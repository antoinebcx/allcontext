import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  Button, 
  Stack, 
  Grid, 
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Plus, Search } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';
import { useArtifacts, useCreateArtifact, useUpdateArtifact, useDeleteArtifact, useSearchArtifacts } from '../hooks/useArtifacts';
import { ArtifactCard } from '../components/Artifacts/ArtifactCard';
import { ArtifactForm } from '../components/Artifacts/ArtifactForm';
import { ArtifactDetail } from '../components/Artifacts/ArtifactDetail';
import type { Artifact, ArtifactCreate, ArtifactUpdate } from '../api/client';

export const Dashboard: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [detailOpen, setDetailOpen] = useState(false);

  // Debounce search query
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Queries
  const { data, isLoading, error } = useArtifacts();
  const { data: searchResults, isLoading: isSearching } = useSearchArtifacts(
    debouncedSearch
  );

  // Mutations
  const createMutation = useCreateArtifact();
  const updateMutation = useUpdateArtifact();
  const deleteMutation = useDeleteArtifact();

  // Use search results if searching, otherwise use regular data
  const artifacts = debouncedSearch ? (searchResults || []) : (data?.items || []);
  const loading = isLoading || (debouncedSearch && isSearching);

  // Handlers
  const handleCreate = () => {
    setSelectedArtifact(null);
    setFormMode('create');
    setFormOpen(true);
  };

  const handleView = (artifact: Artifact) => {
    setSelectedArtifact(artifact);
    setDetailOpen(true);
  };

  const handleEdit = () => {
    setFormMode('edit');
    setFormOpen(true);
    setDetailOpen(false);
  };

  const handleDelete = async () => {
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

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Stack spacing={3} mb={4}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h1" sx={{ fontSize: '1.75rem', fontWeight: 600 }}>
              Context Platform
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <TextField
                placeholder="Search artifacts..."
                size="small"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={18} />
                    </InputAdornment>
                  ),
                }}
                sx={{ width: 320 }}
              />
              <Button
                variant="contained"
                startIcon={<Plus size={18} />}
                onClick={handleCreate}
              >
                New Artifact
              </Button>
            </Stack>
          </Stack>
        </Stack>

        {/* Content */}
        {error && (
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
                  Create your first prompt or document to get started
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
          <Grid container spacing={3}>
            {artifacts.map((artifact) => (
              <Grid item xs={12} sm={6} md={4} key={artifact.id}>
                <ArtifactCard
                  artifact={artifact}
                  onClick={() => handleView(artifact)}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

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
      />
    </Box>
  );
};
