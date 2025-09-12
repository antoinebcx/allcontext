"""MCP server for the Context Platform."""

import sys
from pathlib import Path

# Add parent directory to path so we can import app
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from mcp.server.fastmcp import FastMCP
from typing import Optional, Dict, Any, List
from uuid import UUID
from app.models.core import ArtifactCreate, ArtifactUpdate
from app.config import config

# Get the appropriate service based on configuration
artifact_service = config.get_artifact_service()

# Initialize MCP server
mcp = FastMCP("context-platform")

# For now, using demo user. Will be replaced with OAuth-based auth
DEMO_USER_ID = UUID("123e4567-e89b-12d3-a456-426614174001")


@mcp.tool()
def create_artifact(
    content: str,
    title: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
    is_public: bool = False
) -> Dict[str, Any]:
    """
    Create a new artifact in your context platform.
    
    Args:
        content: Main content (max 100k chars) - title auto-extracted from first heading if not provided
        title: Optional title (max 200 chars) - auto-generated from content if not provided
        metadata: Optional metadata as key-value pairs
        is_public: Whether artifact should be publicly accessible
    
    Returns:
        The created artifact with its ID and timestamps
    """
    import asyncio
    
    async def _create():
        try:
            data = ArtifactCreate(
                title=title,
                content=content,
                metadata=metadata or {},
                is_public=is_public
            )
            
            artifact = await artifact_service.create(DEMO_USER_ID, data)
            return {
                "id": str(artifact.id),
                "title": artifact.title,
                "content": artifact.content,
                "metadata": artifact.metadata,
                "created_at": artifact.created_at.isoformat(),
                "message": f"Created artifact: {artifact.title}"
            }
        except Exception as e:
            return {"error": str(e)}
    
    return asyncio.run(_create())


@mcp.tool()
def search_artifacts(
    query: str
) -> List[Dict[str, Any]]:
    """
    Search your artifacts by text in title and content.
    
    Args:
        query: Search query (searches in title and content)
    
    Returns:
        List of matching artifacts
    """
    import asyncio
    
    async def _search():
        try:
            artifacts = await artifact_service.search(
                user_id=DEMO_USER_ID,
                query=query
            )
            
            return [
                {
                    "id": str(a.id),
                    "title": a.title,
                    "content": a.content[:200] + "..." if len(a.content) > 200 else a.content,
                    "metadata": a.metadata,
                    "created_at": a.created_at.isoformat()
                }
                for a in artifacts
            ]
        except Exception as e:
            return [{"error": str(e)}]
    
    return asyncio.run(_search())


@mcp.tool()
def get_artifact(artifact_id: str) -> Dict[str, Any]:
    """
    Retrieve a specific artifact by its ID.
    
    Args:
        artifact_id: UUID of the artifact
    
    Returns:
        The complete artifact with all fields
    """
    import asyncio
    
    async def _get():
        try:
            artifact = await artifact_service.get(UUID(artifact_id), DEMO_USER_ID)
            
            if not artifact:
                return {"error": f"Artifact {artifact_id} not found"}
            
            return {
                "id": str(artifact.id),
                "title": artifact.title,
                "content": artifact.content,
                "metadata": artifact.metadata,
                "is_public": artifact.is_public,
                "created_at": artifact.created_at.isoformat(),
                "updated_at": artifact.updated_at.isoformat(),
                "version": artifact.version
            }
        except Exception as e:
            return {"error": str(e)}
    
    return asyncio.run(_get())


@mcp.tool()
def list_artifacts(
    limit: int = 10
) -> List[Dict[str, Any]]:
    """
    List your artifacts.
    
    Args:
        limit: Maximum number of artifacts to return (default 10, max 50)
    
    Returns:
        List of artifacts sorted by creation date (newest first)
    """
    import asyncio
    
    async def _list():
        try:
            limit_capped = min(limit, 50)  # Cap at 50
            artifacts = await artifact_service.list(
                user_id=DEMO_USER_ID,
                limit=limit_capped
            )
            
            return [
                {
                    "id": str(a.id),
                    "title": a.title,
                    "content_preview": a.content[:100] + "..." if len(a.content) > 100 else a.content,
                    "metadata": a.metadata,
                    "created_at": a.created_at.isoformat()
                }
                for a in artifacts
            ]
        except Exception as e:
            return [{"error": str(e)}]
    
    return asyncio.run(_list())


if __name__ == "__main__":
    # Run the MCP server
    print("Starting Context Platform MCP Server...")
    print("This server exposes tools for managing your AI artifacts.")
    print("\nAvailable tools:")
    print("  - create_artifact: Create new artifacts")
    print("  - list_artifacts: List your artifacts")
    print("  - search_artifacts: Search by text")
    print("  - get_artifact: Get specific artifact by ID")
    print("\nRunning on stdio...")
    mcp.run()
