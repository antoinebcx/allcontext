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

        # Limit max to 50
        limit = min(limit, 50)

        artifacts = await artifact_service.list(
            user_id=user_id,
            limit=limit,
            offset=offset
        )

        return [
            {
                "id": str(artifact.id),
                "title": artifact.title,
                "content_preview": artifact.content[:500] + "..." if len(artifact.content) > 500 else artifact.content,
                "metadata": artifact.metadata,
                "created_at": artifact.created_at.isoformat(),
                "updated_at": artifact.updated_at.isoformat() if artifact.updated_at else None
            }
            for artifact in artifacts
        ]
    except Exception as e:
        logger.error(f"Error listing artifacts: {e}", exc_info=True)
        return [{"error": "Failed to list artifacts"}]


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

        # Limit max to 50
        limit = min(limit, 50)

        results = await artifact_service.search(
            user_id=user_id,
            query=query,
            limit=limit
        )

        return [
            {
                "id": str(result.id),
                "title": result.title,
                "snippet": generate_snippet(result.content, query, max_length=200),
                "metadata": result.metadata,
                "created_at": result.created_at.isoformat(),
                "updated_at": result.updated_at.isoformat() if result.updated_at else None
            }
            for result in results
        ]
    except Exception as e:
        logger.error(f"Error searching artifacts: {e}", exc_info=True)
        return [{"error": "Failed to search artifacts"}]


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
            return {"error": f"Invalid artifact ID format: {artifact_id}"}

        artifact = await artifact_service.get(user_id, artifact_uuid)

        if not artifact:
            return {"error": f"Artifact not found: {artifact_id}"}

        return {
            "id": str(artifact.id),
            "title": artifact.title,
            "content": artifact.content,
            "metadata": artifact.metadata,
            "created_at": artifact.created_at.isoformat(),
            "updated_at": artifact.updated_at.isoformat() if artifact.updated_at else None,
            "version": artifact.version
        }
    except Exception as e:
        logger.error(f"Error getting artifact: {e}", exc_info=True)
        return {"error": "Failed to get artifact"}


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
            return {"error": f"Invalid artifact ID format: {artifact_id}"}

        # Check if artifact exists
        existing = await artifact_service.get(user_id, artifact_uuid)
        if not existing:
            return {"error": f"Artifact not found: {artifact_id}"}

        # Create update data with provided fields
        update_data = ArtifactUpdate()
        if title is not None:
            update_data.title = title
        if content is not None:
            update_data.content = content
        if metadata is not None:
            update_data.metadata = metadata

        updated = await artifact_service.update(
            user_id=user_id,
            artifact_id=artifact_uuid,
            data=update_data
        )

        if not updated:
            return {"error": f"Failed to update artifact: {artifact_id}"}

        return {
            "id": str(updated.id),
            "title": updated.title,
            "content": updated.content,
            "metadata": updated.metadata,
            "updated_at": updated.updated_at.isoformat() if updated.updated_at else None,
            "version": updated.version,
            "message": f"Updated artifact: {updated.title}"
        }
    except ValueError as e:
        logger.error(f"Validation error: {e}")
        return {"error": f"Invalid input: {str(e)}"}
    except Exception as e:
        logger.error(f"Error updating artifact: {e}", exc_info=True)
        return {"error": "Failed to update artifact"}


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
            logger.warning("Tool called without authentication")
            return {"error": "Authentication required. Please provide a valid API key."}

        if not check_required_scope("write"):
            logger.warning(f"User {user_id} attempted str_replace_artifact without write scope")
            return {"error": "Insufficient permissions. Required scope: write"}

        try:
            artifact_uuid = UUID(artifact_id)
        except ValueError:
            return {"error": f"Invalid artifact ID format: {artifact_id}"}

        # Get existing artifact
        existing = await artifact_service.get(user_id, artifact_uuid)
        if not existing:
            return {"error": f"Artifact not found: {artifact_id}"}

        # Count occurrences
        occurrences = existing.content.count(old_string)
        if occurrences == 0:
            return {"error": f"String not found in artifact: '{old_string[:50]}...'"}

        # Perform replacement
        if count is None:
            new_content = existing.content.replace(old_string, new_string)
            replacements_made = occurrences
        else:
            new_content = existing.content.replace(old_string, new_string, count)
            replacements_made = min(count, occurrences)

        # Update artifact
        update_data = ArtifactUpdate(content=new_content)
        updated = await artifact_service.update(
            user_id=user_id,
            artifact_id=artifact_uuid,
            data=update_data
        )

        if not updated:
            return {"error": f"Failed to update artifact: {artifact_id}"}

        return {
            "id": str(updated.id),
            "title": updated.title,
            "replacements_made": replacements_made,
            "total_occurrences": occurrences,
            "updated_at": updated.updated_at.isoformat() if updated.updated_at else None,
            "version": updated.version,
            "message": f"Replaced {replacements_made} occurrence(s) in {updated.title}"
        }
    except Exception as e:
        logger.error(f"Error in str_replace_artifact: {e}", exc_info=True)
        return {"error": "Failed to replace string in artifact"}


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
            logger.warning("Tool called without authentication")
            return {"error": "Authentication required. Please provide a valid API key."}

        if not check_required_scope("write"):
            logger.warning(f"User {user_id} attempted str_insert_artifact without write scope")
            return {"error": "Insufficient permissions. Required scope: write"}

        try:
            artifact_uuid = UUID(artifact_id)
        except ValueError:
            return {"error": f"Invalid artifact ID format: {artifact_id}"}

        # Get existing artifact
        existing = await artifact_service.get(user_id, artifact_uuid)
        if not existing:
            return {"error": f"Artifact not found: {artifact_id}"}

        # Split content into lines
        lines = existing.content.split('\n')
        total_lines = len(lines)

        # Validate line number
        if line_number < 1 or line_number > total_lines + 1:
            return {"error": f"Line number {line_number} out of range (1-{total_lines + 1})"}

        # Insert text at specified line (converting to 0-based index)
        lines.insert(line_number - 1, text)
        new_content = '\n'.join(lines)

        # Update artifact
        update_data = ArtifactUpdate(content=new_content)
        updated = await artifact_service.update(
            user_id=user_id,
            artifact_id=artifact_uuid,
            data=update_data
        )

        if not updated:
            return {"error": f"Failed to update artifact: {artifact_id}"}

        return {
            "id": str(updated.id),
            "title": updated.title,
            "line_inserted": line_number,
            "total_lines": len(lines),
            "updated_at": updated.updated_at.isoformat() if updated.updated_at else None,
            "version": updated.version,
            "message": f"Inserted text at line {line_number} in {updated.title}"
        }
    except Exception as e:
        logger.error(f"Error in str_insert_artifact: {e}", exc_info=True)
        return {"error": "Failed to insert text in artifact"}


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
            return {"error": f"Invalid artifact ID format: {artifact_id}"}

        # Check if artifact exists
        existing = await artifact_service.get(user_id, artifact_uuid)
        if not existing:
            return {"error": f"Artifact not found: {artifact_id}"}

        success = await artifact_service.delete(user_id, artifact_uuid)

        if success:
            return {
                "id": artifact_id,
                "message": f"Deleted artifact: {existing.title}",
                "success": True
            }
        else:
            return {"error": f"Failed to delete artifact: {artifact_id}"}
    except Exception as e:
        logger.error(f"Error deleting artifact: {e}", exc_info=True)
        return {"error": "Failed to delete artifact"}


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
            logger.warning("Tool called without authentication")
            return {"error": "Authentication required. Please provide a valid API key."}

        if not check_required_scope("read"):
            logger.warning(f"User {user_id} attempted list_artifact_versions without read scope")
            return {"error": "Insufficient permissions. Required scope: read"}

        try:
            artifact_uuid = UUID(artifact_id)
        except ValueError:
            return {"error": f"Invalid artifact ID format: {artifact_id}"}

        versions = await artifact_service.list_versions(user_id, artifact_uuid)

        if not versions:
            return {"error": f"Artifact not found or no version history: {artifact_id}"}

        return {
            "artifact_id": artifact_id,
            "versions": [
                {
                    "version": v.version,
                    "title": v.title,
                    "created_at": v.created_at.isoformat(),
                    "content_preview": v.content[:200] + "..." if len(v.content) > 200 else v.content
                }
                for v in versions
            ],
            "total_versions": len(versions)
        }
    except Exception as e:
        logger.error(f"Error listing artifact versions: {e}", exc_info=True)
        return {"error": "Failed to list versions"}


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
            logger.warning("Tool called without authentication")
            return {"error": "Authentication required. Please provide a valid API key."}

        if not check_required_scope("read"):
            logger.warning(f"User {user_id} attempted get_artifact_version without read scope")
            return {"error": "Insufficient permissions. Required scope: read"}

        try:
            artifact_uuid = UUID(artifact_id)
        except ValueError:
            return {"error": f"Invalid artifact ID format: {artifact_id}"}

        version = await artifact_service.get_version(user_id, artifact_uuid, version_number)

        if not version:
            return {"error": f"Version {version_number} not found for artifact: {artifact_id}"}

        return {
            "id": str(version.artifact_id),
            "version": version.version,
            "title": version.title,
            "content": version.content,
            "metadata": version.metadata,
            "created_at": version.created_at.isoformat()
        }
    except Exception as e:
        logger.error(f"Error getting artifact version: {e}", exc_info=True)
        return {"error": "Failed to get version"}


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
            logger.warning("Tool called without authentication")
            return {"error": "Authentication required. Please provide a valid API key."}

        if not check_required_scope("write"):
            logger.warning(f"User {user_id} attempted restore_artifact_version without write scope")
            return {"error": "Insufficient permissions. Required scope: write"}

        try:
            artifact_uuid = UUID(artifact_id)
        except ValueError:
            return {"error": f"Invalid artifact ID format: {artifact_id}"}

        restored = await artifact_service.restore_version(user_id, artifact_uuid, version_number)

        if restored:
            return {
                "id": str(restored.id),
                "title": restored.title,
                "restored_to_version": version_number,
                "current_version": restored.version,
                "message": f"Restored {restored.title} to version {version_number}"
            }
        else:
            return {"error": f"Failed to restore artifact to version {version_number}"}
    except Exception as e:
        logger.error(f"Error restoring artifact version: {e}", exc_info=True)
        return {"error": "Failed to restore version"}


def register_tools(mcp):
    """Register all MCP tools with the server."""
    # Register each tool function with the MCP server
    mcp.tool()(create_artifact)
    mcp.tool()(list_artifacts)
    mcp.tool()(search_artifacts)
    mcp.tool()(get_artifact)
    mcp.tool()(update_artifact)
    mcp.tool()(str_replace_artifact)
    mcp.tool()(str_insert_artifact)
    mcp.tool()(delete_artifact)
    mcp.tool()(list_artifact_versions)
    mcp.tool()(get_artifact_version)
    mcp.tool()(restore_artifact_version)