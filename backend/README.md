# Context Platform Backend

AI context management platform with dual REST API and MCP (Model Context Protocol) support, backed by Supabase for persistent storage.

## Stack

- **Python 3.11+**
- **FastAPI** - REST API framework
- **Pydantic v2** - Data validation
- **MCP SDK** - Model Context Protocol support
- **Supabase** - PostgreSQL database & authentication
- **Uvicorn** - ASGI server
- **bcrypt** - API key hashing

## Directory Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                      # FastAPI app entry point
│   ├── config.py                    # Configuration management
│   ├── api/
│   │   ├── __init__.py
│   │   ├── artifacts.py             # REST API endpoints
│   │   ├── auth.py                  # Authentication endpoints
│   │   └── api_keys.py              # API key management endpoints
│   ├── dependencies/
│   │   └── auth.py                  # JWT & API key auth dependency
│   ├── models/
│   │   ├── __init__.py
│   │   ├── core.py                  # Pydantic models
│   │   └── api_key.py               # API key models
│   ├── services/
│   │   ├── __init__.py
│   │   ├── artifacts.py             # In-memory service (dev)
│   │   ├── artifacts_supabase.py    # Supabase service (prod)
│   │   └── api_keys.py              # API key service with bcrypt
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
SUPABASE_ANON_KEY=your-anon-key     # For auth endpoints
USE_SUPABASE=true                    # Set to false for in-memory mode
```

### 3. Setup Database

Run the schema in your Supabase SQL Editor:

```sql
-- From supabase_schema.sql
CREATE TABLE IF NOT EXISTS artifacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,  -- No DEFAULT, passed from backend
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

## Authentication

The platform supports dual authentication methods:

- **JWT (Bearer Token)** - For web UI and session-based auth
- **API Keys** - For programmatic access via `X-API-Key` header

## API Endpoints

### Authentication Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/login` | Sign in with email/password |
| POST | `/api/v1/auth/signup` | Register new user |
| POST | `/api/v1/auth/check-email` | Check if email exists |
| POST | `/api/v1/auth/logout` | Sign out |

### Protected Endpoints (Require Authentication - JWT or API Key)
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

### API Key Management (Require JWT Authentication)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/api-keys` | Create API key |
| GET | `/api/v1/api-keys` | List user's API keys |
| GET | `/api/v1/api-keys/{id}` | Get API key details |
| DELETE | `/api/v1/api-keys/{id}` | Revoke API key |

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
# First, authenticate to get a token
TOKEN=$(curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "yourpassword"}' \
  | jq -r '.access_token')

# Create an API key
API_KEY=$(curl -X POST http://localhost:8000/api/v1/api-keys \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Key", "scopes": ["read", "write"]}' \
  | jq -r '.api_key')

# Use API key for requests
curl -X POST http://localhost:8000/api/v1/artifacts \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{
    "title": "Test Artifact",
    "content": "This is a test context artifact."
  }'

# List all artifacts (with authentication)
curl http://localhost:8000/api/v1/artifacts \
  -H "Authorization: Bearer $TOKEN"

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
| `SUPABASE_ANON_KEY` | Supabase anon key for auth | Required |
| `USE_SUPABASE` | Enable Supabase storage | `false` |
| `MCP_MODE` | Run as MCP server | `false` |
| `API_HOST` | API bind address | `0.0.0.0` |
| `API_PORT` | API port | `8000` |

## Architecture Notes

- **Service Layer Pattern**: Business logic separated from API/MCP layers
- **Single Source of Truth**: Pydantic models define all data structures  
- **Protocol Agnostic**: Same service methods power both REST and MCP
- **Flexible Storage**: Easy switch between in-memory and Supabase
- **Text ILIKE Search**: PostgreSQL text (partial) search capabilities in Supabase

## Security Notes

- Using `service_role` key for backend operations (bypasses RLS)
- Dual authentication: JWT tokens and API keys
- API keys hashed with bcrypt before storage
- All artifact endpoints require authentication
- Row Level Security (RLS) policies ready in database
- CORS configured for local development
- Environment variables for sensitive data

## Next Steps

- [x] Add user authentication (Supabase Auth)
- [x] Implement API keys for programmatic access
- [ ] Add rate limiting
- [ ] Implement proper RLS policies
