import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Container, Box, Typography, Breadcrumbs, Link } from '@mui/material';
import { ArrowLeft } from 'lucide-react';
import { MarkdownRenderer } from '../components/Markdown/MarkdownRenderer';
import { getLegalDocumentById } from '../legal/legalRegistry';

export const LegalPage: React.FC = () => {
  const { documentId } = useParams<{ documentId: string }>();

  if (!documentId) {
    return <Navigate to="/" replace />;
  }

  const document = getLegalDocumentById(documentId);

  if (!document) {
    return <Navigate to="/" replace />;
  }

  const handleBack = () => {
    window.history.back();
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link
            component="button"
            onClick={handleBack}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              textDecoration: 'none',
              color: 'text.secondary',
              '&:hover': {
                color: 'primary.main',
                textDecoration: 'underline',
              },
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              font: 'inherit',
            }}
          >
            <ArrowLeft size={16} />
            Back
          </Link>
          <Typography color="text.primary">{document.title}</Typography>
        </Breadcrumbs>

        {/* Document Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
            {document.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {document.description} • Last updated: {document.lastUpdated}
          </Typography>
        </Box>

        {/* Document Content */}
        <Box sx={{
          '& .markdown-content': {
            maxWidth: 'none',
          },
          '& h1': {
            display: 'none', // Hide the markdown H1 since we show it in the header
          },
          '& h2': {
            mt: 4,
            mb: 2,
            fontSize: '1.5rem',
            fontWeight: 600,
          },
          '& h3': {
            mt: 3,
            mb: 1.5,
            fontSize: '1.25rem',
            fontWeight: 600,
          },
          '& p': {
            mb: 2,
            lineHeight: 1.7,
          },
          '& ul, & ol': {
            mb: 2,
            pl: 3,
          },
          '& li': {
            mb: 0.5,
            lineHeight: 1.6,
          },
          '& strong': {
            fontWeight: 600,
          },
          '& a': {
            color: 'primary.main',
            textDecoration: 'none',
            '&:hover': {
              textDecoration: 'underline',
            },
          },
        }}>
          <MarkdownRenderer content={document.content} />
        </Box>

        {/* Footer Note */}
        <Box sx={{
          mt: 6,
          pt: 3,
          borderTop: '1px solid',
          borderColor: 'divider',
          textAlign: 'center'
        }}>
          <Typography variant="body2" color="text.secondary">
            This document is GDPR-compliant and was last updated on {document.lastUpdated}.
            <br />
            If you have questions about this document, please contact our support team.
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};
