import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiKeyApi } from '../api/client';
import { logger } from '../utils/logger';
import type { ApiKeyCreate, ApiKeyUpdate } from '../types';

// Query keys
const API_KEYS_QUERY_KEY = ['apiKeys'];

// Queries
export const useApiKeys = () => {
  const query = useQuery({
    queryKey: API_KEYS_QUERY_KEY,
    queryFn: apiKeyApi.list,
    retry: 2,
  });

  // Log errors when they occur
  if (query.error) {
    logger.error('Failed to fetch API keys', { error: query.error });
  }

  return query;
};

// Mutations
export const useCreateApiKey = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ApiKeyCreate) => apiKeyApi.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: API_KEYS_QUERY_KEY });
      logger.info('API key created successfully', { name: data.name });
    },
    onError: (error: unknown) => {
      logger.error('Failed to create API key', { error });
    },
  });
};

export const useUpdateApiKey = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ApiKeyUpdate }) =>
      apiKeyApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: API_KEYS_QUERY_KEY });
      logger.info('API key updated successfully', { id: variables.id });
    },
    onError: (error: unknown, variables) => {
      logger.error('Failed to update API key', { error, id: variables.id });
    },
  });
};

export const useDeleteApiKey = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiKeyApi.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: API_KEYS_QUERY_KEY });
      logger.info('API key deleted successfully', { id });
    },
    onError: (error: unknown, id) => {
      logger.error('Failed to delete API key', { error, id });
    },
  });
};