"""REST API endpoints for artifacts."""

from fastapi import APIRouter, HTTPException, Query, Path, Depends
from typing import List
from uuid import UUID
from app.models.artifacts import Artifact, ArtifactCreate, ArtifactUpdate, ArtifactList
from app.models.search import ArtifactSearchResult
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
    - **is_public**: Whether artifact is publicly accessible
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
    
    Returns user's artifacts and public artifacts.
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
    if len(q) < 2:
        raise HTTPException(
            status_code=400,
            detail="Search query must be at least 2 characters"
        )

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
    
    Returns artifact if it belongs to user or is public.
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
