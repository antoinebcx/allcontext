"""Tests for Supabase artifact service.

Note: These are integration tests that require a Supabase connection.
Ensure SUPABASE_URL and SUPABASE_KEY are set in your .env file.
"""

import pytest
from uuid import UUID, uuid4
from datetime import datetime, timezone

from app.models.artifacts import ArtifactCreate, ArtifactUpdate
from app.services.artifacts import ArtifactService


@pytest.fixture
def artifact_service():
    """Create artifact service instance."""
    return ArtifactService()


@pytest.fixture
def user_id():
    """Generate a test user ID."""
    return uuid4()


@pytest.fixture
def other_user_id():
    """Generate another test user ID."""
    return uuid4()


@pytest.mark.asyncio
class TestArtifactServiceSupabase:
    """Integration tests for Supabase artifact service.

    Note: These tests require a Supabase connection and will create/delete
    real data in your Supabase database. Use a test/dev project.
    """

    async def test_create_and_get_artifact(self, artifact_service, user_id):
        """Should create and retrieve artifact via Supabase."""
        data = ArtifactCreate(
            title="Test Artifact",
            content="Test content for Supabase"
        )

        # Create artifact
        created = await artifact_service.create(user_id, data)
        assert created.title == "Test Artifact"
        assert created.content == "Test content for Supabase"
        assert created.user_id == user_id

        # Retrieve artifact
        retrieved = await artifact_service.get(created.id, user_id)
        assert retrieved is not None
        assert retrieved.id == created.id
        assert retrieved.title == "Test Artifact"

        # Cleanup
        await artifact_service.delete(created.id, user_id)

    async def test_search_artifacts(self, artifact_service, user_id):
        """Should search artifacts in Supabase."""
        # Create test artifacts
        artifact1 = await artifact_service.create(user_id, ArtifactCreate(
            title="Python Guide", content="Learn Python programming"
        ))
        artifact2 = await artifact_service.create(user_id, ArtifactCreate(
            title="JavaScript Tips", content="Modern JS with Python examples"
        ))

        # Search for "Python"
        results = await artifact_service.search(user_id, "Python")
        titles = [r.title for r in results]

        assert "Python Guide" in titles
        assert "JavaScript Tips" in titles  # Has Python in content

        # Verify search returns snippets
        for result in results:
            assert hasattr(result, 'snippet')
            assert not hasattr(result, 'content')

        # Cleanup
        await artifact_service.delete(artifact1.id, user_id)
        await artifact_service.delete(artifact2.id, user_id)

    async def test_update_artifact(self, artifact_service, user_id):
        """Should update artifact in Supabase."""
        # Create artifact
        created = await artifact_service.create(user_id, ArtifactCreate(
            title="Original", content="Original content"
        ))

        # Update it
        update = ArtifactUpdate(title="Updated", content="Updated content")
        updated = await artifact_service.update(created.id, user_id, update)

        assert updated is not None
        assert updated.title == "Updated"
        assert updated.content == "Updated content"

        # Cleanup
        await artifact_service.delete(created.id, user_id)

    async def test_delete_artifact(self, artifact_service, user_id):
        """Should delete artifact from Supabase."""
        # Create artifact
        created = await artifact_service.create(user_id, ArtifactCreate(
            title="To Delete", content="Content"
        ))

        # Delete it
        deleted = await artifact_service.delete(created.id, user_id)
        assert deleted is True

        # Verify it's gone
        retrieved = await artifact_service.get(created.id, user_id)
        assert retrieved is None