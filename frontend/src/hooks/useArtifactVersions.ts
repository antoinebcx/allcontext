import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { artifactApi } from '../api/client';
import { logger } from '../utils/logger';

// Query keys
const VERSIONS_KEY = 'artifact-versions';
const VERSION_KEY = 'artifact-version';
const ARTIFACTS_KEY = 'artifacts';

// Get version history for an artifact
export const useArtifactVersions = (artifactId: string) => {
  const query = useQuery({
    queryKey: [VERSIONS_KEY, artifactId],
    queryFn: () => artifactApi.getVersions(artifactId),
    enabled: !!artifactId,
    staleTime: 30000, // Consider data fresh for 30 seconds
    retry: 2,
  });

  if (query.error) {
    logger.error('Failed to fetch artifact versions', {
      error: query.error,
      artifactId
    });
  }

  return query;
};

// Get specific version of an artifact
export const useArtifactVersion = (artifactId: string, versionNumber: number | null) => {
  const query = useQuery({
    queryKey: [VERSION_KEY, artifactId, versionNumber],
    queryFn: () => artifactApi.getVersion(artifactId, versionNumber!),
    enabled: !!artifactId && versionNumber !== null && versionNumber > 0,
    staleTime: 60000, // Consider version data fresh for 1 minute
    retry: 2,
  });

  if (query.error) {
    logger.error('Failed to fetch artifact version', {
      error: query.error,
      artifactId,
      versionNumber
    });
  }

  return query;
};

// Restore artifact to a previous version
export const useRestoreVersion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ artifactId, versionNumber }: {
      artifactId: string;
      versionNumber: number
    }) => artifactApi.restoreVersion(artifactId, versionNumber),
    onSuccess: (restoredArtifact, variables) => {
      // Update the artifact in cache
      queryClient.setQueryData(['artifact', restoredArtifact.id], restoredArtifact);

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: [ARTIFACTS_KEY] });
      queryClient.invalidateQueries({
        queryKey: [VERSIONS_KEY, variables.artifactId]
      });

      logger.info('Artifact restored successfully', {
        artifactId: variables.artifactId,
        restoredToVersion: variables.versionNumber,
        newVersion: restoredArtifact.version
      });
    },
    onError: (error: unknown, variables) => {
      logger.error('Failed to restore artifact version', {
        error,
        artifactId: variables.artifactId,
        versionNumber: variables.versionNumber
      });
    },
  });
};

// Compare two versions
export const useVersionDiff = (
  artifactId: string,
  fromVersion: number | null,
  toVersion: number | null
) => {
  const query = useQuery({
    queryKey: ['version-diff', artifactId, fromVersion, toVersion],
    queryFn: () => artifactApi.compareVersions(artifactId, fromVersion!, toVersion!),
    enabled: !!artifactId && fromVersion !== null && toVersion !== null,
    staleTime: 60000, // Cache diff for 1 minute
    retry: 1,
  });

  if (query.error) {
    logger.error('Failed to compare versions', {
      error: query.error,
      artifactId,
      fromVersion,
      toVersion
    });
  }

  return query;
};