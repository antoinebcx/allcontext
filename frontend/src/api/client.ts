import axios from 'axios';
import { supabase } from '../contexts/AuthContext';
import type {
  Artifact,
  ArtifactCreate,
  ArtifactUpdate,
  ArtifactList,
  ArtifactSearchResult,
  ApiKey,
  ApiKeyCreate,
  ApiKeyCreated,
  ApiKeyUpdate,
  ApiKeyList
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    // Get the current session from Supabase
    const { data: { session } } = await supabase.auth.getSession();
    
    // Add auth token if available
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
    }
    return Promise.reject(error);
  }
);

// API functions
export const artifactApi = {
  list: async () => {
    const response = await apiClient.get<ArtifactList>('/api/v1/artifacts');
    return response.data;
  },

  get: async (id: string) => {
    const response = await apiClient.get<Artifact>(`/api/v1/artifacts/${id}`);
    return response.data;
  },

  create: async (data: ArtifactCreate) => {
    const response = await apiClient.post<Artifact>('/api/v1/artifacts', data);
    return response.data;
  },

  update: async (id: string, data: ArtifactUpdate) => {
    const response = await apiClient.put<Artifact>(`/api/v1/artifacts/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/api/v1/artifacts/${id}`);
  },

  search: async (query: string) => {
    const params = { q: query };
    const response = await apiClient.get<ArtifactSearchResult[]>('/api/v1/artifacts/search', { params });
    return response.data;
  },
};

export const apiKeyApi = {
  list: async () => {
    const response = await apiClient.get<ApiKeyList>('/api/v1/api-keys');
    return response.data;
  },

  create: async (data: ApiKeyCreate) => {
    const response = await apiClient.post<ApiKeyCreated>('/api/v1/api-keys', data);
    return response.data;
  },

  update: async (id: string, data: ApiKeyUpdate) => {
    const response = await apiClient.put<ApiKey>(`/api/v1/api-keys/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/api/v1/api-keys/${id}`);
  },
};
