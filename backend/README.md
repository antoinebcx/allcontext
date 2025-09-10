# Context Platform Backend

AI context management platform with dual REST API and MCP (Model Context Protocol) support, backed by Supabase for persistent storage.

## Stack

- **Python 3.11+**
- **FastAPI** - REST API framework
- **Pydantic v2** - Data validation
- **MCP SDK** - Model Context Protocol support
- **Supabase** - PostgreSQL database & future auth
- **Uvicorn** - ASGI server

## Directory Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                      # FastAPI app entry point
│   ├── config.py                    # Configuration management
│   ├── api/
│   │   ├── __init__.py
│   │   └── artifacts.py             # REST API endpoints
│   ├── models/
│   │   ├── __init__.py
│   │   └── core.py                  # Pydantic models
│   ├── services/
│   │   ├── __init__.py
│   │   ├── artifacts.py             # In-memory service (dev)
│   │   └── artifacts_supabase.py    # Supabase service (prod)
│   └── mcp/
│       ├── __init__.py
│       └── server.py                # MCP server tools
├── tests/
│   └── test_mcp.py                  # Test files
├── requirements.txt                  # Python dependencies
├── pyproject.toml                   # Project configuration
├── supabase_schema.sql             # Database schema
├── .env.example                     # Environment template
├── .env                            # Local environment (git ignored)
└── README.md                       # This file
```

## Data Model

The platform stores artifacts - any markdown-based content for AI context

Each artifact includes:
- Title (max 200 chars)
- Content (max 100k chars) 
- Metadata (flexible JSON)
- Public/private flag
- Version tracking

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

### 2. Configure Supabase

Create a `.env` file with your Supabase credentials:

```bash
# Copy template
cp .env.example .env

# Edit .env with your values:
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key  # Use service_role key for backend
USE_SUPABASE=true                    # Set to false for in-memory mode
```

### 3. Setup Database

Run the schema in your Supabase SQL Editor:

```sql
-- From supabase_schema.sql
CREATE TABLE IF NOT EXISTS artifacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    version INTEGER DEFAULT 1
);

-- Add indexes and full-text search (see supabase_schema.sql for complete setup)
```

### 4. Run Servers

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

## Storage Modes

The backend supports two storage modes controlled by `USE_SUPABASE` in `.env`:

- **`USE_SUPABASE=true`** - Production mode with Supabase PostgreSQL
- **`USE_SUPABASE=false`** - Development mode with in-memory storage

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
| GET | `/api/v1/artifacts/search?q=` | Full-text search |

## MCP Tools

- `create_artifact` - Create new artifact
- `list_artifacts` - List user's artifacts  
- `search_artifacts` - Search by text
- `get_artifact` - Get by ID

## Testing

### Unit Tests

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

### Manual API Testing

```bash
# Create an artifact
curl -X POST http://localhost:8000/api/v1/artifacts \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Artifact",
    "content": "This is a test context artifact."
  }'

# List all artifacts
curl http://localhost:8000/api/v1/artifacts

# Search artifacts
curl "http://localhost:8000/api/v1/artifacts/search?q=React"

# Get specific artifact (replace with actual ID)
curl "http://localhost:8000/api/v1/artifacts/782dde8d-5cce-4427-a67c-9500d5b631ac"


# Update an artifact
curl -X PUT "http://localhost:8000/api/v1/artifacts/782dde8d-5cce-4427-a67c-9500d5b631ac" \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated Title"}'

# Delete an artifact
curl -X DELETE "http://localhost:8000/api/v1/artifacts/782dde8d-5cce-4427-a67c-9500d5b631ac"

# Health check
curl http://localhost:8000/health
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
      "args": ["/absolute/path/to/backend/app/mcp/server.py"],
      "env": {
        "PYTHONPATH": "/absolute/path/to/backend",
        "USE_SUPABASE": "true"
      }
    }
  }
}
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SUPABASE_URL` | Supabase project URL | Required |
| `SUPABASE_KEY` | Supabase service role key | Required |
| `USE_SUPABASE` | Enable Supabase storage | `false` |
| `MCP_MODE` | Run as MCP server | `false` |
| `API_HOST` | API bind address | `0.0.0.0` |
| `API_PORT` | API port | `8000` |

## Architecture Notes

- **Service Layer Pattern**: Business logic separated from API/MCP layers
- **Single Source of Truth**: Pydantic models define all data structures  
- **Protocol Agnostic**: Same service methods power both REST and MCP
- **Flexible Storage**: Easy switch between in-memory and Supabase
- **Full-Text Search**: PostgreSQL text search capabilities in Supabase

## Security Notes

- Using `service_role` key for backend operations (bypasses RLS)
- Row Level Security (RLS) ready for when auth is implemented
- CORS configured for local development
- Environment variables for sensitive data

## Next Steps

- [ ] Add user authentication (Supabase Auth)
- [ ] Implement proper RLS policies
