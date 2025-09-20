import React, { useState } from 'react';
import {
  Box,
  Stack,
  Typography,
  IconButton,
  Button,
  Tooltip,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  X,
  Copy,
  Check,
  Edit,
  Trash2,
  Download,
  Cable,
  History,
  Save,
  MoreVertical,
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
  copiedFormat: 'markdown' | 'plain' | null;
  onClose: () => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onCopy: (format: 'markdown' | 'plain') => void;
  onConnect: (event: React.MouseEvent<HTMLElement>) => void;
  onDownload: () => void;
  onToggleHistory: () => void;
  onDelete: () => void;
  isAuthenticated?: boolean;
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
  copiedFormat,
  onClose,
  onEdit,
  onSave,
  onCancel,
  onCopy,
  onConnect,
  onDownload,
  onToggleHistory,
  onDelete,
  isAuthenticated = true,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMenuAction = (action: () => void) => {
    action();
    handleMenuClose();
  };

  // Render different layouts for mobile vs desktop
  if (isMobile) {
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
        {/* Mobile Layout */}
        <Stack spacing={0.75}>
          {/* Row 1: Title and Close button */}
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={1} sx={{ flexGrow: 1, minWidth: 0 }}>
              {currentMode === 'create' ? (
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  New Artifact
                </Typography>
              ) : (
                <>
                  {currentMode === 'edit' && (
                    <Typography variant="body2" color="text.secondary">
                      Editing:
                    </Typography>
                  )}
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flexGrow: 1,
                    }}
                  >
                    {artifact?.title || 'Untitled'}
                  </Typography>
                  {isViewingHistory && (
                    <Chip
                      label={`v${viewingVersion}`}
                      size="small"
                      color="warning"
                      variant="outlined"
                    />
                  )}
                </>
              )}
            </Stack>
            <IconButton onClick={onClose} size="small">
              <X size={20} />
            </IconButton>
          </Stack>

          {/* Row 2: Metadata and Actions */}
          {currentMode !== 'create' && (
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              {/* Left: Metadata */}
              {artifact && !isEditing && (
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Typography variant="caption" color="text.secondary">
                    {artifact.updated_at !== artifact.created_at
                      ? `Updated ${formatSmartDate(artifact.updated_at)}`
                      : `Created ${formatSmartDate(artifact.created_at)}`}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">•</Typography>
                  <Typography variant="caption" color="text.secondary">
                    v{artifact.version}
                  </Typography>
                </Stack>
              )}
              {artifact && isEditing && hasChanges && (
                <Typography variant="caption" color="warning.main">
                  Unsaved changes
                </Typography>
              )}

              {/* Right: Actions */}
              <Stack direction="row" spacing={0.5} alignItems="center">
                {isEditing ? (
                  <>
                    <Button
                      size="small"
                      variant="text"
                      onClick={onSave}
                      disabled={isSaving || !editContent.trim() || !isAuthenticated}
                      sx={{ fontSize: '0.75rem', px: 1, height: 26 }}
                    >
                      {isSaving ? 'Saving...' : 'Save'}
                    </Button>
                    <Button
                      size="small"
                      variant="text"
                      onClick={onCancel}
                      disabled={isSaving}
                      sx={{ fontSize: '0.75rem', px: 1, height: 26, color: 'text.secondary' }}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <Tooltip title={!isAuthenticated ? "Sign in to edit" : "Edit"}>
                      <span>
                        <IconButton
                          size="small"
                          onClick={onEdit}
                          disabled={isViewingHistory || !isAuthenticated}
                        >
                          <Edit size={16} />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <IconButton size="small" onClick={handleMenuOpen}>
                      <MoreVertical size={16} />
                    </IconButton>
                    <Menu
                      anchorEl={anchorEl}
                      open={menuOpen}
                      onClose={handleMenuClose}
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                    >
                      <MenuItem onClick={() => handleMenuAction(() => onCopy('markdown'))}>
                        <ListItemIcon>
                          {copiedFormat === 'markdown' ? <Check size={16} /> : <Copy size={16} />}
                        </ListItemIcon>
                        <ListItemText>{copiedFormat === 'markdown' ? 'Copied!' : 'Copy as Markdown'}</ListItemText>
                      </MenuItem>
                      <MenuItem onClick={(e) => { onConnect(e); handleMenuClose(); }}>
                        <ListItemIcon><Cable size={16} /></ListItemIcon>
                        <ListItemText>Connect</ListItemText>
                      </MenuItem>
                      <MenuItem onClick={() => handleMenuAction(onDownload)}>
                        <ListItemIcon><Download size={16} /></ListItemIcon>
                        <ListItemText>Download</ListItemText>
                      </MenuItem>
                      {artifact && artifact.version > 1 && (
                        <MenuItem onClick={() => handleMenuAction(onToggleHistory)}>
                          <ListItemIcon><History size={16} /></ListItemIcon>
                          <ListItemText>Version History</ListItemText>
                        </MenuItem>
                      )}
                      <MenuItem
                        onClick={() => handleMenuAction(onDelete)}
                        disabled={isViewingHistory || !isAuthenticated}
                        sx={{ color: isAuthenticated && !isViewingHistory ? 'error.main' : 'inherit' }}
                      >
                        <ListItemIcon sx={{ color: isAuthenticated && !isViewingHistory ? 'error.main' : 'inherit' }}>
                          <Trash2 size={16} />
                        </ListItemIcon>
                        <ListItemText>Delete</ListItemText>
                      </MenuItem>
                    </Menu>
                  </>
                )}
              </Stack>
            </Stack>
          )}
        </Stack>
      </Box>
    );
  }

  // Desktop Layout (original layout)
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
        {/* Title and metadata */}
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
                      sx={{ fontSize: '0.813rem', cursor: 'help' }}
                    >
                      {artifact.updated_at !== artifact.created_at
                        ? `Updated ${formatSmartDate(artifact.updated_at)}`
                        : `Created ${formatSmartDate(artifact.created_at)}`}
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

        {/* Actions */}
        <Stack direction="row" spacing={0.5} alignItems="center">
          {isEditing ? (
            <>
              <Button
                size="small"
                variant="text"
                onClick={onSave}
                disabled={isSaving || !editContent.trim() || !isAuthenticated}
                startIcon={<Save size={14} />}
                sx={{
                  height: 28,
                  px: 1.5,
                  fontSize: '0.813rem',
                  textTransform: 'none',
                  color: 'primary.main',
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
                }}
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Tooltip title={!isAuthenticated ? "Sign in to edit" : "Edit"}>
                <span>
                  <IconButton
                    size="small"
                    onClick={onEdit}
                    disabled={isViewingHistory || !isAuthenticated}
                  >
                    <Edit size={16} />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title={copiedFormat === 'markdown' ? "Copied!" : "Copy as Markdown"}>
                <IconButton size="small" onClick={() => onCopy('markdown')}>
                  {copiedFormat === 'markdown' ? <Check size={16} /> : <Copy size={16} />}
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
                  <IconButton size="small" onClick={onToggleHistory}>
                    <History size={16} />
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title={!isAuthenticated ? "Sign in to delete" : "Delete"}>
                <span>
                  <IconButton
                    size="small"
                    onClick={onDelete}
                    sx={{ color: isAuthenticated && !isViewingHistory ? 'error.main' : 'inherit' }}
                    disabled={isViewingHistory || !isAuthenticated}
                  >
                    <Trash2 size={16} />
                  </IconButton>
                </span>
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
