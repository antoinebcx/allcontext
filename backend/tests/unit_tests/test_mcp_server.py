"""Unit tests for MCP server authentication and scope enforcement."""

import pytest
from unittest.mock import patch, AsyncMock
from uuid import uuid4
from contextvars import copy_context

from app.mcp.server import (
    authenticated_user_id,
    authenticated_scopes,
    get_authenticated_user_id,
    check_required_scope,
    ApiKeyVerifier,
    create_artifact,
    list_artifacts,
    search_artifacts,
    get_artifact,
    update_artifact,
    delete_artifact,
    list_artifact_versions,
    get_artifact_version,
    restore_artifact_version
)
from app.models.api_key import ApiKeyValidation


class TestMCPContextManagement:
    """Test suite for MCP context variable management."""

    def test_authenticated_user_id_default(self):
        """Should have None as default value."""
        # Create a new context to avoid interference
        ctx = copy_context()
        result = ctx.run(lambda: authenticated_user_id.get())
        assert result is None

    def test_authenticated_user_id_storage(self):
        """Should store and retrieve user ID."""
        test_user_id = uuid4()

        def test_in_context():
            authenticated_user_id.set(test_user_id)
            return authenticated_user_id.get()

        ctx = copy_context()
        result = ctx.run(test_in_context)
        assert result == test_user_id

    def test_authenticated_scopes_default(self):
        """Should have empty list as default value."""
        ctx = copy_context()
        result = ctx.run(lambda: authenticated_scopes.get())
        assert result == []

    def test_authenticated_scopes_storage(self):
        """Should store and retrieve scopes."""
        test_scopes = ["read", "write"]

        def test_in_context():
            authenticated_scopes.set(test_scopes)
            return authenticated_scopes.get()

        ctx = copy_context()
        result = ctx.run(test_in_context)
        assert result == test_scopes

    def test_get_authenticated_user_id_function(self):
        """Should retrieve user ID from context."""
        test_user_id = uuid4()

        def test_in_context():
            authenticated_user_id.set(test_user_id)
            return get_authenticated_user_id()

        ctx = copy_context()
        result = ctx.run(test_in_context)
        assert result == test_user_id

    def test_get_authenticated_user_id_none(self):
        """Should return None when no user ID set."""
        ctx = copy_context()
        result = ctx.run(get_authenticated_user_id)
        assert result is None

    def test_check_required_scope_with_permission(self):
        """Should return True when user has required scope."""
        def test_in_context():
            authenticated_scopes.set(["read", "write"])
            return check_required_scope("read")

        ctx = copy_context()
        result = ctx.run(test_in_context)
        assert result is True

    def test_check_required_scope_without_permission(self):
        """Should return False when user lacks required scope."""
        def test_in_context():
            authenticated_scopes.set(["read"])
            return check_required_scope("write")

        ctx = copy_context()
        result = ctx.run(test_in_context)
        assert result is False

    def test_check_required_scope_empty_scopes(self):
        """Should return False when no scopes are set."""
        def test_in_context():
            authenticated_scopes.set([])
            return check_required_scope("read")

        ctx = copy_context()
        result = ctx.run(test_in_context)
        assert result is False


class TestApiKeyVerifier:
    """Test suite for ApiKeyVerifier class."""

    @pytest.mark.asyncio
    async def test_verify_token_valid_key(self):
        """Should verify valid API key and set context."""
        verifier = ApiKeyVerifier()
        test_user_id = uuid4()
        test_scopes = ["read", "write"]
        test_token = "sk_prod_testkey123456789012345678901234"

        # Mock the validation
        mock_validation = ApiKeyValidation(
            is_valid=True,
            user_id=test_user_id,
            scopes=test_scopes,
            key_id=uuid4()
        )

        with patch('app.services.api_keys.api_key_service') as mock_service:
            mock_service.validate = AsyncMock(return_value=mock_validation)

            def test_in_context():
                return verifier.verify_token(test_token)

            ctx = copy_context()
            access_token = await ctx.run(test_in_context)

            # Verify AccessToken is returned
            assert access_token is not None
            assert access_token.token == test_token
            assert access_token.scopes == test_scopes
            assert access_token.client_id == f"user_{test_user_id}"

    @pytest.mark.asyncio
    async def test_verify_token_invalid_key(self):
        """Should return None for invalid API key and clear context."""
        verifier = ApiKeyVerifier()
        test_token = "invalid_key"

        # Mock invalid validation
        mock_validation = ApiKeyValidation(
            is_valid=False,
            error_message="Invalid API key"
        )

        with patch('app.services.api_keys.api_key_service') as mock_service:
            mock_service.validate = AsyncMock(return_value=mock_validation)

            def test_in_context():
                return verifier.verify_token(test_token)

            ctx = copy_context()
            access_token = await ctx.run(test_in_context)

            # Should return None
            assert access_token is None

    @pytest.mark.asyncio
    async def test_verify_token_sets_context_variables(self):
        """Should set context variables when validation succeeds."""
        verifier = ApiKeyVerifier()
        test_user_id = uuid4()
        test_scopes = ["read", "delete"]
        test_token = "sk_prod_testkey123456789012345678901234"

        mock_validation = ApiKeyValidation(
            is_valid=True,
            user_id=test_user_id,
            scopes=test_scopes,
            key_id=uuid4()
        )

        with patch('app.services.api_keys.api_key_service') as mock_service:
            mock_service.validate = AsyncMock(return_value=mock_validation)

            async def test_in_context():
                await verifier.verify_token(test_token)
                # Check that context variables were set
                return {
                    'user_id': authenticated_user_id.get(),
                    'scopes': authenticated_scopes.get()
                }

            ctx = copy_context()
            result = await ctx.run(test_in_context)

            assert result['user_id'] == test_user_id
            assert result['scopes'] == test_scopes

    @pytest.mark.asyncio
    async def test_verify_token_clears_context_on_failure(self):
        """Should clear context variables when validation fails."""
        verifier = ApiKeyVerifier()
        test_token = "invalid_key"

        mock_validation = ApiKeyValidation(
            is_valid=False,
            error_message="Invalid API key"
        )

        # Pre-set some context values
        def setup_context():
            authenticated_user_id.set(uuid4())
            authenticated_scopes.set(["read"])

        with patch('app.services.api_keys.api_key_service') as mock_service:
            mock_service.validate = AsyncMock(return_value=mock_validation)

            async def test_in_context():
                setup_context()
                await verifier.verify_token(test_token)
                # Check that context variables were cleared
                return {
                    'user_id': authenticated_user_id.get(),
                    'scopes': authenticated_scopes.get()
                }

            ctx = copy_context()
            result = await ctx.run(test_in_context)

            assert result['user_id'] is None
            assert result['scopes'] == []


class TestScopeEnforcement:
    """Test suite for scope enforcement in MCP tools."""

    def setup_method(self):
        """Set up common test data."""
        self.test_user_id = uuid4()
        self.test_artifact_id = str(uuid4())

    def _setup_context(self, user_id=None, scopes=None):
        """Helper to set up authentication context."""
        authenticated_user_id.set(user_id if user_id is not None else self.test_user_id)
        authenticated_scopes.set(scopes if scopes is not None else ["read", "write"])

    def _setup_no_auth_context(self):
        """Helper to set up unauthenticated context."""
        authenticated_user_id.set(None)
        authenticated_scopes.set([])

    # READ operations tests
    @pytest.mark.asyncio
    async def test_list_artifacts_requires_read_scope(self):
        """Should require read scope for list_artifacts."""
        async def test_in_context():
            self._setup_context(scopes=["write"])  # No read scope
            return await list_artifacts()

        ctx = copy_context()
        result = await ctx.run(test_in_context)

        assert isinstance(result, list)
        assert len(result) == 1
        assert result[0]["error"] == "Insufficient permissions. Required scope: read"

    @pytest.mark.asyncio
    async def test_search_artifacts_requires_read_scope(self):
        """Should require read scope for search_artifacts."""
        async def test_in_context():
            self._setup_context(scopes=["write"])  # No read scope
            return await search_artifacts("test query")

        ctx = copy_context()
        result = await ctx.run(test_in_context)

        assert isinstance(result, list)
        assert len(result) == 1
        assert result[0]["error"] == "Insufficient permissions. Required scope: read"

    @pytest.mark.asyncio
    async def test_get_artifact_requires_read_scope(self):
        """Should require read scope for get_artifact."""
        async def test_in_context():
            self._setup_context(scopes=["write"])  # No read scope
            return await get_artifact(self.test_artifact_id)

        ctx = copy_context()
        result = await ctx.run(test_in_context)

        assert result["error"] == "Insufficient permissions. Required scope: read"

    @pytest.mark.asyncio
    async def test_list_artifact_versions_requires_read_scope(self):
        """Should require read scope for list_artifact_versions."""
        async def test_in_context():
            self._setup_context(scopes=["write"])  # No read scope
            return await list_artifact_versions(self.test_artifact_id)

        ctx = copy_context()
        result = await ctx.run(test_in_context)

        assert result["error"] == "Insufficient permissions. Required scope: read"

    @pytest.mark.asyncio
    async def test_get_artifact_version_requires_read_scope(self):
        """Should require read scope for get_artifact_version."""
        async def test_in_context():
            self._setup_context(scopes=["write"])  # No read scope
            return await get_artifact_version(self.test_artifact_id, 1)

        ctx = copy_context()
        result = await ctx.run(test_in_context)

        assert result["error"] == "Insufficient permissions. Required scope: read"

    # WRITE operations tests
    @pytest.mark.asyncio
    async def test_create_artifact_requires_write_scope(self):
        """Should require write scope for create_artifact."""
        async def test_in_context():
            self._setup_context(scopes=["read"])  # No write scope
            return await create_artifact("test content")

        ctx = copy_context()
        result = await ctx.run(test_in_context)

        assert result["error"] == "Insufficient permissions. Required scope: write"

    @pytest.mark.asyncio
    async def test_update_artifact_requires_write_scope(self):
        """Should require write scope for update_artifact."""
        async def test_in_context():
            self._setup_context(scopes=["read"])  # No write scope
            return await update_artifact(self.test_artifact_id, title="new title")

        ctx = copy_context()
        result = await ctx.run(test_in_context)

        assert result["error"] == "Insufficient permissions. Required scope: write"

    @pytest.mark.asyncio
    async def test_restore_artifact_version_requires_write_scope(self):
        """Should require write scope for restore_artifact_version."""
        async def test_in_context():
            self._setup_context(scopes=["read"])  # No write scope
            return await restore_artifact_version(self.test_artifact_id, 1)

        ctx = copy_context()
        result = await ctx.run(test_in_context)

        assert result["error"] == "Insufficient permissions. Required scope: write"

    # DELETE operations tests
    @pytest.mark.asyncio
    async def test_delete_artifact_requires_delete_scope(self):
        """Should require delete scope for delete_artifact."""
        async def test_in_context():
            self._setup_context(scopes=["read", "write"])  # No delete scope
            return await delete_artifact(self.test_artifact_id)

        ctx = copy_context()
        result = await ctx.run(test_in_context)

        assert result["error"] == "Insufficient permissions. Required scope: delete"

    # Authentication tests
    @pytest.mark.asyncio
    async def test_unauthenticated_access_blocked(self):
        """Should block access when not authenticated."""
        async def test_in_context():
            self._setup_no_auth_context()
            return await create_artifact("test content")

        ctx = copy_context()
        result = await ctx.run(test_in_context)

        assert result["error"] == "Authentication required. Please provide a valid API key."


class TestMCPToolAuthorization:
    """Integration tests for MCP tool authorization."""

    def setup_method(self):
        """Set up common test data."""
        self.test_user_id = uuid4()
        self.test_artifact_id = str(uuid4())

    def _setup_context_with_all_scopes(self):
        """Helper to set up context with all scopes."""
        authenticated_user_id.set(self.test_user_id)
        authenticated_scopes.set(["read", "write", "delete"])

    @pytest.mark.asyncio
    async def test_tool_with_sufficient_permissions_proceeds(self):
        """Should proceed past scope check when user has required permissions."""
        async def test_in_context():
            self._setup_context_with_all_scopes()
            # This will fail at the service level but should pass the scope check
            result = await list_artifacts(limit=5)
            return result

        ctx = copy_context()
        result = await ctx.run(test_in_context)

        # Should not return a permission error - will get a different error from missing service
        assert isinstance(result, list)
        if result and len(result) == 1:
            # Should not be a permission error
            assert "Insufficient permissions" not in str(result[0].get("error", ""))

    @pytest.mark.asyncio
    async def test_multiple_scope_validation(self):
        """Should validate different scopes for different tools."""
        test_cases = [
            ("read", lambda: list_artifacts()),
            ("write", lambda: create_artifact("test")),
            ("delete", lambda: delete_artifact(self.test_artifact_id))
        ]

        for required_scope, tool_func in test_cases:
            # Test with missing scope
            async def test_without_scope():
                other_scopes = [s for s in ["read", "write", "delete"] if s != required_scope]
                authenticated_user_id.set(self.test_user_id)
                authenticated_scopes.set(other_scopes)
                return await tool_func()

            ctx = copy_context()
            result = await ctx.run(test_without_scope)

            # Should be blocked
            if isinstance(result, list):
                assert any("Insufficient permissions" in str(item) for item in result)
            else:
                assert "Insufficient permissions" in str(result)

    def test_scope_combinations(self):
        """Should handle various scope combinations correctly."""
        scope_combinations = [
            (["read"], "read", True),
            (["read"], "write", False),
            (["read", "write"], "read", True),
            (["read", "write"], "write", True),
            (["read", "write"], "delete", False),
            (["read", "write", "delete"], "delete", True),
            ([], "read", False),
        ]

        for user_scopes, required_scope, should_pass in scope_combinations:
            def test_in_context():
                authenticated_scopes.set(user_scopes)
                return check_required_scope(required_scope)

            ctx = copy_context()
            result = ctx.run(test_in_context)

            assert result == should_pass, f"Failed for scopes {user_scopes}, required {required_scope}"
