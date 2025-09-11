import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
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
        width: '100%',
        height: 220,
        display: 'flex',
        flexDirection: 'column',
        transition: 'border-color 0.2s ease',
        '&:hover': onClick ? {
          borderColor: 'primary.main',
        } : {},
      }}
    >
      <CardContent sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Title */}
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 600,
            fontSize: '1rem',
            lineHeight: 1.3,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            minHeight: '2.6rem', // Ensures consistent height even for 1-line titles
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
            flexGrow: 1,
            '& *': {
              margin: '0 !important',
              fontSize: '0.875rem !important',
            },
          }}
        >
          <MarkdownRenderer content={getPreview(content)} preview />
        </Box>

        {/* Date at bottom */}
        <Typography 
          variant="caption" 
          color="text.secondary"
          sx={{ 
            mt: 0.5,
            fontSize: '0.75rem',
          }}
        >
          {formatDate(created_at)}
        </Typography>
      </CardContent>
    </Card>
  );
};
