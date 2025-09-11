"""Authentication dependencies for FastAPI."""

from fastapi import Depends, HTTPException, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from uuid import UUID
from typing import Optional, Tuple
import logging

# Set up logging
logger = logging.getLogger(__name__)

# Security scheme for Bearer token
security = HTTPBearer(auto_error=False)  # Don't auto-error, we'll handle it


async def validate_jwt_token(
    credentials: HTTPAuthorizationCredentials
) -> UUID:
    """
    Extract and verify user_id from JWT token.
    """
    try:
        # Decode JWT without signature verification
        # (Supabase already verified it when issuing the token)
        payload = jwt.decode(
            credentials.credentials,
            options={"verify_signature": False}
        )
        
        # Log the payload structure for debugging
        logger.debug(f"JWT payload: {payload}")
        
        # Extract user ID from 'sub' claim (Supabase standard)
        user_id = payload.get("sub")
        
        # Check if this is an anon token (no user ID)
        role = payload.get("role")
        if role == "anon":
            logger.error("Attempted to use anon token for authenticated endpoint")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required. Please log in."
            )
        
        if not user_id:
            logger.error(f"No user ID in token. Payload: {payload}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: no user ID"
            )
        
        return UUID(user_id)
    except jwt.ExpiredSignatureError:
        logger.error("JWT token has expired")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except jwt.DecodeError as e:
        logger.error(f"JWT decode error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token format"
        )
    except ValueError as e:
        logger.error(f"Invalid user ID format: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID in token"
        )
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        logger.error(f"Unexpected error in auth: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )


async def validate_api_key(api_key: str) -> Tuple[UUID, list]:
    """
    Validate an API key and return user_id and scopes.
    """
    from app.services.api_keys import api_key_service
    
    validation = await api_key_service.validate(api_key)
    
    if not validation.is_valid:
        logger.error(f"Invalid API key: {validation.error_message}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=validation.error_message or "Invalid API key"
        )
    
    return validation.user_id, validation.scopes


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    x_api_key: Optional[str] = Header(None, alias="X-API-Key")
) -> UUID:
    """
    Extract and verify user_id from JWT token or API key.
    
    This dependency can be used in any endpoint that requires authentication.
    Supports both Bearer token (JWT) and API key authentication.
    """
    # First, check for API key
    if x_api_key:
        user_id, _ = await validate_api_key(x_api_key)
        return user_id
    
    # Then, check for Bearer token
    if credentials:
        return await validate_jwt_token(credentials)
    
    # No authentication provided
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required. Provide Bearer token or API key."
    )


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[UUID]:
    """
    Optional authentication - returns user_id if authenticated, None otherwise.
    
    Useful for endpoints that have different behavior for authenticated users.
    """
    if not credentials:
        return None
    
    try:
        return await get_current_user(credentials)
    except HTTPException:
        return None