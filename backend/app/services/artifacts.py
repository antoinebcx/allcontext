"""Service layer for artifact operations."""

from typing import List, Optional, Dict
from uuid import UUID, uuid4
from datetime import datetime, timezone
from app.models.core import Artifact, ArtifactCreate, ArtifactUpdate


class ArtifactService:
    """
    Service class for artifact operations.
    Currently uses in-memory storage, will be replaced with Supabase.
    """
    
    def __init__(self):
        # In-memory storage - will be replaced with Supabase
        self._artifacts: Dict[UUID, Artifact] = {}
        
        # Add some demo data for testing
        self._init_demo_data()
    
    def _init_demo_data(self):
        """Initialize with some demo artifacts for testing."""
        demo_user_id = UUID("123e4567-e89b-12d3-a456-426614174001")
        
        demos = [
            ArtifactCreate(
                type="prompt",
                title="Code Review Template",
                content="Review this code for:\n1. Security vulnerabilities\n2. Performance issues\n3. Code style\n4. Best practices",
                metadata={"category": "engineering", "tags": ["review", "template"]}
            ),
            ArtifactCreate(
                type="goal",
                title="Launch MVP",
                content="Launch the Context Platform MVP by end of Q1:\n- Complete core features\n- Documentation\n- Deploy to production",
                metadata={"priority": "high", "quarter": "Q1"}
            ),
            ArtifactCreate(
                type="document",
                title="API Design Principles",
                content="1. RESTful design\n2. Clear error messages\n3. Consistent naming\n4. Versioning strategy",
                metadata={"category": "architecture"}
            )
        ]
        
        for demo in demos:
            artifact = Artifact(
                **demo.model_dump(),
                user_id=demo_user_id
            )
            self._artifacts[artifact.id] = artifact
    
    async def create(self, user_id: UUID, data: ArtifactCreate) -> Artifact:
        """Create a new artifact."""
        artifact = Artifact(
            **data.model_dump(),
            user_id=user_id
        )
        self._artifacts[artifact.id] = artifact
        return artifact
    
    async def get(self, artifact_id: UUID, user_id: Optional[UUID] = None) -> Optional[Artifact]:
        """
        Get an artifact by ID.
        If user_id is provided, ensures the artifact belongs to that user.
        """
        artifact = self._artifacts.get(artifact_id)
        
        if artifact and user_id:
            # Check ownership
            if artifact.user_id != user_id and not artifact.is_public:
                return None
        
        return artifact
    
    async def list(
        self,
        user_id: Optional[UUID] = None,
        type: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[Artifact]:
        """
        List artifacts with optional filtering.
        If user_id is provided, returns only that user's artifacts and public ones.
        """
        artifacts = list(self._artifacts.values())
        
        # Filter by user
        if user_id:
            artifacts = [
                a for a in artifacts 
                if a.user_id == user_id or a.is_public
            ]
        
        # Filter by type
        if type:
            artifacts = [a for a in artifacts if a.type == type]
        
        # Sort by created_at descending
        artifacts.sort(key=lambda x: x.created_at, reverse=True)
        
        # Apply pagination
        return artifacts[offset:offset + limit]
    
    async def update(
        self,
        artifact_id: UUID,
        user_id: UUID,
        data: ArtifactUpdate
    ) -> Optional[Artifact]:
        """Update an artifact if it belongs to the user."""
        artifact = await self.get(artifact_id, user_id)
        
        if not artifact or artifact.user_id != user_id:
            return None
        
        # Update fields that are provided
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(artifact, field, value)
        
        # Update metadata
        artifact.updated_at = datetime.now(timezone.utc)
        artifact.version += 1
        
        self._artifacts[artifact_id] = artifact
        return artifact
    
    async def delete(self, artifact_id: UUID, user_id: UUID) -> bool:
        """Delete an artifact if it belongs to the user."""
        artifact = await self.get(artifact_id, user_id)
        
        if not artifact or artifact.user_id != user_id:
            return False
        
        del self._artifacts[artifact_id]
        return True
    
    async def search(
        self,
        user_id: UUID,
        query: str,
        type: Optional[str] = None
    ) -> List[Artifact]:
        """
        Simple text search in title and content.
        Returns only user's artifacts and public ones.
        """
        query_lower = query.lower()
        artifacts = await self.list(user_id, type)
        
        # Simple text search
        results = [
            a for a in artifacts
            if query_lower in a.title.lower() or query_lower in a.content.lower()
        ]
        
        return results
    
    async def count(self, user_id: Optional[UUID] = None, type: Optional[str] = None) -> int:
        """Count artifacts with optional filtering."""
        artifacts = await self.list(user_id, type, limit=10000)
        return len(artifacts)


# Singleton instance
artifact_service = ArtifactService()
