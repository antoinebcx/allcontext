import type { Artifact } from '../types';

export const demoArtifacts: Artifact[] = [
  {
    id: 'demo-1',
    user_id: 'demo-user',
    title: 'Welcome to Allcontext',
    content: `# Welcome to Allcontext

Your context in the cloud — accessible anywhere, anytime, through any interface.

## The Problem We Solve

If you use AI tools daily, you know the frustration:
- Your prompts are scattered across ChatGPT, Claude, and local files
- You copy-paste the same context repeatedly
- Your team can't share proven prompts and instructions
- There's no single source of truth for your AI workflows

## How Allcontext Works

**One platform, three access methods:**

### 📱 Web App
Write, organize, and search your artifacts with our clean, minimal interface. Perfect for managing your growing library of prompts, instructions, and documentation.

### 🔌 MCP Protocol
Connect directly to Claude Code, OpenAI, or any MCP-compatible AI tool. Your artifacts become native tools that AI assistants can access in real-time.

### 🚀 REST API
Integrate with your workflows using our simple API. Build custom integrations, automate artifact management, or embed your context anywhere.

## Real Use Cases

- **Engineering teams**: Share coding standards, review guidelines, and debugging prompts
- **Content creators**: Store brand voice guides, content templates, and style instructions
- **Researchers**: Maintain analysis frameworks, methodology docs, and data processing prompts
- **Consultants**: Keep client contexts, project templates, and deliverable frameworks

## Why Allcontext?

✓ **Always in sync** — Changes propagate instantly across all interfaces
✓ **Version controlled** — Never lose important context iterations
✓ **Search everything** — Full-text search across all your artifacts
✓ **API keys** — Secure, scoped access for different tools and team members
✓ **Markdown native** — Write once, render beautifully everywhere

Ready to centralize your AI context? Sign up and get your first API key in seconds.`,
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
    title: 'My CLAUDE.md Instructions',
    content: `# Claude Instructions

## Context About My Work

I'm a full-stack developer working on modern web applications. I value clean, maintainable code and prefer composition over inheritance. I work primarily with:
- **Frontend**: React, TypeScript, Tailwind/MUI
- **Backend**: Node.js/Python, REST APIs, PostgreSQL
- **Tools**: Git, Docker, AWS/Vercel

## How I Want You to Help

### Code Reviews
- Focus on security, performance, and maintainability
- Suggest idiomatic solutions for the language/framework
- Point out potential edge cases I might have missed

### Problem Solving
- Start with clarifying questions if requirements are ambiguous
- Provide multiple approaches with trade-offs
- Include code examples that follow my stack's conventions

### Documentation
- Keep it concise and practical
- Include examples for complex concepts
- Follow the style of my existing docs

## Communication Style

- Be direct and concise
- Skip pleasantries and get to the point
- Use bullet points for multiple items
- Include code snippets where relevant

## Project-Specific Context

When working on my **Allcontext** project:
- It's a context management platform for AI workflows
- Uses FastAPI (backend) and React (frontend)
- Follows REST conventions with JWT/API key auth
- Database is Supabase (PostgreSQL with RLS)

Remember: I prefer working solutions over theoretical discussions. When in doubt, show me the code.`,
    metadata: {
      category: 'demo',
      type: 'instructions',
      usage: 'claude-code'
    },
    created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    version: 1
  },
  {
    id: 'demo-3',
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
claude mcp add --transport http allcontext https://api.allcontext.dev/mcp \\
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
        "server_url": "https://api.allcontext.dev/mcp",
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
        "url": "https://api.allcontext.dev/mcp",
        "authorization_token": "YOUR_API_KEY"
    }]
)
\`\`\`

## Pro Tips

✓ Create separate API keys for different tools
✓ Use read-only keys for safer access
✓ Organize with metadata tags for better search
✓ All artifacts are private to your account

Your context, always at your AI's fingertips.`,
    metadata: {
      category: 'demo',
      type: 'guide',
      tags: ['mcp', 'integration', 'claude']
    },
    created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    updated_at: new Date(Date.now() - 172800000).toISOString(),
    version: 1
  }
];

export const demoSearchMessage = "Sign up to search your own artifacts and create unlimited content!";
export const demoCreateMessage = "Create a free account to start building your personal knowledge base.";
