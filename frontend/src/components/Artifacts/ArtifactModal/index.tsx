import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  DialogTitle,
  Button,
  Box,
  Typography,
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Trash2 } from 'lucide-react';
import type { Artifact, ArtifactCreate, ArtifactUpdate } from '../../../types';
import { ArtifactModalHeader } from './ArtifactModalHeader';
import { ArtifactEditor } from './ArtifactEditor';
import { MarkdownRenderer } from '../../Markdown/MarkdownRenderer';
import { ProgressiveMarkdownRenderer } from '../../Markdown/ProgressiveMarkdownRenderer';
import { ConnectPopover } from '../ConnectPopover';
import { VersionHistory } from '../VersionHistory';
import { useArtifactVersion } from '../../../hooks/useArtifactVersions';

interface ArtifactModalProps {
  open: boolean;
  onClose: () => void;
  artifact: Artifact | null;
  mode: 'view' | 'edit' | 'create';
  onSave: (data: ArtifactCreate | ArtifactUpdate) => Promise<void>;
  onDelete: () => void;
  onUpdate?: (updatedArtifact: Artifact) => void;
}

export const ArtifactModal: React.FC<ArtifactModalProps> = ({
  open,
  onClose,
  artifact,
  mode: initialMode,
  onSave,
  onDelete,
  onUpdate,
}) => {
  // UI State
  const [showCopySuccess, setShowCopySuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [connectAnchorEl, setConnectAnchorEl] = useState<HTMLElement | null>(null);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [viewingVersion, setViewingVersion] = useState<number | null>(null);

  // Mode and editing state
  const [currentMode, setCurrentMode] = useState<'view' | 'edit' | 'create'>(initialMode);
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const [editContent, setEditContent] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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

  // Initialize content and mode when opening
  useEffect(() => {
    if (open) {
      setCurrentMode(initialMode);
      if (initialMode === 'edit' && artifact) {
        setEditContent(artifact.content);
      } else if (initialMode === 'create') {
        setEditContent('');
      }
      setHasChanges(false);
      setActiveTab('write');
    }
  }, [open, initialMode, artifact]);

  // Skip render for view/edit modes without artifact
  if (!artifact && currentMode !== 'create') return null;

  // Computed values
  const displayContent = viewingVersion && versionData ? versionData : artifact;
  const isViewingHistory = viewingVersion !== null;
  const isEditing = currentMode === 'edit' || currentMode === 'create';

  // Handlers
  const handleEdit = () => {
    setCurrentMode('edit');
    setEditContent(artifact?.content || '');
    setHasChanges(false);
    setActiveTab('write');
  };

  const handleCancel = () => {
    if (hasChanges) {
      if (!confirm('Discard unsaved changes?')) return;
    }
    setCurrentMode('view');
    setEditContent('');
    setHasChanges(false);
  };

  const handleSave = async () => {
    if (!editContent.trim()) return;

    setIsSaving(true);
    try {
      const data = currentMode === 'create'
        ? { content: editContent, metadata: {} }
        : { content: editContent };

      await onSave(data);

      if (currentMode === 'create') {
        onClose();
      } else {
        setCurrentMode('view');
        setHasChanges(false);
      }
    } catch (error) {
      // Error handled by parent
    } finally {
      setIsSaving(false);
    }
  };

  const handleContentChange = (value: string) => {
    setEditContent(value);
    setHasChanges(value !== (artifact?.content || ''));
  };

  const handleCopy = async (format: 'markdown' | 'plain') => {
    const textToCopy = format === 'markdown'
      ? displayContent?.content || ''
      : displayContent?.content?.replace(/[#*`_~\[\]()]/g, '') || '';

    try {
      await navigator.clipboard.writeText(textToCopy);
      setShowCopySuccess(true);
    } catch (error) {
      setShowCopySuccess(false);
    }
  };

  const handleDownload = () => {
    if (!displayContent?.content) return;

    const blob = new Blob([displayContent.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${displayContent.title?.toLowerCase().replace(/\s+/g, '-') || 'artifact'}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleConnectClick = (event: React.MouseEvent<HTMLElement>) => {
    setConnectAnchorEl(event.currentTarget);
  };

  const handleConnectClose = () => {
    setConnectAnchorEl(null);
  };

  const handleToggleHistory = () => {
    setShowVersionHistory(!showVersionHistory);
  };

  const handleViewVersion = (versionNumber: number) => {
    if (artifact && versionNumber === artifact.version) {
      setViewingVersion(null);
    } else {
      setViewingVersion(versionNumber);
    }
  };

  const handleRestore = (restoredArtifact: Artifact) => {
    if (onUpdate) {
      onUpdate(restoredArtifact);
    }
    setViewingVersion(null);
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
        <DialogContent sx={{ p: 0, height: '100%' }}>
          {/* Header */}
          <ArtifactModalHeader
            artifact={artifact}
            currentMode={currentMode}
            isEditing={isEditing}
            isViewingHistory={isViewingHistory}
            viewingVersion={viewingVersion}
            hasChanges={hasChanges}
            isSaving={isSaving}
            editContent={editContent}
            onClose={onClose}
            onEdit={handleEdit}
            onSave={handleSave}
            onCancel={handleCancel}
            onCopy={handleCopy}
            onConnect={handleConnectClick}
            onDownload={handleDownload}
            onToggleHistory={handleToggleHistory}
            onDelete={() => setShowDeleteConfirm(true)}
          />

          {/* Content Area */}
          {isEditing ? (
            <ArtifactEditor
              content={editContent}
              activeTab={activeTab}
              onChange={handleContentChange}
              onTabChange={setActiveTab}
            />
          ) : (
            <Box
              sx={{
                position: 'relative',
                height: 'calc(100% - 56px)',
                display: 'flex',
                backgroundColor: 'background.default',
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
                    {displayContent && displayContent.content ? (
                      displayContent.content.length > 10000 ? (
                        <ProgressiveMarkdownRenderer
                          content={displayContent.content}
                          chunkSize={5000}
                          initialChunks={2}
                        />
                      ) : (
                        <MarkdownRenderer content={displayContent.content} />
                      )
                    ) : (
                      <Typography color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        No content available
                      </Typography>
                    )}
                  </>
                )}
              </Box>

              {/* Version History Panel */}
              {artifact && (
                <VersionHistory
                  open={showVersionHistory}
                  onClose={() => setShowVersionHistory(false)}
                  artifactId={artifact.id}
                  currentVersion={artifact.version}
                  viewingVersion={viewingVersion}
                  onViewVersion={handleViewVersion}
                  onRestore={handleRestore}
                />
              )}
            </Box>
          )}
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
            Are you sure you want to delete "{artifact?.title}"? This action cannot be undone.
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
      {artifact && (
        <ConnectPopover
          artifact={artifact}
          anchorEl={connectAnchorEl}
          open={Boolean(connectAnchorEl)}
          onClose={handleConnectClose}
        />
      )}
    </>
  );
};