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
import type { Artifact, ArtifactCreate, ArtifactUpdate } from '../../api/client';
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
    title: '',
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
        title: artifact.title,
        content: artifact.content,
        metadata: artifact.metadata || {},
        is_public: artifact.is_public,
      });
    } else if (mode === 'create') {
      setFormData({
        title: '',
        content: '',
        metadata: {},
        is_public: false,
      });
    }
  }, [artifact, mode, open]);

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      return;
    }

    setLoading(true);
    try {
      if (mode === 'edit') {
        // For edit mode, only send changed fields
        const updates: ArtifactUpdate = {
          title: formData.title,
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
        title: '',
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
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '90vh',
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
          {/* Title Field */}
          <TextField
            label="Title"
            size="small"
            fullWidth
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Enter artifact title"
            required
          />

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
                rows={16}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Write in Markdown..."
                required
                sx={{
                  mt: 2,
                  '& .MuiInputBase-root': {
                    fontFamily: '"Fira Code", monospace',
                    fontSize: '0.875rem',
                  },
                }}
              />
            ) : (
              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  minHeight: 400,
                  maxHeight: 400,
                  overflowY: 'auto',
                  backgroundColor: 'background.default',
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider',
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
          disabled={loading || !formData.title.trim() || !formData.content.trim()}
        >
          {loading ? 'Saving...' : mode === 'create' ? 'Create' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
