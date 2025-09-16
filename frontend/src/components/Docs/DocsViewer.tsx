import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, IconButton, Tooltip } from '@mui/material';
import { Copy, Check } from 'lucide-react';
import { ProgressiveMarkdownRenderer } from '../Markdown/ProgressiveMarkdownRenderer';
import { MarkdownRenderer } from '../Markdown/MarkdownRenderer';
import type { DocItem } from '../../data/docsRegistry';

interface DocsViewerProps {
  doc: DocItem;
}

export const DocsViewer: React.FC<DocsViewerProps> = ({ doc }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  // Scroll to top when doc changes
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [doc.id]);

  const handleCopyDocument = async () => {
    await navigator.clipboard.writeText(doc.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Use progressive renderer for large documents (>10k chars)
  const isLargeDoc = doc.content.length > 10000;

  return (
    <Box
      ref={contentRef}
      sx={{
        flexGrow: 1,
        overflowY: 'auto',
        height: '100%',
        bgcolor: 'transparent',
      }}
    >
      <Box
        sx={{
          maxWidth: 900,
          mx: 'auto',
          p: { xs: 2, sm: 3, md: 4 },
          minHeight: '100%',
        }}
      >
        {/* Document Header */}
        <Box sx={{ mb: 4, position: 'relative' }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" component="h1" gutterBottom fontWeight={600}>
                {doc.title}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {doc.description}
              </Typography>
            </Box>
            <Tooltip title={copied ? "Copied!" : "Copy document"}>
              <IconButton
                onClick={handleCopyDocument}
                sx={{
                  ml: 2,
                  color: 'text.secondary',
                  '&:hover': {
                    color: 'text.primary',
                  },
                }}
              >
                {copied ? <Check size={20} /> : <Copy size={20} />}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Document Content */}
        <Box
          sx={{
            '& > *:first-of-type': {
              mt: 0,
            },
            '& h1': {
              fontSize: '2rem',
              fontWeight: 600,
              mt: 4,
              mb: 2,
            },
            '& h2': {
              fontSize: '1.5rem',
              fontWeight: 600,
              mt: 3,
              mb: 2,
            },
            '& h3': {
              fontSize: '1.25rem',
              fontWeight: 600,
              mt: 2.5,
              mb: 1.5,
            },
            '& h4': {
              fontSize: '1.1rem',
              fontWeight: 600,
              mt: 2,
              mb: 1,
            },
            '& p': {
              mb: 2,
              lineHeight: 1.7,
            },
            '& ul, & ol': {
              mb: 2,
            },
            '& li': {
              mb: 0.5,
              lineHeight: 1.7,
            },
            '& table': {
              mb: 3,
            },
            '& blockquote': {
              borderLeft: '4px solid',
              borderColor: 'primary.main',
              pl: 2,
              ml: 0,
              my: 2,
              fontStyle: 'italic',
            },
            '& hr': {
              my: 4,
              borderColor: 'divider',
            },
            '& code': {
              backgroundColor: 'action.hover',
              padding: '2px 6px',
              borderRadius: 1,
              fontFamily: 'monospace',
              fontSize: '0.9em',
            },
            '& pre': {
              mb: 3,
              '& code': {
                backgroundColor: 'transparent',
                padding: 0,
              },
            },
          }}
        >
          {isLargeDoc ? (
            <ProgressiveMarkdownRenderer
              key={doc.id}
              content={doc.content}
              autoLoadAll={true}
            />
          ) : (
            <MarkdownRenderer key={doc.id} content={doc.content} />
          )}
        </Box>
      </Box>
    </Box>
  );
};
