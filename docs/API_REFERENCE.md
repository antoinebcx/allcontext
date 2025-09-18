# Allcontext API Reference

Comprehensive reference for the Allcontext REST API.

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Error Handling](#error-handling)
- [Rate Limiting & Pagination](#rate-limiting--pagination)
- [Endpoints](#endpoints)
  - [Health Check](#health-check)
  - [Authentication](#authentication-endpoints)
  - [Artifacts](#artifacts-endpoints)
  - [API Keys](#api-keys-endpoints)
- [Examples](#complete-examples)

---

## Overview

The Allcontext API provides REST endpoints for managing AI context artifacts. All endpoints return JSON and follow RESTful conventions.

### Base URLs

| Environment | URL | Description |
|-------------|-----|-------------|
| **Production** | `https://api.allcontext.dev` | Live production API |
| **Development** | `http://localhost:8000` | Local development server |
| **Tunnel** | `https://your-tunnel.ngrok-free.app` | Development tunnel (ngrok) |

### Content Types

- **Request**: `application/json`
- **Response**: `application/json`

### API Versioning

Current version: **v1** (all endpoints prefixed with `/api/v1/`)

---

## Authentication

Allcontext supports dual authentication methods:

### 1. JWT Bearer Tokens (Web Sessions)

For web applications using Supabase Auth:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. API Keys (Programmatic Access)

For integrations, scripts, and MCP clients:

```http
X-API-Key: sk_prod_1234567890abcdefghijklmnopqrstuvwxyz
```

### Authentication Flow

1. **Web UI**: Email/password → Supabase Auth → JWT token
2. **Programmatic**: Create API key via JWT-authenticated request → Use API key

**Note**: API keys require JWT authentication to create, but can then be used independently.

---

## Error Handling

### HTTP Status Codes

| Code | Description | Usage |
|------|-------------|--------|
| `200` | OK | Successful GET, PUT requests |
| `201` | Created | Successful POST requests |
| `204` | No Content | Successful DELETE requests |
| `400` | Bad Request | Malformed request |
| `401` | Unauthorized | Authentication required/invalid |
| `404` | Not Found | Resource doesn't exist |
| `422` | Unprocessable Entity | Validation error |
| `500` | Internal Server Error | Server error |

### Error Response Format

```json
{
  "detail": "Error message description"
}
```

### Validation Errors (422)

```json
{
  "detail": [
    {
      "loc": ["body", "title"],
      "msg": "String should have at least 1 character",
      "type": "string_too_short",
      "ctx": {"min_length": 1}
    }
  ]
}
```

---

## Rate Limiting & Pagination

### Pagination

List endpoints support pagination via query parameters:

| Parameter | Type | Default | Range | Description |
|-----------|------|---------|-------|-------------|
| `limit` | integer | 50 | 1-100 | Items per page |
| `offset` | integer | 0 | ≥0 | Items to skip |

### Pagination Response Format

```json
{
  "items": [...],
  "total": 150,
  "page": 3,
  "page_size": 50
}
```

### Content Limits

| Resource | Limit | Description |
|----------|-------|-------------|
| Artifact content | 100,000 chars | Maximum content length |
| Artifact title | 200 chars | Maximum title length |
| API keys per user | 10 | Maximum active keys |
| Metadata size | No hard limit | JSON object |

---

## Endpoints

### Health Check

#### GET `/health`

Check if the service is running.

**Authentication**: None required

**Response** (200):
```json
{
  "status": "healthy",
  "service": "context-platform"
}
```

**Example**:
```bash
curl https://api.allcontext.dev/health
```

---

### Authentication Endpoints

#### POST `/api/v1/auth/login`

Authenticate user with email and password.

**Authentication**: None required

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response** (200):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@example.com"
  }
}
```

**Errors**:
- `401`: Invalid credentials
- `422`: Validation error

**Example**:
```bash
curl -X POST https://api.allcontext.dev/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123"
  }'
```

#### POST `/api/v1/auth/signup`

Register a new user account.

**Authentication**: None required

**Request Body**:
```json
{
  "email": "newuser@example.com",
  "password": "securepassword123"
}
```

**Response** (200):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174001",
    "email": "newuser@example.com"
  }
}
```

**Errors**:
- `400`: Email already registered
- `422`: Validation error

#### POST `/api/v1/auth/check-email`

Check if an email is already registered.

**Authentication**: None required

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Response** (200):
```json
{
  "exists": true,
  "email": "user@example.com"
}
```

#### POST `/api/v1/auth/logout`

Sign out the current user (client-side cleanup).

**Authentication**: None required

**Response** (200):
```json
{
  "message": "Logged out successfully"
}
```

---

### Artifacts Endpoints

#### POST `/api/v1/artifacts`

Create a new artifact.

**Authentication**: Required (JWT or API Key)

**Request Body**:
```json
{
  "title": "Optional Title",
  "content": "# My Artifact\n\nThis is the content...",
  "metadata": {
    "category": "documentation",
    "tags": ["api", "reference"]
  }
}
```

**Fields**:
- `title` (optional): Will auto-generate from content if not provided
- `content` (required): Markdown content (max 100k chars)
- `metadata` (optional): JSON object with any structure

**Response** (201):
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "user_id": "123e4567-e89b-12d3-a456-426614174001",
  "title": "My Artifact",
  "content": "# My Artifact\n\nThis is the content...",
  "metadata": {
    "category": "documentation",
    "tags": ["api", "reference"]
  },
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z",
  "version": 1
}
```

**Auto-Title Generation**:
1. Uses provided `title` if present
2. Extracts from H1 heading (`# Title`)
3. Falls back to H2 heading (`## Title`)
4. Uses first line of content
5. Truncates to fit 200 char limit

**Example**:
```bash
curl -X POST https://api.allcontext.dev/api/v1/artifacts \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sk_prod_your_api_key" \
  -d '{
    "content": "# API Guidelines\n\nBest practices for our API design:\n\n1. Use RESTful conventions\n2. Include proper status codes\n3. Provide clear error messages",
    "metadata": {
      "category": "engineering",
      "team": "backend"
    }
  }'
```

#### GET `/api/v1/artifacts`

List artifacts (user's artifacts only).

**Authentication**: Required (JWT or API Key)

**Query Parameters**:
- `limit` (optional): Items per page (1-100, default: 50)
- `offset` (optional): Items to skip (default: 0)

**Response** (200):
```json
{
  "items": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "user_id": "123e4567-e89b-12d3-a456-426614174001",
      "title": "API Guidelines",
      "content": "# API Guidelines\n\nBest practices...",
      "metadata": {
        "category": "engineering",
        "team": "backend"
      },
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z",
      "version": 1
    }
  ],
  "total": 1,
  "page": 1,
  "page_size": 50
}
```

**Example**:
```bash
curl https://api.allcontext.dev/api/v1/artifacts?limit=10&offset=0 \
  -H "X-API-Key: sk_prod_your_api_key"
```

#### GET `/api/v1/artifacts/search`

Search artifacts by text in title and content.

**Authentication**: Required (JWT or API Key)

**Query Parameters**:
- `q` (required): Search query (min 1 char)

**Response** (200):
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "title": "API Guidelines",
    "snippet": "# API Guidelines\n\nBest practices for our API design:\n\n1. Use RESTful conventions\n2. Include proper status codes\n3. Provide clear error messages...",
    "metadata": {"category": "engineering"},
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
]
```

**Search Behavior**:
- Searches both title and content
- Case-insensitive partial matching
- Returns user's artifacts only
- Returns preview snippets (200 chars)
- Use `GET /artifacts/{id}` to retrieve full content

**Example**:
```bash
curl "https://api.allcontext.dev/api/v1/artifacts/search?q=API%20guidelines" \
  -H "X-API-Key: sk_prod_your_api_key"
```

#### GET `/api/v1/artifacts/{artifact_id}`

Get a specific artifact by ID.

**Authentication**: Required (JWT or API Key)

**Path Parameters**:
- `artifact_id`: UUID of the artifact

**Response** (200):
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "user_id": "123e4567-e89b-12d3-a456-426614174001",
  "title": "API Guidelines",
  "content": "# API Guidelines\n\nBest practices...",
  "metadata": {"category": "engineering"},
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z",
  "version": 1
}
```

**Access Control**:
- Returns artifact if user owns it
- Returns 404 if artifact doesn't exist or access denied

**Example**:
```bash
curl https://api.allcontext.dev/api/v1/artifacts/123e4567-e89b-12d3-a456-426614174000 \
  -H "X-API-Key: sk_prod_your_api_key"
```

#### PUT `/api/v1/artifacts/{artifact_id}`

Update an existing artifact.

**Authentication**: Required (JWT or API Key)

**Path Parameters**:
- `artifact_id`: UUID of the artifact

**Request Body** (all fields optional):
```json
{
  "title": "Updated API Guidelines",
  "content": "# Updated API Guidelines\n\nRevised best practices...",
  "metadata": {
    "category": "engineering",
    "team": "backend",
    "updated_reason": "Added security section"
  }
}
```

**Response** (200):
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "user_id": "123e4567-e89b-12d3-a456-426614174001",
  "title": "Updated API Guidelines",
  "content": "# Updated API Guidelines\n\nRevised best practices...",
  "metadata": {
    "category": "engineering",
    "team": "backend",
    "updated_reason": "Added security section"
  },
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T01:30:00Z",
  "version": 1
}
```

**Update Behavior**:
- Only provided fields are updated
- Owner-only operation (returns 404 if not owner)
- Auto-updates `updated_at` timestamp
- If content updated without title, may auto-generate new title

**Example**:
```bash
curl -X PUT https://api.allcontext.dev/api/v1/artifacts/123e4567-e89b-12d3-a456-426614174000 \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sk_prod_your_api_key" \
  -d '{
    "title": "Updated API Guidelines",
  }'
```

#### DELETE `/api/v1/artifacts/{artifact_id}`

Delete an artifact.

**Authentication**: Required (JWT or API Key)

**Path Parameters**:
- `artifact_id`: UUID of the artifact

**Response** (204): No content

**Access Control**:
- Owner-only operation
- Returns 404 if artifact doesn't exist or access denied

**Example**:
```bash
curl -X DELETE https://api.allcontext.dev/api/v1/artifacts/123e4567-e89b-12d3-a456-426614174000 \
  -H "X-API-Key: sk_prod_your_api_key"
```

---

#### GET `/api/v1/artifacts/{artifact_id}/versions`

Get version history for an artifact.

**Authentication**: Required (JWT or API Key)

**Parameters**:
- `artifact_id` (path): Artifact UUID

**Response** (200):
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "current_version": 5,
  "version_count": 4,
  "versions": [
    {
      "version": 4,
      "title": "Previous Title",
      "updated_at": "2024-01-01T00:00:00Z",
      "content_length": 1500,
      "changes": ["title", "content"]
    }
  ]
}
```

**Errors**:
- `404`: Artifact not found or access denied

**Example**:
```bash
curl https://api.allcontext.dev/api/v1/artifacts/123e4567-e89b-12d3-a456-426614174000/versions \
  -H "X-API-Key: sk_prod_your_api_key"
```

---

#### GET `/api/v1/artifacts/{artifact_id}/versions/{version_number}`

Get a specific version of an artifact with full content.

**Authentication**: Required (JWT or API Key)

**Parameters**:
- `artifact_id` (path): Artifact UUID
- `version_number` (path): Version number (>= 1)

**Response** (200):
```json
{
  "version": 4,
  "title": "Previous Title",
  "content": "Full content of the version...",
  "metadata": {"key": "value"},
  "updated_at": "2024-01-01T00:00:00Z",
  "content_length": 1500,
  "title_changed": true,
  "content_changed": true
}
```

**Errors**:
- `404`: Version not found

**Example**:
```bash
curl https://api.allcontext.dev/api/v1/artifacts/123e4567-e89b-12d3-a456-426614174000/versions/4 \
  -H "X-API-Key: sk_prod_your_api_key"
```

---

#### POST `/api/v1/artifacts/{artifact_id}/restore/{version_number}`

Restore an artifact to a previous version.

**Authentication**: Required (JWT or API Key)

**Parameters**:
- `artifact_id` (path): Artifact UUID
- `version_number` (path): Version to restore (>= 1)

**Response** (200):
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Restored Title",
  "content": "Restored content...",
  "version": 6,
  "updated_at": "2024-01-02T00:00:00Z"
}
```

**Errors**:
- `404`: Cannot restore version

**Example**:
```bash
curl -X POST https://api.allcontext.dev/api/v1/artifacts/123e4567-e89b-12d3-a456-426614174000/restore/4 \
  -H "X-API-Key: sk_prod_your_api_key"
```

---

#### GET `/api/v1/artifacts/{artifact_id}/diff`

Compare two versions of an artifact.

**Authentication**: Required (JWT or API Key)

**Parameters**:
- `artifact_id` (path): Artifact UUID
- `from_version` (query): Starting version (>= 1)
- `to_version` (query): Ending version (>= 1)

**Response** (200):
```json
{
  "from_version": 3,
  "to_version": 5,
  "title_changed": true,
  "old_title": "Old Title",
  "new_title": "New Title",
  "content_length_change": 250,
  "metadata_changed": false
}
```

**Errors**:
- `404`: Cannot compare versions

**Example**:
```bash
curl "https://api.allcontext.dev/api/v1/artifacts/123e4567-e89b-12d3-a456-426614174000/diff?from_version=3&to_version=5" \
  -H "X-API-Key: sk_prod_your_api_key"
```

---

### API Keys Endpoints

#### POST `/api/v1/api-keys`

Create a new API key.

**Authentication**: Required (JWT only - cannot use API key to create API keys)

**Request Body**:
```json
{
  "name": "Production Integration",
  "scopes": ["read", "write", "delete"],
  "expires_at": "2025-12-31T23:59:59Z"
}
```

**Fields**:
- `name` (required): Friendly name (max 100 chars)
- `scopes` (optional): Array of permissions (default: ["read", "write"])
- `expires_at` (optional): Expiry date (must be future)

**Available Scopes**:
- `read`: List, get, search artifacts
- `write`: Create, update artifacts
- `delete`: Delete artifacts

**Response** (201):
```json
{
  "id": "456e7890-e89b-12d3-a456-426614174000",
  "user_id": "123e4567-e89b-12d3-a456-426614174001",
  "name": "Production Integration",
  "key_prefix": "sk_prod_",
  "last_4": "wxyz",
  "api_key": "sk_prod_1234567890abcdefghijklmnopqrstuvwxyz",
  "scopes": ["read", "write", "delete"],
  "expires_at": "2025-12-31T23:59:59Z",
  "last_used_at": null,
  "is_active": true,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

**⚠️ Important**: The `api_key` field is only returned during creation. Store it securely!

**Example**:
```bash
curl -X POST https://api.allcontext.dev/api/v1/api-keys \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "name": "My Integration",
    "scopes": ["read", "write"]
  }'
```

#### GET `/api/v1/api-keys`

List all API keys for the authenticated user.

**Authentication**: Required (JWT or API Key)

**Response** (200):
```json
{
  "items": [
    {
      "id": "456e7890-e89b-12d3-a456-426614174000",
      "user_id": "123e4567-e89b-12d3-a456-426614174001",
      "name": "Production Integration",
      "key_prefix": "sk_prod_",
      "last_4": "wxyz",
      "scopes": ["read", "write", "delete"],
      "expires_at": "2025-12-31T23:59:59Z",
      "last_used_at": "2024-01-15T10:30:00Z",
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 1
}
```

**Note**: The actual API key value is never returned in list/get operations.

#### GET `/api/v1/api-keys/{key_id}`

Get details of a specific API key.

**Authentication**: Required (JWT or API Key)

**Path Parameters**:
- `key_id`: UUID of the API key

**Response** (200):
```json
{
  "id": "456e7890-e89b-12d3-a456-426614174000",
  "user_id": "123e4567-e89b-12d3-a456-426614174001",
  "name": "Production Integration",
  "key_prefix": "sk_prod_",
  "last_4": "wxyz",
  "scopes": ["read", "write", "delete"],
  "expires_at": "2025-12-31T23:59:59Z",
  "last_used_at": "2024-01-15T10:30:00Z",
  "is_active": true,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

#### PUT `/api/v1/api-keys/{key_id}`

Update an API key.

**Authentication**: Required (JWT or API Key)

**Path Parameters**:
- `key_id`: UUID of the API key

**Request Body** (all fields optional):
```json
{
  "name": "Updated Integration Name",
  "scopes": ["read", "write"],
  "is_active": false
}
```

**Updatable Fields**:
- `name`: Friendly name
- `scopes`: Permissions array
- `is_active`: Enable/disable key

**Note**: Cannot update the actual key value or expiry date.

**Response** (200):
```json
{
  "id": "456e7890-e89b-12d3-a456-426614174000",
  "name": "Updated Integration Name",
  "scopes": ["read", "write"],
  "is_active": false,
  "updated_at": "2024-01-15T11:00:00Z"
}
```

#### DELETE `/api/v1/api-keys/{key_id}`

Delete (revoke) an API key.

**Authentication**: Required (JWT or API Key)

**Path Parameters**:
- `key_id`: UUID of the API key

**Response** (204): No content

**Note**: This performs a soft delete by setting `is_active` to false. The key will no longer work for authentication.

---

## Complete Examples

### Getting Started Workflow

1. **Register and get JWT token**:
```bash
# Register
TOKEN=$(curl -X POST https://api.allcontext.dev/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email": "dev@example.com", "password": "securepass123"}' \
  | jq -r '.access_token')
```

2. **Create an API key**:
```bash
# Create API key
API_KEY=$(curl -X POST https://api.allcontext.dev/api/v1/api-keys \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name": "My Integration", "scopes": ["read", "write"]}' \
  | jq -r '.api_key')
```

3. **Create your first artifact**:
```bash
# Create artifact
ARTIFACT_ID=$(curl -X POST https://api.allcontext.dev/api/v1/artifacts \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{
    "content": "# My First Context\n\nThis is my personal AI context artifact.\n\n## Key Information\n- Project: Allcontext\n- Type: Documentation\n- Purpose: Testing the API",
    "metadata": {"category": "personal", "priority": "high"}
  }' \
  | jq -r '.id')

echo "Created artifact: $ARTIFACT_ID"
```

4. **Search and retrieve**:
```bash
# Search artifacts
curl "https://api.allcontext.dev/api/v1/artifacts/search?q=context" \
  -H "X-API-Key: $API_KEY"

# Get specific artifact
curl "https://api.allcontext.dev/api/v1/artifacts/$ARTIFACT_ID" \
  -H "X-API-Key: $API_KEY"
```

### Integration Patterns

#### Python Example

```python
import requests

class AllcontextClient:
    def __init__(self, api_key: str, base_url: str = "https://api.allcontext.dev"):
        self.api_key = api_key
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            "X-API-Key": api_key,
            "Content-Type": "application/json"
        })

    def create_artifact(self, content: str, title: str = None, metadata: dict = None):
        data = {"content": content}
        if title:
            data["title"] = title
        if metadata:
            data["metadata"] = metadata

        response = self.session.post(f"{self.base_url}/api/v1/artifacts", json=data)
        response.raise_for_status()
        return response.json()

    def search_artifacts(self, query: str):
        response = self.session.get(
            f"{self.base_url}/api/v1/artifacts/search",
            params={"q": query}
        )
        response.raise_for_status()
        return response.json()

# Usage
client = AllcontextClient("sk_prod_your_api_key")
artifact = client.create_artifact(
    "# Project Notes\n\nKey insights from today's meeting...",
    metadata={"project": "alpha", "meeting_date": "2024-01-15"}
)
```

#### Node.js Example

```javascript
class AllcontextClient {
  constructor(apiKey, baseUrl = 'https://api.allcontext.dev') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'X-API-Key': this.apiKey,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async createArtifact(content, { title, metadata } = {}) {
    return this.request('/api/v1/artifacts', {
      method: 'POST',
      body: JSON.stringify({ content, title, metadata }),
    });
  }

  async searchArtifacts(query) {
    return this.request(`/api/v1/artifacts/search?q=${encodeURIComponent(query)}`);
  }
}

// Usage
const client = new AllcontextClient('sk_prod_your_api_key');
const artifact = await client.createArtifact(
  '# Project Notes\n\nKey insights...',
  { metadata: { project: 'beta' } }
);
```

---

## Need Help?

- **Interactive API Docs**: Visit `/api/docs` on any server for Swagger UI
- **Alternative Docs**: Visit `/api/redoc` for ReDoc interface
- **OpenAPI Spec**: Download from `/api/openapi.json`
- **MCP Specification**: See [MCP Server Specification](./MCP_SPECIFICATION.md)
- **Issues**: Report bugs or request features on GitHub

---

*This reference covers Allcontext API v1.0.0. For the latest updates, check the interactive documentation.*
