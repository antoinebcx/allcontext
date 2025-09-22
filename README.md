# Allcontext

Context platform that works across all your AI tools. Access from anywhere via MCP, API, or web.

## Overview

**The Problem**: Your documents, prompts and notes are scattered across local files and apps. There's no single source of truth where all your AI agents and yourself can collaborate.

**The Solution**: A persistent context platform that both you and your AI tools can access from anywhere.

Features:
- **Universal Access** - MCP, REST API and Web UI
- **Markdown Artifacts** - Store documents as Markdown
- **Full-Text Search** - Find anything across all your context
- **Version History** - Track changes, restore previous versions
- **API Keys** - Secure programmatic access with scoped permissions
- **Mobile Friendly** - Update context from any device

MCP tools:
- `create_artifact` - Create new artifact
- `search_artifacts` - Search your artifacts
- `get_artifact` - Get artifact content
- `str_replace_artifact` - Replace text efficiently
- `restore_artifact_version` - Restore previous version
- Plus 6 more tools for complete control; see more in the docs.

*Claude Code integration via MCP*
<img width="988" height="595" alt="Screenshot 2025-09-20 at 15 37 02" src="https://github.com/user-attachments/assets/255f7a31-e07a-46a5-add1-3db6550a177c" />

*Web UI - Manage your artifacts*
<img width="1302" height="705" alt="Screenshot 2025-09-21 at 13 50 43" src="https://github.com/user-attachments/assets/6aa64991-8a83-447e-8c01-88fd9714ef64" />

Try it now: visit https://allcontext.dev and check the **[MCP Specification](./docs/MCP_SPECIFICATION.md)** to connect your AI tools.

## Repository Structure

- `/backend`: Python FastAPI server (REST API + MCP)
- `/frontend`: React TypeScript web application
- `/docs`: API and MCP documentation

## Documentation

- **[API Reference](./docs/API_REFERENCE.md)** - REST API endpoints
- **[API Integration](./docs/API_INTEGRATION.md)** - Quick integration guide with examples
- **[MCP Specification](./docs/MCP_SPECIFICATION.md)** - MCP server spec
- **[MCP Integration](./docs/MCP_INTEGRATION.md)** - How to connect and use the MCP

## Community

- [Contributing Guidelines](./CONTRIBUTING.md)
- [Code of Conduct](./CODE_OF_CONDUCT.md)
- [Security Policy](./SECURITY.md)
- [License](./LICENSE)
