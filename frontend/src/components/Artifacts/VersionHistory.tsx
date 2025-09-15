import React, { useState } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Button,
  IconButton,
  Stack,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  X,
  RotateCcw,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import type { ArtifactVersionSummary } from '../../types';
import { useArtifactVersions, useRestoreVersion } from '../../hooks/useArtifactVersions';

interface VersionHistoryProps {
  open: boolean;
  onClose: () => void;
  artifactId: string;
  currentVersion: number;
  viewingVersion: number | null;
  onViewVersion: (versionNumber: number) => void;
  onRestore?: (restoredArtifact: any) => void;
}

export const VersionHistory: React.FC<VersionHistoryProps> = ({
  open,
  onClose,
  artifactId,
  currentVersion,
  viewingVersion,
  onViewVersion,
  onRestore,
}) => {
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<ArtifactVersionSummary | null>(null);

  // Queries and mutations
  const { data: versionsData, isLoading, error } = useArtifactVersions(artifactId);
  const restoreMutation = useRestoreVersion();

  const handleRestore = (version: ArtifactVersionSummary) => {
    setSelectedVersion(version);
    setRestoreConfirmOpen(true);
  };

  const confirmRestore = async () => {
    if (!selectedVersion) return;

    const restoredArtifact = await restoreMutation.mutateAsync({
      artifactId,
      versionNumber: selectedVersion.version,
    });

    setRestoreConfirmOpen(false);
    setSelectedVersion(null);

    // Call the onRestore callback if provided
    if (onRestore) {
      onRestore(restoredArtifact);
    }

    // Don't call onViewVersion here - the restored version is now the current version
    // and handleRestore in ArtifactDetail will clear viewingVersion
  };

  const formatVersionDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      full: format(date, 'MMM d, yyyy h:mm a'),
      relative: formatDistanceToNow(date, { addSuffix: true }),
    };
  };

  const getChangeLabel = (changes: string[]) => {
    if (changes.length === 0) return null;
    if (changes.includes('title') && changes.includes('content')) {
      return 'Title & Content';
    }
    if (changes.includes('title')) return 'Title';
    if (changes.includes('content')) return 'Content';
    return null;
  };

  if (!open) return null;

  return (
    <>
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: 380,
          height: '100%',
          bgcolor: 'background.paper',
          borderLeft: '1px solid',
          borderColor: 'divider',
          display: open ? 'flex' : 'none',
          flexDirection: 'column',
          zIndex: 1,
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Version History
            </Typography>
            <IconButton onClick={onClose} size="small">
              <X size={20} />
            </IconButton>
          </Stack>
          {versionsData && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {versionsData.version_count} total edits
            </Typography>
          )}
        </Box>

        {/* Content */}
        <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress size={32} thickness={2} />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ m: 2 }}>
              Failed to load version history
            </Alert>
          ) : versionsData?.versions.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">
                No version history yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Edit this artifact to create versions
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {/* Current version */}
              <ListItem
                disablePadding
                sx={{
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <ListItemButton
                  onClick={() => onViewVersion(currentVersion)}
                  sx={{
                    py: 1.5,
                    bgcolor: (!viewingVersion || viewingVersion === currentVersion)
                      ? 'action.selected'
                      : 'transparent',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  <ListItemText
                    primary={
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="body2" fontWeight={600}>
                          Version {currentVersion}
                        </Typography>
                        <Chip label="Current" size="small" color="default" />
                      </Stack>
                    }
                    secondary="Latest version"
                  />
                </ListItemButton>
              </ListItem>

              <Divider />

              {/* Version history */}
              {versionsData?.versions.map((version: ArtifactVersionSummary) => {
                const { full, relative } = formatVersionDate(version.updated_at);
                const changeLabel = getChangeLabel(version.changes);

                return (
                  <ListItem
                    key={version.version}
                    disablePadding
                    sx={{
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      '&:last-child': { borderBottom: 'none' },
                    }}
                  >
                    <ListItemButton
                      onClick={() => onViewVersion(version.version)}
                      sx={{
                        py: 1.5,
                        bgcolor: viewingVersion === version.version
                          ? 'action.selected'
                          : 'transparent',
                        '&:hover': {
                          bgcolor: 'action.hover',
                        },
                      }}
                    >
                      <ListItemText
                        primary={
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Typography variant="body2" fontWeight={500}>
                              Version {version.version}
                            </Typography>
                            {changeLabel && (
                              <Chip
                                label={changeLabel}
                                size="small"
                                variant="outlined"
                                sx={{ height: 20, fontSize: '0.75rem' }}
                              />
                            )}
                          </Stack>
                        }
                        secondary={
                          <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">
                              {version.title}
                            </Typography>
                            <Tooltip title={full}>
                              <Typography variant="caption" color="text.secondary">
                                {relative}
                              </Typography>
                            </Tooltip>
                          </Stack>
                        }
                      />
                      <Tooltip title="Restore to this version">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRestore(version);
                          }}
                        >
                          <RotateCcw size={16} />
                        </IconButton>
                      </Tooltip>
                    </ListItemButton>
                  </ListItem>
                );
              })}

              {versionsData && versionsData.version_count > versionsData.versions.length && (
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    Showing last {versionsData.versions.length} of {versionsData.version_count} versions
                  </Typography>
                </Box>
              )}
            </List>
          )}
        </Box>
      </Box>

      {/* Restore Confirmation Dialog */}
      <Dialog
        open={restoreConfirmOpen}
        onClose={() => setRestoreConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Restore Version?</DialogTitle>
        <DialogContent>
          <Typography>
            Restore to Version {selectedVersion?.version}? This will create a new version with the content from that point.
          </Typography>
          {selectedVersion && (
            <Box sx={{ mt: 2, p: 1.5, bgcolor: 'background.default', borderRadius: 1 }}>
              <Typography variant="body2" fontWeight={500}>
                {selectedVersion.title}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                From {formatVersionDate(selectedVersion.updated_at).relative}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setRestoreConfirmOpen(false)}
            variant="outlined"
            disabled={restoreMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmRestore}
            variant="contained"
            startIcon={restoreMutation.isPending ? <CircularProgress size={16} /> : <RotateCcw size={16} />}
            disabled={restoreMutation.isPending}
          >
            {restoreMutation.isPending ? 'Restoring...' : 'Restore'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};