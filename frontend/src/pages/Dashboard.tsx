import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Grid, 
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
} from '@mui/material';
import { Plus, Search } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';
import { useArtifacts, useCreateArtifact, useUpdateArtifact, useDeleteArtifact, useSearchArtifacts } from '../hooks/useArtifacts';
import { ArtifactCard } from '../components/Artifacts/ArtifactCard';
import { ArtifactForm } from '../components/Artifacts/ArtifactForm';
import { ArtifactDetail } from '../components/Artifacts/ArtifactDetail';
import type { Artifact, ArtifactCreate, ArtifactUpdate } from '../types';

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
    <>
      {/* Action Bar */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          startIcon={<Plus size={18} />}
          onClick={handleCreate}
        >
          New Artifact
        </Button>
      </Box>

      {/* Search Bar */}
      <Box sx={{ mb: 5, display: 'flex', justifyContent: 'center' }}>
        <TextField
          placeholder="Search artifacts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search size={20} />
              </InputAdornment>
            ),
          }}
          sx={{ 
            width: 600,
            '& .MuiOutlinedInput-root': {
              bgcolor: 'background.default',
              height: 48
            }
          }}
        />
      </Box>

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
                artifact={artifact}
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
      />
    </>
  );
};
