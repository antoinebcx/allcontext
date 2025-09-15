import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Grid,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  Paper,
} from '@mui/material';
import { Plus, Search } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';
import { useArtifacts, useCreateArtifact, useUpdateArtifact, useDeleteArtifact, useSearchArtifacts } from '../hooks/useArtifacts';
import { ArtifactCard } from '../components/Artifacts/ArtifactCard';
import { ArtifactForm } from '../components/Artifacts/ArtifactForm';
import { ArtifactDetail } from '../components/Artifacts/ArtifactDetail';
import { useAuth } from '../contexts/AuthContext';
import { demoArtifacts } from '../data/demoData';
import type { Artifact, ArtifactCreate, ArtifactUpdate, ArtifactSearchResult } from '../types';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [detailOpen, setDetailOpen] = useState(false);

  // Debounce search query
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + Enter for new artifact (common pattern in messaging apps)
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleCreate();
      }
      // Cmd/Ctrl + K for search focus
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
        searchInput?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [user]);

  // Queries - only fetch if authenticated
  const { data, isLoading, error } = useArtifacts();
  const { data: searchResults, isLoading: isSearching } = useSearchArtifacts(
    user ? debouncedSearch : ''
  );

  // Mutations
  const createMutation = useCreateArtifact();
  const updateMutation = useUpdateArtifact();
  const deleteMutation = useDeleteArtifact();

  // Determine which artifacts to show
  let artifacts: (Artifact | ArtifactSearchResult)[] = [];
  let loading = false;

  if (user) {
    // Authenticated: use real data
    artifacts = debouncedSearch ? (searchResults || []) : (data?.items || []);
    loading = isLoading || (!!debouncedSearch && isSearching);
  } else {
    // Non-authenticated: use demo data
    artifacts = demoArtifacts;
    if (debouncedSearch) {
      // Simple client-side filtering for demo
      artifacts = demoArtifacts.filter(a =>
        a.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        a.content.toLowerCase().includes(debouncedSearch.toLowerCase())
      );
    }
  }

  // Handlers
  const handleCreate = () => {
    if (!user) {
      navigate('/login?signup=true');
      return;
    }
    setSelectedArtifact(null);
    setFormMode('create');
    setFormOpen(true);
  };

  const handleView = async (artifactOrResult: Artifact | ArtifactSearchResult) => {
    // If it's a search result, we need to fetch the full artifact
    if ('snippet' in artifactOrResult && user) {
      // This is a search result, need to fetch full artifact
      // For now, we'll just show what we have
      // In a real implementation, you'd fetch the full artifact by ID
      setSelectedArtifact(null);
      navigate('/login');
      return;
    }
    setSelectedArtifact(artifactOrResult as Artifact);
    setDetailOpen(true);
  };

  const handleEdit = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setFormMode('edit');
    setFormOpen(true);
    setDetailOpen(false);
  };

  const handleDelete = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (selectedArtifact) {
      await deleteMutation.mutateAsync(selectedArtifact.id);
      setDetailOpen(false);
      setSelectedArtifact(null);
    }
  };

  const handleFormSubmit = async (data: ArtifactCreate | ArtifactUpdate) => {
    if (formMode === 'create') {
      await createMutation.mutateAsync(data as ArtifactCreate);
    } else if (selectedArtifact) {
      await updateMutation.mutateAsync({
        id: selectedArtifact.id,
        data: data as ArtifactUpdate,
      });
    }
    setFormOpen(false);
  };

  const handleArtifactUpdate = (updatedArtifact: Artifact) => {
    // Update the selected artifact with the restored version
    setSelectedArtifact(updatedArtifact);
    // The artifacts list will be refreshed via React Query invalidation
  };

  return (
    <>
      {/* Welcome Banner for non-authenticated users */}
      {!user && (
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 2 },
            mb: { xs: 4, sm: 7 },
            border: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'stretch', sm: 'center' },
            gap: 2,
            bgcolor: 'transparent'
          }}
        >
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="body1" fontWeight={500}>
              Welcome to Allcontext!
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Your context in the cloud — accessible anywhere, anytime, through any interface (app, API, MCP).
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              You're viewing demo content. Sign up to create your own artifacts.
            </Typography>
          </Box>
          <Button
            variant="outlined"
            onClick={() => navigate('/login?signup=true')}
            sx={{
              width: { xs: '100%', sm: 'auto' },
              mt: { xs: 1, sm: 0 }
            }}
          >
            Sign Up Free
          </Button>
        </Paper>
      )}

      {/* Unified Search and Create Bar */}
      <Box sx={{
        mb: { xs: 4, sm: 7 },
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'center',
        gap: { xs: 1, sm: 1.5 },
        mt: { xs: 2, sm: 3 },
        px: { xs: 0, sm: 0 }
      }}>
        <TextField
          placeholder="Search artifacts... (⌘K)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={20} />
                </InputAdornment>
              ),
            }
          }}
          sx={{
            width: { xs: '100%', sm: 520 },
            '& .MuiOutlinedInput-root': {
              bgcolor: 'background.default',
              height: { xs: 48, sm: 58 }
            }
          }}
        />
        <Button
          variant="outlined"
          startIcon={<Plus size={18} />}
          onClick={handleCreate}
          title="New Artifact (⌘↵)"
          sx={{
            height: { xs: 48, sm: 58 },
            px: 2.5,
            minWidth: { xs: '100%', sm: 'auto' },
            fontSize: '0.95rem',
          }}
        >
          New
        </Button>
      </Box>

      {/* Content */}
      {error && user && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load artifacts. Please check your backend connection.
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={32} thickness={2} />
        </Box>
      ) : artifacts.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography color="text.secondary" gutterBottom>
            {searchQuery 
              ? `No artifacts found for "${searchQuery}"`
              : 'No artifacts yet'}
          </Typography>
          {!searchQuery && (
            <>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Create your first artifact to get started
              </Typography>
              <Button
                variant="contained"
                startIcon={<Plus size={18} />}
                onClick={handleCreate}
              >
                Create Your First Artifact
              </Button>
            </>
          )}
        </Box>
      ) : (
        <Grid container spacing={2}>
          {artifacts.map((artifact) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={artifact.id}>
              <ArtifactCard
                artifact={artifact as Artifact}
                onClick={() => handleView(artifact)}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create/Edit Form */}
      <ArtifactForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
        artifact={selectedArtifact}
        mode={formMode}
      />

      {/* Detail View */}
      <ArtifactDetail
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        artifact={selectedArtifact}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onUpdate={handleArtifactUpdate}
      />
    </>
  );
};
