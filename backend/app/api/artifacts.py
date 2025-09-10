"""REST API endpoints for artifacts."""

from fastapi import APIRouter, HTTPException, Query, Path
from typing import List
from uuid import UUID
from app.models.core import Artifact, ArtifactCreate, ArtifactUpdate, ArtifactList
from app.config import config

# Get the appropriate service based on configuration
artifact_service = config.get_artifact_service()

router = APIRouter(
    prefix="/api/v1/artifacts",
    tags=["artifacts"],
    responses={
        404: {"description": "Not found"},
        400: {"description": "Bad request"}
    }
)

# For now, using a hardcoded user_id. Will be replaced with auth later.
DEMO_USER_ID = UUID("123e4567-e89b-12d3-a456-426614174001")


@router.post("", response_model=Artifact, status_code=201)
async def create_artifact(data: ArtifactCreate):
    """
    Create a new artifact.
    
    - **title**: Title of the artifact (max 200 chars)
    - **content**: Main content (max 100k chars)
    - **metadata**: Optional metadata as JSON object
    - **is_public**: Whether artifact is publicly accessible
    """
    artifact = await artifact_service.create(DEMO_USER_ID, data)
    return artifact


@router.get("", response_model=ArtifactList)
async def list_artifacts(
    limit: int = Query(50, ge=1, le=100, description="Items per page"),
    offset: int = Query(0, ge=0, description="Number of items to skip")
):
    """
    List artifacts.
    
    Returns user's artifacts and public artifacts.
    """
    artifacts = await artifact_service.list(
        user_id=DEMO_USER_ID,
        limit=limit,
        offset=offset
    )
    
    total = await artifact_service.count(DEMO_USER_ID)
    
    return ArtifactList(
        items=artifacts,
        total=total,
        page=(offset // limit) + 1,
        page_size=limit
    )


@router.get("/search", response_model=List[Artifact])
async def search_artifacts(
    q: str = Query(..., min_length=1, description="Search query")
):
    """
    Search artifacts by text in title and content.
    
    Uses full-text search when available.
    """
    if len(q) < 2:
        raise HTTPException(
            status_code=400,
            detail="Search query must be at least 2 characters"
        )
    
    results = await artifact_service.search(
        user_id=DEMO_USER_ID,
        query=q
    )
    
    return results


@router.get("/{artifact_id}", response_model=Artifact)
async def get_artifact(
    artifact_id: UUID = Path(..., description="Artifact ID")
):
    """
    Get a single artifact by ID.
    
    Returns artifact if it belongs to user or is public.
    """
    artifact = await artifact_service.get(artifact_id, DEMO_USER_ID)
    
    if not artifact:
        raise HTTPException(
            status_code=404,
            detail=f"Artifact {artifact_id} not found"
        )
    
    return artifact


@router.put("/{artifact_id}", response_model=Artifact)
async def update_artifact(
    artifact_id: UUID,
    data: ArtifactUpdate
):
    """
    Update an artifact.
    
    Only the owner can update their artifacts.
    All fields are optional - only provided fields will be updated.
    """
    artifact = await artifact_service.update(
        artifact_id=artifact_id,
        user_id=DEMO_USER_ID,
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
    artifact_id: UUID = Path(..., description="Artifact ID")
):
    """
    Delete an artifact.
    
    Only the owner can delete their artifacts.
    """
    success = await artifact_service.delete(artifact_id, DEMO_USER_ID)
    
    if not success:
        raise HTTPException(
            status_code=404,
            detail=f"Artifact {artifact_id} not found or access denied"
        )
    
    return None
