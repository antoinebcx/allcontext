"""Unit tests for Pydantic model validation."""

import pytest
from datetime import datetime, timezone, timedelta
from uuid import UUID
from pydantic import ValidationError

from app.models.artifacts import (
    ArtifactCreate, ArtifactUpdate, Artifact, ArtifactList, ArtifactSearchResult,
    ArtifactVersion, ArtifactVersionSummary, ArtifactVersionsResponse
)
from app.models.api_key import (
    ApiKeyCreate, ApiKeyUpdate, ApiKeyScope, ApiKeyResponse,
    ApiKeyCreated, ApiKeyList, ApiKeyValidation
)
from app.models.auth import AuthRequest, EmailCheckRequest


class TestArtifactModels:
    """Test suite for artifact models."""
    
    def test_artifact_create_minimal(self):
        """Should create artifact with minimal required fields."""
        artifact = ArtifactCreate(content="Test content")
        assert artifact.content == "Test content"
        assert artifact.title is None
        assert artifact.metadata == {}
    
    def test_artifact_create_full(self):
        """Should create artifact with all fields."""
        artifact = ArtifactCreate(
            title="Test Title",
            content="Test content",
            metadata={"key": "value"}
        )
        assert artifact.title == "Test Title"
        assert artifact.content == "Test content"
        assert artifact.metadata == {"key": "value"}
    
    def test_artifact_create_content_required(self):
        """Should fail when content is missing."""
        with pytest.raises(ValidationError) as exc_info:
            ArtifactCreate()
        errors = exc_info.value.errors()
        assert any(e["loc"] == ("content",) for e in errors)
    
    def test_artifact_create_empty_content_invalid(self):
        """Should fail with empty content."""
        with pytest.raises(ValidationError) as exc_info:
            ArtifactCreate(content="")
        errors = exc_info.value.errors()
        assert any("at least 1 character" in str(e) for e in errors)
    
    def test_artifact_create_content_max_length(self):
        """Should fail when content exceeds 100k characters."""
        long_content = "a" * 100001
        with pytest.raises(ValidationError) as exc_info:
            ArtifactCreate(content=long_content)
        errors = exc_info.value.errors()
        assert any("at most 100000 characters" in str(e) for e in errors)
    
    def test_artifact_create_title_max_length(self):
        """Should fail when title exceeds 200 characters."""
        long_title = "a" * 201
        with pytest.raises(ValidationError) as exc_info:
            ArtifactCreate(title=long_title, content="test")
        errors = exc_info.value.errors()
        assert any("at most 200 characters" in str(e) for e in errors)
    
    def test_artifact_update_all_optional(self):
        """Should allow all fields to be optional in update."""
        update = ArtifactUpdate()
        assert update.title is None
        assert update.content is None
        assert update.metadata is None
    
    def test_artifact_update_partial(self):
        """Should allow partial updates."""
        update = ArtifactUpdate(title="New Title")
        assert update.title == "New Title"
        assert update.content is None
    
    def test_artifact_complete_model(self):
        """Should create complete artifact with system fields."""
        artifact = Artifact(
            id=UUID("12345678-1234-5678-1234-567812345678"),
            user_id=UUID("87654321-4321-8765-4321-876543218765"),
            title="Test",
            content="Content",
            metadata={},
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
            version=1
        )
        assert artifact.id
        assert artifact.user_id
        assert artifact.version == 1


class TestApiKeyModels:
    """Test suite for API key models."""
    
    def test_api_key_create_minimal(self):
        """Should create API key with minimal fields."""
        api_key = ApiKeyCreate(name="Test Key")
        assert api_key.name == "Test Key"
        assert api_key.expires_at is None
        assert api_key.scopes == [ApiKeyScope.READ, ApiKeyScope.WRITE]
    
    def test_api_key_create_with_scopes(self):
        """Should create API key with custom scopes."""
        api_key = ApiKeyCreate(
            name="Test Key",
            scopes=[ApiKeyScope.READ]
        )
        assert api_key.scopes == [ApiKeyScope.READ]
    
    def test_api_key_create_with_expiry(self):
        """Should create API key with expiry date."""
        future_date = datetime.now(timezone.utc) + timedelta(days=30)
        api_key = ApiKeyCreate(
            name="Test Key",
            expires_at=future_date
        )
        assert api_key.expires_at == future_date
    
    def test_api_key_create_past_expiry_invalid(self):
        """Should fail with past expiry date."""
        past_date = datetime.now(timezone.utc) - timedelta(days=1)
        with pytest.raises(ValidationError) as exc_info:
            ApiKeyCreate(name="Test Key", expires_at=past_date)
        errors = exc_info.value.errors()
        assert any("future" in str(e).lower() for e in errors)
    
    def test_api_key_create_name_required(self):
        """Should fail when name is missing."""
        with pytest.raises(ValidationError) as exc_info:
            ApiKeyCreate()
        errors = exc_info.value.errors()
        assert any(e["loc"] == ("name",) for e in errors)
    
    def test_api_key_create_name_min_length(self):
        """Should fail with empty name."""
        with pytest.raises(ValidationError) as exc_info:
            ApiKeyCreate(name="")
        errors = exc_info.value.errors()
        assert any("at least 1 character" in str(e) for e in errors)
    
    def test_api_key_create_name_max_length(self):
        """Should fail when name exceeds 100 characters."""
        long_name = "a" * 101
        with pytest.raises(ValidationError) as exc_info:
            ApiKeyCreate(name=long_name)
        errors = exc_info.value.errors()
        assert any("at most 100 characters" in str(e) for e in errors)
    
    def test_api_key_update_all_optional(self):
        """Should allow all fields to be optional in update."""
        update = ApiKeyUpdate()
        assert update.name is None
        assert update.scopes is None
        assert update.is_active is None
    
    def test_api_key_scope_enum_values(self):
        """Should only accept valid scope values."""
        assert ApiKeyScope.READ.value == "read"
        assert ApiKeyScope.WRITE.value == "write"
        assert ApiKeyScope.DELETE.value == "delete"


class TestAuthModels:
    """Test suite for authentication models."""
    
    def test_auth_request_valid_email(self):
        """Should create auth request with valid email."""
        auth = AuthRequest(
            email="test@example.com",
            password="password123"
        )
        assert auth.email == "test@example.com"
        assert auth.password == "password123"
    
    def test_auth_request_invalid_email(self):
        """Should fail with invalid email format."""
        with pytest.raises(ValidationError) as exc_info:
            AuthRequest(email="not-an-email", password="password123")
        errors = exc_info.value.errors()
        assert any("email" in str(e).lower() for e in errors)
    
    def test_auth_request_missing_fields(self):
        """Should fail when required fields are missing."""
        with pytest.raises(ValidationError) as exc_info:
            AuthRequest(email="test@example.com")
        errors = exc_info.value.errors()
        assert any(e["loc"] == ("password",) for e in errors)
    
    def test_email_check_request(self):
        """Should validate email format in check request."""
        check = EmailCheckRequest(email="test@example.com")
        assert check.email == "test@example.com"
        
        with pytest.raises(ValidationError):
            EmailCheckRequest(email="invalid")


class TestArtifactVersionModels:
    """Test suite for artifact version models."""

    def test_artifact_version_minimal(self):
        """Should create version with required fields."""
        version = ArtifactVersion(
            version=1,
            title="Test",
            content="Content",
            metadata={},
            updated_at=datetime.now(timezone.utc),
            content_length=7
        )
        assert version.version == 1
        assert version.title_changed is False
        assert version.content_changed is False

    def test_artifact_version_with_changes(self):
        """Should track title and content changes."""
        version = ArtifactVersion(
            version=2,
            title="Updated",
            content="New content",
            metadata={"key": "value"},
            updated_at=datetime.now(timezone.utc),
            content_length=11,
            title_changed=True,
            content_changed=True
        )
        assert version.title_changed is True
        assert version.content_changed is True

    def test_artifact_version_summary_minimal(self):
        """Should create version summary with required fields."""
        summary = ArtifactVersionSummary(
            version=1,
            title="Test",
            updated_at=datetime.now(timezone.utc),
            content_length=100
        )
        assert summary.version == 1
        assert summary.changes == []

    def test_artifact_version_summary_with_changes(self):
        """Should track changes in summary."""
        summary = ArtifactVersionSummary(
            version=2,
            title="Updated",
            updated_at=datetime.now(timezone.utc),
            content_length=150,
            changes=["title", "content"]
        )
        assert summary.changes == ["title", "content"]

    def test_artifact_versions_response(self):
        """Should create versions response."""
        test_id = UUID("12345678-1234-5678-1234-567812345678")
        response = ArtifactVersionsResponse(
            id=test_id,
            current_version=2,
            version_count=2,
            versions=[
                ArtifactVersionSummary(
                    version=1,
                    title="Original",
                    updated_at=datetime.now(timezone.utc),
                    content_length=100
                )
            ]
        )
        assert response.id == test_id
        assert response.current_version == 2
        assert len(response.versions) == 1


class TestArtifactListModels:
    """Test suite for artifact list and search models."""

    def test_artifact_list_minimal(self):
        """Should create artifact list with required fields."""
        artifact_list = ArtifactList(
            items=[],
            total=0
        )
        assert artifact_list.items == []
        assert artifact_list.total == 0
        assert artifact_list.page == 1
        assert artifact_list.page_size == 50

    def test_artifact_list_with_pagination(self):
        """Should create artifact list with pagination."""
        artifact_list = ArtifactList(
            items=[],
            total=100,
            page=2,
            page_size=25
        )
        assert artifact_list.page == 2
        assert artifact_list.page_size == 25

    def test_artifact_search_result(self):
        """Should create search result."""
        test_id = UUID("12345678-1234-5678-1234-567812345678")
        result = ArtifactSearchResult(
            id=test_id,
            title="Search Result",
            snippet="This is a snippet...",
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        assert result.id == test_id
        assert result.snippet == "This is a snippet..."
        assert result.metadata == {}

    def test_artifact_search_result_with_metadata(self):
        """Should create search result with metadata."""
        test_id = UUID("12345678-1234-5678-1234-567812345678")
        result = ArtifactSearchResult(
            id=test_id,
            title="Search Result",
            snippet="Snippet",
            metadata={"category": "test"},
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        assert result.metadata == {"category": "test"}


class TestApiKeyResponseModels:
    """Test suite for API key response models."""

    def test_api_key_response(self):
        """Should create API key response without sensitive data."""
        test_id = UUID("12345678-1234-5678-1234-567812345678")
        test_user_id = UUID("87654321-4321-8765-4321-876543218765")
        response = ApiKeyResponse(
            id=test_id,
            user_id=test_user_id,
            name="Test Key",
            key_prefix="sk_prod_",
            last_4="abcd",
            scopes=["read", "write"],
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        assert response.name == "Test Key"
        assert response.key_prefix == "sk_prod_"
        assert response.last_4 == "abcd"
        assert response.is_active is True
        assert response.last_used_at is None

    def test_api_key_created_with_key(self):
        """Should create API key creation response with actual key."""
        test_id = UUID("12345678-1234-5678-1234-567812345678")
        test_user_id = UUID("87654321-4321-8765-4321-876543218765")
        response = ApiKeyCreated(
            id=test_id,
            user_id=test_user_id,
            name="Test Key",
            key_prefix="sk_prod_",
            last_4="abcd",
            api_key="sk_prod_1234567890abcdefghijklmnopqrstuvwxyz",
            scopes=["read", "write"],
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        assert response.api_key == "sk_prod_1234567890abcdefghijklmnopqrstuvwxyz"
        assert response.name == "Test Key"

    def test_api_key_list(self):
        """Should create API key list response."""
        key_list = ApiKeyList(
            items=[],
            total=0
        )
        assert key_list.items == []
        assert key_list.total == 0

    def test_api_key_validation_valid(self):
        """Should create valid API key validation result."""
        test_user_id = UUID("12345678-1234-5678-1234-567812345678")
        test_key_id = UUID("87654321-4321-8765-4321-876543218765")
        validation = ApiKeyValidation(
            is_valid=True,
            user_id=test_user_id,
            scopes=["read", "write"],
            key_id=test_key_id
        )
        assert validation.is_valid is True
        assert validation.user_id == test_user_id
        assert validation.error_message is None

    def test_api_key_validation_invalid(self):
        """Should create invalid API key validation result."""
        validation = ApiKeyValidation(
            is_valid=False,
            error_message="Invalid API key"
        )
        assert validation.is_valid is False
        assert validation.user_id is None
        assert validation.scopes == []
        assert validation.error_message == "Invalid API key"
