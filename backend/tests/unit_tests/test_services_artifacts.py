"""Unit tests for in-memory artifact service."""

import pytest
from uuid import UUID, uuid4
from datetime import datetime, timezone

from app.models.artifacts import ArtifactCreate, ArtifactUpdate
from app.services.artifacts import ArtifactService


@pytest.fixture
def artifact_service():
    """Create a fresh artifact service for each test."""
    service = ArtifactService()
    # Clear demo data
    service._artifacts.clear()
    return service


@pytest.fixture
def user_id():
    """Generate a test user ID."""
    return uuid4()


@pytest.fixture
def other_user_id():
    """Generate another test user ID."""
    return uuid4()


class TestArtifactService:
    """Test suite for artifact service."""
    
    @pytest.mark.asyncio
    async def test_create_artifact_with_title(self, artifact_service, user_id):
        """Should create artifact with provided title."""
        data = ArtifactCreate(
            title="Test Title",
            content="Test content"
        )
        
        artifact = await artifact_service.create(user_id, data)
        
        assert artifact.title == "Test Title"
        assert artifact.content == "Test content"
        assert artifact.user_id == user_id
        assert artifact.id is not None
        assert artifact.version == 1
    
    @pytest.mark.asyncio
    async def test_create_artifact_auto_title(self, artifact_service, user_id):
        """Should auto-generate title from content when not provided."""
        data = ArtifactCreate(
            content="# Auto Generated Title\n\nContent here"
        )
        
        artifact = await artifact_service.create(user_id, data)
        
        assert artifact.title == "Auto Generated Title"
        assert artifact.user_id == user_id
    
    @pytest.mark.asyncio
    async def test_get_artifact_by_owner(self, artifact_service, user_id):
        """Should retrieve artifact when requested by owner."""
        data = ArtifactCreate(title="Test", content="Content")
        created = await artifact_service.create(user_id, data)
        
        retrieved = await artifact_service.get(created.id, user_id)
        
        assert retrieved is not None
        assert retrieved.id == created.id
        assert retrieved.title == "Test"
    
    @pytest.mark.asyncio
    async def test_get_artifact_public(self, artifact_service, user_id, other_user_id):
        """Should retrieve public artifact by other users."""
        data = ArtifactCreate(
            title="Public",
            content="Content",
            is_public=True
        )
        created = await artifact_service.create(user_id, data)
        
        retrieved = await artifact_service.get(created.id, other_user_id)
        
        assert retrieved is not None
        assert retrieved.id == created.id
    
    @pytest.mark.asyncio
    async def test_get_artifact_private_blocked(self, artifact_service, user_id, other_user_id):
        """Should not retrieve private artifact by other users."""
        data = ArtifactCreate(
            title="Private",
            content="Content",
            is_public=False
        )
        created = await artifact_service.create(user_id, data)
        
        retrieved = await artifact_service.get(created.id, other_user_id)
        
        assert retrieved is None
    
    @pytest.mark.asyncio
    async def test_list_user_artifacts(self, artifact_service, user_id, other_user_id):
        """Should list only user's own and public artifacts."""
        # Create user's artifacts
        await artifact_service.create(user_id, ArtifactCreate(
            title="My Private", content="Content", is_public=False
        ))
        await artifact_service.create(user_id, ArtifactCreate(
            title="My Public", content="Content", is_public=True
        ))
        
        # Create other user's artifacts
        await artifact_service.create(other_user_id, ArtifactCreate(
            title="Other Private", content="Content", is_public=False
        ))
        await artifact_service.create(other_user_id, ArtifactCreate(
            title="Other Public", content="Content", is_public=True
        ))
        
        # List for first user
        artifacts = await artifact_service.list(user_id)
        titles = [a.title for a in artifacts]
        
        assert "My Private" in titles
        assert "My Public" in titles
        assert "Other Private" not in titles
        assert "Other Public" in titles
        assert len(artifacts) == 3
    
    @pytest.mark.asyncio
    async def test_list_pagination(self, artifact_service, user_id):
        """Should paginate results correctly."""
        # Create 5 artifacts
        for i in range(5):
            await artifact_service.create(user_id, ArtifactCreate(
                title=f"Artifact {i}", content="Content"
            ))
        
        # Get first page
        page1 = await artifact_service.list(user_id, limit=2, offset=0)
        assert len(page1) == 2
        
        # Get second page
        page2 = await artifact_service.list(user_id, limit=2, offset=2)
        assert len(page2) == 2
        
        # Get third page
        page3 = await artifact_service.list(user_id, limit=2, offset=4)
        assert len(page3) == 1
        
        # Verify no overlap
        ids1 = {a.id for a in page1}
        ids2 = {a.id for a in page2}
        ids3 = {a.id for a in page3}
        assert len(ids1 & ids2) == 0
        assert len(ids2 & ids3) == 0
    
    @pytest.mark.asyncio
    async def test_update_artifact(self, artifact_service, user_id):
        """Should update artifact fields."""
        data = ArtifactCreate(title="Original", content="Original content")
        created = await artifact_service.create(user_id, data)
        original_created_at = created.created_at
        
        update = ArtifactUpdate(title="Updated", content="Updated content")
        updated = await artifact_service.update(created.id, user_id, update)
        
        assert updated is not None
        assert updated.title == "Updated"
        assert updated.content == "Updated content"
        assert updated.version == 2
        assert updated.created_at == original_created_at
        assert updated.updated_at > original_created_at
    
    @pytest.mark.asyncio
    async def test_update_artifact_partial(self, artifact_service, user_id):
        """Should update only provided fields."""
        data = ArtifactCreate(
            title="Original",
            content="Original content",
            metadata={"key": "value"}
        )
        created = await artifact_service.create(user_id, data)
        
        # Update only title
        update = ArtifactUpdate(title="New Title")
        updated = await artifact_service.update(created.id, user_id, update)
        
        assert updated.title == "New Title"
        assert updated.content == "Original content"  # Unchanged
        assert updated.metadata == {"key": "value"}  # Unchanged
    
    @pytest.mark.asyncio
    async def test_update_artifact_auto_title(self, artifact_service, user_id):
        """Should auto-generate title when content changes but title not provided."""
        data = ArtifactCreate(title="Original", content="Original")
        created = await artifact_service.create(user_id, data)
        
        update = ArtifactUpdate(content="# New Auto Title\n\nNew content")
        updated = await artifact_service.update(created.id, user_id, update)
        
        assert updated.title == "New Auto Title"
    
    @pytest.mark.asyncio
    async def test_update_artifact_not_owner(self, artifact_service, user_id, other_user_id):
        """Should not update artifact if not owner."""
        data = ArtifactCreate(title="Test", content="Content")
        created = await artifact_service.create(user_id, data)
        
        update = ArtifactUpdate(title="Hacked")
        updated = await artifact_service.update(created.id, other_user_id, update)
        
        assert updated is None
        
        # Verify original unchanged
        original = await artifact_service.get(created.id, user_id)
        assert original.title == "Test"
    
    @pytest.mark.asyncio
    async def test_delete_artifact(self, artifact_service, user_id):
        """Should delete artifact when owner."""
        data = ArtifactCreate(title="To Delete", content="Content")
        created = await artifact_service.create(user_id, data)
        
        deleted = await artifact_service.delete(created.id, user_id)
        assert deleted is True
        
        # Verify deleted
        retrieved = await artifact_service.get(created.id, user_id)
        assert retrieved is None
    
    @pytest.mark.asyncio
    async def test_delete_artifact_not_owner(self, artifact_service, user_id, other_user_id):
        """Should not delete artifact if not owner."""
        data = ArtifactCreate(title="Protected", content="Content")
        created = await artifact_service.create(user_id, data)
        
        deleted = await artifact_service.delete(created.id, other_user_id)
        assert deleted is False
        
        # Verify still exists
        retrieved = await artifact_service.get(created.id, user_id)
        assert retrieved is not None
    
    @pytest.mark.asyncio
    async def test_search_artifacts(self, artifact_service, user_id):
        """Should search artifacts by text in title and content."""
        # Create test artifacts with different content lengths
        await artifact_service.create(user_id, ArtifactCreate(
            title="Python Guide", content="Learn Python programming"
        ))
        await artifact_service.create(user_id, ArtifactCreate(
            title="JavaScript Tips", content="Modern JS best practices"
        ))
        long_content = "Container with Python examples. " * 20  # Over 200 chars
        await artifact_service.create(user_id, ArtifactCreate(
            title="Docker Tutorial", content=long_content
        ))

        # Search for "Python"
        results = await artifact_service.search(user_id, "Python")
        titles = [r.title for r in results]

        assert "Python Guide" in titles
        assert "Docker Tutorial" in titles  # Has Python in content
        assert "JavaScript Tips" not in titles
        assert len(results) == 2

        # Verify search returns snippets, not full content
        for result in results:
            # Check that result has snippet field (not content)
            assert hasattr(result, 'snippet')
            assert not hasattr(result, 'content')

            # Verify snippet length constraint
            if result.title == "Docker Tutorial":
                # This one has long content, should be truncated
                assert len(result.snippet) == 203  # 200 + "..."
                assert result.snippet.endswith("...")
            elif result.title == "Python Guide":
                # Short content, no truncation
                assert result.snippet == "Learn Python programming"
    
    @pytest.mark.asyncio
    async def test_search_case_insensitive(self, artifact_service, user_id):
        """Should search case-insensitively."""
        await artifact_service.create(user_id, ArtifactCreate(
            title="UPPERCASE", content="lowercase content"
        ))
        
        results1 = await artifact_service.search(user_id, "uppercase")
        results2 = await artifact_service.search(user_id, "UPPERCASE")
        results3 = await artifact_service.search(user_id, "LOWERCASE")
        
        assert len(results1) == 1
        assert len(results2) == 1
        assert len(results3) == 1
    
    @pytest.mark.asyncio
    async def test_count_artifacts(self, artifact_service, user_id):
        """Should count user's artifacts correctly."""
        # Create 3 artifacts
        for i in range(3):
            await artifact_service.create(user_id, ArtifactCreate(
                title=f"Artifact {i}", content="Content"
            ))
        
        count = await artifact_service.count(user_id)
        assert count == 3