# Allcontext MCP Integration & Configuration

Quick guide to connect AI assistants to Allcontext via Model Context Protocol (MCP) for seamless artifact management.

## Table of Contents

- [Quick Start](#quick-start)
  - [Available MCP Tools](#available-mcp-tools)
  - [Claude Code](#claude-code)
  - [OpenAI SDK](#openai-sdk)
  - [Anthropic SDK](#anthropic-sdk)
  - [Claude Desktop](#claude-desktop)
  - [ChatGPT](#chatgpt)
  - [Claude.ai](#claudeai)

## Quick Start

Generate your Allcontext API key in Settings and connect via MCP using any of these methods.

### Available MCP Tools

Your AI assistant will have access to these artifact management tools:
- `create_artifact` - Create new artifacts
- `list_artifacts` - List your artifacts with pagination
- `search_artifacts` - Search artifacts by text
- `get_artifact` - Get specific artifact by ID
- `update_artifact` - Update existing artifacts entirely
- `str_replace_artifact` - Replace specific strings without reading entire content
- `str_insert_artifact` - Insert text at specific line number
- `delete_artifact` - Delete artifacts
- `list_artifact_versions` - View version history
- `get_artifact_version` - Get specific version
- `restore_artifact_version` - Restore to previous version

### Claude Code

Add the MCP to Claude Code with this simple terminal command:
```zsh
claude mcp add --transport http allcontext https://api.allcontext.dev/mcp/ \
  --header "Authorization: Bearer your_api_key"
```

You can then ask Claude to interact with your Allcontext (search, read, write...).

Learn more about MCP connectors with Claude Code: https://docs.anthropic.com/en/docs/claude-code/mcp

### Codex CLI

Since Codex CLI only supports stdio-based MCP servers, you'll need supergateway to bridge to Allcontext's HTTP-based MCP server.

**Step 1:** Install supergateway:
```bash
npm install -g supergateway
```

**Step 2:** Open your Codex configuration:
```bash
nano ~/.codex/config.toml
```

**Step 3:** Add this configuration block:
```toml
[mcp_servers.allcontext]
command = "npx"
args = [
    "-y",
    "supergateway",
    "--streamableHttp", "https://api.allcontext.dev/mcp/",
    "--header", "Authorization: Bearer your_api_key"
]
```

The Allcontext tools will now be available in your Codex sessions.

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
            "server_url": "https://api.allcontext.dev/mcp/",
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
      server_url: "https://api.allcontext.dev/mcp/",
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
        "url": "https://api.allcontext.dev/mcp/",
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
      url: "https://api.allcontext.dev/mcp/",
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
      "url": "https://api.allcontext.dev/mcp/",
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
