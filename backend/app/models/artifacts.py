"""Core data models for the Context Platform."""

from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from uuid import UUID, uuid4


class ArtifactBase(BaseModel):
    """Base fields for artifacts."""
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1, max_length=100000)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    is_public: bool = False


class ArtifactCreate(BaseModel):
    """Request model for creating an artifact."""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    content: str = Field(..., min_length=1, max_length=100000)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    is_public: bool = False


class ArtifactUpdate(BaseModel):
    """Request model for updating an artifact - all fields optional."""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    content: Optional[str] = Field(None, min_length=1, max_length=100000)
    metadata: Optional[Dict[str, Any]] = None
    is_public: Optional[bool] = None


class Artifact(ArtifactBase):
    """Complete artifact model with system fields."""
    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "user_id": "123e4567-e89b-12d3-a456-426614174001",
                "title": "Code Review Guidelines",
                "content": "Review this code for:\n1. Security issues\n2. Performance\n3. Best practices",
                "metadata": {
                    "category": "engineering",
                    "tags": ["review", "security"],
                    "model": "claude-3"
                },
                "is_public": False,
                "created_at": "2024-01-01T00:00:00Z",
                "updated_at": "2024-01-01T00:00:00Z",
                "version": 1
            }
        }
    )
    
    id: UUID = Field(default_factory=uuid4)
    user_id: UUID
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    version: int = 1


class ArtifactList(BaseModel):
    """Response model for listing artifacts."""
    items: list[Artifact]
    total: int
    page: int = 1
    page_size: int = 50
