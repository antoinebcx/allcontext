import React, { memo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Box, Link, IconButton, Tooltip, useTheme } from '@mui/material';
import { Copy, Check } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  preview?: boolean;
}

const MarkdownRendererComponent: React.FC<MarkdownRendererProps> = ({ content, preview = false }) => {
  const theme = useTheme();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

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
          backgroundColor: theme.palette.mode === 'light'
            ? theme.palette.grey[100]
            : theme.palette.grey[900],
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '0.875em',
          fontFamily: '"Fira Code", "Courier New", monospace',
        },
        '& pre': {
          overflow: 'auto',
          borderRadius: '8px',
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
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const codeString = String(children).replace(/\n$/, '');

            return !inline && match ? (
              <Box sx={{ position: 'relative', my: 2 }}>
                <Tooltip title={copiedCode === codeString ? "Copied!" : "Copy code"}>
                  <IconButton
                    size="small"
                    onClick={() => handleCopyCode(codeString)}
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      zIndex: 1,
                      color: 'grey.500',
                      bgcolor: 'transparent',
                      border: 'none',
                      '&:hover': {
                        bgcolor: 'transparent',
                        color: 'grey.300',
                      },
                    }}
                  >
                    {copiedCode === codeString ? (
                      <Check size={16} />
                    ) : (
                      <Copy size={16} />
                    )}
                  </IconButton>
                </Tooltip>
                <SyntaxHighlighter
                  language={match[1]}
                  style={oneDark as any}
                  customStyle={{
                    margin: 0,
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                  }}
                >
                  {codeString}
                </SyntaxHighlighter>
              </Box>
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

// Memoize the component to prevent unnecessary re-renders
export const MarkdownRenderer = memo(MarkdownRendererComponent);
