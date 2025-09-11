import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  TextField,
  IconButton,
  Alert,
  Paper,
} from '@mui/material';
import { Copy, Eye, EyeOff } from 'lucide-react';
import type { ApiKeyCreated } from '../../api/client';

interface ApiKeyDisplayProps {
  open: boolean;
  onClose: () => void;
  apiKey: ApiKeyCreated | null;
}

export const ApiKeyDisplay: React.FC<ApiKeyDisplayProps> = ({ open, onClose, apiKey }) => {
  const [showKey, setShowKey] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (apiKey?.api_key) {
      navigator.clipboard.writeText(apiKey.api_key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const toggleShowKey = () => {
    setShowKey(!showKey);
  };

  if (!apiKey) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>API Key Created Successfully</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <Alert severity="warning">
            <Typography variant="body2">
              <strong>Important:</strong> This is the only time you'll see this API key. 
              Please copy it now and store it securely.
            </Typography>
          </Alert>

          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Key Name
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {apiKey.name}
            </Typography>
          </Box>

          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              API Key
            </Typography>
            <Paper 
              variant="outlined" 
              sx={{ 
                p: 1.5, 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                bgcolor: 'grey.50' 
              }}
            >
              <TextField
                value={showKey ? apiKey.api_key : '•'.repeat(apiKey.api_key.length)}
                fullWidth
                variant="standard"
                InputProps={{
                  readOnly: true,
                  disableUnderline: true,
                  sx: {
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                  },
                  endAdornment: (
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton size="small" onClick={toggleShowKey}>
                        {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                      </IconButton>
                      <IconButton size="small" onClick={handleCopy}>
                        <Copy size={18} />
                      </IconButton>
                    </Box>
                  ),
                }}
              />
            </Paper>
            {copied && (
              <Typography variant="caption" color="success.main" sx={{ mt: 0.5 }}>
                Copied to clipboard!
              </Typography>
            )}
          </Box>

          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Permissions
            </Typography>
            <Typography variant="body1">
              {apiKey.scopes.join(', ')}
            </Typography>
          </Box>

          {apiKey.expires_at && (
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Expires
              </Typography>
              <Typography variant="body1">
                {new Date(apiKey.expires_at).toLocaleDateString()}
              </Typography>
            </Box>
          )}

          <Alert severity="info">
            <Typography variant="body2">
              Use this key by adding the header <code>X-API-Key: {apiKey.api_key.substring(0, 12)}...</code> to your API requests.
            </Typography>
          </Alert>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
};