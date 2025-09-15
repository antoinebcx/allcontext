"""MCP server for the Context Platform."""

import logging
from typing import Optional, Dict, Any, List
from uuid import UUID
from contextvars import ContextVar

from pydantic import AnyHttpUrl
from mcp.server.fastmcp import FastMCP, Context
from mcp.server.auth.provider import TokenVerifier, AccessToken
from mcp.server.auth.settings import AuthSettings

from app.models.artifacts import ArtifactCreate, ArtifactUpdate
from app.utils import generate_snippet
from app.services.artifacts import artifact_service

# Set up logging
logger = logging.getLogger(__name__)

# Context variable for storing authenticated user ID per request
# This is thread-safe and async-safe
authenticated_user_id: ContextVar[Optional[UUID]] = ContextVar('authenticated_user_id', default=None)


class ApiKeyVerifier(TokenVerifier):
    """Verifies API keys for MCP authentication."""
    
    async def verify_token(self, token: str) -> Optional[AccessToken]:
        """
        Verify the API key and return access token if valid.
        
        This method is called by the MCP framework for each authenticated request.
        We store the validated user_id in a context variable for access by tools.
        
        Args:
            token: The API key from the Authorization header
            
        Returns:
            AccessToken if valid, None otherwise
        """
        from app.services.api_keys import api_key_service
        
        # Validate the API key
        validation = await api_key_service.validate(token)
        
        if validation.is_valid and validation.user_id:
            # Store user_id in context variable (thread-safe, request-scoped)
            authenticated_user_id.set(validation.user_id)
            
            return AccessToken(
                token=token,
                client_id=f"user_{validation.user_id}",
                user_id=str(validation.user_id),
                scopes=validation.scopes or ["read", "write"]
            )
        
        # Clear context on validation failure
        authenticated_user_id.set(None)
        return None


def get_authenticated_user_id() -> Optional[UUID]:
    """
    Get the authenticated user ID for the current request.
    
    This retrieves the user_id stored by ApiKeyVerifier during token validation.
    Uses contextvars for thread-safe, request-scoped storage.
    
    Returns:
        UUID of the authenticated user or None if not authenticated
    """
    return authenticated_user_id.get()


def create_mcp_server() -> FastMCP:
    """
    Create the MCP server with stateless configuration for cloud deployment.

    Returns:
        Configured FastMCP server instance
    """
    from app.config import settings

    base_url = settings.api_base_url
    if settings.is_development:
        base_url = f"http://localhost:{settings.port}"

    return FastMCP(
        name="Allcontext",
        instructions=(
            "A cloud-based platform for storing and managing AI context artifacts. "
            "Store prompts, documentation, and markdown content that can be accessed "
            "by AI assistants through multiple interfaces."
        ),
        # Stateless configuration for cloud deployment
        stateless_http=True,
        json_response=True,
        streamable_http_path="/",
        token_verifier=ApiKeyVerifier(),
        auth=AuthSettings(
            issuer_url=AnyHttpUrl(base_url),
            resource_server_url=AnyHttpUrl(f"{base_url}/mcp"),
            required_scopes=["read", "write"]
        )
    )


# Create the MCP server instance
mcp = create_mcp_server()


@mcp.tool()
async def create_artifact(
    content: str,
    title: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
    ctx: Context = None
) -> Dict[str, Any]:
    """
    Create a new artifact in your context platform.
    
    Args:
        content: Main content (max 100k chars)
        title: Optional title (max 200 chars)
        metadata: Optional metadata as key-value pairs
        ctx: Context object (injected by FastMCP)
    
    Returns:
        The created artifact with its ID and timestamps
    """
    try:
        user_id = get_authenticated_user_id()
        
        if not user_id:
            logger.warning("Tool called without authentication")
            return {"error": "Authentication required. Please provide a valid API key."}
        
        data = ArtifactCreate(
            title=title,
            content=content,
            metadata=metadata or {},
        )
        
        artifact = await artifact_service.create(user_id, data)
        
        return {
            "id": str(artifact.id),
            "title": artifact.title,
            "content": artifact.content,
            "metadata": artifact.metadata,
            "created_at": artifact.created_at.isoformat(),
            "message": f"Created artifact: {artifact.title}"
        }
    except ValueError as e:
        logger.error(f"Validation error: {e}")
        return {"error": f"Invalid input: {str(e)}"}
    except Exception as e:
        logger.error(f"Error creating artifact: {e}", exc_info=True)
        return {"error": "Failed to create artifact"}


@mcp.tool()
async def list_artifacts(
    limit: int = 10,
    offset: int = 0,
    ctx: Context = None
) -> List[Dict[str, Any]]:
    """
    List your artifacts.
    
    Args:
        limit: Maximum number of artifacts to return (default 10, max 50)
        offset: Number of artifacts to skip for pagination
        ctx: Context object (injected by FastMCP)
    
    Returns:
        List of artifacts sorted by creation date (newest first)
    """
    try:
        user_id = get_authenticated_user_id()
        
        if not user_id:
            logger.warning("Tool called without authentication")
            return [{"error": "Authentication required. Please provide a valid API key."}]
        
        # Validate and cap limit
        limit = min(max(1, limit), 50)
        offset = max(0, offset)
        
        artifacts = await artifact_service.list(
            user_id=user_id,
            limit=limit,
            offset=offset
        )
        
        return [
            {
                "id": str(a.id),
                "title": a.title,
                "content_preview": generate_snippet(a.content),
                "metadata": a.metadata,
                "created_at": a.created_at.isoformat(),
                "updated_at": a.updated_at.isoformat()
            }
            for a in artifacts
        ]
    except Exception as e:
        logger.error(f"Error listing artifacts: {e}", exc_info=True)
        return [{"error": "Failed to list artifacts"}]


@mcp.tool()
async def search_artifacts(
    query: str,
    limit: int = 10,
    ctx: Context = None
) -> List[Dict[str, Any]]:
    """
    Search your artifacts by text in title and content.
    
    Args:
        query: Search query (searches in title and content)
        limit: Maximum number of results (default 10, max 50)
        ctx: Context object (injected by FastMCP)
    
    Returns:
        List of matching artifacts
    """
    try:
        user_id = get_authenticated_user_id()
        
        if not user_id:
            logger.warning("Tool called without authentication")
            return [{"error": "Authentication required. Please provide a valid API key."}]
        
        if not query or not query.strip():
            return [{"error": "Search query cannot be empty"}]
        
        # Validate and cap limit
        limit = min(max(1, limit), 50)
        
        artifacts = await artifact_service.search(
            user_id=user_id,
            query=query.strip()
        )
        
        # Apply limit
        artifacts = artifacts[:limit]
        
        return [
            {
                "id": str(a.id),
                "title": a.title,
                "content_preview": a.snippet,
                "metadata": a.metadata,
                "relevance_context": f"Matched query: '{query}'",
                "created_at": a.created_at.isoformat()
            }
            for a in artifacts
        ]
    except Exception as e:
        logger.error(f"Error searching artifacts: {e}", exc_info=True)
        return [{"error": "Failed to search artifacts"}]


@mcp.tool()
async def get_artifact(
    artifact_id: str,
    ctx: Context = None
) -> Dict[str, Any]:
    """
    Retrieve a specific artifact by its ID.
    
    Args:
        artifact_id: UUID of the artifact
        ctx: Context object (injected by FastMCP)
    
    Returns:
        The complete artifact with all fields
    """
    try:
        user_id = get_authenticated_user_id()
        
        if not user_id:
            logger.warning("Tool called without authentication")
            return {"error": "Authentication required. Please provide a valid API key."}
        
        try:
            artifact_uuid = UUID(artifact_id)
        except ValueError:
            return {"error": "Invalid artifact ID format. Must be a valid UUID."}
        
        artifact = await artifact_service.get(artifact_uuid, user_id)
        
        if not artifact:
            return {"error": f"Artifact {artifact_id} not found or access denied"}
        
        return {
            "id": str(artifact.id),
            "title": artifact.title,
            "content": artifact.content,
            "metadata": artifact.metadata,
            "created_at": artifact.created_at.isoformat(),
            "updated_at": artifact.updated_at.isoformat(),
            "version": artifact.version
        }
    except ValueError as e:
        return {"error": f"Invalid input: {str(e)}"}
    except Exception as e:
        logger.error(f"Error getting artifact: {e}", exc_info=True)
        return {"error": "Failed to retrieve artifact"}


@mcp.tool()
async def update_artifact(
    artifact_id: str,
    title: Optional[str] = None,
    content: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
    ctx: Context = None
) -> Dict[str, Any]:
    """
    Update an existing artifact.
    
    Args:
        artifact_id: UUID of the artifact to update
        title: New title (optional)
        content: New content (optional)
        metadata: New metadata (optional)
        ctx: Context object (injected by FastMCP)
    
    Returns:
        The updated artifact
    """
    try:
        user_id = get_authenticated_user_id()
        
        if not user_id:
            logger.warning("Tool called without authentication")
            return {"error": "Authentication required. Please provide a valid API key."}
        
        try:
            artifact_uuid = UUID(artifact_id)
        except ValueError:
            return {"error": "Invalid artifact ID format. Must be a valid UUID."}
        
        # Check if any update fields are provided
        if all(v is None for v in [title, content, metadata]):
            return {"error": "No update fields provided"}
        
        update_data = ArtifactUpdate(
            title=title,
            content=content,
            metadata=metadata,
        )
        
        artifact = await artifact_service.update(
            artifact_id=artifact_uuid,
            user_id=user_id,
            data=update_data
        )
        
        if not artifact:
            return {"error": f"Artifact {artifact_id} not found or access denied"}
        
        return {
            "id": str(artifact.id),
            "title": artifact.title,
            "content": artifact.content,
            "metadata": artifact.metadata,
            "updated_at": artifact.updated_at.isoformat(),
            "version": artifact.version,
            "message": f"Updated artifact: {artifact.title}"
        }
    except ValueError as e:
        return {"error": f"Invalid input: {str(e)}"}
    except Exception as e:
        logger.error(f"Error updating artifact: {e}", exc_info=True)
        return {"error": "Failed to update artifact"}


@mcp.tool()
async def delete_artifact(
    artifact_id: str,
    ctx: Context = None
) -> Dict[str, Any]:
    """
    Delete an artifact.
    
    Args:
        artifact_id: UUID of the artifact to delete
        ctx: Context object (injected by FastMCP)
    
    Returns:
        Confirmation of deletion
    """
    try:
        user_id = get_authenticated_user_id()
        
        if not user_id:
            logger.warning("Tool called without authentication")
            return {"error": "Authentication required. Please provide a valid API key."}
        
        try:
            artifact_uuid = UUID(artifact_id)
        except ValueError:
            return {"error": "Invalid artifact ID format. Must be a valid UUID."}
        
        success = await artifact_service.delete(artifact_uuid, user_id)
        
        if not success:
            return {"error": f"Artifact {artifact_id} not found or access denied"}
        
        return {
            "success": True,
            "message": f"Artifact {artifact_id} deleted successfully"
        }
    except ValueError as e:
        return {"error": f"Invalid input: {str(e)}"}
    except Exception as e:
        logger.error(f"Error deleting artifact: {e}", exc_info=True)
        return {"error": "Failed to delete artifact"}


# Export for use in main.py
__all__ = ['mcp']
