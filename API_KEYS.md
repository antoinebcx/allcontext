# API Keys Usage Guide

## Authentication Methods

All protected endpoints support two authentication methods:

### 1. Bearer Token (JWT)
```bash
curl -H "Authorization: Bearer <jwt_token>" \
     http://localhost:8000/api/v1/artifacts
```

### 2. API Key
```bash
curl -H "X-API-Key: sk_prod_xxxxxxxxxxxxx" \
     http://localhost:8000/api/v1/artifacts
```

## Creating API Keys

### Via UI
1. Navigate to Settings (user menu → Settings)
2. Click "Create API Key"
3. Configure name, scopes, and expiration
4. Copy the key immediately (shown only once)

### Via API
```bash
# Requires JWT authentication
curl -X POST http://localhost:8000/api/v1/api-keys \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production Key",
    "scopes": ["read", "write"],
    "expires_at": "2024-12-31T23:59:59Z"  # Optional
  }'
```

## Usage Examples

### Python
```python
import requests

API_KEY = "sk_prod_your_key_here"
BASE_URL = "http://localhost:8000"

# List artifacts
response = requests.get(
    f"{BASE_URL}/api/v1/artifacts",
    headers={"X-API-Key": API_KEY}
)

# Create artifact
response = requests.post(
    f"{BASE_URL}/api/v1/artifacts",
    headers={"X-API-Key": API_KEY},
    json={
        "title": "My Artifact",
        "content": "# Content here"
    }
)
```

### JavaScript/Node.js
```javascript
const API_KEY = 'sk_prod_your_key_here';
const BASE_URL = 'http://localhost:8000';

// Using fetch
const response = await fetch(`${BASE_URL}/api/v1/artifacts`, {
  headers: { 'X-API-Key': API_KEY }
});

// Using axios
import axios from 'axios';

const client = axios.create({
  baseURL: BASE_URL,
  headers: { 'X-API-Key': API_KEY }
});

const { data } = await client.get('/api/v1/artifacts');
```

### cURL
```bash
# List artifacts
curl -H "X-API-Key: sk_prod_your_key_here" \
     http://localhost:8000/api/v1/artifacts

# Create artifact
curl -X POST http://localhost:8000/api/v1/artifacts \
  -H "X-API-Key: sk_prod_your_key_here" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test", "content": "# Test content"}'
```

## API Key Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/api-keys` | Create new API key |
| GET | `/api/v1/api-keys` | List your API keys |
| DELETE | `/api/v1/api-keys/{id}` | Revoke API key |

## Security Best Practices

- **Never commit API keys** to version control
- **Use environment variables** in production
- **Set expiration dates** for temporary keys
- **Use minimal scopes** (read, write, delete)
- **Rotate keys regularly** (90 days recommended)
- **Monitor usage** via `last_used_at` timestamp
- **Revoke immediately** if compromised

## Key Features

- **Secure**: Keys hashed with bcrypt (never stored plain)
- **Scoped**: Granular permissions per key
- **Expiring**: Optional automatic expiration
- **Limited**: Max 10 active keys per user
- **Tracked**: Last usage timestamp

## Troubleshooting

**"Invalid API key"**
- Check key hasn't expired
- Verify key is active
- Ensure header format: `X-API-Key: <key>`

**"Maximum number of API keys reached"**
- Delete unused keys (10 key limit)

**"Authentication required"**
- Provide either Bearer token or API key