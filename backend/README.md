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
- **contextvars** - Thread-safe request context management

## Directory Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                      # FastAPI app entry point with MCP mounting
│   ├── config.py                    # Configuration management
│   ├── api/
│   │   ├── __init__.py
│   │   ├── artifacts.py             # REST API endpoints
│   │   ├── auth.py                  # Authentication endpoints
│   │   └── api_keys.py              # API key management endpoints
│   ├── dependencies/
│   │   └── auth.py                  # JWT & API key auth dependency
│   ├── models/
│   │   ├── __init__.py              # Model exports
│   │   ├── core.py                  # Artifact models
│   │   ├── api_key.py               # API key models
│   │   └── auth.py                  # Auth models
│   ├── services/
│   │   ├── __init__.py
│   │   ├── artifacts.py             # In-memory service (dev)
│   │   ├── artifacts_supabase.py    # Supabase service (prod)
│   │   └── api_keys.py              # API key service with bcrypt and lookup optimization
│   ├── utils/
│   │   ├── __init__.py
│   │   └── markdown.py              # Title extraction utility
│   └── mcp/
│       ├── __init__.py
│       └── server.py                # MCP server with stateless HTTP transport
├── tests/
│   ├── __init__.py
│   ├── integration_tests/
│   │   ├── __init__.py
│   │   ├── test_api_endpoints.py    # Complete API integration test
│   │   ├── test_openai_mcp.py      # OpenAI MCP integration tests
│   │   └── test_anthropic_mcp.py   # Anthropic MCP integration tests
│   └── unit_tests/
│       ├── __init__.py
│       ├── test_utils_markdown.py  # Markdown title extraction tests
│       ├── test_models_validation.py # Pydantic model validation tests
│       ├── test_services_artifacts.py # Artifact service logic tests
│       └── test_api_key_hashing.py # API key security tests
├── schema/
│   └── schema.sql                   # Consolidated database schema with lookup_hash
├── requirements.txt                  # Python dependencies
├── .env.example                     # Environment template
├── .env                            # Local environment (git ignored)
├── .gitignore                      # Git ignore rules
└── README.md                       # This file
```

## Architecture

### Dual Access Pattern
- **REST API** at `/api/v1/*` for traditional HTTP clients
- **MCP Server** at `/mcp` for AI assistants (Claude, OpenAI, etc.)
- Both use the same backend services and authentication system

### Authentication Strategy
1. **JWT tokens** (Bearer) for web UI sessions via Supabase Auth
2. **API keys** (`sk_prod_*`) for programmatic access
   - Performance optimized with `lookup_hash` (SHA256 of first 16 chars)
   - Avoids iterating all keys with bcrypt

### MCP Implementation
The MCP server uses a stateless HTTP configuration optimized for cloud deployment:

```python
FastMCP(
    stateless_http=True,  # No session persistence between requests
    json_response=True,   # Pure JSON responses (no SSE)
    streamable_http_path="/"  # Prevents double-path issues
)
```

**Authentication Context Management**: Due to limitations in the MCP SDK's stateless mode, we use Python's `contextvars` to maintain thread-safe, request-scoped authentication context. This ensures proper user isolation in concurrent requests while working within the framework's constraints.

### Service Layer Pattern
- Abstract service layer switchable between in-memory and Supabase
- Shared Pydantic models ensure consistency
- Business logic isolated from transport layers

## Data Model

### Artifacts
Core content units with:
- **Auto-title generation** from markdown (H1 > H2 > first line > truncated)
- **100k char limit** for content
- **Flexible JSON metadata**
- **Full-text search** capability via PostgreSQL
- **Version tracking** with auto-incrementing version numbers

### API Keys
- **bcrypt hashed** with lookup_hash optimization
- **Scoped permissions** (read, write, delete)
- **Max 10 keys** per user
- **Optional expiration** with automatic cleanup
- **Usage tracking** via last_used_at timestamp

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
# Copy template to create .env in backend directory
cp .env.example .env

# Edit .env with your values:
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key  # Use service_role key for backend
SUPABASE_ANON_KEY=your-anon-key     # For auth endpoints
USE_SUPABASE=true                    # Set to false for in-memory mode
API_BASE_URL=https://api.contexthub.com  # Your API URL
```

**Note:** Environment file must be in `/backend/.env` (not root). Config loads explicitly from backend directory.

### 3. Setup Database

Apply the schema to your Supabase project:

```bash
# Run in Supabase SQL Editor
# File: backend/schema/schema.sql
```

The schema includes:
- Artifacts table with full-text search
- API keys table with bcrypt hashing and lookup_hash optimization
- RLS policies for both tables
- Triggers for updated_at timestamps

### 4. Run Server

```bash
# Start the combined REST API and MCP server
python app/main.py

# Or with auto-reload for development
uvicorn app.main:app --reload
```

## Access Patterns

The backend serves both REST API and MCP from a single deployment:

### REST API Endpoints
- `http://localhost:8000/api/v1/artifacts` - Artifact CRUD operations
- `http://localhost:8000/api/v1/auth` - Authentication endpoints
- `http://localhost:8000/api/v1/api-keys` - API key management
- `http://localhost:8000/api/docs` - Interactive API documentation

### MCP Server Endpoint
- `http://localhost:8000/mcp` - MCP server for AI assistants

### Health Check
- `http://localhost:8000/health` - Service health status

## Authentication

The platform supports dual authentication methods:

- **JWT (Bearer Token)** - For web UI and session-based auth
- **API Keys** - For programmatic access via `X-API-Key` header

### Using API Keys with MCP

API keys created through the UI work for both REST API and MCP access:

```python
# In MCP clients (e.g., Claude, OpenAI)
mcp_servers=[{
    "type": "url",
    "url": "https://api.contexthub.com/mcp",
    "name": "contexthub",
    "authorization_token": "sk_prod_your_api_key"  # Same API key as REST!
}]
```

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
| POST | `/api/v1/artifacts` | Create artifact (title optional - auto-generated) |
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

The MCP server provides the following tools (all require API key authentication):

- `create_artifact` - Create new artifact in your personal collection
- `list_artifacts` - List your artifacts with pagination
- `search_artifacts` - Search your artifacts by text
- `get_artifact` - Get a specific artifact by ID
- `update_artifact` - Update an existing artifact
- `delete_artifact` - Delete an artifact

Each tool operates within the context of the authenticated user, ensuring data isolation and security.

## Testing

### Unit Tests

```bash
# From backend directory
pytest tests/unit_tests/

# Verbose output
pytest tests/unit_tests/ -v

# With coverage
pytest tests/unit_tests/ --cov=app

# Run specific test file
pytest tests/unit_tests/test_utils_markdown.py -v
```

### Integration Tests

#### API Integration Tests

Complete test suite for the REST API endpoints, simulating real developer usage:

```bash
# From backend directory
python tests/integration_tests/test_api_endpoints.py
```

**Test Coverage:**
- Server health and connectivity
- Authentication (API key validation)
- Complete CRUD lifecycle (create, read, update, delete)
- Search functionality and edge cases
- Auto-title generation from markdown
- Content validation and limits
- Error handling and edge cases
- Full workflow integration scenarios

**Prerequisites:**
- Server running on localhost:8000 or ngrok
- `CONTEXTHUB_API_KEY` in `.env`
- Optional: `NGROK_URL` for remote testing

**Output:** Detailed test report with timing, pass/fail status, and cleanup verification.

#### MCP Integration Tests

```bash
# For remote testing, start ngrok first
ngrok http 8000

# From backend directory
cd tests/integration_tests
python test_openai_mcp.py
python test_anthropic_mcp.py

# Or with pytest
pytest tests/integration_tests/
```

### Manual API Testing

**Alternative:** Use the automated integration test above for comprehensive API testing.

**Manual curl commands:**

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

# Create an artifact
curl -X POST http://localhost:8000/api/v1/artifacts \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{
    "content": "# Test Artifact\n\nThis is a test context artifact."
  }'

# List all artifacts (with authentication)
curl http://localhost:8000/api/v1/artifacts \
  -H "Authorization: Bearer $TOKEN"

# Search artifacts
curl "http://localhost:8000/api/v1/artifacts/search?q=React" \
  -H "X-API-Key: $API_KEY"

# Get specific artifact (replace with actual ID)
curl "http://localhost:8000/api/v1/artifacts/782dde8d-5cce-4427-a67c-9500d5b631ac" \
  -H "X-API-Key: $API_KEY"

# Update an artifact
curl -X PUT "http://localhost:8000/api/v1/artifacts/782dde8d-5cce-4427-a67c-9500d5b631ac" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{"title": "Updated Title"}'

# Delete an artifact
curl -X DELETE "http://localhost:8000/api/v1/artifacts/782dde8d-5cce-4427-a67c-9500d5b631ac" \
  -H "X-API-Key: $API_KEY"

# Health check (no auth required)
curl http://localhost:8000/health
```

## Development

### Code Quality Tools

```bash
# Format code with Black
black app/ tests/

# Lint code with Pylint
pylint app/

# Type checking with MyPy
mypy app/

# Run tests with pytest
pytest

# Run tests with coverage
pytest --cov=app tests/

# Run async tests
pytest --asyncio-mode=auto tests/
```

### Development Workflow

1. **Before committing:**
   ```bash
   black app/          # Format code
   mypy app/          # Check types
   pylint app/        # Lint code
   pytest             # Run tests
   ```

2. **Watch mode for development:**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

## Environment Variables

Located in `/backend/.env`:

| Variable | Description | Default |
|----------|-------------|---------|
| `SUPABASE_URL` | Supabase project URL | Required |
| `SUPABASE_KEY` | Supabase service role key | Required |
| `SUPABASE_ANON_KEY` | Supabase anon key for auth | Required |
| `USE_SUPABASE` | Enable Supabase storage | `true` |
| `API_HOST` | API bind address | `0.0.0.0` |
| `API_PORT` | API port | `8000` |
| `API_BASE_URL` | Base URL for MCP auth | `https://api.contexthub.com` |
| `CONTEXTHUB_API_KEY` | API key for testing | Required for tests |
| `OPENAI_API_KEY` | OpenAI API key | Required for OpenAI tests |
| `ANTHROPIC_API_KEY` | Anthropic API key | Required for Anthropic tests |
| `NGROK_URL` | Ngrok tunnel URL | Optional for remote testing |

## Technical Notes

### Performance Optimizations
- **API key validation**: Uses lookup_hash for O(1) filtering before bcrypt comparison
- **Text search**: PostgreSQL full-text search with GIN indexes
- **Stateless MCP**: No session persistence overhead, perfect for cloud deployment

### Security Considerations
- Using `service_role` key for backend operations (bypasses RLS)
- Dual authentication: JWT tokens and API keys
- API keys hashed with bcrypt before storage
- All artifact endpoints require authentication
- Row Level Security (RLS) policies ready in database
- CORS configured with `Mcp-Session-Id` exposed for browser MCP clients

### Known Limitations
- MCP SDK's stateless mode doesn't properly inject auth context into tools
- Workaround: Using Python's `contextvars` for thread-safe request context
- This is a framework limitation that may be fixed in future SDK versions

## Contributing

When contributing, please:
1. Follow the existing code structure and patterns
2. Add tests for new functionality
3. Update documentation as needed
4. Ensure all authentication flows work correctly
5. Test both REST API and MCP endpoints

## Next Steps

- [x] Add user authentication (Supabase Auth)
- [x] Implement API keys for programmatic access
- [x] Add MCP server with HTTP transport
- [x] Optimize API key validation performance
- [x] Fix MCP authentication context issue
- [ ] Add rate limiting
- [ ] Implement proper versioning for artifacts
- [ ] Add bulk operations
- [ ] Add webhook support for artifact changes
