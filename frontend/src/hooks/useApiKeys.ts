import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiKeyApi } from '../api/client';
import type { ApiKeyCreate, ApiKeyUpdate } from '../types';

// Query keys
const API_KEYS_QUERY_KEY = ['apiKeys'];

// Queries
export const useApiKeys = () => {
  return useQuery({
    queryKey: API_KEYS_QUERY_KEY,
    queryFn: apiKeyApi.list,
  });
};

// Mutations
export const useCreateApiKey = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ApiKeyCreate) => apiKeyApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: API_KEYS_QUERY_KEY });
    },
  });
};

export const useUpdateApiKey = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ApiKeyUpdate }) => 
      apiKeyApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: API_KEYS_QUERY_KEY });
    },
  });
};

export const useDeleteApiKey = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiKeyApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: API_KEYS_QUERY_KEY });
    },
  });
};