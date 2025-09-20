import React, { useState } from 'react';
import {
  Popover,
  Box,
  Tabs,
  Tab,
  Typography,
  IconButton,
  Divider,
} from '@mui/material';
import { X } from 'lucide-react';
import { API_URL } from '../../config/env';
import { MarkdownRenderer } from '../Markdown/MarkdownRenderer';
import type { Artifact, ArtifactSearchResult } from '../../types';

interface ConnectPopoverProps {
  artifact: Artifact | ArtifactSearchResult;
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
};

export const ConnectPopover: React.FC<ConnectPopoverProps> = ({
  artifact,
  anchorEl,
  open,
  onClose,
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [apiSubTab, setApiSubTab] = useState(0); // 0: cURL, 1: Python, 2: JavaScript

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleApiSubTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setApiSubTab(newValue);
  };

  const artifactId = artifact.id;
  const artifactTitle = artifact.title;

  // Code snippets formatted as markdown
  const aiChatExample = `\`\`\`markdown
# With Claude Code / Claude Desktop (MCP configured)
"Can you get my artifact titled '${artifactTitle}'?"
"Search for my '${artifactTitle}' artifact"
"Update my '${artifactTitle}' artifact with the following changes..."
\`\`\``;

  const claudeCodeExample = `\`\`\`bash
# Add Allcontext MCP to Claude Code (run once)
claude mcp add --transport http allcontext https://api.allcontext.dev/mcp/ \\
  --header "Authorization: Bearer YOUR_API_KEY"

# Then ask Claude to work with your artifacts
"Get my '${artifactTitle}' artifact from Allcontext"
\`\`\``;

  const codexExample = `\`\`\`toml
# Add to ~/.codex/config.toml
[mcp_servers.allcontext]
command = "npx"
args = [
    "-y",
    "supergateway",
    "--streamableHttp", "https://api.allcontext.dev/mcp/",
    "--header", "Authorization: Bearer YOUR_API_KEY"
]
\`\`\``;

  const curlExample = `\`\`\`bash
# Get by ID
curl "${API_URL}/api/v1/artifacts/${artifactId}" \\
  -H "X-API-Key: YOUR_API_KEY"

# Search by title
curl "${API_URL}/api/v1/artifacts/search?q=${encodeURIComponent(artifactTitle)}" \\
  -H "X-API-Key: YOUR_API_KEY"
\`\`\``;

  const pythonExample = `\`\`\`python
import requests

# Get by ID
response = requests.get(
    "${API_URL}/api/v1/artifacts/${artifactId}",
    headers={"X-API-Key": "YOUR_API_KEY"}
)
artifact = response.json()

# Search by title
response = requests.get(
    "${API_URL}/api/v1/artifacts/search",
    headers={"X-API-Key": "YOUR_API_KEY"},
    params={"q": "${artifactTitle}"}
)
results = response.json()
\`\`\``;

  const jsExample = `\`\`\`javascript
// Get by ID
const response = await fetch('${API_URL}/api/v1/artifacts/${artifactId}', {
  headers: { 'X-API-Key': 'YOUR_API_KEY' }
});
const artifact = await response.json();

// Search by title
const searchResponse = await fetch(
  '${API_URL}/api/v1/artifacts/search?q=${encodeURIComponent(artifactTitle)}',
  { headers: { 'X-API-Key': 'YOUR_API_KEY' } }
);
const results = await searchResponse.json();
\`\`\``;

  const anthropicSdkExample = `\`\`\`python
import anthropic

client = anthropic.Anthropic()
response = client.beta.messages.create(
    model="claude-sonnet-4-20250514",
    messages=[{
        "role": "user",
        "content": "Read my '${artifactTitle}' artifact from Allcontext"
    }],
    mcp_servers=[{
        "type": "url",
        "url": "https://api.allcontext.dev/mcp/",
        "name": "Allcontext",
        "authorization_token": "YOUR_API_KEY"
    }],
    betas=["mcp-client-2025-04-04"]
)
\`\`\``;

  const openaiSdkExample = `\`\`\`python
from openai import OpenAI

client = OpenAI()
resp = client.responses.create(
    model="gpt-5",
    tools=[{
        "type": "mcp",
        "server_label": "Allcontext",
        "server_url": "https://api.allcontext.dev/mcp/",
        "authorization": "YOUR_API_KEY"
    }],
    input="Read my '${artifactTitle}' artifact"
)
\`\`\``;


  return (
    <>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={onClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        slotProps={{
          paper: {
            sx: {
              width: { xs: '90vw', sm: 600 },
              maxWidth: 600,
              height: { xs: '80vh', sm: 600 },
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              border: '1px solid',
              borderColor: 'divider',
              backgroundImage: 'none',
              boxShadow: 'none',
            },
          },
        }}
      >
        <Box sx={{ p: 2, pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" fontWeight={600}>
            Connect to Artifact
          </Typography>
          <IconButton size="small" onClick={onClose}>
            <X size={20} />
          </IconButton>
        </Box>

        <Divider />

        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons={false}
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
        >
          <Tab label="Code Agents" />
          <Tab label="API" />
          <Tab label="AI SDKs" />
          <Tab label="Chat" />
        </Tabs>

        <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 2 }}>
          <TabPanel value={tabValue} index={0}>
            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }} fontWeight={600}>
              Claude Code
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Configure Claude Code to access your Allcontext:
            </Typography>
            <MarkdownRenderer content={claudeCodeExample} />

            <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }} fontWeight={600}>
              Codex CLI
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Configure Codex CLI using supergateway bridge:
            </Typography>
            <MarkdownRenderer content={codexExample} />

            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
              Note: Codex CLI requires supergateway (npm install -g supergateway) to bridge to HTTP-based MCP servers
            </Typography>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Tabs
              value={apiSubTab}
              onChange={handleApiSubTabChange}
              sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab label="cURL" />
              <Tab label="Python" />
              <Tab label="JavaScript" />
            </Tabs>

            {apiSubTab === 0 && <MarkdownRenderer content={curlExample} />}
            {apiSubTab === 1 && <MarkdownRenderer content={pythonExample} />}
            {apiSubTab === 2 && <MarkdownRenderer content={jsExample} />}

            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
              Get your API key from Settings → API Keys
            </Typography>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Typography variant="subtitle2" sx={{ mt: 2 }} gutterBottom>
              OpenAI SDK
            </Typography>
            <MarkdownRenderer content={openaiSdkExample} />

            <Typography variant="subtitle2" gutterBottom>
              Anthropic SDK
            </Typography>
            <MarkdownRenderer content={anthropicSdkExample} />

            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
              Both SDKs support MCP for accessing your Allcontext artifacts
            </Typography>
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2, mb: 2 }}>
              Reference this artifact in AI conversations:
            </Typography>
            <MarkdownRenderer content={aiChatExample} />
          </TabPanel>
        </Box>
      </Popover>
    </>
  );
};
