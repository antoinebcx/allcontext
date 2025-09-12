import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Stack,
  IconButton,
  Typography,
  Divider,
  Tab,
  Tabs,
} from '@mui/material';
import { X, Eye, Edit } from 'lucide-react';
import type { Artifact, ArtifactCreate, ArtifactUpdate } from '../../types';
import { MarkdownRenderer } from '../Markdown/MarkdownRenderer';

interface ArtifactFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ArtifactCreate | ArtifactUpdate) => Promise<void>;
  artifact?: Artifact | null;
  mode: 'create' | 'edit';
}

export const ArtifactForm: React.FC<ArtifactFormProps> = ({
  open,
  onClose,
  onSubmit,
  artifact,
  mode,
}) => {
  const [formData, setFormData] = useState<ArtifactCreate>({
    content: '',
    metadata: {},
    is_public: false,
  });
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  // Initialize form when artifact changes or modal opens
  useEffect(() => {
    if (mode === 'edit' && artifact) {
      setFormData({
        content: artifact.content,
        metadata: artifact.metadata || {},
        is_public: artifact.is_public,
      });
    } else if (mode === 'create') {
      setFormData({
        content: '',
        metadata: {},
        is_public: false,
      });
    }
  }, [artifact, mode, open]);

  const handleSubmit = async () => {
    if (!formData.content.trim()) {
      return;
    }

    setLoading(true);
    try {
      if (mode === 'edit') {
        // For edit mode, only send changed fields
        const updates: ArtifactUpdate = {
          content: formData.content,
          metadata: formData.metadata,
          is_public: formData.is_public,
        };
        await onSubmit(updates);
      } else {
        await onSubmit(formData);
      }
      onClose();
      setFormData({
        content: '',
        metadata: {},
        is_public: false,
      });
      setTabValue(0);
    } catch (error) {
      console.error('Failed to save artifact:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
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
            {mode === 'create' ? 'New Artifact' : 'Edit Artifact'}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <X size={20} />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ p: 2 }}>
        <Stack spacing={2}>
          {/* Editor/Preview Tabs */}
          <Box>
            <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb: 1 }}>
              <Tab
                label="Edit"
                icon={<Edit size={16} />}
                iconPosition="start"
                sx={{ textTransform: 'none', minHeight: 40 }}
              />
              <Tab
                label="Preview"
                icon={<Eye size={16} />}
                iconPosition="start"
                sx={{ textTransform: 'none', minHeight: 40 }}
              />
            </Tabs>

            <Divider />

            {/* Content Editor or Preview */}
            {tabValue === 0 ? (
              <TextField
                multiline
                fullWidth
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Write in Markdown... (use # for title)"
                required
                sx={{
                  mt: 2,
                  '& .MuiInputBase-root': {
                    fontFamily: '"Fira Code", monospace',
                    fontSize: '0.875rem',
                    height: 'calc(85vh - 250px)',
                    alignItems: 'flex-start',
                  },
                  '& .MuiInputBase-input': {
                    height: '100% !important',
                    overflowY: 'auto !important',
                  },
                }}
              />
            ) : (
              <Box
                sx={{
                  p: 3,
                  height: 'calc(85vh - 250px)',
                  overflowY: 'auto',
                }}
              >
                {formData.content ? (
                  <MarkdownRenderer content={formData.content} />
                ) : (
                  <Typography color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    Nothing to preview
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 0 }}>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !formData.content.trim()}
        >
          {loading ? 'Saving...' : mode === 'create' ? 'Create' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
