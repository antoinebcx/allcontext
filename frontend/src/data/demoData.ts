import type { Artifact } from '../types';

export const demoArtifacts: Artifact[] = [
  {
    id: 'demo-1',
    user_id: 'demo-user',
    title: 'Welcome to Allcontext',
    content: `# Welcome to Allcontext

Context platform that works across all your AI tools. Access from anywhere via MCP, API, or web.

## The Problems We Solve

• **Context fragmentation** — Your prompts and docs scattered across Claude Code, Codex, Cursor, ChatGPT, repos  
• **Context drift** — Different AI tools have different versions of your instructions  
• **No persistence** — AI can't save outputs back to your context for next time  
• **Tool lock-in** — Your context trapped in proprietary platforms and formats  
• **No shared workspace** — Can't collaborate with AI on the same living documents

## How Allcontext Works

Allcontext is a cloud-native platform that stores your AI context as markdown artifacts, accessible through three synchronized interfaces:

### MCP (Model Context Protocol)
Direct integration with AI tools via the 2025 MCP standard. Your AI assistants get read/write access to your context through native tool calling. Setup takes one line in your terminal: 'claude mcp add allcontext https://api.allcontext.dev/mcp/'. This gives your AI assistants access to nine native tools for creating, reading, updating, deleting, searching, and version control of your artifacts. The integration works seamlessly with Claude Code, Codex CLI, Cursor, OpenAI SDK, and Anthropic SDK.

### REST API  
Full-featured API for custom integrations and automation. Authentication works through both JWT tokens and API keys with granular scopes. Every operation returns in under 100ms with built-in versioning and diff tracking. We provide complete Python, TypeScript, and curl examples that are ready to copy and run in your projects.

### Web Interface
Clean, fast React app for direct context management. The real-time markdown editor makes it simple to create and edit your artifacts. Full-text search works across all your content instantly. You can generate and manage API keys with specific read, write, or delete permissions. The interface is designed for zero-friction creation and organization of your context.

All three interfaces share the same backend and data model. Changes propagate instantly across every access point.

## Use Cases

**"My coding standards everywhere"**  
Store your team's coding guidelines once. Claude Code reads them when reviewing PRs. Cursor follows them when generating code. ChatGPT references them when debugging.

**"AI that remembers our discussions"**  
After a brainstorming session: "Claude, save these insights to my context." Next week: "What did we decide about the API design?" It's all there.

**"Living documentation"**  
Your project README isn't static. AI assistants read it for context, update it with changes, and keep it current as your project evolves.

**"Context that travels with you"**  
Switch from Claude to ChatGPT to Cursor throughout your day. Your context, preferences, and project knowledge follow you everywhere.

## Why Allcontext?

**Why now?** The shift to human-AI collaboration is happening. A year ago, this would have been a notes app with an API. Today, with MCP becoming the standard and AI agents needing persistent memory, a unified context platform is essential infrastructure.

**Why unified?** Every AI tool wants to build its own memory system. That path leads to fragmentation. We believe in one source of truth that all tools can access.

**Why open?** Your context is too important to trust to a single vendor. Allcontext is open source. Run our cloud version, self-host, or fork it. You own your data.

**Why MCP-native?** We didn't bolt MCP onto an existing product. We built specifically for a world where AI agents are first-class citizens that need to read and write context.

**Why simple?** No complex schemas. No proprietary formats. Just markdown, accessible everywhere. Get your API key and connect in 30 seconds.

---

*The future of work is human-AI collaboration. Start building your shared context today.*`,
    metadata: {
      category: 'demo',
      type: 'documentation'
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1
  },
  {
    id: 'demo-2',
    user_id: 'demo-user',
    title: 'MCP Integration Guide',
    content: `# Connecting Allcontext to Claude Code

Make your Allcontext artifacts instantly available in Claude Code with a single command.

## Quick Setup

### 1. Get Your API Key
1. Sign up for Allcontext
2. Go to Settings → API Keys
3. Create a new key with your desired scopes
4. Copy the key (starts with \`sk_prod_\`)

### 2. Add to Claude Code

Simply run this command in your terminal:

\`\`\`bash
claude mcp add --transport http allcontext https://api.allcontext.dev/mcp/ \\
  --header "Authorization: Bearer sk_prod_your_api_key_here"
\`\`\`

That's it! Your artifacts are now available to Claude.

## Available MCP Tools

Claude can now:
- **Search** your artifacts for specific content
- **List** all your artifacts
- **Read** full artifact content
- **Create** new artifacts (requires \`write\` scope)
- **Update** existing artifacts (requires \`write\` scope)
- **Delete** artifacts (requires \`delete\` scope)

## Example Usage

Just ask Claude naturally:
- "Search my artifacts for the GPT-5 guide"
- "Fetch my AGENTS.md instructions from Allcontext"
- "Summarize our discussion and create an artifact"
- "Update my project documentation with the latest requirements"

## Other Integration Options

### OpenAI SDK
\`\`\`python
client = OpenAI()
resp = client.responses.create(
    model="gpt-5",
    tools=[{
        "type": "mcp",
        "server_url": "https://api.allcontext.dev/mcp/",
        "authorization": "YOUR_API_KEY",
    }],
    input="List my artifacts"
)
\`\`\`

### Anthropic SDK
\`\`\`python
client = anthropic.Anthropic()
response = client.beta.messages.create(
    model="claude-sonnet-4",
    mcp_servers=[{
        "url": "https://api.allcontext.dev/mcp/",
        "authorization_token": "YOUR_API_KEY"
    }]
)
\`\`\`

## Pro Tips

✓ Use read-only keys for safer access
✓ All artifacts are private to your account`,
    metadata: {
      category: 'demo',
      type: 'guide',
      tags: ['mcp', 'integration', 'claude']
    },
    created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    updated_at: new Date(Date.now() - 172800000).toISOString(),
    version: 1
  },
  {
    id: 'demo-3',
    user_id: 'demo-user',
    title: 'AGENTS.md',
    content: `# AGENTS.md

## Project Context

Building next-gen AI agent systems. Focus: reliability at scale, sub-100ms latency, graceful degradation.

Stack: Python 3.12, FastAPI, Anthropic/OpenAI SDKs, PostgreSQL, Redis, Kubernetes.

## Core Principles

- First principles thinking. Question assumptions. Build from fundamentals.
- Simplicity > complexity. If it's not simple, we haven't understood it yet.
- No praise for bad ideas. Be Socratic—challenge me to think better.

## Commands

\`\`\`bash
# Development
make dev          # Start local environment
make test         # Run test suite (must pass before commit)
make eval         # Run evaluation benchmarks

# Deployment
make build        # Build containers
make deploy-staging  # Deploy to staging
make deploy-prod  # Production (requires approval)
\`\`\`

## Code Standards

- Type everything. No \`Any\` without justification
- Docstrings for public functions
- Tests before implementation (TDD)
- Keep functions under 20 lines
- Async by default for I/O operations

## AI Engineering Patterns

- Streaming responses for user-facing LLM calls
- Structured outputs with Pydantic models
- Retry with exponential backoff (max 3 attempts)
- Always have fallback for LLM failures
- Log prompts and responses for debugging (dev only)
- Temperature 0 for deterministic tasks, 0.7 for creative

## Architecture Decisions

- Stateless agents (context in DB, not memory)
- Event-driven with clear boundaries
- Separate prompt management from business logic
- Version all prompts like code
- Monitor: latency p50/p95/p99, token usage, error rates

## Communication Style

- Direct feedback. Skip pleasantries.
- Show me metrics, not opinions
- Code > lengthy explanations
- If unsure, ask. Don't guess.

## Current Focus

Making our agent pipeline 10x faster without sacrificing quality.
Key metric: 95% success rate at <100ms latency.`,
    metadata: {
      category: 'demo',
      type: 'instructions',
      usage: 'ai-agents'
    },
    created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    version: 1
  }
];

export const demoSearchMessage = "Sign up to search your own artifacts and create unlimited content!";
export const demoCreateMessage = "Create a free account to start building your personal knowledge base.";
