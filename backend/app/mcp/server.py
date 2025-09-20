"""MCP server for the Context Platform."""

from pydantic import AnyHttpUrl
from mcp.server.fastmcp import FastMCP
from mcp.server.auth.settings import AuthSettings

from .auth import ApiKeyVerifier
from .tools import register_tools


def create_mcp_server() -> FastMCP:
    """
    Create the MCP server with stateless configuration for cloud deployment.

    Returns:
        Configured FastMCP server instance
    """
    from app.config import settings

    base_url = settings.api_base_url
    if settings.is_development:
        base_url = f"http://localhost:{settings.port}"

    return FastMCP(
        name="Allcontext",
        instructions=(
            "A cloud-based platform for storing and managing AI context artifacts. "
            "Store prompts, documentation, and markdown content that can be accessed "
            "by AI assistants through multiple interfaces."
        ),
        # Stateless configuration for cloud deployment
        stateless_http=True,
        json_response=True,
        streamable_http_path="/",
        token_verifier=ApiKeyVerifier(),
        auth=AuthSettings(
            issuer_url=AnyHttpUrl(base_url),
            resource_server_url=AnyHttpUrl(f"{base_url}/mcp/"),
            required_scopes=["read", "write"]
        )
    )


# Create the MCP server instance
mcp = create_mcp_server()

# Register all tools with the server
register_tools(mcp)

# Export for use in main.py
__all__ = ['mcp']