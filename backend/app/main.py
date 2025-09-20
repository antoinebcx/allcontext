"""Main FastAPI application."""

import sys
import logging
from pathlib import Path
from contextlib import asynccontextmanager

# Add parent directory to path so we can import app
sys.path.insert(0, str(Path(__file__).parent.parent))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api import artifacts, auth, api_keys
from app.mcp.server import mcp
from app.config import settings
from app.database import Database


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle - start/stop MCP session manager."""
    # Startup
    logger.info(f"Starting Allcontext API - Environment: {settings.environment}")

    # Verify database connection
    if not Database.health_check():
        logger.warning("Database connection failed at startup - will retry on requests")
    else:
        logger.info("Database connection verified")

    # Start the MCP session manager
    async with mcp.session_manager.run():
        yield

    # Shutdown
    logger.info("Shutting down Allcontext API")


# OpenAPI configuration
tags_metadata = [
    {
        "name": "auth",
        "description": "Authentication endpoints for user registration, login, and session management. "
                      "Supports email/password authentication via Supabase Auth.",
        "externalDocs": {
            "description": "Supabase Auth Documentation",
            "url": "https://supabase.com/docs/guides/auth",
        },
    },
    {
        "name": "artifacts",
        "description": "Core CRUD operations for managing AI context artifacts. "
                      "Artifacts are markdown-based content with auto-title generation, metadata support, "
                      "and full-text search capabilities. All artifacts are private to the user.",
    },
    {
        "name": "api-keys",
        "description": "API key management for programmatic access. "
                      "Create, manage, and revoke API keys with configurable scopes and expiration. "
                      "API keys enable stateless authentication for REST API and MCP access.",
    },
]

# Server configurations
servers = [
    {
        "url": "http://localhost:8000",
        "description": "Local development server"
    },
    {
        "url": "https://api.allcontext.dev",
        "description": "Production server"
    }
]

# Add ngrok server if configured
if hasattr(settings, 'ngrok_url') and settings.ngrok_url:
    servers.append({
        "url": settings.ngrok_url,
        "description": "Development tunnel (ngrok)"
    })

# Create FastAPI app with enhanced OpenAPI configuration
app = FastAPI(
    title="Allcontext API",
    description="""
## Personal AI Context Management Platform

Allcontext provides a unified platform for storing and managing AI context artifacts through multiple access patterns:

### Dual Access Architecture
- **REST API** (`/api/v1/*`) - Traditional HTTP endpoints for web applications
- **MCP Server** (`/mcp`) - Model Context Protocol for AI assistants (Claude, OpenAI, etc.)

### Artifacts
Store markdown-based content with:
- **Auto-title generation** from H1/H2 headings or content
- **Flexible metadata** as JSON objects
- **Full-text search** across title and content
- **Version history** with last 20 versions stored
- **Automatic rollback** to any previous version
- **Change detection** for efficient storage

### Authentication
- **JWT tokens** for web UI sessions (Bearer authentication)
- **API keys** for programmatic access (`X-API-Key` header)
- Both methods work for REST API and MCP access

### Search & Discovery
- PostgreSQL full-text search with GIN indexes
- ILIKE pattern matching for flexible queries
- User-scoped results only

### Pagination & Limits**
- Configurable page sizes (1-100 items)
- Offset-based pagination
- Content limits: 100k characters per artifact
- API key limits: 10 keys per user

Built with FastAPI, Supabase, and following OpenAPI 3.1 standards.
    """.strip(),
    version="1.0.0",
    contact={
        "name": "Allcontext",
        "url": "https://github.com/allcontext/api",
        "email": "support@allcontext.dev"
    },
    license_info={
        "name": "MIT",
        "url": "https://opensource.org/licenses/MIT"
    },
    servers=servers,
    openapi_tags=tags_metadata,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan
)

# Configure CORS for API service with API key authentication
# Following industry best practices: open CORS with API key security
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Open for all origins (security via API keys)
    allow_credentials=False,  # No cookies needed with API keys
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Mcp-Session-Id"],  # Required for MCP browser clients
)

# Health check endpoint
@app.get("/health")
async def health_check():
    """Enhanced health check with dependency status."""
    health = {
        "status": "healthy",
        "service": "allcontext",
        "environment": settings.environment,
        "checks": {
            "api": "ok",
            "database": "ok" if Database.health_check() else "degraded",
            "mcp": "ok"
        }
    }

    # Return 503 if any critical service is down
    if health["checks"]["database"] != "ok":
        return JSONResponse(
            status_code=503,
            content={**health, "status": "degraded"}
        )

    return health

# Root endpoint
@app.get("/")
async def root():
    """Welcome message and API information."""
    return {
        "name": "Context Platform API",
        "version": "1.0.0",
        "endpoints": {
            "api_docs": "/api/docs",
            "rest_api": "/api/v1",
            "mcp_server": "/mcp"
        },
        "health": "/health"
    }

# Include REST API routers
app.include_router(auth.router)
app.include_router(artifacts.router)
app.include_router(api_keys.router)

# Mount MCP server
# The MCP server is stateless and uses the same API key authentication
app.mount("/mcp", mcp.streamable_http_app())

# Add middleware to log requests
@app.middleware("http")
async def log_requests(request: Request, call_next):
    # Don't log health checks to reduce noise
    if request.url.path != "/health":
        logger.info(f"{request.method} {request.url.path}")
        
        # Log auth header presence (not the actual token for security)
        if "authorization" in request.headers:
            logger.info("Request has Authorization header")
        elif "x-api-key" in request.headers:
            logger.info("Request has X-API-Key header")
    
    response = await call_next(request)
    
    if request.url.path != "/health":
        logger.info(f"Response status: {response.status_code}")
    
    return response

# Global error handler
@app.exception_handler(500)
async def internal_error_handler(request: Request, exc):
    logger.error(f"Internal error: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )

# For running directly
if __name__ == "__main__":
    import uvicorn

    # Run the combined REST API and MCP server
    uvicorn.run(
        "app.main:app",
        host=settings.api_host,
        port=settings.port,
        reload=settings.is_development
    )
