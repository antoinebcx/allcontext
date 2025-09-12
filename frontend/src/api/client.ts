import axios from 'axios';
import { supabase } from '../contexts/AuthContext';

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

// Type definitions
export interface Artifact {
  id: string;
  user_id: string;
  title: string;
  content: string;
  metadata: Record<string, any>;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  version: number;
}

export interface ArtifactCreate {
  title?: string;
  content: string;
  metadata?: Record<string, any>;
  is_public?: boolean;
}

export interface ArtifactUpdate {
  title?: string;
  content?: string;
  metadata?: Record<string, any>;
  is_public?: boolean;
}

// API Key types
export interface ApiKey {
  id: string;
  user_id: string;
  name: string;
  key_prefix: string;
  last_4: string;
  last_used_at: string | null;
  expires_at: string | null;
  scopes: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiKeyCreate {
  name: string;
  expires_at?: string;
  scopes?: string[];
}

export interface ApiKeyCreated extends ApiKey {
  api_key: string;
}

export interface ApiKeyUpdate {
  name?: string;
  scopes?: string[];
  is_active?: boolean;
}

// API functions
export const artifactApi = {
  list: async () => {
    const response = await apiClient.get<{
      items: Artifact[];
      total: number;
      page: number;
      page_size: number;
    }>('/api/v1/artifacts');
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
    const response = await apiClient.get<Artifact[]>('/api/v1/artifacts/search', { params });
    return response.data;
  },
};

export const apiKeyApi = {
  list: async () => {
    const response = await apiClient.get<{
      items: ApiKey[];
      total: number;
    }>('/api/v1/api-keys');
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
