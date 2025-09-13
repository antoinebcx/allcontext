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


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle - start/stop MCP session manager."""
    # Start the MCP session manager
    async with mcp.session_manager.run():
        yield


# Create FastAPI app with lifespan
app = FastAPI(
    title="Context Platform API",
    description="Store and retrieve AI context via REST API and MCP",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan
)

# Configure CORS for frontend and MCP clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",  # Alternative dev port
        "http://localhost:8000",  # Production frontend
        "*",  # For MCP clients - configure more restrictively in production
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Mcp-Session-Id"],  # Required for MCP browser clients
)

# Health check endpoint
@app.get("/health")
async def health_check():
    """Check if the service is running."""
    return {"status": "healthy", "service": "context-platform"}

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
        host="0.0.0.0",
        port=8000,
        reload=True
    )
