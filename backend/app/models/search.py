"""Search-related models for the Context Platform."""

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Dict, Any
from uuid import UUID


class ArtifactSearchResult(BaseModel):
    """Search result with preview - following best practices."""
    id: UUID
    title: str
    snippet: str = Field(..., description="First 200 chars of content")
    metadata: Dict[str, Any] = Field(default_factory=dict)
    is_public: bool
    created_at: datetime
    updated_at: datetime