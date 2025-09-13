import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  useTheme,
  useMediaQuery,
  IconButton,
  Drawer,
} from '@mui/material';
import { Menu, X } from 'lucide-react';
import { DocsSidebar } from '../components/Docs/DocsSidebar';
import { DocsViewer } from '../components/Docs/DocsViewer';
import { getDocById, getDefaultDoc } from '../data/docsRegistry';

export const Docs: React.FC = () => {
  const { docId } = useParams<{ docId?: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [mobileOpen, setMobileOpen] = useState(false);

  // Get the current document
  const currentDoc = docId ? getDocById(docId) : getDefaultDoc();

  // Redirect to default doc if invalid docId
  useEffect(() => {
    if (docId && !currentDoc) {
      navigate('/docs', { replace: true });
    }
  }, [docId, currentDoc, navigate]);

  // Handle document selection
  const handleDocSelect = (selectedDocId: string) => {
    navigate(`/docs/${selectedDocId}`);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  // Toggle mobile drawer
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  if (!currentDoc) {
    return null;
  }

  const sidebar = (
    <DocsSidebar
      selectedDoc={currentDoc.id}
      onDocSelect={handleDocSelect}
    />
  );

  return (
    <Box sx={{ display: 'flex', width: '100%', height: '100%' }}>
      {/* Mobile menu button */}
      {isMobile && (
        <IconButton
          onClick={handleDrawerToggle}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            zIndex: theme.zIndex.drawer + 2,
            '&:hover': {
              bgcolor: 'primary.dark',
            },
          }}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </IconButton>
      )}

      {/* Desktop sidebar */}
      {!isMobile && (
        <Box
          sx={{
            width: 280,
            flexShrink: 0,
            borderRight: 1,
            borderColor: 'divider',
            bgcolor: 'transparent',
            height: '100%',
            position: 'sticky',
            top: 0,
            overflowY: 'auto',
          }}
        >
          {sidebar}
        </Box>
      )}

      {/* Mobile drawer */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile
          }}
          sx={{
            '& .MuiDrawer-paper': {
              width: '80%',
              maxWidth: 320,
            },
          }}
        >
          {sidebar}
        </Drawer>
      )}

      {/* Main content */}
      <DocsViewer doc={currentDoc} />
    </Box>
  );
};
