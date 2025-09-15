"""Service layer for artifact operations using Supabase."""

from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime, timezone
from supabase import Client
from app.models.artifacts import (
    Artifact, ArtifactCreate, ArtifactUpdate, ArtifactSearchResult,
    ArtifactVersion, ArtifactVersionSummary, ArtifactVersionsResponse
)
from app.utils import extract_title_from_content, generate_snippet
from app.database import db


class ArtifactService:
    """
    Service class for artifact operations using Supabase.
    """

    @property
    def client(self) -> Client:
        """Get database client from singleton."""
        return db()
    
    async def create(self, user_id: UUID, data: ArtifactCreate) -> Artifact:
        """Create a new artifact in Supabase."""
        # Auto-generate title if not provided
        title = data.title if data.title else extract_title_from_content(data.content)
        
        artifact_data = {
            "user_id": str(user_id),
            "title": title,
            "content": data.content,
            "metadata": data.metadata,
        }
        
        response = self.client.table("artifacts").insert(artifact_data).execute()
        
        if response.data:
            return Artifact(**response.data[0])
        else:
            raise Exception("Failed to create artifact")
    
    async def get(self, artifact_id: UUID, user_id: Optional[UUID] = None) -> Optional[Artifact]:
        """Get an artifact by ID from Supabase."""
        query = self.client.table("artifacts").select("*").eq("id", str(artifact_id))
        
        response = query.execute()
        
        if not response.data:
            return None
        
        artifact = Artifact(**response.data[0])
        
        # Check access permissions
        if user_id and artifact.user_id != user_id:
            return None
        
        return artifact
    
    async def list(
        self,
        user_id: Optional[UUID] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[Artifact]:
        """List artifacts from Supabase with optional filtering."""
        query = self.client.table("artifacts").select("*")
        
        # Filter by user only
        if user_id:
            # Get user's artifacts only
            query = query.eq("user_id", str(user_id))
        
        # Order by created_at descending
        query = query.order("created_at", desc=True)
        
        # Apply pagination
        query = query.range(offset, offset + limit - 1)
        
        response = query.execute()
        
        return [Artifact(**item) for item in response.data] if response.data else []
    
    async def update(
        self,
        artifact_id: UUID,
        user_id: UUID,
        data: ArtifactUpdate
    ) -> Optional[Artifact]:
        """Update an artifact in Supabase."""
        # First check if user owns the artifact
        existing = await self.get(artifact_id, user_id)
        if not existing or existing.user_id != user_id:
            return None
        
        # Prepare update data (only non-None fields)
        update_data = {}
        if data.title is not None:
            update_data["title"] = data.title
        if data.content is not None:
            update_data["content"] = data.content
            # Auto-generate title from new content if title not explicitly provided
            if data.title is None:
                update_data["title"] = extract_title_from_content(data.content)
        if data.metadata is not None:
            update_data["metadata"] = data.metadata
        
        if not update_data:
            return existing  # Nothing to update
        
        response = self.client.table("artifacts") \
            .update(update_data) \
            .eq("id", str(artifact_id)) \
            .eq("user_id", str(user_id)) \
            .execute()
        
        if response.data:
            return Artifact(**response.data[0])
        return None
    
    async def delete(self, artifact_id: UUID, user_id: UUID) -> bool:
        """Delete an artifact from Supabase."""
        response = self.client.table("artifacts") \
            .delete() \
            .eq("id", str(artifact_id)) \
            .eq("user_id", str(user_id)) \
            .execute()
        
        # Supabase returns deleted rows
        return len(response.data) > 0 if response.data else False
    
    async def search(
        self,
        user_id: UUID,
        query: str,
    ) -> List[ArtifactSearchResult]:
        """
        Search artifacts using ILIKE for partial text matching.
        Returns search results with snippets instead of full content.
        """
        # Build the search query
        search_query = self.client.table("artifacts").select("*")

        # Filter by user only
        search_query = search_query.eq("user_id", str(user_id))

        # Use ILIKE for partial matching
        search_pattern = f"%{query}%"
        search_query = search_query.or_(
            f"title.ilike.{search_pattern},content.ilike.{search_pattern}"
        )

        # Order by relevance (default for text search)
        response = search_query.execute()

        # Transform to search results with snippets
        results = []
        for item in response.data if response.data else []:
            artifact = Artifact(**item)
            results.append(ArtifactSearchResult(
                id=artifact.id,
                title=artifact.title,
                snippet=generate_snippet(artifact.content),
                metadata=artifact.metadata,
                created_at=artifact.created_at,
                updated_at=artifact.updated_at
            ))

        return results
        
    async def count(self, user_id: Optional[UUID] = None) -> int:
        """Count artifacts in Supabase."""
        query = self.client.table("artifacts").select("id", count="exact")

        if user_id:
            query = query.eq("user_id", str(user_id))

        response = query.execute()
        return response.count if response.count else 0

    async def get_versions(self, artifact_id: UUID, user_id: UUID) -> Optional[ArtifactVersionsResponse]:
        """Get artifact with version history summary."""
        response = self.client.table("artifacts") \
            .select("id, version, version_count, version_history, title") \
            .eq("id", str(artifact_id)) \
            .eq("user_id", str(user_id)) \
            .execute()

        if not response.data:
            return None

        artifact = response.data[0]

        # Parse version history and create summaries
        versions = []
        if artifact.get("version_history"):
            for v in artifact["version_history"][:10]:  # Return last 10 for API
                changes = []
                if v.get("title_changed"):
                    changes.append("title")
                if v.get("content_changed"):
                    changes.append("content")

                versions.append(ArtifactVersionSummary(
                    version=v["version"],
                    title=v["title"],
                    updated_at=datetime.fromisoformat(v["updated_at"]) if isinstance(v["updated_at"], str) else v["updated_at"],
                    content_length=v.get("content_length", 0),
                    changes=changes
                ))

        return ArtifactVersionsResponse(
            id=UUID(artifact["id"]),
            current_version=artifact["version"],
            version_count=artifact.get("version_count", 0),
            versions=versions
        )

    async def get_version(self, artifact_id: UUID, user_id: UUID, version_number: int) -> Optional[ArtifactVersion]:
        """Get specific version content by version number."""
        response = self.client.table("artifacts") \
            .select("version, title, content, metadata, version_history") \
            .eq("id", str(artifact_id)) \
            .eq("user_id", str(user_id)) \
            .execute()

        if not response.data:
            return None

        artifact = response.data[0]

        # Check if requesting current version
        if version_number == artifact["version"]:
            return ArtifactVersion(
                version=artifact["version"],
                title=artifact["title"],
                content=artifact["content"],
                metadata=artifact["metadata"],
                updated_at=datetime.now(timezone.utc),
                content_length=len(artifact["content"]),
                title_changed=False,
                content_changed=False
            )

        # Search in history
        if artifact.get("version_history"):
            for v in artifact["version_history"]:
                if v["version"] == version_number:
                    return ArtifactVersion(
                        version=v["version"],
                        title=v["title"],
                        content=v["content"],
                        metadata=v["metadata"],
                        updated_at=datetime.fromisoformat(v["updated_at"]) if isinstance(v["updated_at"], str) else v["updated_at"],
                        content_length=v.get("content_length", len(v["content"])),
                        title_changed=v.get("title_changed", False),
                        content_changed=v.get("content_changed", False)
                    )

        return None

    async def restore_version(self, artifact_id: UUID, user_id: UUID, version_number: int) -> Optional[Artifact]:
        """Restore artifact to a previous version by version number."""
        # First get the version to restore
        version = await self.get_version(artifact_id, user_id, version_number)

        if not version:
            return None

        # Update with the old version's content
        # This will trigger the versioning system to save current as history
        update_data = {
            "title": version.title,
            "content": version.content,
            "metadata": version.metadata
        }

        response = self.client.table("artifacts") \
            .update(update_data) \
            .eq("id", str(artifact_id)) \
            .eq("user_id", str(user_id)) \
            .execute()

        if response.data:
            return Artifact(**response.data[0])
        return None

    async def get_version_diff(self, artifact_id: UUID, user_id: UUID, from_version: int, to_version: int) -> Optional[Dict[str, Any]]:
        """Get differences between two versions."""
        from_v = await self.get_version(artifact_id, user_id, from_version)
        to_v = await self.get_version(artifact_id, user_id, to_version)

        if not from_v or not to_v:
            return None

        return {
            "from_version": from_version,
            "to_version": to_version,
            "title_changed": from_v.title != to_v.title,
            "old_title": from_v.title if from_v.title != to_v.title else None,
            "new_title": to_v.title if from_v.title != to_v.title else None,
            "content_length_change": to_v.content_length - from_v.content_length,
            "metadata_changed": from_v.metadata != to_v.metadata
        }


# Create service instance
artifact_service = ArtifactService()
