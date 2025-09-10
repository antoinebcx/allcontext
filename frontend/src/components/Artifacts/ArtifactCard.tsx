import React from 'react';
import { Card, CardContent, Stack, Typography, Box } from '@mui/material';
import { Calendar } from 'lucide-react';
import type { Artifact } from '../../api/client';
import { MarkdownRenderer } from '../Markdown/MarkdownRenderer';

interface ArtifactCardProps {
  artifact: Artifact;
  onClick?: () => void;
}

export const ArtifactCard: React.FC<ArtifactCardProps> = ({ artifact, onClick }) => {
  const { title, content, created_at } = artifact;
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  // Get preview content (first 150 chars or until first double newline)
  const getPreview = (text: string) => {
    const firstBreak = text.indexOf('\n\n');
    const maxLength = 150;
    
    if (firstBreak > 0 && firstBreak < maxLength) {
      return text.substring(0, firstBreak);
    }
    
    if (text.length > maxLength) {
      return text.substring(0, maxLength) + '...';
    }
    
    return text;
  };

  return (
    <Card
      onClick={onClick}
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.2s ease',
        '&:hover': onClick ? {
          borderColor: 'primary.main',
          transform: 'translateY(-2px)',
        } : {},
      }}
    >
      <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
        {/* Header */}
        <Stack direction="row" spacing={0.5} alignItems="center" mb={1.5} justifyContent="flex-end">
          <Calendar size={14} />
          <Typography variant="caption" color="text.secondary">
            {formatDate(created_at)}
          </Typography>
        </Stack>

        {/* Title */}
        <Typography 
          variant="h6" 
          gutterBottom
          sx={{ 
            fontWeight: 600,
            fontSize: '1rem',
            lineHeight: 1.3,
            mb: 1.5,
          }}
        >
          {title}
        </Typography>

        {/* Content Preview */}
        <Box
          sx={{
            fontSize: '0.875rem',
            color: 'text.secondary',
            lineHeight: 1.6,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            '& *': {
              margin: '0 !important',
              fontSize: '0.875rem !important',
            },
          }}
        >
          <MarkdownRenderer content={getPreview(content)} preview />
        </Box>
      </CardContent>
    </Card>
  );
};
