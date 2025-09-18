import React from 'react';
import {
  Box,
  Stack,
  Typography,
  IconButton,
  Button,
  Tooltip,
  Chip,
} from '@mui/material';
import {
  X,
  Copy,
  Edit,
  Trash2,
  Download,
  Cable,
  History,
  Save,
} from 'lucide-react';
import type { Artifact } from '../../../types';
import { formatSmartDate, formatFullDate } from '../../../utils/dates';

interface ArtifactModalHeaderProps {
  artifact: Artifact | null;
  currentMode: 'view' | 'edit' | 'create';
  isEditing: boolean;
  isViewingHistory: boolean;
  viewingVersion: number | null;
  hasChanges: boolean;
  isSaving: boolean;
  editContent: string;
  onClose: () => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onCopy: (format: 'markdown' | 'plain') => void;
  onConnect: (event: React.MouseEvent<HTMLElement>) => void;
  onDownload: () => void;
  onToggleHistory: () => void;
  onDelete: () => void;
}

export const ArtifactModalHeader: React.FC<ArtifactModalHeaderProps> = ({
  artifact,
  currentMode,
  isEditing,
  isViewingHistory,
  viewingVersion,
  hasChanges,
  isSaving,
  editContent,
  onClose,
  onEdit,
  onSave,
  onCancel,
  onCopy,
  onConnect,
  onDownload,
  onToggleHistory,
  onDelete,
}) => {
  return (
    <Box
      sx={{
        px: 2,
        py: 1.5,
        borderBottom: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.paper',
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        {/* Title, dates and version on same line */}
        <Stack direction="row" alignItems="center" spacing={1.5}>
          {currentMode === 'create' ? (
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              New Artifact
            </Typography>
          ) : (
            <>
              {currentMode === 'edit' && (
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                  Editing:
                </Typography>
              )}
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {artifact?.title || 'Untitled'}
              </Typography>
              {isViewingHistory && (
                <Chip
                  label={`Version ${viewingVersion}`}
                  size="small"
                  color="warning"
                  variant="outlined"
                />
              )}
              {artifact && !isEditing && (
                <>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.813rem' }}>
                    •
                  </Typography>
                  <Tooltip
                    title={
                      <>
                        Created: {formatFullDate(artifact.created_at)}
                        {artifact.updated_at !== artifact.created_at && (
                          <>
                            <br />
                            Updated: {formatFullDate(artifact.updated_at)}
                          </>
                        )}
                      </>
                    }
                  >
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        fontSize: '0.813rem',
                        cursor: 'help'
                      }}
                    >
                      {artifact.updated_at !== artifact.created_at ? (
                        <>Updated {formatSmartDate(artifact.updated_at)}</>
                      ) : (
                        <>Created {formatSmartDate(artifact.created_at)}</>
                      )}
                    </Typography>
                  </Tooltip>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.813rem' }}>
                    •
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.813rem' }}>
                    v{artifact.version}
                  </Typography>
                </>
              )}
              {artifact && isEditing && hasChanges && (
                <>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.813rem' }}>
                    •
                  </Typography>
                  <Typography variant="body2" color="warning.main" sx={{ fontSize: '0.813rem' }}>
                    Unsaved changes
                  </Typography>
                </>
              )}
            </>
          )}
        </Stack>

        {/* Action Buttons and Close */}
        <Stack direction="row" spacing={0.5} alignItems="center">
          {isEditing ? (
            <>
              <Button
                size="small"
                variant="text"
                onClick={onSave}
                disabled={isSaving || !editContent.trim()}
                startIcon={<Save size={14} />}
                sx={{
                  height: 28,
                  px: 1.5,
                  fontSize: '0.813rem',
                  textTransform: 'none',
                  color: 'primary.main',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  }
                }}
              >
                {isSaving ? 'Saving...' : currentMode === 'create' ? 'Create' : 'Save'}
              </Button>
              <Button
                size="small"
                variant="text"
                onClick={onCancel}
                disabled={isSaving}
                sx={{
                  height: 28,
                  px: 1.5,
                  fontSize: '0.813rem',
                  textTransform: 'none',
                  color: 'text.secondary',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  }
                }}
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Tooltip title="Edit">
                <IconButton
                  size="small"
                  onClick={onEdit}
                  disabled={isViewingHistory}
                >
                  <Edit size={16} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Copy as Markdown">
                <IconButton size="small" onClick={() => onCopy('markdown')}>
                  <Copy size={16} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Connect">
                <IconButton size="small" onClick={onConnect}>
                  <Cable size={16} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Download">
                <IconButton size="small" onClick={onDownload}>
                  <Download size={16} />
                </IconButton>
              </Tooltip>
              {artifact && artifact.version > 1 && (
                <Tooltip title="Version History">
                  <IconButton
                    size="small"
                    onClick={onToggleHistory}
                  >
                    <History size={16} />
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title="Delete">
                <IconButton
                  size="small"
                  onClick={onDelete}
                  sx={{ color: 'error.main' }}
                  disabled={isViewingHistory}
                >
                  <Trash2 size={16} />
                </IconButton>
              </Tooltip>
            </>
          )}
          <Box sx={{ width: '1px', height: 20, bgcolor: 'divider', mx: 0.5 }} />
          <IconButton onClick={onClose} size="small">
            <X size={20} />
          </IconButton>
        </Stack>
      </Stack>
    </Box>
  );
};
