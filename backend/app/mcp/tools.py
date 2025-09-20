"""MCP tools for artifact management."""

import logging
from typing import Optional, Dict, Any, List
from uuid import UUID

from mcp.server.fastmcp import Context

from app.models.artifacts import ArtifactCreate, ArtifactUpdate
from app.utils import generate_snippet
from app.services.artifacts import artifact_service
from .auth import get_authenticated_user_id, check_required_scope

# Set up logging
logger = logging.getLogger(__name__)


def register_tools(mcp):
    """Register all MCP tools with the server."""

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

            if not check_required_scope("write"):
                logger.warning(f"User {user_id} attempted create_artifact without write scope")
                return {"error": "Insufficient permissions. Required scope: write"}

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

            if not check_required_scope("read"):
                logger.warning(f"User {user_id} attempted list_artifacts without read scope")
                return [{"error": "Insufficient permissions. Required scope: read"}]

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

            if not check_required_scope("read"):
                logger.warning(f"User {user_id} attempted search_artifacts without read scope")
                return [{"error": "Insufficient permissions. Required scope: read"}]

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

            if not check_required_scope("read"):
                logger.warning(f"User {user_id} attempted get_artifact without read scope")
                return {"error": "Insufficient permissions. Required scope: read"}

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

            if not check_required_scope("write"):
                logger.warning(f"User {user_id} attempted update_artifact without write scope")
                return {"error": "Insufficient permissions. Required scope: write"}
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
    async def str_replace_artifact(
        artifact_id: str,
        old_string: str,
        new_string: str,
        count: Optional[int] = None,
        ctx: Context = None
    ) -> Dict[str, Any]:
        """
        Replace specific strings in artifact content without reading entire content.

        Efficiently edits large artifacts by replacing exact string matches.
        This saves tokens and improves performance for large files.

        Args:
            artifact_id: UUID of the artifact to edit
            old_string: The exact string to find and replace
            new_string: The replacement string
            count: Maximum number of replacements (None for all)
            ctx: Context object (injected by FastMCP)

        Returns:
            Updated artifact with replacement information

        Note:
            - Requires exact string match (including whitespace)
            - Returns error if old_string not found
            - Returns error if multiple matches when ambiguous
        """
        try:
            user_id = get_authenticated_user_id()

            if not user_id:
                return {"error": "Authentication required. Please provide a valid API key."}

            if not check_required_scope("write"):
                logger.warning(f"User {user_id} attempted str_replace_artifact without write scope")
                return {"error": "Insufficient permissions. Required scope: write"}

            try:
                artifact_uuid = UUID(artifact_id)
            except ValueError:
                return {"error": "Invalid artifact ID format. Must be a valid UUID."}

            if not old_string:
                return {"error": "old_string cannot be empty"}

            # Perform string replacement
            try:
                updated = await artifact_service.string_replace(
                    artifact_uuid,
                    user_id,
                    old_string,
                    new_string,
                    count
                )
            except ValueError as e:
                return {"error": str(e)}

            if not updated:
                return {"error": f"Artifact {artifact_id} not found or access denied"}

            return {
                "id": str(updated.id),
                "title": updated.title,
                "version": updated.version,
                "updated_at": updated.updated_at.isoformat(),
                "message": f"Successfully replaced string in artifact"
            }
        except Exception as e:
            logger.error(f"Error in str_replace_artifact: {e}", exc_info=True)
            return {"error": "Failed to replace string in artifact"}

    @mcp.tool()
    async def str_insert_artifact(
        artifact_id: str,
        line_number: int,
        text: str,
        ctx: Context = None
    ) -> Dict[str, Any]:
        """
        Insert text at a specific line in artifact content.

        Efficiently adds content to large artifacts without reading/rewriting everything.
        Line numbers are 1-based (first line is 1).

        Args:
            artifact_id: UUID of the artifact to edit
            line_number: Line number where to insert (1-based)
            text: Text to insert at the specified line
            ctx: Context object (injected by FastMCP)

        Returns:
            Updated artifact with insertion information

        Note:
            - Line numbers are 1-based (first line is 1)
            - Can insert at end by using line_number = total_lines + 1
            - Text is inserted as a new line before the specified line
        """
        try:
            user_id = get_authenticated_user_id()

            if not user_id:
                return {"error": "Authentication required. Please provide a valid API key."}

            if not check_required_scope("write"):
                logger.warning(f"User {user_id} attempted str_insert_artifact without write scope")
                return {"error": "Insufficient permissions. Required scope: write"}

            try:
                artifact_uuid = UUID(artifact_id)
            except ValueError:
                return {"error": "Invalid artifact ID format. Must be a valid UUID."}

            if line_number < 1:
                return {"error": "Line number must be 1 or greater"}

            # Perform string insertion
            try:
                updated = await artifact_service.string_insert(
                    artifact_uuid,
                    user_id,
                    line_number,
                    text
                )
            except ValueError as e:
                return {"error": str(e)}

            if not updated:
                return {"error": f"Artifact {artifact_id} not found or access denied"}

            return {
                "id": str(updated.id),
                "title": updated.title,
                "version": updated.version,
                "updated_at": updated.updated_at.isoformat(),
                "message": f"Successfully inserted text at line {line_number}"
            }
        except Exception as e:
            logger.error(f"Error in str_insert_artifact: {e}", exc_info=True)
            return {"error": "Failed to insert text in artifact"}

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

            if not check_required_scope("delete"):
                logger.warning(f"User {user_id} attempted delete_artifact without delete scope")
                return {"error": "Insufficient permissions. Required scope: delete"}

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

    @mcp.tool()
    async def list_artifact_versions(
        artifact_id: str,
        ctx: Context = None
    ) -> Dict[str, Any]:
        """
        Get version history for an artifact.

        Args:
            artifact_id: UUID of the artifact
            ctx: Context object (injected by FastMCP)

        Returns:
            Version history summary
        """
        try:
            user_id = get_authenticated_user_id()

            if not user_id:
                return {"error": "Authentication required. Please provide a valid API key."}

            if not check_required_scope("read"):
                logger.warning(f"User {user_id} attempted list_artifact_versions without read scope")
                return {"error": "Insufficient permissions. Required scope: read"}

            try:
                artifact_uuid = UUID(artifact_id)
            except ValueError:
                return {"error": "Invalid artifact ID format. Must be a valid UUID."}

            versions = await artifact_service.get_versions(artifact_uuid, user_id)

            if not versions:
                return {"error": f"Artifact {artifact_id} not found or access denied"}

            return {
                "artifact_id": str(versions.id),
                "current_version": versions.current_version,
                "total_edits": versions.version_count,
                "recent_versions": [
                    {
                        "version": v.version,
                        "title": v.title,
                        "updated_at": v.updated_at.isoformat(),
                        "changes": v.changes
                    }
                    for v in versions.versions
                ]
            }
        except Exception as e:
            logger.error(f"Error listing versions: {e}", exc_info=True)
            return {"error": "Failed to retrieve version history"}

    @mcp.tool()
    async def get_artifact_version(
        artifact_id: str,
        version_number: int,
        ctx: Context = None
    ) -> Dict[str, Any]:
        """
        Get a specific version of an artifact.

        Args:
            artifact_id: UUID of the artifact
            version_number: Version number to retrieve
            ctx: Context object (injected by FastMCP)

        Returns:
            The specified version with full content
        """
        try:
            user_id = get_authenticated_user_id()

            if not user_id:
                return {"error": "Authentication required. Please provide a valid API key."}

            if not check_required_scope("read"):
                logger.warning(f"User {user_id} attempted get_artifact_version without read scope")
                return {"error": "Insufficient permissions. Required scope: read"}

            try:
                artifact_uuid = UUID(artifact_id)
            except ValueError:
                return {"error": "Invalid artifact ID format. Must be a valid UUID."}

            version = await artifact_service.get_version(artifact_uuid, user_id, version_number)

            if not version:
                return {"error": f"Version {version_number} not found for artifact {artifact_id}"}

            return {
                "version": version.version,
                "title": version.title,
                "content": version.content,
                "metadata": version.metadata,
                "updated_at": version.updated_at.isoformat()
            }
        except Exception as e:
            logger.error(f"Error getting version: {e}", exc_info=True)
            return {"error": "Failed to retrieve version"}

    @mcp.tool()
    async def restore_artifact_version(
        artifact_id: str,
        version_number: int,
        ctx: Context = None
    ) -> Dict[str, Any]:
        """
        Restore an artifact to a previous version.

        Args:
            artifact_id: UUID of the artifact
            version_number: Version number to restore
            ctx: Context object (injected by FastMCP)

        Returns:
            Confirmation of restoration
        """
        try:
            user_id = get_authenticated_user_id()

            if not user_id:
                return {"error": "Authentication required. Please provide a valid API key."}

            if not check_required_scope("write"):
                logger.warning(f"User {user_id} attempted restore_artifact_version without write scope")
                return {"error": "Insufficient permissions. Required scope: write"}

            try:
                artifact_uuid = UUID(artifact_id)
            except ValueError:
                return {"error": "Invalid artifact ID format. Must be a valid UUID."}

            restored = await artifact_service.restore_version(artifact_uuid, user_id, version_number)

            if not restored:
                return {"error": f"Cannot restore version {version_number} for artifact {artifact_id}"}

            return {
                "success": True,
                "message": f"Artifact restored to version {version_number}",
                "current_version": restored.version,
                "title": restored.title
            }
        except Exception as e:
            logger.error(f"Error restoring version: {e}", exc_info=True)
            return {"error": "Failed to restore version"}
