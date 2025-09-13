"""Unit tests for Pydantic model validation."""

import pytest
from datetime import datetime, timezone, timedelta
from uuid import UUID
from pydantic import ValidationError

from app.models.core import ArtifactCreate, ArtifactUpdate, Artifact
from app.models.api_key import ApiKeyCreate, ApiKeyUpdate, ApiKeyScope
from app.models.auth import AuthRequest, EmailCheckRequest


class TestArtifactModels:
    """Test suite for artifact models."""
    
    def test_artifact_create_minimal(self):
        """Should create artifact with minimal required fields."""
        artifact = ArtifactCreate(content="Test content")
        assert artifact.content == "Test content"
        assert artifact.title is None
        assert artifact.metadata == {}
        assert artifact.is_public is False
    
    def test_artifact_create_full(self):
        """Should create artifact with all fields."""
        artifact = ArtifactCreate(
            title="Test Title",
            content="Test content",
            metadata={"key": "value"},
            is_public=True
        )
        assert artifact.title == "Test Title"
        assert artifact.content == "Test content"
        assert artifact.metadata == {"key": "value"}
        assert artifact.is_public is True
    
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
        assert update.is_public is None
    
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
            is_public=False,
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