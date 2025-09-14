# Allcontext API Integration

Quick guide to integrate with the Allcontext REST API using curl, Python, or JavaScript/TypeScript.

## Table of Contents

- [Quick Start](#quick-start)
- [Authentication](#authentication)
- [Working with Artifacts](#working-with-artifacts)
  - [List artifacts](#list-artifacts)
  - [Search artifacts](#search-artifacts)
  - [Get a specific artifact](#get-a-specific-artifact)
  - [Create an artifact](#create-an-artifact)
  - [Update an artifact](#update-an-artifact)
  - [Delete an artifact](#delete-an-artifact)
- [Managing API Keys](#managing-api-keys)
- [Error Handling](#error-handling)
- [Complete Examples](#complete-examples)

## Quick Start

1. Get your API key from Settings in the Allcontext app
2. Set your API key as an environment variable:

```bash
export API_KEY="sk_prod_your_api_key_here"
```

3. Make your first request:

**curl:**
```bash
curl https://api.allcontext.dev/api/v1/artifacts \
  -H "X-API-Key: $API_KEY"
```

**Python:**
```python
import requests

api_key = "sk_prod_your_api_key_here"
response = requests.get(
    "https://api.allcontext.dev/api/v1/artifacts",
    headers={"X-API-Key": api_key}
)
print(response.json())
```

**JavaScript:**
```javascript
const apiKey = 'sk_prod_your_api_key_here';
const response = await fetch('https://api.allcontext.dev/api/v1/artifacts', {
  headers: { 'X-API-Key': apiKey }
});
const data = await response.json();
console.log(data);
```

## Authentication

All API requests require an API key in the `X-API-Key` header:

```
X-API-Key: sk_prod_your_api_key_here
```

Create API keys in the Allcontext Settings page. Each key can have different scopes:
- `read` - List, search, and get artifacts
- `write` - Create and update artifacts
- `delete` - Delete artifacts

## Working with Artifacts

Base URL: `https://api.allcontext.dev/api/v1`

### List artifacts

Get all your artifacts (paginated).

**curl:**
```bash
curl "https://api.allcontext.dev/api/v1/artifacts?limit=10&offset=0" \
  -H "X-API-Key: $API_KEY"
```

**Python:**
```python
response = requests.get(
    "https://api.allcontext.dev/api/v1/artifacts",
    headers={"X-API-Key": api_key},
    params={"limit": 10, "offset": 0}
)
artifacts = response.json()
```

**JavaScript:**
```javascript
const response = await fetch('https://api.allcontext.dev/api/v1/artifacts?limit=10&offset=0', {
  headers: { 'X-API-Key': apiKey }
});
const artifacts = await response.json();
```

### Search artifacts

Find artifacts by text in title or content.

**curl:**
```bash
curl "https://api.allcontext.dev/api/v1/artifacts/search?q=api" \
  -H "X-API-Key: $API_KEY"
```

**Python:**
```python
response = requests.get(
    "https://api.allcontext.dev/api/v1/artifacts/search",
    headers={"X-API-Key": api_key},
    params={"q": "api"}
)
results = response.json()
```

**JavaScript:**
```javascript
const response = await fetch('https://api.allcontext.dev/api/v1/artifacts/search?q=api', {
  headers: { 'X-API-Key': apiKey }
});
const results = await response.json();
```

### Get a specific artifact

Retrieve full content of an artifact by ID.

**curl:**
```bash
curl "https://api.allcontext.dev/api/v1/artifacts/123e4567-e89b-12d3-a456-426614174000" \
  -H "X-API-Key: $API_KEY"
```

**Python:**
```python
artifact_id = "123e4567-e89b-12d3-a456-426614174000"
response = requests.get(
    f"https://api.allcontext.dev/api/v1/artifacts/{artifact_id}",
    headers={"X-API-Key": api_key}
)
artifact = response.json()
```

**JavaScript:**
```javascript
const artifactId = '123e4567-e89b-12d3-a456-426614174000';
const response = await fetch(`https://api.allcontext.dev/api/v1/artifacts/${artifactId}`, {
  headers: { 'X-API-Key': apiKey }
});
const artifact = await response.json();
```

### Create an artifact

Add a new artifact to your context.

**curl:**
```bash
curl -X POST https://api.allcontext.dev/api/v1/artifacts \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "# My Context\n\nThis is my artifact content...",
    "metadata": {"category": "personal"}
  }'
```

**Python:**
```python
artifact_data = {
    "content": "# My Context\n\nThis is my artifact content...",
    "metadata": {"category": "personal"}
}
response = requests.post(
    "https://api.allcontext.dev/api/v1/artifacts",
    headers={"X-API-Key": api_key},
    json=artifact_data
)
created_artifact = response.json()
```

**JavaScript:**
```javascript
const artifactData = {
  content: '# My Context\n\nThis is my artifact content...',
  metadata: { category: 'personal' }
};
const response = await fetch('https://api.allcontext.dev/api/v1/artifacts', {
  method: 'POST',
  headers: {
    'X-API-Key': apiKey,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(artifactData)
});
const createdArtifact = await response.json();
```

### Update an artifact

Modify an existing artifact (partial updates supported).

**curl:**
```bash
curl -X PUT "https://api.allcontext.dev/api/v1/artifacts/123e4567-e89b-12d3-a456-426614174000" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Title",
    "is_public": true
  }'
```

**Python:**
```python
artifact_id = "123e4567-e89b-12d3-a456-426614174000"
update_data = {
    "title": "Updated Title",
    "is_public": True
}
response = requests.put(
    f"https://api.allcontext.dev/api/v1/artifacts/{artifact_id}",
    headers={"X-API-Key": api_key},
    json=update_data
)
updated_artifact = response.json()
```

**JavaScript:**
```javascript
const artifactId = '123e4567-e89b-12d3-a456-426614174000';
const updateData = {
  title: 'Updated Title',
  is_public: true
};
const response = await fetch(`https://api.allcontext.dev/api/v1/artifacts/${artifactId}`, {
  method: 'PUT',
  headers: {
    'X-API-Key': apiKey,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(updateData)
});
const updatedArtifact = await response.json();
```

### Delete an artifact

Remove an artifact from your context.

**curl:**
```bash
curl -X DELETE "https://api.allcontext.dev/api/v1/artifacts/123e4567-e89b-12d3-a456-426614174000" \
  -H "X-API-Key: $API_KEY"
```

**Python:**
```python
artifact_id = "123e4567-e89b-12d3-a456-426614174000"
response = requests.delete(
    f"https://api.allcontext.dev/api/v1/artifacts/{artifact_id}",
    headers={"X-API-Key": api_key}
)
# Returns 204 No Content on success
```

**JavaScript:**
```javascript
const artifactId = '123e4567-e89b-12d3-a456-426614174000';
const response = await fetch(`https://api.allcontext.dev/api/v1/artifacts/${artifactId}`, {
  method: 'DELETE',
  headers: { 'X-API-Key': apiKey }
});
// Returns 204 No Content on success
```

## Managing API Keys

### Create an API key

**Note:** Requires JWT authentication (use the web app or authenticate first).

**curl:**
```bash
curl -X POST https://api.allcontext.dev/api/v1/api-keys \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Integration",
    "scopes": ["read", "write"]
  }'
```

**Python:**
```python
key_data = {
    "name": "My Integration",
    "scopes": ["read", "write"]
}
response = requests.post(
    "https://api.allcontext.dev/api/v1/api-keys",
    headers={"Authorization": f"Bearer {jwt_token}"},
    json=key_data
)
api_key = response.json()["api_key"]  # Save this! Only shown once
```

### List your API keys

**curl:**
```bash
curl https://api.allcontext.dev/api/v1/api-keys \
  -H "X-API-Key: $API_KEY"
```

**Python:**
```python
response = requests.get(
    "https://api.allcontext.dev/api/v1/api-keys",
    headers={"X-API-Key": api_key}
)
keys = response.json()
```

### Delete an API key

**curl:**
```bash
curl -X DELETE "https://api.allcontext.dev/api/v1/api-keys/456e7890-e89b-12d3-a456-426614174000" \
  -H "X-API-Key: $API_KEY"
```

**Python:**
```python
key_id = "456e7890-e89b-12d3-a456-426614174000"
response = requests.delete(
    f"https://api.allcontext.dev/api/v1/api-keys/{key_id}",
    headers={"X-API-Key": api_key}
)
```

## Error Handling

The API returns standard HTTP status codes:

- `200` - Success
- `201` - Created
- `204` - No Content (successful delete)
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `422` - Validation Error

Error responses include a `detail` field:

```json
{
  "detail": "Invalid API key"
}
```

**Python error handling:**
```python
try:
    response = requests.get(
        "https://api.allcontext.dev/api/v1/artifacts",
        headers={"X-API-Key": api_key}
    )
    response.raise_for_status()
    data = response.json()
except requests.exceptions.HTTPError as e:
    if e.response.status_code == 401:
        print("Invalid API key")
    else:
        print(f"Error: {e.response.json()['detail']}")
```

**JavaScript error handling:**
```javascript
try {
  const response = await fetch('https://api.allcontext.dev/api/v1/artifacts', {
    headers: { 'X-API-Key': apiKey }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail);
  }

  const data = await response.json();
} catch (error) {
  console.error('API Error:', error.message);
}
```

## Complete Examples

### Python Client

```python
import requests

class AllcontextClient:
    def __init__(self, api_key):
        self.api_key = api_key
        self.base_url = "https://api.allcontext.dev/api/v1"
        self.headers = {"X-API-Key": api_key}

    def create_artifact(self, content, metadata=None):
        data = {"content": content}
        if metadata:
            data["metadata"] = metadata

        response = requests.post(
            f"{self.base_url}/artifacts",
            headers=self.headers,
            json=data
        )
        response.raise_for_status()
        return response.json()

    def search_artifacts(self, query):
        response = requests.get(
            f"{self.base_url}/artifacts/search",
            headers=self.headers,
            params={"q": query}
        )
        response.raise_for_status()
        return response.json()

    def list_artifacts(self, limit=10):
        response = requests.get(
            f"{self.base_url}/artifacts",
            headers=self.headers,
            params={"limit": limit}
        )
        response.raise_for_status()
        return response.json()

# Usage
client = AllcontextClient("sk_prod_your_api_key")

# Create an artifact
artifact = client.create_artifact(
    "# Project Notes\n\nKey insights from today's meeting...",
    metadata={"project": "alpha"}
)
print(f"Created artifact: {artifact['id']}")

# Search for it
results = client.search_artifacts("meeting")
print(f"Found {len(results)} artifacts")
```

### JavaScript/TypeScript Client

```typescript
class AllcontextClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.allcontext.dev/api/v1';
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'X-API-Key': this.apiKey,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'API request failed');
    }

    if (response.status === 204) {
      return null;
    }

    return response.json();
  }

  async createArtifact(content: string, metadata?: Record<string, any>) {
    return this.request('/artifacts', {
      method: 'POST',
      body: JSON.stringify({ content, metadata }),
    });
  }

  async searchArtifacts(query: string) {
    return this.request(`/artifacts/search?q=${encodeURIComponent(query)}`);
  }

  async listArtifacts(limit = 10, offset = 0) {
    return this.request(`/artifacts?limit=${limit}&offset=${offset}`);
  }

  async getArtifact(id: string) {
    return this.request(`/artifacts/${id}`);
  }

  async updateArtifact(id: string, data: any) {
    return this.request(`/artifacts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteArtifact(id: string) {
    return this.request(`/artifacts/${id}`, {
      method: 'DELETE',
    });
  }
}

// Usage
const client = new AllcontextClient('sk_prod_your_api_key');

// Create and search
const artifact = await client.createArtifact(
  '# Meeting Notes\n\nImportant points...',
  { project: 'beta' }
);
console.log('Created:', artifact.id);

const results = await client.searchArtifacts('meeting');
console.log('Found:', results.length, 'artifacts');
```

## Next Steps

- View the complete [API Reference](./API_REFERENCE.md) for detailed endpoint specifications
- Set up [MCP Integration](./MCP_INTEGRATION.md) for AI assistant access
- Explore the interactive API documentation at `https://api.allcontext.dev/api/docs`