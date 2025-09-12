import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
} from '@mui/material';
import { Plus, Key, User, Shield } from 'lucide-react';
import { useApiKeys, useCreateApiKey, useDeleteApiKey } from '../hooks/useApiKeys';
import { ApiKeysList } from '../components/ApiKeys/ApiKeysList';
import { CreateApiKey } from '../components/ApiKeys/CreateApiKey';
import { ApiKeyDisplay } from '../components/ApiKeys/ApiKeyDisplay';
import { useAuth } from '../contexts/AuthContext';
import type { ApiKey, ApiKeyCreated } from '../types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [displayDialogOpen, setDisplayDialogOpen] = useState(false);
  const [createdKey, setCreatedKey] = useState<ApiKeyCreated | null>(null);
  
  const { user } = useAuth();
  const { data, isLoading, error } = useApiKeys();
  const createMutation = useCreateApiKey();
  const deleteMutation = useDeleteApiKey();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleCreateClick = () => {
    setCreateDialogOpen(true);
  };

  const handleCreateKey = async (data: any) => {
    const result = await createMutation.mutateAsync(data);
    setCreatedKey(result);
    setCreateDialogOpen(false);
    setDisplayDialogOpen(true);
    return result;
  };


  const handleDeleteKey = (key: ApiKey) => {
    deleteMutation.mutate(key.id);
  };

  const handleDisplayClose = () => {
    setDisplayDialogOpen(false);
    setCreatedKey(null);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Settings
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your account settings and API keys
        </Typography>
      </Box>

      {/* Tabs */}
      <Paper elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
        >
          <Tab icon={<Key size={18} />} iconPosition="start" label="API Keys" />
          <Tab icon={<User size={18} />} iconPosition="start" label="Profile" />
          <Tab icon={<Shield size={18} />} iconPosition="start" label="Security" />
        </Tabs>

        {/* API Keys Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ p: 3 }}>
            {/* Section Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  API Keys
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Create and manage API keys for programmatic access to your artifacts
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<Plus size={18} />}
                onClick={handleCreateClick}
                disabled={data?.items && data.items.length >= 10}
              >
                Create API Key
              </Button>
            </Box>

            {/* API Keys Limit Info */}
            {data?.items && data.items.length >= 10 && (
              <Alert severity="info" sx={{ mb: 2 }}>
                You've reached the maximum limit of 10 API keys. Delete unused keys to create new ones.
              </Alert>
            )}

            {/* Loading State */}
            {isLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            )}

            {/* Error State */}
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                Failed to load API keys. Please try again.
              </Alert>
            )}

            {/* API Keys List */}
            {data && (
              <ApiKeysList
                apiKeys={data.items}
                onDelete={handleDeleteKey}
              />
            )}

            {/* Usage Instructions */}
            <Box sx={{ mt: 4, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                How to use API keys
              </Typography>
              <Typography variant="body2" color="text.secondary" component="div">
                Include your API key in the request header:
                <Box component="pre" sx={{ mt: 1, p: 1, bgcolor: 'white', borderRadius: 1, fontSize: '0.875rem' }}>
                  {`curl -H "X-API-Key: sk_prod_your_key_here" \\
     https://api.contexthub.com/api/v1/artifacts`}
                </Box>
              </Typography>
            </Box>
          </Box>
        </TabPanel>

        {/* Profile Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Profile Information
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Email
              </Typography>
              <Typography variant="body1">
                {user?.email}
              </Typography>
            </Box>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                User ID
              </Typography>
              <Typography variant="body1" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                {user?.id}
              </Typography>
            </Box>
          </Box>
        </TabPanel>

        {/* Security Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Security Settings
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Security settings and password management coming soon.
            </Typography>
          </Box>
        </TabPanel>
      </Paper>

      {/* Dialogs */}
      <CreateApiKey
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onCreate={handleCreateKey}
      />

      <ApiKeyDisplay
        open={displayDialogOpen}
        onClose={handleDisplayClose}
        apiKey={createdKey}
      />
    </Container>
  );
};