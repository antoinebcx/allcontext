"""REST API endpoints for artifacts."""

from fastapi import APIRouter, HTTPException, Query, Path, Depends
from typing import List, Dict, Any
from uuid import UUID
from app.models.artifacts import (
    Artifact, ArtifactCreate, ArtifactUpdate, ArtifactList, ArtifactSearchResult,
    ArtifactVersion, ArtifactVersionsResponse
)
from app.dependencies.auth import get_current_user
from app.services.artifacts import artifact_service

router = APIRouter(
    prefix="/api/v1/artifacts",
    tags=["artifacts"],
    responses={
        404: {"description": "Not found"},
        400: {"description": "Bad request"}
    }
)


@router.post("", response_model=Artifact, status_code=201)
async def create_artifact(
    data: ArtifactCreate,
    user_id: UUID = Depends(get_current_user)
):
    """
    Create a new artifact.
    
    - **title**: Title of the artifact (max 200 chars)
    - **content**: Main content (max 100k chars)
    - **metadata**: Optional metadata as JSON object
    """
    artifact = await artifact_service.create(user_id, data)
    return artifact


@router.get("", response_model=ArtifactList)
async def list_artifacts(
    limit: int = Query(50, ge=1, le=100, description="Items per page"),
    offset: int = Query(0, ge=0, description="Number of items to skip"),
    user_id: UUID = Depends(get_current_user)
):
    """
    List artifacts.

    Returns user's artifacts.
    """
    artifacts = await artifact_service.list(
        user_id=user_id,
        limit=limit,
        offset=offset
    )
    
    total = await artifact_service.count(user_id)
    
    return ArtifactList(
        items=artifacts,
        total=total,
        page=(offset // limit) + 1,
        page_size=limit
    )


@router.get("/search", response_model=List[ArtifactSearchResult])
async def search_artifacts(
    q: str = Query(..., min_length=1, description="Search query"),
    user_id: UUID = Depends(get_current_user)
):
    """
    Search artifacts by text in title and content.

    Returns preview snippets instead of full content (best practice).
    Use GET /artifacts/{id} to retrieve full content.
    """
    results = await artifact_service.search(
        user_id=user_id,
        query=q
    )

    return results


@router.get("/{artifact_id}", response_model=Artifact)
async def get_artifact(
    artifact_id: UUID = Path(..., description="Artifact ID"),
    user_id: UUID = Depends(get_current_user)
):
    """
    Get a single artifact by ID.

    Returns artifact if it belongs to user.
    """
    artifact = await artifact_service.get(artifact_id, user_id)
    
    if not artifact:
        raise HTTPException(
            status_code=404,
            detail=f"Artifact {artifact_id} not found"
        )
    
    return artifact


@router.put("/{artifact_id}", response_model=Artifact)
async def update_artifact(
    artifact_id: UUID,
    data: ArtifactUpdate,
    user_id: UUID = Depends(get_current_user)
):
    """
    Update an artifact.
    
    Only the owner can update their artifacts.
    All fields are optional - only provided fields will be updated.
    """
    artifact = await artifact_service.update(
        artifact_id=artifact_id,
        user_id=user_id,
        data=data
    )
    
    if not artifact:
        raise HTTPException(
            status_code=404,
            detail=f"Artifact {artifact_id} not found or access denied"
        )
    
    return artifact


@router.delete("/{artifact_id}", status_code=204)
async def delete_artifact(
    artifact_id: UUID = Path(..., description="Artifact ID"),
    user_id: UUID = Depends(get_current_user)
):
    """
    Delete an artifact.

    Only the owner can delete their artifacts.
    """
    success = await artifact_service.delete(artifact_id, user_id)

    if not success:
        raise HTTPException(
            status_code=404,
            detail=f"Artifact {artifact_id} not found or access denied"
        )

    return None


@router.get("/{artifact_id}/versions", response_model=ArtifactVersionsResponse)
async def get_artifact_versions(
    artifact_id: UUID = Path(..., description="Artifact ID"),
    user_id: UUID = Depends(get_current_user)
):
    """
    Get version history for an artifact.

    Returns summary of last 10 versions without full content.
    """
    versions = await artifact_service.get_versions(artifact_id, user_id)

    if not versions:
        raise HTTPException(
            status_code=404,
            detail=f"Artifact {artifact_id} not found or access denied"
        )

    return versions


@router.get("/{artifact_id}/versions/{version_number}", response_model=ArtifactVersion)
async def get_artifact_version(
    artifact_id: UUID = Path(..., description="Artifact ID"),
    version_number: int = Path(..., description="Version number", ge=1),
    user_id: UUID = Depends(get_current_user)
):
    """
    Get specific version of an artifact with full content.
    """
    version = await artifact_service.get_version(artifact_id, user_id, version_number)

    if not version:
        raise HTTPException(
            status_code=404,
            detail=f"Version {version_number} not found for artifact {artifact_id}"
        )

    return version


@router.post("/{artifact_id}/restore/{version_number}", response_model=Artifact)
async def restore_artifact_version(
    artifact_id: UUID = Path(..., description="Artifact ID"),
    version_number: int = Path(..., description="Version to restore", ge=1),
    user_id: UUID = Depends(get_current_user)
):
    """
    Restore artifact to a previous version.

    This creates a new version with the content from the specified version.
    """
    restored = await artifact_service.restore_version(artifact_id, user_id, version_number)

    if not restored:
        raise HTTPException(
            status_code=404,
            detail=f"Cannot restore version {version_number} for artifact {artifact_id}"
        )

    return restored


@router.get("/{artifact_id}/diff")
async def get_version_diff(
    artifact_id: UUID = Path(..., description="Artifact ID"),
    from_version: int = Query(..., description="Starting version", ge=1),
    to_version: int = Query(..., description="Ending version", ge=1),
    user_id: UUID = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get differences between two versions of an artifact.
    """
    diff = await artifact_service.get_version_diff(
        artifact_id, user_id, from_version, to_version
    )

    if not diff:
        raise HTTPException(
            status_code=404,
            detail=f"Cannot compare versions {from_version} and {to_version}"
        )

    return diff
