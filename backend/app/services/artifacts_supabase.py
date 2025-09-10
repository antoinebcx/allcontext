"""Service layer for artifact operations using Supabase."""

import os
from typing import List, Optional
from uuid import UUID
from supabase import create_client, Client
from dotenv import load_dotenv
from app.models.core import Artifact, ArtifactCreate, ArtifactUpdate

# Load environment variables
load_dotenv()


class ArtifactServiceSupabase:
    """
    Service class for artifact operations using Supabase.
    """
    
    def __init__(self):
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_KEY")
        
        if not url or not key:
            raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in environment")
        
        self.client: Client = create_client(url, key)
    
    async def create(self, user_id: UUID, data: ArtifactCreate) -> Artifact:
        """Create a new artifact in Supabase."""
        artifact_data = {
            "user_id": str(user_id),
            "type": data.type,
            "title": data.title,
            "content": data.content,
            "metadata": data.metadata,
            "is_public": data.is_public
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
        if user_id and artifact.user_id != user_id and not artifact.is_public:
            return None
        
        return artifact
    
    async def list(
        self,
        user_id: Optional[UUID] = None,
        type: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[Artifact]:
        """List artifacts from Supabase with optional filtering."""
        query = self.client.table("artifacts").select("*")
        
        # Filter by user or public
        if user_id:
            # Get user's artifacts and public ones
            query = query.or_(f"user_id.eq.{str(user_id)},is_public.eq.true")
        
        # Filter by type
        if type:
            query = query.eq("type", type)
        
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
        if data.type is not None:
            update_data["type"] = data.type
        if data.title is not None:
            update_data["title"] = data.title
        if data.content is not None:
            update_data["content"] = data.content
        if data.metadata is not None:
            update_data["metadata"] = data.metadata
        if data.is_public is not None:
            update_data["is_public"] = data.is_public
        
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
        type: Optional[str] = None
    ) -> List[Artifact]:
        """
        Search artifacts using Supabase full-text search.
        """
        # Build the search query
        search_query = self.client.table("artifacts").select("*")
        
        # Filter by user or public
        search_query = search_query.or_(f"user_id.eq.{str(user_id)},is_public.eq.true")
        
        # Filter by type if specified
        if type:
            search_query = search_query.eq("type", type)
        
        # Use full-text search
        search_query = search_query.text_search("search_vector", query)
        
        # Order by relevance (default for text search)
        response = search_query.execute()
        
        return [Artifact(**item) for item in response.data] if response.data else []
    
    async def count(self, user_id: Optional[UUID] = None, type: Optional[str] = None) -> int:
        """Count artifacts in Supabase."""
        query = self.client.table("artifacts").select("id", count="exact")
        
        if user_id:
            query = query.or_(f"user_id.eq.{str(user_id)},is_public.eq.true")
        
        if type:
            query = query.eq("type", type)
        
        response = query.execute()
        return response.count if response.count else 0


# Create service instance
artifact_service_supabase = ArtifactServiceSupabase()
