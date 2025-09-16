import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Typography,
  Box,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import { Trash2, Copy, Eye, EyeOff } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { ApiKey } from '../../types';

interface ApiKeysListProps {
  apiKeys: ApiKey[];
  onDelete: (key: ApiKey) => void;
}

export const ApiKeysList: React.FC<ApiKeysListProps> = ({ apiKeys, onDelete }) => {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [keyToDelete, setKeyToDelete] = useState<ApiKey | null>(null);

  const handleDeleteClick = (key: ApiKey) => {
    setKeyToDelete(key);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (keyToDelete) {
      onDelete(keyToDelete);
    }
    setDeleteConfirmOpen(false);
    setKeyToDelete(null);
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
    setKeyToDelete(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatLastUsed = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  const maskKey = (prefix: string, last4: string) => {
    return `${prefix}${'•'.repeat(32)}${last4}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (apiKeys.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body1" color="text.secondary">
          No API keys yet. Create your first API key to get started.
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <TableContainer sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Key</TableCell>
              <TableCell>Scopes</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Last Used</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Expires</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {apiKeys.map((key) => (
              <TableRow key={key.id}>
                <TableCell>
                  <Typography variant="body2" fontWeight={500}>
                    {key.name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontFamily: 'monospace',
                        fontSize: '0.875rem',
                        color: 'text.secondary'
                      }}
                    >
                      {maskKey(key.key_prefix, key.last_4)}
                    </Typography>
                    <Tooltip title="Copy prefix">
                      <IconButton 
                        size="small" 
                        onClick={() => copyToClipboard(key.key_prefix)}
                      >
                        <Copy size={14} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {key.scopes.map((scope) => (
                      <Chip
                        key={scope}
                        label={scope}
                        size="small"
                        variant="outlined"
                        sx={{ height: 22 }}
                      />
                    ))}
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={key.is_active ? 'Active' : 'Inactive'}
                    size="small"
                    color={key.is_active ? 'success' : 'default'}
                    icon={key.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                    sx={{ height: 24 }}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {formatLastUsed(key.last_used_at)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(key.created_at)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {key.expires_at ? formatDate(key.expires_at) : 'Never'}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Delete">
                    <IconButton 
                      size="small" 
                      onClick={() => handleDeleteClick(key)}
                      sx={{ color: 'error.main' }}
                    >
                      <Trash2 size={16} />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Delete API Key</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the API key "{keyToDelete?.name}"? 
            This action cannot be undone and any applications using this key will stop working.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};