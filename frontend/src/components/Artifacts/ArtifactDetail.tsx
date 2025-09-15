import React, { useState, useEffect } from 'react';
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
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  X,
  Copy,
  Edit,
  Trash2,
  Download,
  Cable,
  History,
} from 'lucide-react';
import type { Artifact } from '../../types';
import { MarkdownRenderer } from '../Markdown/MarkdownRenderer';
import { ProgressiveMarkdownRenderer } from '../Markdown/ProgressiveMarkdownRenderer';
import { ConnectPopover } from './ConnectPopover';
import { VersionHistory } from './VersionHistory';
import { useArtifactVersion } from '../../hooks/useArtifactVersions';

interface ArtifactDetailProps {
  open: boolean;
  onClose: () => void;
  artifact: Artifact | null;
  onEdit: () => void;
  onDelete: () => void;
  onUpdate?: (updatedArtifact: Artifact) => void;
}

export const ArtifactDetail: React.FC<ArtifactDetailProps> = ({
  open,
  onClose,
  artifact,
  onEdit,
  onDelete,
  onUpdate,
}) => {
  const [showCopySuccess, setShowCopySuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [connectAnchorEl, setConnectAnchorEl] = useState<HTMLElement | null>(null);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [viewingVersion, setViewingVersion] = useState<number | null>(null);

  // Version queries
  const { data: versionData, isLoading: isLoadingVersion } = useArtifactVersion(
    artifact?.id || '',
    viewingVersion
  );

  // Reset viewing version when artifact changes or dialog closes
  useEffect(() => {
    if (!open || !artifact) {
      setViewingVersion(null);
      setShowVersionHistory(false);
    }
  }, [open, artifact?.id]);

  if (!artifact) return null;

  // Determine what content to show (current or historical version)
  const displayContent = viewingVersion && versionData ? versionData : artifact;
  const isViewingHistory = viewingVersion !== null;

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
      ? displayContent.content
      : displayContent.content.replace(/[#*`_~\[\]()]/g, ''); // Strip markdown

    try {
      await navigator.clipboard.writeText(textToCopy);
      setShowCopySuccess(true);
    } catch (error) {
      // Clipboard API might not be available
      setShowCopySuccess(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([displayContent.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${displayContent.title.toLowerCase().replace(/\s+/g, '-')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleViewVersion = (versionNumber: number) => {
    // If clicking on current version, clear the viewing version to show current
    if (versionNumber === artifact.version) {
      setViewingVersion(null);
    } else {
      setViewingVersion(versionNumber);
    }
  };

  const handleRestore = (restoredArtifact: Artifact) => {
    // Update the parent component if callback provided
    if (onUpdate) {
      onUpdate(restoredArtifact);
    }
    // Clear viewing version to show the newly restored current version
    setViewingVersion(null);
  };

  const handleDelete = () => {
    onDelete();
    setShowDeleteConfirm(false);
    onClose();
  };

  const handleConnectClick = (event: React.MouseEvent<HTMLElement>) => {
    setConnectAnchorEl(event.currentTarget);
  };

  const handleConnectClose = () => {
    setConnectAnchorEl(null);
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: 1.5,
              height: '90vh',
            },
          },
        }}
      >
        <DialogTitle sx={{ p: 2, pb: 1 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {displayContent.title}
              </Typography>
              {isViewingHistory && (
                <Chip
                  label={`Version ${viewingVersion}`}
                  size="small"
                  color="warning"
                  variant="outlined"
                />
              )}
            </Stack>
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
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Typography variant="caption" color="text.secondary">
                Created {formatDate(artifact.created_at)}
              </Typography>
              {artifact.updated_at !== artifact.created_at && (
                <>
                  <Typography variant="caption" color="text.secondary">|</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Updated {formatDate(artifact.updated_at)}
                  </Typography>
                </>
              )}
              <>
                <Typography variant="caption" color="text.secondary">|</Typography>
                <Typography variant="caption" color="text.secondary">
                  Version {artifact.version}
                </Typography>
              </>
              <Box sx={{ flexGrow: 1 }} />
              <Stack direction="row" spacing={0.5}>
                <Tooltip title="Copy as Markdown">
                  <IconButton size="small" onClick={() => handleCopy('markdown')}>
                    <Copy size={16} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Connect">
                  <IconButton size="small" onClick={handleConnectClick}>
                    <Cable size={16} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Download">
                  <IconButton size="small" onClick={handleDownload}>
                    <Download size={16} />
                  </IconButton>
                </Tooltip>
                {artifact.version > 1 && (
                  <Tooltip title="Version History">
                    <IconButton
                      size="small"
                      onClick={() => setShowVersionHistory(!showVersionHistory)}
                    >
                      <History size={16} />
                    </IconButton>
                  </Tooltip>
                )}
                <Tooltip title="Edit">
                  <IconButton
                    size="small"
                    onClick={onEdit}
                    disabled={isViewingHistory}
                  >
                    <Edit size={16} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton
                    size="small"
                    onClick={() => setShowDeleteConfirm(true)}
                    sx={{ color: 'error.main' }}
                    disabled={isViewingHistory}
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
              position: 'relative',
              height: 'calc(90vh - 120px)',
              display: 'flex',
            }}
          >
            <Box
              sx={{
                p: 3,
                flexGrow: 1,
                overflowY: 'auto',
                pr: showVersionHistory ? 0 : 3,
              }}
            >
              {isLoadingVersion ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress size={32} thickness={2} />
                </Box>
              ) : (
                <>
                  {isViewingHistory && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                      Viewing Version {viewingVersion} | This is a read-only historical version
                    </Alert>
                  )}
                  {/* Use progressive rendering for content over 10k chars */}
                  {displayContent.content.length > 10000 ? (
                    <ProgressiveMarkdownRenderer
                      content={displayContent.content}
                      chunkSize={5000}
                      initialChunks={2}
                    />
                  ) : (
                    <MarkdownRenderer content={displayContent.content} />
                  )}
                </>
              )}
            </Box>

            {/* Version History Panel */}
            <VersionHistory
              open={showVersionHistory}
              onClose={() => setShowVersionHistory(false)}
              artifactId={artifact.id}
              currentVersion={artifact.version}
              viewingVersion={viewingVersion}
              onViewVersion={handleViewVersion}
              onRestore={handleRestore}
            />
          </Box>
        </DialogContent>
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
