import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  IconButton,
  Typography,
  Box,
  Tooltip,
  Snackbar,
  Alert,
} from '@mui/material';
import { 
  X, 
  Copy, 
  Edit, 
  Trash2, 
  Calendar,
  Download
} from 'lucide-react';
import type { Artifact } from '../../types';
import { MarkdownRenderer } from '../Markdown/MarkdownRenderer';

interface ArtifactDetailProps {
  open: boolean;
  onClose: () => void;
  artifact: Artifact | null;
  onEdit: () => void;
  onDelete: () => void;
}

export const ArtifactDetail: React.FC<ArtifactDetailProps> = ({
  open,
  onClose,
  artifact,
  onEdit,
  onDelete,
}) => {
  const [showCopySuccess, setShowCopySuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!artifact) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleCopy = async (format: 'markdown' | 'plain') => {
    const textToCopy = format === 'markdown' 
      ? artifact.content 
      : artifact.content.replace(/[#*`_~\[\]()]/g, ''); // Strip markdown

    try {
      await navigator.clipboard.writeText(textToCopy);
      setShowCopySuccess(true);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([artifact.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${artifact.title.toLowerCase().replace(/\s+/g, '-')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDelete = () => {
    onDelete();
    setShowDeleteConfirm(false);
    onClose();
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: 2,
              height: '85vh',
            },
          },
        }}
      >
        <DialogTitle sx={{ p: 2, pb: 1 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {artifact.title}
            </Typography>
            <IconButton onClick={onClose} size="small">
              <X size={20} />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          {/* Metadata Bar */}
          <Box
            sx={{
              px: 2,
              py: 1.5,
              borderBottom: '1px solid',
              borderColor: 'divider',
              backgroundColor: 'background.default',
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Stack direction="row" spacing={0.5} alignItems="center" color="text.secondary">
                <Calendar size={14} />
                <Typography variant="caption">
                  Created {formatDate(artifact.created_at)}
                </Typography>
              </Stack>
              {artifact.updated_at !== artifact.created_at && (
                <Typography variant="caption" color="text.secondary">
                  • Updated {formatDate(artifact.updated_at)}
                </Typography>
              )}
              <Box sx={{ flexGrow: 1 }} />
              <Stack direction="row" spacing={0.5}>
                <Tooltip title="Copy as Markdown">
                  <IconButton size="small" onClick={() => handleCopy('markdown')}>
                    <Copy size={16} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Download">
                  <IconButton size="small" onClick={handleDownload}>
                    <Download size={16} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Edit">
                  <IconButton size="small" onClick={onEdit}>
                    <Edit size={16} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton 
                    size="small" 
                    onClick={() => setShowDeleteConfirm(true)}
                    sx={{ color: 'error.main' }}
                  >
                    <Trash2 size={16} />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>
          </Box>

          {/* Content */}
          <Box
            sx={{
              p: 3,
              height: 'calc(85vh - 200px)',
              overflowY: 'auto',
            }}
          >
            <MarkdownRenderer content={artifact.content} />
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={onClose} variant="outlined">
            Close
          </Button>
          <Button
            onClick={onEdit}
            variant="contained"
            startIcon={<Edit size={16} />}
          >
            Edit
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Artifact?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{artifact.title}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteConfirm(false)} variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            variant="contained"
            color="error"
            startIcon={<Trash2 size={16} />}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Copy Success Snackbar */}
      <Snackbar
        open={showCopySuccess}
        autoHideDuration={2000}
        onClose={() => setShowCopySuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShowCopySuccess(false)} 
          severity="success" 
          sx={{ width: '100%' }}
        >
          Copied to clipboard!
        </Alert>
      </Snackbar>
    </>
  );
};
