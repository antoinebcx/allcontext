# Contexthub MCP Client Integration & Configuration

## Quick Start

Create an API key in Contexthub, then connect via MCP using one of these methods.

### Claude Code

Add the MCP to Claude Code with this simple terminal command:
```zsh
claude mcp add --transport http contexthub https://api.contexthub.com/mcp \
  --header "Authorization: Bearer your_api_key"
```

You can then ask to Claude to interact with your Contexthub (search, read, write...).

### OpenAI SDK

Use the Contexthub MCP with the OpenAI SDK:

Python:
```python
from openai import OpenAI

client = OpenAI()

resp = client.responses.create(
    model="gpt-5",
    tools=[
        {
            "type": "mcp",
            "server_label": "Contexthub",
            "server_description": "Personal AI context management platform",
            "server_url": "https://api.contexthub.com/mcp",
            "authorization": "YOUR_API_KEY",
            "require_approval": "never",
        },
    ],
    input="List my artifacts",
)

print(resp)
```

TypeScript:
```typescript
import OpenAI from "openai";
const client = new OpenAI();

const resp = await client.responses.create({
  model: "gpt-5",
  tools: [
    {
      type: "mcp",
      server_label: "Contexthub",
      server_description: "Personal AI context management platform",
      server_url: "https://api.contexthub.com/mcp",
      authorization: "YOUR_API_KEY",
      require_approval: "never",
    },
  ],
  input: "List my artifacts",
});

console.log(resp);
```

### Anthropic SDK

Use the Contexthub MCP with the Anthropic SDK:

Python:
```python
import anthropic

client = anthropic.Anthropic()

response = client.beta.messages.create(
    model="claude-sonnet-4-20250514",
    messages=[{
        "role": "user",
        "content": "Summarize this conversation and create a context artifact"
    }],
    mcp_servers=[{
        "type": "url",
        "url": "https://api.contexthub.com/mcp",
        "name": "Contexthub",
        "authorization_token": "YOUR_API_KEY"
    }],
    betas=["mcp-client-2025-04-04"]
)
```

TypeScript:
```typescript
import { Anthropic } from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

const response = await anthropic.beta.messages.create({
  model: "claude-sonnet-4-20250514",
  messages: [
    {
      role: "user",
      content: "Summarize this conversation and create a context artifact",
    },
  ],
  mcp_servers: [
    {
      type: "url",
      url: "https://api.contexthub.com/mcp",
      name: "Contexthub",
      authorization_token: "YOUR_API_KEY",
    },
  ],
  betas: ["mcp-client-2025-04-04"],
});
```

### Claude Desktop

Add to your Claude Desktop config:
```json
{
  "mcpServers": {
    "contexthub": {
      "url": "https://api.contexthub.com/mcp",
      "transport": "http",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY"
      }
    }
  }
}
```

### ChatGPT

Incoming

### Claude.ai

Incoming
