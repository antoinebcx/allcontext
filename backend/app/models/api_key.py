"""API Key models for the Context Platform."""

from pydantic import BaseModel, Field, ConfigDict, field_validator
from datetime import datetime, timezone
from typing import Optional, List, Literal
from uuid import UUID, uuid4
from enum import Enum


class ApiKeyScope(str, Enum):
    """Available scopes for API keys."""
    READ = "read"
    WRITE = "write"
    DELETE = "delete"


class ApiKeyBase(BaseModel):
    """Base fields for API keys."""
    name: str = Field(..., min_length=1, max_length=100, description="Friendly name for the key")
    expires_at: Optional[datetime] = Field(None, description="Optional expiry date")
    scopes: List[ApiKeyScope] = Field(
        default=[ApiKeyScope.READ, ApiKeyScope.WRITE],
        description="Permissions for this key"
    )


class ApiKeyCreate(ApiKeyBase):
    """Request model for creating an API key."""
    
    @field_validator('expires_at')
    @classmethod
    def validate_expiry(cls, v: Optional[datetime]) -> Optional[datetime]:
        """Ensure expiry date is in the future."""
        if v and v <= datetime.now(timezone.utc):
            raise ValueError("Expiry date must be in the future")
        return v


class ApiKeyUpdate(BaseModel):
    """Request model for updating an API key."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    scopes: Optional[List[ApiKeyScope]] = None
    is_active: Optional[bool] = None


class ApiKeyResponse(ApiKeyBase):
    """Response model for API key (without sensitive data)."""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    user_id: UUID
    key_prefix: str = Field(..., description="First 8 characters of the key")
    last_4: str = Field(..., description="Last 4 characters for identification")
    last_used_at: Optional[datetime] = None
    is_active: bool = True
    created_at: datetime
    updated_at: datetime


class ApiKeyCreated(ApiKeyResponse):
    """Response model when creating a new API key (includes the actual key)."""
    api_key: str = Field(..., description="The actual API key - store this securely!")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "user_id": "123e4567-e89b-12d3-a456-426614174001",
                "name": "Production API Key",
                "key_prefix": "sk_prod_",
                "last_4": "abcd",
                "api_key": "sk_prod_1234567890abcdefghijklmnopqrstuvwxyz",
                "scopes": ["read", "write"],
                "expires_at": None,
                "last_used_at": None,
                "is_active": True,
                "created_at": "2024-01-01T00:00:00Z",
                "updated_at": "2024-01-01T00:00:00Z"
            }
        }
    )


class ApiKeyList(BaseModel):
    """Response model for listing API keys."""
    items: List[ApiKeyResponse]
    total: int
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "items": [
                    {
                        "id": "123e4567-e89b-12d3-a456-426614174000",
                        "name": "Production API Key",
                        "key_prefix": "sk_prod_",
                        "last_4": "abcd",
                        "scopes": ["read", "write"],
                        "last_used_at": "2024-01-10T10:00:00Z",
                        "is_active": True,
                        "created_at": "2024-01-01T00:00:00Z"
                    }
                ],
                "total": 1
            }
        }
    )


class ApiKeyValidation(BaseModel):
    """Internal model for API key validation results."""
    is_valid: bool
    user_id: Optional[UUID] = None
    scopes: List[ApiKeyScope] = []
    key_id: Optional[UUID] = None
    error_message: Optional[str] = None