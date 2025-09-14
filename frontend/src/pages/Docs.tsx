import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  useTheme,
  useMediaQuery,
  Select,
  MenuItem,
  FormControl,
  Paper,
} from '@mui/material';
import { ChevronDown } from 'lucide-react';
import { DocsSidebar } from '../components/Docs/DocsSidebar';
import { DocsViewer } from '../components/Docs/DocsViewer';
import { getDocById, getDefaultDoc, docsRegistry } from '../data/docsRegistry';

export const Docs: React.FC = () => {
  const { docId } = useParams<{ docId?: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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
    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
      {/* Mobile Doc Selector */}
      {isMobile && (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: 'background.default',
          }}
        >
          <FormControl fullWidth size="small">
            <Select
              value={currentDoc.id}
              onChange={(e) => handleDocSelect(e.target.value)}
              IconComponent={ChevronDown}
              sx={{
                bgcolor: 'background.paper',
                '& .MuiSelect-select': {
                  display: 'flex',
                  alignItems: 'center',
                  py: 1.5,
                },
                '& .MuiSelect-icon': {
                  top: '50%',
                  transform: 'translateY(-50%)',
                  right: 12,
                },
              }}
            >
              {docsRegistry.map((doc) => (
                <MenuItem key={doc.id} value={doc.id}>
                  <Box>
                    <Box sx={{ fontWeight: 500 }}>{doc.title}</Box>
                    <Box sx={{ fontSize: '0.75rem', color: 'text.secondary', mt: 0.25 }}>
                      {doc.description}
                    </Box>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Paper>
      )}

      <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
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

        {/* Main content */}
        <DocsViewer doc={currentDoc} />
      </Box>
    </Box>
  );
};
