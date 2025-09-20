"""Authentication and authorization for MCP server."""

import logging
from typing import Optional, List
from uuid import UUID
from contextvars import ContextVar

from mcp.server.auth.provider import TokenVerifier, AccessToken

# Set up logging
logger = logging.getLogger(__name__)

# Context variables for storing authenticated user context per request
# These are thread-safe and async-safe
authenticated_user_id: ContextVar[Optional[UUID]] = ContextVar('authenticated_user_id', default=None)
authenticated_scopes: ContextVar[List[str]] = ContextVar('authenticated_scopes', default=[])


class ApiKeyVerifier(TokenVerifier):
    """Verifies API keys for MCP authentication."""

    async def verify_token(self, token: str) -> Optional[AccessToken]:
        """
        Verify the API key and return access token if valid.

        This method is called by the MCP framework for each authenticated request.
        We store the validated user_id in a context variable for access by tools.

        Args:
            token: The API key from the Authorization header

        Returns:
            AccessToken if valid, None otherwise
        """
        from app.services.api_keys import api_key_service

        # Validate the API key
        validation = await api_key_service.validate(token)

        if validation.is_valid and validation.user_id:
            # Store user_id and scopes in context variables (thread-safe, request-scoped)
            authenticated_user_id.set(validation.user_id)
            authenticated_scopes.set(validation.scopes or ["read", "write"])

            return AccessToken(
                token=token,
                client_id=f"user_{validation.user_id}",
                user_id=str(validation.user_id),
                scopes=validation.scopes or ["read", "write"]
            )

        # Clear context on validation failure
        authenticated_user_id.set(None)
        authenticated_scopes.set([])
        return None


def get_authenticated_user_id() -> Optional[UUID]:
    """
    Get the authenticated user ID for the current request.

    This retrieves the user_id stored by ApiKeyVerifier during token validation.
    Uses contextvars for thread-safe, request-scoped storage.

    Returns:
        UUID of the authenticated user or None if not authenticated
    """
    return authenticated_user_id.get()


def check_required_scope(required_scope: str) -> bool:
    """
    Check if the authenticated user has the required scope.

    Args:
        required_scope: The scope to check for ("read", "write", "delete")

    Returns:
        True if the user has the required scope, False otherwise
    """
    user_scopes = authenticated_scopes.get()
    return required_scope in user_scopes
