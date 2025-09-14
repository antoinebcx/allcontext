# Allcontext MCP Integration & Configuration

## Table of Contents

- [Quick Start](#quick-start)
  - [Claude Code](#claude-code)
  - [OpenAI SDK](#openai-sdk)
  - [Anthropic SDK](#anthropic-sdk)
  - [Claude Desktop](#claude-desktop)
  - [ChatGPT](#chatgpt)
  - [Claude.ai](#claudeai)

## Quick Start

Generate your Allcontext API key in Settings and connect via MCP using any of these methods:

### Claude Code

Add the MCP to Claude Code with this simple terminal command:
```zsh
claude mcp add --transport http allcontext https://api.allcontext.dev/mcp \
  --header "Authorization: Bearer your_api_key"
```

You can then ask Claude to interact with your Allcontext (search, read, write...).

Learn more about MCP connectors with Claude Code: https://docs.anthropic.com/en/docs/claude-code/mcp

### OpenAI SDK

Use the Allcontext MCP with the OpenAI SDK:

**Python:**
```python
from openai import OpenAI

client = OpenAI()

resp = client.responses.create(
    model="gpt-5",
    tools=[
        {
            "type": "mcp",
            "server_label": "Allcontext",
            "server_description": "Personal context management platform",
            "server_url": "https://api.allcontext.dev/mcp",
            "authorization": "YOUR_API_KEY",
            "require_approval": "never",
        },
    ],
    input="List my artifacts",
)

print(resp)
```

**TypeScript:**
```typescript
import OpenAI from "openai";
const client = new OpenAI();

const resp = await client.responses.create({
  model: "gpt-5",
  tools: [
    {
      type: "mcp",
      server_label: "Allcontext",
      server_description: "Personal context management platform",
      server_url: "https://api.allcontext.dev/mcp",
      authorization: "YOUR_API_KEY",
      require_approval: "never",
    },
  ],
  input: "List my artifacts",
});

console.log(resp);
```

Learn more about MCP connectors with the OpenAI SDK: https://platform.openai.com/docs/guides/tools-connectors-mcp?lang=python

### Anthropic SDK

Use the Allcontext MCP with the Anthropic SDK:

**Python:**
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
        "url": "https://api.allcontext.dev/mcp",
        "name": "Allcontext",
        "authorization_token": "YOUR_API_KEY"
    }],
    betas=["mcp-client-2025-04-04"]
)
```

**TypeScript:**
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
      url: "https://api.allcontext.dev/mcp",
      name: "Allcontext",
      authorization_token: "YOUR_API_KEY",
    },
  ],
  betas: ["mcp-client-2025-04-04"],
});
```

Learn more about MCP connectors with the Anthropic SDK: https://docs.anthropic.com/en/docs/agents-and-tools/mcp-connector

### Claude Desktop

Add to your Claude Desktop config:
```json
{
  "mcpServers": {
    "allcontext": {
      "url": "https://api.allcontext.dev/mcp",
      "transport": "http",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY"
      }
    }
  }
}
```

### ChatGPT

Coming soon

### Claude.ai

Coming soon
