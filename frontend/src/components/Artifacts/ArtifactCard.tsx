import React, { useState } from 'react';
import { Card, CardContent, Typography, Box, IconButton } from '@mui/material';
import { Cable } from 'lucide-react';
import type { Artifact, ArtifactSearchResult } from '../../types';
import { MarkdownRenderer } from '../Markdown/MarkdownRenderer';
import { ConnectPopover } from './ConnectPopover';

interface ArtifactCardProps {
  artifact: Artifact | ArtifactSearchResult;
  onClick?: () => void;
}

export const ArtifactCard: React.FC<ArtifactCardProps> = ({ artifact, onClick }) => {
  const { title, created_at } = artifact;
  const content = 'content' in artifact ? artifact.content : artifact.snippet;
  const [connectAnchorEl, setConnectAnchorEl] = useState<HTMLElement | null>(null);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  const handleConnectClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation(); // Prevent card click
    setConnectAnchorEl(event.currentTarget);
  };

  const handleConnectClose = () => {
    setConnectAnchorEl(null);
  };

  // Get preview content (first 150 chars or until first double newline)
  const getPreview = (text: string) => {
    // Strip markdown headers and represent line breaks
    const cleaned = text
      .replace(/^#{1,6}\s+/gm, '')  // Remove markdown headers (# ## ### etc.)
      .replace(/\n\n+/g, ' ___ ')    // Replace double line breaks with triple underscore
      .replace(/\n/g, ' ')           // Replace single line breaks with space
      .replace(/\s+/g, ' ')          // Replace multiple spaces with single
      .trim();                       // Trim start/end

    const maxLength = 120;

    if (cleaned.length > maxLength) {
      return cleaned.substring(0, maxLength) + '...';
    }

    return cleaned;
  };

  return (
    <>
      <Card
      onClick={onClick}
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        width: '100%',
        height: 195,
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
            mt: 0.5,
            '& *': {
              margin: '0 !important',
              fontSize: '0.875rem !important',
            },
          }}
        >
          <MarkdownRenderer content={getPreview(content)} preview />
        </Box>

        {/* Date at bottom with Connect button */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              fontSize: '0.75rem',
            }}
          >
            {formatDate(created_at)}
          </Typography>
          <IconButton
            size="small"
            onClick={handleConnectClick}
            sx={{
              p: 0.75,
              color: 'text.secondary',
              '&:hover': {
                color: 'primary.main',
                bgcolor: 'action.hover',
              },
            }}
            title="Connect"
          >
            <Cable size={16} />
          </IconButton>
        </Box>
      </CardContent>
      </Card>

      {/* Connect Popover */}
      <ConnectPopover
        artifact={artifact}
        anchorEl={connectAnchorEl}
        open={Boolean(connectAnchorEl)}
        onClose={handleConnectClose}
      />
    </>
  );
};
