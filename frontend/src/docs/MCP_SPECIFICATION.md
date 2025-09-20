# Allcontext MCP Server Specification

Model Context Protocol (MCP) server specification for Allcontext.

## Table of Contents

- [Overview](#overview)
- [Server Configuration](#server-configuration)
- [Authentication](#authentication)
- [Tools](#tools)
- [Error Handling](#error-handling)
- [Security & Compliance](#security--compliance)

---

## Overview

The Allcontext MCP server provides AI assistants with direct access to personal context artifacts through the Model Context Protocol. This enables seamless integration with AI tools like Claude Desktop, OpenAI assistants, and other MCP-compatible clients.

### MCP Version Compliance

- **MCP Specification**: 2025-03-26
- **Protocol**: JSON-RPC 2.0
- **Transport**: Stateless HTTP
- **Security**: OAuth Resource Server compliant

### Server Identity

```json
{
  "name": "Allcontext",
  "version": "1.0.0",
  "instructions": "A cloud-based platform for storing and managing AI context artifacts. Store prompts, documentation, and markdown content that can be accessed by AI assistants through multiple interfaces."
}
```

### Key Features

- **6 Core Tools** for complete CRUD operations on artifacts
- **Stateless Architecture** optimized for cloud deployment
- **Thread-safe Authentication** via contextvars
- **User Data Isolation** with proper access controls
- **Error Handling** with detailed feedback

---

## Server Configuration

### Connection Details

| Property | Value | Description |
|----------|-------|-------------|
| **Protocol** | `http/https` | Standard HTTP transport |
| **Endpoint** | `/mcp/` | MCP server mount point |
| **Method** | `POST` | JSON-RPC over HTTP POST |
| **Content-Type** | `application/json` | JSON-RPC 2.0 format |

### Production URLs

```json
{
  "servers": [
    {
      "url": "http://localhost:8000/mcp/",
      "description": "Local development"
    },
    {
      "url": "https://api.allcontext.dev/mcp/",
      "description": "Production server"
    },
    {
      "url": "https://your-tunnel.ngrok-free.app/mcp/",
      "description": "Development tunnel"
    }
  ]
}
```

### Transport Configuration

The server uses **stateless HTTP** configuration optimized for cloud deployment:

```python
FastMCP(
    name="Allcontext",
    stateless_http=True,        # No session persistence
    json_response=True,         # Pure JSON responses
    streamable_http_path="/",   # Prevents path issues
    token_verifier=ApiKeyVerifier(),
    auth=AuthSettings(
        issuer_url="https://api.allcontext.dev",
        resource_server_url="https://api.allcontext.dev/mcp/",
        required_scopes=["read", "write"]
    )
)
```

---

## Authentication

### OAuth Resource Server Configuration

Allcontext MCP server operates as an **OAuth Resource Server** following MCP 2025 security specifications.

### Authentication Method

**API Key Authentication** via `authorization_token`:

```json
{
  "authorization": "sk_prod_1234567890abcdefghijklmnopqrstuvwxyz"
}
```

### API Key Format

- **Prefix**: `sk_prod_` (production keys)
- **Length**: 32 random characters after prefix
- **Example**: `sk_prod_1234567890abcdefghijklmnopqrstuvwxyz`
- **Encoding**: URL-safe base64 characters

### Security Features

1. **bcrypt Hashing**: Keys stored as bcrypt hashes
2. **Lookup Hash Optimization**: SHA256 of first 16 chars for fast filtering
3. **Scope-based Permissions**: `read`, `write`, `delete` scopes
4. **Expiration Support**: Optional expiry timestamps
5. **Usage Tracking**: `last_used_at` timestamps
6. **Soft Deletion**: Keys can be deactivated vs hard deleted

### Thread-Safe Context

Due to FastMCP framework limitations, authentication context is managed via Python `contextvars`:

```python
# Context variable for thread-safe user identification
user_context: ContextVar[Optional[UUID]] = ContextVar('user_context', default=None)

def get_authenticated_user_id() -> Optional[UUID]:
    """Get the authenticated user ID from request context."""
    return user_context.get()
```

---

## Tools

The Allcontext MCP server provides 6 core tools for complete artifact management.

### 1. create_artifact

Create a new context artifact.

**Function Signature**:
```python
async def create_artifact(
    content: str,
    title: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]
```

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `content` | string | ✅ | Artifact content (max 100k chars) |
| `title` | string | ❌ | Title (max 200 chars, auto-generated if not provided) |
| `metadata` | object | ❌ | JSON metadata object |

**Auto-Title Generation**:
1. Use provided `title` if present
2. Extract from H1 heading (`# Title`)
3. Fall back to H2 heading (`## Title`)
4. Use first line of content
5. Truncate to 200 characters

**Success Response**:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Generated Title",
  "content": "# My Context\n\nThis is my artifact content...",
  "metadata": {"category": "personal"},
  "created_at": "2024-01-01T00:00:00Z",
  "message": "Created artifact: Generated Title"
}
```

**Error Response**:
```json
{
  "error": "Invalid input: Content exceeds maximum length of 100000 characters"
}
```

### 2. list_artifacts

List user's context artifacts with pagination.

**Function Signature**:
```python
async def list_artifacts(
    limit: int = 10,
    offset: int = 0
) -> List[Dict[str, Any]]
```

**Parameters**:

| Parameter | Type | Default | Range | Description |
|-----------|------|---------|--------|-------------|
| `limit` | integer | 10 | 1-50 | Maximum artifacts to return |
| `offset` | integer | 0 | ≥0 | Number of artifacts to skip |

**Success Response**:
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "title": "My Context Document",
    "content_preview": "# My Context\n\nThis document contains important information about my project setup and preferences. It includes configuration details, coding standards, and workflow preferences...",
    "metadata": {"category": "project", "priority": "high"},
      "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
]
```

**Notes**:
- Returns artifacts sorted by creation date (newest first)
- Content is truncated to 200 characters with "..." if longer
- Includes user's artifacts only

### 3. search_artifacts

Search artifacts by text in title and content.

**Function Signature**:
```python
async def search_artifacts(
    query: str,
    limit: int = 10
) -> List[Dict[str, Any]]
```

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | ✅ | Search query (min 1 char) |
| `limit` | integer | ❌ | Maximum results (1-50, default: 10) |

**Search Behavior**:
- **Case-insensitive** partial matching
- Searches both **title** and **content** fields
- Uses PostgreSQL **ILIKE** pattern matching
- Results from user's artifacts only

**Success Response**:
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "title": "API Documentation",
    "content_preview": "# API Documentation\n\nThis document outlines the API design patterns we use in our applications. It covers REST principles, authentication patterns...",
    "metadata": {"category": "documentation", "team": "engineering"},
    "relevance_context": "Matched query: 'API patterns'",
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

**Error Response**:
```json
[
  {
    "error": "Search query cannot be empty"
  }
]
```

### 4. get_artifact

Retrieve a specific artifact by ID.

**Function Signature**:
```python
async def get_artifact(
    artifact_id: str
) -> Dict[str, Any]
```

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `artifact_id` | string | ✅ | UUID of the artifact |

**Success Response**:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Complete Context Document",
  "content": "# Complete Context Document\n\nThis is the full content of my context artifact. It contains detailed information about my project setup, preferences, and important context for AI assistants...\n\n## Project Setup\n- Framework: FastAPI\n- Database: Supabase\n- Authentication: JWT + API Keys",
  "metadata": {
    "category": "project",
    "tags": ["setup", "configuration"],
    "importance": "high",
    "last_review": "2024-01-01"
  },
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z",
  "version": 1
}
```

**Error Responses**:
```json
{
  "error": "Invalid artifact ID format. Must be a valid UUID."
}
```

```json
{
  "error": "Artifact 123e4567-e89b-12d3-a456-426614174000 not found or access denied"
}
```

**Access Control**:
- Returns artifact if user owns it
- Returns error for non-existent or inaccessible artifacts

### 5. update_artifact

Update an existing artifact.

**Function Signature**:
```python
async def update_artifact(
    artifact_id: str,
    title: Optional[str] = None,
    content: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]
```

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `artifact_id` | string | ✅ | UUID of artifact to update |
| `title` | string | ❌ | New title (max 200 chars) |
| `content` | string | ❌ | New content (max 100k chars) |
| `metadata` | object | ❌ | New metadata object |

**Update Behavior**:
- **Partial updates**: Only provided fields are modified
- **Owner only**: User must own the artifact
- **Auto-title**: If content updated without title, may auto-generate new title
- **Timestamp**: `updated_at` is automatically updated

**Success Response**:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Updated Context Document",
  "content": "# Updated Context Document\n\nThis artifact has been updated with new information...",
  "metadata": {
    "category": "project",
    "tags": ["updated", "current"],
    "last_modified_by": "user"
  },
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T10:30:00Z",
  "version": 1,
  "message": "Updated artifact: Updated Context Document"
}
```

### 6. delete_artifact

Delete an artifact.

**Function Signature**:
```python
async def delete_artifact(
    artifact_id: str
) -> Dict[str, Any]
```

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `artifact_id` | string | ✅ | UUID of artifact to delete |

**Success Response**:
```json
{
  "message": "Successfully deleted artifact",
  "artifact_id": "123e4567-e89b-12d3-a456-426614174000"
}
```

**Error Response**:
```json
{
  "error": "Artifact 123e4567-e89b-12d3-a456-426614174000 not found or access denied"
}
```

**Access Control**:
- **Owner only**: User must own the artifact
- **Hard delete**: Permanently removes artifact from database
- **Cascade**: Related metadata is also removed

---

### 7. list_artifact_versions

Get version history for an artifact.

**Function Signature**:
```python
async def list_artifact_versions(
    artifact_id: str
) -> Dict[str, Any]
```

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `artifact_id` | string | ✅ | UUID of the artifact |

**Success Response**:
```json
{
  "artifact_id": "123e4567-e89b-12d3-a456-426614174000",
  "current_version": 5,
  "total_edits": 4,
  "recent_versions": [
    {
      "version": 4,
      "title": "Previous Title",
      "updated_at": "2024-01-01T00:00:00Z",
      "changes": ["title", "content"]
    },
    {
      "version": 3,
      "title": "Earlier Title",
      "updated_at": "2023-12-31T00:00:00Z",
      "changes": ["content"]
    }
  ]
}
```

**Error Response**:
```json
{
  "error": "Artifact 123e4567-e89b-12d3-a456-426614174000 not found or access denied"
}
```

---

### 8. get_artifact_version

Get a specific version of an artifact.

**Function Signature**:
```python
async def get_artifact_version(
    artifact_id: str,
    version_number: int
) -> Dict[str, Any]
```

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `artifact_id` | string | ✅ | UUID of the artifact |
| `version_number` | integer | ✅ | Version number to retrieve |

**Success Response**:
```json
{
  "version": 4,
  "title": "Previous Title",
  "content": "Full content of the previous version...",
  "metadata": {"key": "value"},
  "updated_at": "2024-01-01T00:00:00Z"
}
```

**Error Response**:
```json
{
  "error": "Version 4 not found for artifact 123e4567-e89b-12d3-a456-426614174000"
}
```

---

### 9. restore_artifact_version

Restore an artifact to a previous version.

**Function Signature**:
```python
async def restore_artifact_version(
    artifact_id: str,
    version_number: int
) -> Dict[str, Any]
```

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `artifact_id` | string | ✅ | UUID of the artifact |
| `version_number` | integer | ✅ | Version to restore |

**Success Response**:
```json
{
  "success": true,
  "message": "Artifact restored to version 4",
  "current_version": 6,
  "title": "Restored Title"
}
```

**Error Response**:
```json
{
  "error": "Cannot restore version 4 for artifact 123e4567-e89b-12d3-a456-426614174000"
}
```

**Note**: Restoring creates a new version with content from the specified version.

---

## Error Handling

### Error Response Format

All MCP tools return errors in a consistent format:

```json
{
  "error": "Human-readable error message"
}
```

### Error Categories

#### Authentication Errors
```json
{
  "error": "Authentication required. Please provide a valid API key."
}
```

#### Validation Errors
```json
{
  "error": "Invalid input: Content exceeds maximum length of 100000 characters"
}
```

#### Not Found Errors
```json
{
  "error": "Artifact 123e4567-e89b-12d3-a456-426614174000 not found or access denied"
}
```

#### Server Errors
```json
{
  "error": "Failed to create artifact"
}
```

### Error Handling Best Practices

1. **Always check for `error` key** in responses
2. **Handle authentication errors** by checking API key validity
3. **Validate UUIDs** before sending to avoid format errors
4. **Respect content limits** to avoid validation errors
5. **Implement retry logic** for transient server errors

---

## Security & Compliance

### MCP 2025 Compliance

✅ **OAuth Resource Server**: Proper token handling and scope validation
✅ **Resource Indicators**: Token protection with resource-specific validation
✅ **Authorization Headers**: Standard `authorization` field support
✅ **Error Handling**: Consistent error responses with security context
✅ **Access Control**: User-scoped data isolation

### Security Features

#### Data Protection
- **User Isolation**: All operations scoped to authenticated user
- **Access Control**: Public/private artifact visibility controls
- **Secure Storage**: bcrypt hashed API keys with lookup optimization
- **Thread Safety**: Contextvars for secure request context

#### API Key Security
- **Secure Generation**: Cryptographically secure random generation
- **Hashed Storage**: bcrypt with salts, never store plaintext
- **Lookup Optimization**: SHA256 prefix hashing for performance
- **Scope Limitation**: Granular permissions (read/write/delete)
- **Expiration Support**: Optional time-based expiry
- **Usage Tracking**: Monitor key usage patterns

#### Transport Security
- **HTTPS Required**: Production deployments use TLS
- **CORS Configuration**: Restricted origins with MCP header support
- **Request Validation**: Input sanitization and validation
- **Rate Limiting**: Built-in FastAPI rate limiting support

### Privacy Considerations

1. **Data Ownership**: Users own all their artifacts
2. **Privacy**: All artifacts are private to the user
3. **Search Scope**: Users only search their own artifacts
4. **No Cross-User Access**: Strict user boundary enforcement
5. **Metadata Privacy**: User-defined metadata not exposed beyond access controls

### Compliance Notes

- **GDPR Ready**: User data isolation and deletion capabilities
- **SOC 2 Compatible**: Access logging and audit trail support
- **API Security**: Following OWASP API Security Top 10
- **MCP Standards**: Full compliance with 2025 specification

---

## Usage Patterns

### Typical AI Assistant Workflow

1. **Authentication**: Provide API key via `authorization` field
2. **Discovery**: Use `list_artifacts` to browse available context
3. **Search**: Use `search_artifacts` to find relevant information
4. **Retrieval**: Use `get_artifact` for complete content
5. **Creation**: Use `create_artifact` for new context items
6. **Updates**: Use `update_artifact` to modify existing content
7. **Cleanup**: Use `delete_artifact` to remove outdated items

### Performance Considerations

- **Pagination**: Use appropriate limits for large collections
- **Caching**: Client-side caching of artifacts for better performance
- **Batch Operations**: Use search to reduce multiple get calls
- **Content Size**: Be mindful of 100k content limit
- **Connection Pooling**: Reuse HTTP connections for multiple requests

### Integration Examples

For integration with MCP clients:
- Configure Claude Desktop with the MCP server URL and API key
- Use OpenAI assistants with MCP tool configuration
- Develop custom MCP clients using the JSON-RPC protocol
- Refer to the API Reference for authentication details

---

*This specification covers Allcontext MCP Server v1.0.0 following MCP 2025-03-26 standards.*
