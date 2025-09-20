import React from 'react';
import {
  Box,
  List,
  ListItemButton,
  ListItemText,
  Typography,
  Divider,
  Button,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { GitHub as GitHubIcon } from '@mui/icons-material';
import { docsRegistry, type DocItem } from '../../data/docsRegistry';

interface DocsSidebarProps {
  selectedDoc: string;
  onDocSelect: (docId: string) => void;
}

export const DocsSidebar: React.FC<DocsSidebarProps> = ({
  selectedDoc,
  onDocSelect,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box
      sx={{
        width: isMobile ? '100%' : 280,
        flexShrink: 0,
        borderRight: isMobile ? 0 : 1,
        borderColor: 'divider',
        height: '100%',
        overflowY: 'auto',
      }}
    >
      <Box sx={{ p: 2, pl: { xs: 2, md: 3 } }}>
        <Typography variant="h6" fontWeight={600}>
          Documentation
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Learn how to use Allcontext
        </Typography>
      </Box>

      <Divider />

      <List sx={{ px: 1, pl: { xs: 1, md: 2 }, py: 2 }}>
        {docsRegistry.map((doc: DocItem) => (
          <ListItemButton
            key={doc.id}
            selected={selectedDoc === doc.id}
            onClick={() => onDocSelect(doc.id)}
            sx={{
              borderRadius: 1,
              mb: 0.5,
              pl: 2,
              '&.Mui-selected': {
                bgcolor: 'action.selected',
                '&:hover': {
                  bgcolor: 'action.selected',
                },
              },
            }}
          >
            <ListItemText
              primary={doc.title}
              secondary={doc.description}
              primaryTypographyProps={{
                fontWeight: selectedDoc === doc.id ? 600 : 500,
                fontSize: '0.95rem',
              }}
              secondaryTypographyProps={{
                fontSize: '0.75rem',
                sx: {
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                },
              }}
            />
          </ListItemButton>
        ))}
      </List>

      <Divider />

      {/* GitHub Link */}
      <Box sx={{ p: 2, pl: { xs: 2, md: 3 } }}>
        <Button
          fullWidth
          variant="text"
          startIcon={<GitHubIcon />}
          href="https://github.com/antoinebcx/allcontext"
          target="_blank"
          rel="noopener noreferrer"
          component="a"
          sx={{
            justifyContent: 'flex-start',
            textTransform: 'none',
            color: 'text.secondary',
            fontWeight: 400,
            '&:hover': {
              color: 'primary.main',
              bgcolor: 'action.hover',
            },
          }}
        >
          View on GitHub
        </Button>
      </Box>
    </Box>
  );
};
