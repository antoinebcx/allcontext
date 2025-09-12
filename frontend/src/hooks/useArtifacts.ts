import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { artifactApi } from '../api/client';
import type { Artifact, ArtifactCreate, ArtifactUpdate } from '../types';

// Query keys
const ARTIFACTS_KEY = 'artifacts';
const ARTIFACT_KEY = 'artifact';

// List artifacts
export const useArtifacts = () => {
  return useQuery({
    queryKey: [ARTIFACTS_KEY],
    queryFn: () => artifactApi.list(),
  });
};

// Get single artifact
export const useArtifact = (id: string) => {
  return useQuery({
    queryKey: [ARTIFACT_KEY, id],
    queryFn: () => artifactApi.get(id),
    enabled: !!id,
  });
};

// Search artifacts
export const useSearchArtifacts = (query: string) => {
  return useQuery({
    queryKey: [ARTIFACTS_KEY, 'search', query],
    queryFn: () => artifactApi.search(query),
    enabled: query.length > 0,
  });
};

// Create artifact
export const useCreateArtifact = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: ArtifactCreate) => artifactApi.create(data),
    onSuccess: () => {
      // Invalidate and refetch artifacts list
      queryClient.invalidateQueries({ queryKey: [ARTIFACTS_KEY] });
    },
  });
};

// Update artifact
export const useUpdateArtifact = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ArtifactUpdate }) => 
      artifactApi.update(id, data),
    onSuccess: (updatedArtifact) => {
      // Update the specific artifact in cache
      queryClient.setQueryData([ARTIFACT_KEY, updatedArtifact.id], updatedArtifact);
      // Invalidate list
      queryClient.invalidateQueries({ queryKey: [ARTIFACTS_KEY] });
    },
  });
};

// Delete artifact
export const useDeleteArtifact = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => artifactApi.delete(id),
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: [ARTIFACTS_KEY] });
    },
  });
};
