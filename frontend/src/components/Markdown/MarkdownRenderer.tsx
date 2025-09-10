import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Box, Link, Typography } from '@mui/material';

interface MarkdownRendererProps {
  content: string;
  preview?: boolean;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, preview = false }) => {
  return (
    <Box
      sx={{
        '& h1': { fontSize: '1.75rem', fontWeight: 600, mt: 2, mb: 1 },
        '& h2': { fontSize: '1.5rem', fontWeight: 600, mt: 2, mb: 1 },
        '& h3': { fontSize: '1.25rem', fontWeight: 600, mt: 1.5, mb: 0.5 },
        '& p': { mb: 1, lineHeight: 1.7 },
        '& ul, & ol': { pl: 3, mb: 1 },
        '& li': { mb: 0.5 },
        '& code': {
          backgroundColor: '#f5f5f5',
          padding: '2px 6px',
          borderRadius: 4,
          fontSize: '0.875em',
          fontFamily: '"Fira Code", "Courier New", monospace',
        },
        '& pre': {
          overflow: 'auto',
          borderRadius: 8,
          my: 2,
        },
        '& blockquote': {
          borderLeft: '4px solid #e0e0e0',
          pl: 2,
          ml: 0,
          color: '#666',
          fontStyle: 'italic',
        },
        '& hr': {
          border: 'none',
          borderTop: '1px solid #e0e0e0',
          my: 2,
        },
        ...(preview && {
          '& h1, & h2, & h3': { fontSize: '1rem', fontWeight: 600, mt: 1, mb: 0.5 },
          '& p': { mb: 0.5, fontSize: '0.875rem' },
        }),
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <SyntaxHighlighter
                language={match[1]}
                style={oneDark}
                customStyle={{
                  margin: 0,
                  borderRadius: 8,
                  fontSize: '0.875rem',
                }}
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          a({ href, children }) {
            return (
              <Link href={href} target="_blank" rel="noopener noreferrer">
                {children}
              </Link>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </Box>
  );
};
