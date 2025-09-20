import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material';
import { Plus, Monitor, Sun, Moon } from 'lucide-react';
import { useApiKeys, useCreateApiKey, useDeleteApiKey } from '../hooks/useApiKeys';
import { ApiKeysList } from '../components/ApiKeys/ApiKeysList';
import { CreateApiKey } from '../components/ApiKeys/CreateApiKey';
import { ApiKeyDisplay } from '../components/ApiKeys/ApiKeyDisplay';
import { MarkdownRenderer } from '../components/Markdown/MarkdownRenderer';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
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
  const [tabValue, setTabValue] = useState(0);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [displayDialogOpen, setDisplayDialogOpen] = useState(false);
  const [createdKey, setCreatedKey] = useState<ApiKeyCreated | null>(null);

  const { user } = useAuth();
  const { themeMode, setThemeMode } = useTheme();
  const { data, isLoading, error } = useApiKeys();
  const createMutation = useCreateApiKey();
  const deleteMutation = useDeleteApiKey();

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
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
    <Container maxWidth="lg" sx={{ py: 0 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 500 }}>
          Settings
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your account settings and API keys
        </Typography>
      </Box>

      {/* Tabs */}
      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="API Keys" />
        <Tab label="Profile" />
        <Tab label="Appearance" />
        <Tab label="Terms" />
        <Tab label="Security" />
      </Tabs>

      {/* API Keys Tab */}
      <TabPanel value={tabValue} index={0}>
        <Box sx={{ py: 3 }}>
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
                variant="outlined"
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
            <Box sx={{ mt: 4 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ mb: 1 }}>
                How to use API keys
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Add the MCP to Claude Code with this simple terminal command:
              </Typography>
              <MarkdownRenderer content={`\`\`\`bash
claude mcp add --transport http allcontext https://api.allcontext.dev/mcp/ \\
  --header "Authorization: Bearer your_api_key"
\`\`\``} />

              <Typography variant="body2" color="text.secondary" sx={{ mb: 1, mt: 2 }}>
                Include your API key in the API request header:
              </Typography>
              <MarkdownRenderer content={`\`\`\`bash
curl -H "X-API-Key: your_api_key" \\
  https://api.allcontext.dev/api/v1/artifacts
\`\`\``} />

              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                More information in the docs.
              </Typography>
            </Box>
        </Box>
      </TabPanel>

      {/* Profile Tab */}
      <TabPanel value={tabValue} index={1}>
        <Box sx={{ py: 3 }}>
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

      {/* Appearance Tab */}
      <TabPanel value={tabValue} index={2}>
        <Box sx={{ py: 3 }}>
            <Typography variant="h6" gutterBottom>
              Appearance
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Customize how Allcontext looks on your device
            </Typography>

            <Box>
              <Typography variant="subtitle2" gutterBottom sx={{ mb: 2 }}>
                Theme
              </Typography>
              <FormControl component="fieldset">
                <RadioGroup
                  value={themeMode}
                  onChange={(e) => setThemeMode(e.target.value as 'system' | 'light' | 'dark')}
                  sx={{ gap: 0.5 }}
                >
                  <FormControlLabel
                    value="system"
                    control={<Radio size="small" sx={{ display: 'none' }} />}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.5 }}>
                        <Monitor size={18} style={{ opacity: 0.7 }} />
                        <Typography variant="body2">System preference</Typography>
                      </Box>
                    }
                    sx={{
                      m: 0,
                      px: 2,
                      py: 1,
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: themeMode === 'system' ? 'primary.main' : 'divider',
                      bgcolor: themeMode === 'system' ? 'action.selected' : 'transparent',
                      '&:hover': {
                        bgcolor: themeMode === 'system' ? 'action.selected' : 'action.hover',
                      },
                      transition: 'all 0.2s ease',
                    }}
                  />
                  <FormControlLabel
                    value="light"
                    control={<Radio size="small" sx={{ display: 'none' }} />}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.5 }}>
                        <Sun size={18} style={{ opacity: 0.7 }} />
                        <Typography variant="body2">Light</Typography>
                      </Box>
                    }
                    sx={{
                      m: 0,
                      px: 2,
                      py: 1,
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: themeMode === 'light' ? 'primary.main' : 'divider',
                      bgcolor: themeMode === 'light' ? 'action.selected' : 'transparent',
                      '&:hover': {
                        bgcolor: themeMode === 'light' ? 'action.selected' : 'action.hover',
                      },
                      transition: 'all 0.2s ease',
                    }}
                  />
                  <FormControlLabel
                    value="dark"
                    control={<Radio size="small" sx={{ display: 'none' }} />}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.5 }}>
                        <Moon size={18} style={{ opacity: 0.7 }} />
                        <Typography variant="body2">Dark</Typography>
                      </Box>
                    }
                    sx={{
                      m: 0,
                      px: 2,
                      py: 1,
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: themeMode === 'dark' ? 'primary.main' : 'divider',
                      bgcolor: themeMode === 'dark' ? 'action.selected' : 'transparent',
                      '&:hover': {
                        bgcolor: themeMode === 'dark' ? 'action.selected' : 'action.hover',
                      },
                      transition: 'all 0.2s ease',
                    }}
                  />
                </RadioGroup>
              </FormControl>
            </Box>

            <Box sx={{ mt: 4, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Your preference is saved locally and will be remembered when you return.
              </Typography>
            </Box>
        </Box>
      </TabPanel>

      {/* Terms Tab */}
      <TabPanel value={tabValue} index={3}>
        <Box sx={{ py: 3 }}>
            <Typography variant="h6" gutterBottom>
              Legal Documents
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Review our terms of service and privacy policy
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => window.open('/legal/terms-of-service', '_blank')}
                sx={{
                  justifyContent: 'flex-start',
                  px: 2,
                  py: 1.5,
                  textAlign: 'left'
                }}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Typography variant="body2" fontWeight={500}>
                    Terms of Service
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Terms and conditions for using Allcontext
                  </Typography>
                </Box>
              </Button>

              <Button
                variant="outlined"
                onClick={() => window.open('/legal/privacy-policy', '_blank')}
                sx={{
                  justifyContent: 'flex-start',
                  px: 2,
                  py: 1.5,
                  textAlign: 'left'
                }}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Typography variant="body2" fontWeight={500}>
                    Privacy Policy
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    How we collect, use, and protect your data
                  </Typography>
                </Box>
              </Button>
            </Box>

            <Box sx={{ mt: 4, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                These documents are GDPR-compliant and were last updated on September 15, 2025.
              </Typography>
            </Box>
        </Box>
      </TabPanel>

      {/* Security Tab */}
      <TabPanel value={tabValue} index={4}>
        <Box sx={{ py: 3 }}>
            <Typography variant="h6" gutterBottom>
              Security Settings
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Security settings and password management coming soon.
            </Typography>
        </Box>
      </TabPanel>

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
