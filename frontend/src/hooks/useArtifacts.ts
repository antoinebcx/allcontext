import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { artifactApi } from '../api/client';
import { logger } from '../utils/logger';
import type { ArtifactCreate, ArtifactUpdate } from '../types';

// Query keys
const ARTIFACTS_KEY = 'artifacts';
const ARTIFACT_KEY = 'artifact';

// List artifacts
export const useArtifacts = () => {
  const query = useQuery({
    queryKey: [ARTIFACTS_KEY],
    queryFn: () => artifactApi.list(),
    retry: 2,
  });

  // Log errors when they occur
  if (query.error) {
    logger.error('Failed to fetch artifacts', { error: query.error });
  }

  return query;
};

// Get single artifact
export const useArtifact = (id: string) => {
  const query = useQuery({
    queryKey: [ARTIFACT_KEY, id],
    queryFn: () => artifactApi.get(id),
    enabled: !!id,
    retry: 2,
  });

  // Log errors when they occur
  if (query.error) {
    logger.error('Failed to fetch artifact', { error: query.error, id });
  }

  return query;
};

// Search artifacts
export const useSearchArtifacts = (query: string) => {
  const searchQuery = useQuery({
    queryKey: [ARTIFACTS_KEY, 'search', query],
    queryFn: ({ signal }) => artifactApi.search(query, signal),
    enabled: query.length > 0,
    retry: 1,
  });

  // Log errors when they occur
  if (searchQuery.error) {
    logger.error('Search failed', { error: searchQuery.error, query });
  }

  return searchQuery;
};

// Create artifact
export const useCreateArtifact = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ArtifactCreate) => artifactApi.create(data),
    onSuccess: () => {
      // Invalidate and refetch artifacts list
      queryClient.invalidateQueries({ queryKey: [ARTIFACTS_KEY] });
      logger.info('Artifact created successfully');
    },
    onError: (error) => {
      logger.error('Failed to create artifact', { error });
      // The component can access error via mutation.error
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
      // Invalidate version queries since the artifact was updated
      queryClient.invalidateQueries({ queryKey: ['artifact-versions', updatedArtifact.id] });
      logger.info('Artifact updated successfully', { id: updatedArtifact.id });
    },
    onError: (error: unknown, variables) => {
      logger.error('Failed to update artifact', { error, id: variables.id });
    },
  });
};

// Delete artifact
export const useDeleteArtifact = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => artifactApi.delete(id),
    onSuccess: (_, id) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: [ARTIFACTS_KEY] });
      logger.info('Artifact deleted successfully', { id });
    },
    onError: (error: unknown, id) => {
      logger.error('Failed to delete artifact', { error, id });
    },
  });
};
