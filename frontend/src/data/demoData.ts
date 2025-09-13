import type { Artifact } from '../types';

export const demoArtifacts: Artifact[] = [
  {
    id: 'demo-1',
    user_id: 'demo-user',
    title: 'Welcome to Contexthub',
    content: `# Welcome to Contexthub

Contexthub is your personal AI context management platform. Store, organize, and access your prompts, documentation, and markdown content from anywhere.

## Key Features

- **Markdown-first**: Write in markdown with live preview
- **Auto-title generation**: Titles extracted from your content automatically
- **Full-text search**: Find anything instantly
- **API & MCP access**: Use your artifacts with any AI tool
- **Cloud storage**: Your context, always accessible

## Getting Started

1. **Sign up** to create your account
2. **Create artifacts** for your prompts, docs, and notes
3. **Access anywhere** via web, API, or MCP protocol
4. **Search and organize** your growing knowledge base

Ready to start? Click "Sign Up" in the top navigation!`,
    metadata: {
      category: 'demo',
      type: 'documentation'
    },
    is_public: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1
  },
  {
    id: 'demo-2',
    user_id: 'demo-user',
    title: 'Example AI Prompt',
    content: `# Code Review Assistant

You are an expert code reviewer with deep knowledge of software engineering best practices.

## Your Role

Review the provided code for:
- **Security vulnerabilities**: SQL injection, XSS, authentication issues
- **Performance optimizations**: Algorithm efficiency, database queries
- **Code quality**: Readability, maintainability, DRY principles
- **Best practices**: Design patterns, error handling, testing

## Output Format

Provide your review in this structure:
1. **Summary**: Brief overview of the code quality
2. **Critical Issues**: Must-fix problems
3. **Recommendations**: Suggested improvements
4. **Positive Aspects**: What was done well

Be constructive and educational in your feedback.`,
    metadata: {
      category: 'demo',
      type: 'prompt',
      model: 'gpt-4'
    },
    is_public: true,
    created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    version: 1
  },
  {
    id: 'demo-3',
    user_id: 'demo-user',
    title: 'API Documentation Template',
    content: `# API Documentation

## Overview

This template helps you document your REST API endpoints consistently.

## Endpoint: [Method] /api/path

### Description
Brief description of what this endpoint does.

### Authentication
- Required: Yes/No
- Type: Bearer token / API key

### Request

\`\`\`json
{
  "field1": "value",
  "field2": 123
}
\`\`\`

### Response

**Success (200)**
\`\`\`json
{
  "id": "123",
  "status": "success"
}
\`\`\`

**Error (400)**
\`\`\`json
{
  "error": "Invalid input"
}
\`\`\`

### Example

\`\`\`bash
curl -X POST https://api.example.com/endpoint \\
  -H "Authorization: Bearer token" \\
  -d '{"field1": "value"}'
\`\`\``,
    metadata: {
      category: 'demo',
      type: 'template',
      tags: ['api', 'documentation']
    },
    is_public: true,
    created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    updated_at: new Date(Date.now() - 172800000).toISOString(),
    version: 1
  }
];

export const demoSearchMessage = "Sign up to search your own artifacts and create unlimited content!";
export const demoCreateMessage = "Create a free account to start building your personal knowledge base.";