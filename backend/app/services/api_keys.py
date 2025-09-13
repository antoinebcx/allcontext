"""Service layer for API key operations."""

import secrets
import bcrypt
import hashlib
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timezone
from supabase import create_client, Client
from dotenv import load_dotenv
import os
import logging

from app.models.api_key import (
    ApiKeyCreate, 
    ApiKeyUpdate, 
    ApiKeyResponse, 
    ApiKeyCreated,
    ApiKeyValidation
)

# Load environment variables
load_dotenv()

# Set up logging
logger = logging.getLogger(__name__)


class ApiKeyService:
    """Service class for API key operations."""
    
    # Key configuration
    KEY_PREFIX = "sk_prod_"
    KEY_LENGTH = 32  # Random part length
    MAX_KEYS_PER_USER = 10
    
    def __init__(self):
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_KEY")
        
        if not url or not key:
            raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in environment")
        
        self.client: Client = create_client(url, key)
    
    def _generate_api_key(self) -> tuple[str, str, str, str, str]:
        """
        Generate a new API key with lookup hash.
        
        Returns:
            Tuple of (full_key, key_hash, key_prefix, last_4, lookup_hash)
        """
        # Generate random part
        random_part = secrets.token_urlsafe(self.KEY_LENGTH)[:self.KEY_LENGTH]
        
        # Construct full key
        full_key = f"{self.KEY_PREFIX}{random_part}"
        
        # Hash the key for storage
        key_hash = bcrypt.hashpw(full_key.encode(), bcrypt.gensalt()).decode()
        
        # Create a lookup hash from the first 16 characters for faster filtering
        # This significantly reduces the number of bcrypt comparisons needed
        lookup_hash = hashlib.sha256(full_key[:16].encode()).hexdigest()[:16]
        
        # Extract last 4 characters
        last_4 = random_part[-4:]
        
        return full_key, key_hash, self.KEY_PREFIX, last_4, lookup_hash
    
    async def create(self, user_id: UUID, data: ApiKeyCreate) -> ApiKeyCreated:
        """Create a new API key."""
        try:
            # Check if user has reached the limit
            count_response = self.client.table("api_keys") \
                .select("id", count="exact") \
                .eq("user_id", str(user_id)) \
                .eq("is_active", True) \
                .execute()
            
            if count_response.count and count_response.count >= self.MAX_KEYS_PER_USER:
                raise ValueError(f"Maximum number of API keys ({self.MAX_KEYS_PER_USER}) reached")
            
            # Generate the API key with lookup hash
            full_key, key_hash, key_prefix, last_4, lookup_hash = self._generate_api_key()
            
            # Prepare data for insertion
            api_key_data = {
                "user_id": str(user_id),
                "name": data.name,
                "key_hash": key_hash,
                "key_prefix": key_prefix,
                "last_4": last_4,
                "lookup_hash": lookup_hash,  # Store for fast filtering
                "scopes": [scope.value for scope in data.scopes],
                "expires_at": data.expires_at.isoformat() if data.expires_at else None
            }
            
            # Insert into database
            response = self.client.table("api_keys").insert(api_key_data).execute()
            
            if not response.data:
                raise Exception("Failed to create API key")
            
            # Prepare response with the actual key
            created_key = response.data[0]
            return ApiKeyCreated(
                **created_key,
                api_key=full_key  # Include the actual key only in creation response
            )
            
        except Exception as e:
            logger.error(f"Error creating API key: {e}")
            raise
    
    async def list(self, user_id: UUID) -> List[ApiKeyResponse]:
        """List all API keys for a user."""
        try:
            response = self.client.table("api_keys") \
                .select("*") \
                .eq("user_id", str(user_id)) \
                .order("created_at", desc=True) \
                .execute()
            
            if not response.data:
                return []
            
            return [ApiKeyResponse(**key) for key in response.data]
            
        except Exception as e:
            logger.error(f"Error listing API keys: {e}")
            raise
    
    async def get(self, key_id: UUID, user_id: UUID) -> Optional[ApiKeyResponse]:
        """Get a specific API key."""
        try:
            response = self.client.table("api_keys") \
                .select("*") \
                .eq("id", str(key_id)) \
                .eq("user_id", str(user_id)) \
                .single() \
                .execute()
            
            if not response.data:
                return None
            
            return ApiKeyResponse(**response.data)
            
        except Exception as e:
            logger.error(f"Error getting API key: {e}")
            return None
    
    async def update(
        self, 
        key_id: UUID, 
        user_id: UUID, 
        data: ApiKeyUpdate
    ) -> Optional[ApiKeyResponse]:
        """Update an API key."""
        try:
            # Build update data
            update_data = {}
            if data.name is not None:
                update_data["name"] = data.name
            if data.scopes is not None:
                update_data["scopes"] = [scope.value for scope in data.scopes]
            if data.is_active is not None:
                update_data["is_active"] = data.is_active
            
            if not update_data:
                # Nothing to update, return existing
                return await self.get(key_id, user_id)
            
            response = self.client.table("api_keys") \
                .update(update_data) \
                .eq("id", str(key_id)) \
                .eq("user_id", str(user_id)) \
                .execute()
            
            if not response.data:
                return None
            
            return ApiKeyResponse(**response.data[0])
            
        except Exception as e:
            logger.error(f"Error updating API key: {e}")
            raise
    
    async def delete(self, key_id: UUID, user_id: UUID) -> bool:
        """Delete (soft delete) an API key."""
        try:
            # Soft delete by setting is_active to False
            response = self.client.table("api_keys") \
                .update({"is_active": False}) \
                .eq("id", str(key_id)) \
                .eq("user_id", str(user_id)) \
                .execute()
            
            return len(response.data) > 0 if response.data else False
            
        except Exception as e:
            logger.error(f"Error deleting API key: {e}")
            raise
    
    async def validate(self, api_key: str) -> ApiKeyValidation:
        """
        Validate an API key and return user information.
        
        Optimized version that uses lookup_hash to reduce bcrypt comparisons.
        
        Args:
            api_key: The API key to validate
            
        Returns:
            ApiKeyValidation object with validation result
        """
        try:
            # Check key format
            if not api_key.startswith(self.KEY_PREFIX):
                return ApiKeyValidation(
                    is_valid=False,
                    error_message="Invalid key format"
                )
            
            # Generate lookup hash from the provided key
            lookup_hash = hashlib.sha256(api_key[:16].encode()).hexdigest()[:16]
            
            # Query only keys with matching lookup hash (much smaller set)
            response = self.client.table("api_keys") \
                .select("*") \
                .eq("is_active", True) \
                .eq("lookup_hash", lookup_hash) \
                .execute()
            
            if not response.data:
                return ApiKeyValidation(
                    is_valid=False,
                    error_message="Invalid API key"
                )
            
            # Now check the bcrypt hash (on a much smaller set of keys)
            for key_record in response.data:
                if bcrypt.checkpw(api_key.encode(), key_record['key_hash'].encode()):
                    # Check if expired
                    if key_record.get('expires_at'):
                        expires_at = datetime.fromisoformat(key_record['expires_at'])
                        if expires_at < datetime.now(timezone.utc):
                            return ApiKeyValidation(
                                is_valid=False,
                                error_message="API key has expired"
                            )
                    
                    # Update last_used_at
                    self.client.table("api_keys") \
                        .update({"last_used_at": datetime.now(timezone.utc).isoformat()}) \
                        .eq("id", key_record['id']) \
                        .execute()
                    
                    return ApiKeyValidation(
                        is_valid=True,
                        user_id=UUID(key_record['user_id']),
                        key_id=UUID(key_record['id']),
                        scopes=key_record.get('scopes', [])
                    )
            
            return ApiKeyValidation(
                is_valid=False,
                error_message="Invalid API key"
            )
            
        except Exception as e:
            logger.error(f"Error validating API key: {e}")
            return ApiKeyValidation(
                is_valid=False,
                error_message="Error validating key"
            )
    
    async def cleanup_expired(self) -> int:
        """
        Clean up expired API keys.
        
        Returns:
            Number of keys deactivated
        """
        try:
            response = self.client.table("api_keys") \
                .update({"is_active": False}) \
                .lt("expires_at", datetime.now(timezone.utc).isoformat()) \
                .eq("is_active", True) \
                .execute()
            
            return len(response.data) if response.data else 0
            
        except Exception as e:
            logger.error(f"Error cleaning up expired keys: {e}")
            return 0


# Create service instance
api_key_service = ApiKeyService()
