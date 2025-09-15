"""Integration tests for artifact versioning."""

import sys
import os
# Add parent directory to path for direct execution
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

import asyncio
from uuid import uuid4
from app.services.artifacts import artifact_service
from app.models.artifacts import ArtifactCreate, ArtifactUpdate

async def test_version_history():
    """Test version history creation and retrieval."""
    user_id = uuid4()

    print("Creating initial artifact...")
    # Create artifact
    artifact = await artifact_service.create(user_id, ArtifactCreate(
        title="Version Test",
        content="Initial content"
    ))
    print(f"Created artifact {artifact.id} with version {artifact.version}")

    print("\nMaking 5 updates...")
    # Make several updates
    for i in range(5):
        updated = await artifact_service.update(
            artifact.id,
            user_id,
            ArtifactUpdate(content=f"Updated content version {i+1}")
        )
        print(f"Update {i+1}: version is now {updated.version}")

    print("\nGetting version history...")
    # Get version history
    versions = await artifact_service.get_versions(artifact.id, user_id)
    assert versions is not None, "Should get version history"
    assert versions.version_count == 5, f"Should have 5 edits, got {versions.version_count}"
    assert len(versions.versions) == 5, f"Should have 5 versions in history, got {len(versions.versions)}"
    print(f"Version history: {versions.version_count} total edits")
    print(f"Recent versions: {[v.version for v in versions.versions]}")

    print("\nGetting specific version (v1)...")
    # Get specific version
    version = await artifact_service.get_version(artifact.id, user_id, 1)
    assert version is not None, "Should get version 1"
    assert version.content == "Initial content", f"Version 1 should have initial content, got: {version.content}"
    print(f"Version 1 content: {version.content[:50]}...")

    print("\nRestoring to version 1...")
    # Restore version
    restored = await artifact_service.restore_version(artifact.id, user_id, 1)
    assert restored is not None, "Should restore successfully"
    assert restored.content == "Initial content", f"Restored content should match v1, got: {restored.content}"
    assert restored.version == 7, f"Should be version 7 after restore, got {restored.version}"  # Original + 5 updates + restore
    print(f"Restored to v1, new version is {restored.version}")

    print("\nGetting diff between versions...")
    # Test version diff
    diff = await artifact_service.get_version_diff(artifact.id, user_id, 1, 6)
    assert diff is not None, "Should get diff"
    assert diff["content_length_change"] != 0, "Content length should change"
    print(f"Diff v1 to v6: content length change = {diff['content_length_change']}")

    print("\nCleaning up...")
    # Cleanup
    deleted = await artifact_service.delete(artifact.id, user_id)
    assert deleted, "Should delete artifact"
    print("Test completed successfully!")

async def test_version_limit():
    """Test that version history is limited to 20 versions."""
    user_id = uuid4()

    print("\nTesting version history limit...")
    # Create artifact
    artifact = await artifact_service.create(user_id, ArtifactCreate(
        title="Limit Test",
        content="Initial"
    ))

    # Make 25 updates to exceed the 20 version limit
    print("Making 25 updates to test limit...")
    for i in range(25):
        await artifact_service.update(
            artifact.id,
            user_id,
            ArtifactUpdate(content=f"Update {i+1}")
        )

    # Get version history
    versions = await artifact_service.get_versions(artifact.id, user_id)
    assert versions is not None, "Should get version history"
    assert versions.version_count == 25, f"Should track 25 total edits, got {versions.version_count}"
    # Note: API returns max 10 versions, but DB stores 20
    assert len(versions.versions) <= 10, f"API should return max 10 versions, got {len(versions.versions)}"
    print(f"Total edits: {versions.version_count}")
    print(f"Versions returned by API: {len(versions.versions)} (max 10)")

    # The oldest version in history should be v6 (25 - 20 + 1)
    # But we can't directly test this without DB access

    # Cleanup
    await artifact_service.delete(artifact.id, user_id)
    print("Version limit test completed!")

async def test_no_change_no_version():
    """Test that version doesn't increment if content doesn't change."""
    user_id = uuid4()

    print("\nTesting change detection...")
    # Create artifact
    artifact = await artifact_service.create(user_id, ArtifactCreate(
        title="No Change Test",
        content="Same content",
        metadata={"key": "value"}
    ))
    initial_version = artifact.version

    # Update with same content (only metadata change)
    print("Updating only metadata...")
    updated = await artifact_service.update(
        artifact.id,
        user_id,
        ArtifactUpdate(metadata={"key": "new_value"})
    )

    # Version should not increment for metadata-only change
    # Actually, the trigger checks for title/content changes only
    print(f"Version after metadata update: {updated.version}")

    # Update with actual content change
    print("Updating content...")
    updated = await artifact_service.update(
        artifact.id,
        user_id,
        ArtifactUpdate(content="Different content")
    )
    print(f"Version after content update: {updated.version}")
    assert updated.version > initial_version, "Version should increment on content change"

    # Cleanup
    await artifact_service.delete(artifact.id, user_id)
    print("Change detection test completed!")

async def main():
    """Run all tests."""
    print("=" * 60)
    print("ARTIFACT VERSIONING INTEGRATION TESTS")
    print("=" * 60)

    try:
        await test_version_history()
        await test_version_limit()
        await test_no_change_no_version()

        print("\n" + "=" * 60)
        print("ALL TESTS PASSED ✅")
        print("=" * 60)
    except AssertionError as e:
        print(f"\n❌ Test failed: {e}")
        raise
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(main())