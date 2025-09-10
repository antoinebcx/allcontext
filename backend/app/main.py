"""Main FastAPI application."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.api import artifacts

# Create FastAPI app
app = FastAPI(
    title="Context Platform API",
    description="Store and retrieve AI context via REST API and MCP",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# Configure CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",  # Alternative dev port
        "http://localhost:8000",  # Production frontend
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
        "docs": "/api/docs",
        "health": "/health"
    }

# Include routers
app.include_router(artifacts.router)

# Global error handler
@app.exception_handler(500)
async def internal_error_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )

# For running directly
if __name__ == "__main__":
    import uvicorn
    import os
    
    # Check if we should run in MCP mode
    if os.getenv("MCP_MODE") == "true":
        # Run as MCP server
        from app.mcp.server import mcp
        print("Starting MCP server on stdio...")
        print("Use this with Claude Desktop or other MCP clients")
        mcp.run()
    else:
        # Run REST API
        uvicorn.run(
            "app.main:app",
            host="0.0.0.0",
            port=8000,
            reload=True
        )
