# Context Platform Backend

AI context management platform with dual REST API and MCP (Model Context Protocol) support.

## Stack

- **Python 3.11+**
- **FastAPI** - REST API framework
- **Pydantic v2** - Data validation
- **MCP SDK** - Model Context Protocol support
- **Supabase** - Database & Auth (coming soon)
- **Uvicorn** - ASGI server

## Directory Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app entry point
│   ├── api/
│   │   ├── __init__.py
│   │   └── artifacts.py     # REST API endpoints
│   ├── models/
│   │   ├── __init__.py
│   │   └── core.py          # Pydantic models
│   ├── services/
│   │   ├── __init__.py
│   │   └── artifacts.py     # Business logic layer
│   └── mcp/
│       ├── __init__.py
│       └── server.py        # MCP server tools
├── tests/
│   ├── __init__.py
│   ├── test_api.py          # API endpoint tests
│   ├── test_services.py     # Service layer tests
│   └── test_mcp.py          # MCP tools tests
├── requirements.txt          # Python dependencies
├── pyproject.toml           # Project configuration
├── .env.example             # Environment variables template
└── README.md                # This file
```

## Quick Start

### 1. Setup Environment

```bash
# Create virtual environment
python3 -m venv .venv

# Activate it
source .venv/bin/activate  # macOS/Linux
# or
.venv\Scripts\activate      # Windows

# Install dependencies
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
# Copy example config
cp .env.example .env

# Edit .env with your settings (when adding Supabase)
```

### 3. Run Servers

```bash
# REST API Server (default)
python app/main.py
# API available at http://localhost:8000
# Docs at http://localhost:8000/api/docs

# MCP Server (for AI clients)
MCP_MODE=true python app/main.py
# Or directly:
python app/mcp/server.py

# Development mode with auto-reload
uvicorn app.main:app --reload
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/docs` | Interactive API documentation |
| POST | `/api/v1/artifacts` | Create artifact |
| GET | `/api/v1/artifacts` | List artifacts |
| GET | `/api/v1/artifacts/{id}` | Get artifact |
| PUT | `/api/v1/artifacts/{id}` | Update artifact |
| DELETE | `/api/v1/artifacts/{id}` | Delete artifact |
| GET | `/api/v1/artifacts/search?q=` | Search artifacts |

## MCP Tools

- `create_artifact` - Create new artifact
- `list_artifacts` - List user's artifacts  
- `search_artifacts` - Search by text
- `get_artifact` - Get by ID

## Testing

### Quick API Tests with curl

```bash
# Create an artifact
curl -X POST http://localhost:8000/api/v1/artifacts \
  -H "Content-Type: application/json" \
  -d '{
    "type": "prompt",
    "title": "Test Prompt",
    "content": "This is a test"
  }'

# List all artifacts
curl http://localhost:8000/api/v1/artifacts

# Search artifacts
curl "http://localhost:8000/api/v1/artifacts/search?q=code"

# Get specific artifact (replace with actual ID)
curl "http://localhost:8000/api/v1/artifacts/782dde8d-5cce-4427-a67c-9500d5b631ac"

# Filter by type
curl "http://localhost:8000/api/v1/artifacts?type=prompt"

# Update an artifact
curl -X PUT "http://localhost:8000/api/v1/artifacts/782dde8d-5cce-4427-a67c-9500d5b631ac" \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated Test Prompt"}'

# Delete an artifact
curl -X DELETE "http://localhost:8000/api/v1/artifacts/782dde8d-5cce-4427-a67c-9500d5b631ac"
```

### Automated Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app tests/

# Run specific test file
pytest tests/test_api.py

# Run with verbose output
pytest -v

# Run only unit tests (fast)
pytest -m "not integration"
```

## Development

```bash
# Format code
black app/ tests/

# Lint
pylint app/

# Type checking
mypy app/

# Install dev dependencies
pip install pytest pytest-cov pytest-asyncio httpx black pylint mypy
```

## MCP Client Configuration

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "context-platform": {
      "command": "python",
      "args": ["path/to/backend/app/mcp/server.py"]
    }
  }
}
```

## Architecture Notes

- **Service Layer Pattern**: Business logic separated from API/MCP layers
- **Single Source of Truth**: Pydantic models define all data structures
- **Protocol Agnostic**: Same service methods power both REST and MCP
- **In-Memory Storage**: Currently using dict, ready for Supabase migration

## Next Steps

- [ ] Add Supabase integration
- [ ] Implement authentication
- [ ] Add vector search
- [ ] Deploy to production
