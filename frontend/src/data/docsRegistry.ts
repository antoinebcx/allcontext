// @ts-ignore
import ApiReference from '../docs/API_REFERENCE.md?raw';
// @ts-ignore
import McpSpecification from '../docs/MCP_SPECIFICATION.md?raw';
// @ts-ignore
import McpIntegration from '../docs/MCP_INTEGRATION.md?raw';

export interface DocItem {
  id: string;
  title: string;
  description: string;
  content: string;
}

export const docsRegistry: DocItem[] = [
  {
    id: 'mcp-integration',
    title: 'MCP Integration',
    description: 'How to connect and use the MCP server with various AI clients',
    content: McpIntegration,
  },
  {
    id: 'mcp-specification',
    title: 'MCP Specification',
    description: 'Model Context Protocol server specification and implementation details',
    content: McpSpecification,
  },
  {
    id: 'api-reference',
    title: 'API Reference',
    description: 'Complete REST API documentation with endpoints, authentication, and examples',
    content: ApiReference,
  }
];

export const getDocById = (id: string): DocItem | undefined => {
  return docsRegistry.find(doc => doc.id === id);
};

export const getDefaultDoc = (): DocItem => {
  return docsRegistry[0];
};
