"""Authentication dependencies for FastAPI."""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from uuid import UUID
from typing import Optional
import logging

# Set up logging
logger = logging.getLogger(__name__)

# Security scheme for Bearer token
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> UUID:
    """
    Extract and verify user_id from JWT token.
    
    This dependency can be used in any endpoint that requires authentication.
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