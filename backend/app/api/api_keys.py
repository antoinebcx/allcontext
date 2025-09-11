"""REST API endpoints for API key management."""

from fastapi import APIRouter, HTTPException, Depends, status
from typing import List
from uuid import UUID

from app.models.api_key import (
    ApiKeyCreate,
    ApiKeyUpdate,
    ApiKeyResponse,
    ApiKeyCreated,
    ApiKeyList
)
from app.services.api_keys import api_key_service
from app.dependencies.auth import get_current_user

router = APIRouter(
    prefix="/api/v1/api-keys",
    tags=["api-keys"],
    responses={
        401: {"description": "Unauthorized"},
        404: {"description": "Not found"},
        400: {"description": "Bad request"}
    }
)


@router.post("", response_model=ApiKeyCreated, status_code=status.HTTP_201_CREATED)
async def create_api_key(
    data: ApiKeyCreate,
    user_id: UUID = Depends(get_current_user)
):
    """
    Create a new API key.
    
    **Important**: The actual API key is only returned once during creation.
    Store it securely as it cannot be retrieved again.
    
    - **name**: Friendly name for the key (max 100 chars)
    - **expires_at**: Optional expiry date (must be in future)
    - **scopes**: Array of permissions (read, write, delete)
    
    Returns the created key with the actual API key value.
    """
    try:
        api_key = await api_key_service.create(user_id, data)
        return api_key
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create API key"
        )


@router.get("", response_model=ApiKeyList)
async def list_api_keys(
    user_id: UUID = Depends(get_current_user)
):
    """
    List all API keys for the authenticated user.
    
    Returns a list of API keys without the actual key values.
    Keys are sorted by creation date (newest first).
    """
    try:
        keys = await api_key_service.list(user_id)
        return ApiKeyList(
            items=keys,
            total=len(keys)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list API keys"
        )


@router.get("/{key_id}", response_model=ApiKeyResponse)
async def get_api_key(
    key_id: UUID,
    user_id: UUID = Depends(get_current_user)
):
    """
    Get details of a specific API key.
    
    Returns the key information without the actual key value.
    """
    api_key = await api_key_service.get(key_id, user_id)
    
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found"
        )
    
    return api_key


@router.put("/{key_id}", response_model=ApiKeyResponse)
async def update_api_key(
    key_id: UUID,
    data: ApiKeyUpdate,
    user_id: UUID = Depends(get_current_user)
):
    """
    Update an API key.
    
    Can update:
    - **name**: Friendly name
    - **scopes**: Permissions array
    - **is_active**: Enable/disable the key
    
    Cannot update the actual key value or expiry date.
    """
    try:
        updated_key = await api_key_service.update(key_id, user_id, data)
        
        if not updated_key:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="API key not found"
            )
        
        return updated_key
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update API key"
        )


@router.delete("/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_api_key(
    key_id: UUID,
    user_id: UUID = Depends(get_current_user)
):
    """
    Delete (revoke) an API key.
    
    This performs a soft delete by setting is_active to false.
    The key will no longer be valid for authentication.
    """
    try:
        success = await api_key_service.delete(key_id, user_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="API key not found"
            )
        
        return None
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete API key"
        )


@router.post("/validate", response_model=dict)
async def validate_api_key(
    api_key: str,
    user_id: UUID = Depends(get_current_user)
):
    """
    Validate an API key (for testing purposes).
    
    This endpoint is protected and can only be used by authenticated users
    to test their own API keys.
    """
    validation = await api_key_service.validate(api_key)
    
    if not validation.is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=validation.error_message or "Invalid API key"
        )
    
    # Only return validation result if it's the user's own key
    if validation.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot validate another user's API key"
        )
    
    return {
        "valid": True,
        "user_id": str(validation.user_id),
        "scopes": validation.scopes
    }