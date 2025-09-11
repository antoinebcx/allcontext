import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  RadioGroup,
  Radio,
  Box,
  Typography,
} from '@mui/material';
import { addDays, addMonths } from 'date-fns';
import type { ApiKeyCreate } from '../../api/client';

interface CreateApiKeyProps {
  open: boolean;
  onClose: () => void;
  onCreate: (data: ApiKeyCreate) => Promise<any>;
}

export const CreateApiKey: React.FC<CreateApiKeyProps> = ({ open, onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [expiryOption, setExpiryOption] = useState('never');
  const [scopes, setScopes] = useState({
    read: true,
    write: true,
    delete: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const selectedScopes = Object.entries(scopes)
        .filter(([_, enabled]) => enabled)
        .map(([scope, _]) => scope);

      let expires_at: string | undefined;
      if (expiryOption !== 'never') {
        const now = new Date();
        switch (expiryOption) {
          case '30days':
            expires_at = addDays(now, 30).toISOString();
            break;
          case '60days':
            expires_at = addDays(now, 60).toISOString();
            break;
          case '90days':
            expires_at = addDays(now, 90).toISOString();
            break;
          case '1year':
            expires_at = addMonths(now, 12).toISOString();
            break;
        }
      }

      const data: ApiKeyCreate = {
        name: name.trim(),
        scopes: selectedScopes,
        expires_at,
      };

      await onCreate(data);
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create API key');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setExpiryOption('never');
    setScopes({ read: true, write: true, delete: false });
    setError('');
    onClose();
  };

  const handleScopeChange = (scope: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setScopes(prev => ({
      ...prev,
      [scope]: event.target.checked,
    }));
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create API Key</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
          <TextField
            label="Key Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            required
            helperText="A friendly name to identify this key"
            error={!!error && !name.trim()}
          />

          <FormControl component="fieldset">
            <FormLabel component="legend">Permissions</FormLabel>
            <FormGroup row>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={scopes.read}
                    onChange={handleScopeChange('read')}
                  />
                }
                label="Read"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={scopes.write}
                    onChange={handleScopeChange('write')}
                  />
                }
                label="Write"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={scopes.delete}
                    onChange={handleScopeChange('delete')}
                  />
                }
                label="Delete"
              />
            </FormGroup>
          </FormControl>

          <FormControl component="fieldset">
            <FormLabel component="legend">Expiration</FormLabel>
            <RadioGroup
              value={expiryOption}
              onChange={(e) => setExpiryOption(e.target.value)}
            >
              <FormControlLabel value="never" control={<Radio />} label="Never expire" />
              <FormControlLabel value="30days" control={<Radio />} label="30 days" />
              <FormControlLabel value="60days" control={<Radio />} label="60 days" />
              <FormControlLabel value="90days" control={<Radio />} label="90 days" />
              <FormControlLabel value="1year" control={<Radio />} label="1 year" />
            </RadioGroup>
          </FormControl>

          {error && (
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleCreate} 
          variant="contained" 
          disabled={loading || !name.trim()}
        >
          {loading ? 'Creating...' : 'Create Key'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};