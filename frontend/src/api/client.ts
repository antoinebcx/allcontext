import axios, { AxiosError } from 'axios';
import type { AxiosInstance } from 'axios';
import { supabase } from '../contexts/AuthContext';
import { logger } from '../utils/logger';
import { createAppError, isRetryableError } from '../utils/errors';
import { API_URL } from '../config/env';
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

// Configuration
const TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY_BASE = 1000; // 1 second

// Create axios instance with timeout
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Retry logic helper
async function retryRequest(
  fn: () => Promise<any>,
  retries = MAX_RETRIES
): Promise<any> {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0 && isRetryableError(error)) {
      const delay = RETRY_DELAY_BASE * Math.pow(2, MAX_RETRIES - retries);
      logger.debug(`Retrying request in ${delay}ms`, { retriesLeft: retries });

      await new Promise(resolve => setTimeout(resolve, delay));
      return retryRequest(fn, retries - 1);
    }
    throw error;
  }
}

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // Get the current session from Supabase
      const { data: { session } } = await supabase.auth.getSession();

      // Add auth token if available
      if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
      }

      // Log request in development
      logger.debug('API Request', {
        method: config.method,
        url: config.url,
        hasAuth: !!session?.access_token,
      });

      return config;
    } catch (error) {
      logger.error('Request interceptor error', { error });
      return config;
    }
  },
  (error) => {
    logger.error('Request configuration error', { error });
    return Promise.reject(createAppError(error));
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    logger.debug('API Response', {
      status: response.status,
      url: response.config.url,
    });
    return response;
  },
  async (error: AxiosError) => {
    const appError = createAppError(error);

    // Log error details
    logger.error('API Error', {
      status: error.response?.status,
      url: error.config?.url,
      message: appError.message,
    });

    // Handle 401 - try to refresh token
    if (error.response?.status === 401) {
      try {
        const { data: { session } } = await supabase.auth.refreshSession();
        if (session) {
          // Retry the original request with new token
          const originalRequest = error.config;
          if (originalRequest) {
            originalRequest.headers.Authorization = `Bearer ${session.access_token}`;
            return apiClient(originalRequest);
          }
        }
      } catch (refreshError) {
        logger.error('Token refresh failed', { refreshError });
        // Redirect to login will be handled by auth context
      }
    }

    return Promise.reject(appError);
  }
);

// API functions with retry logic
export const artifactApi = {
  list: async () => {
    return retryRequest(async () => {
      const response = await apiClient.get<ArtifactList>('/api/v1/artifacts');
      return response.data;
    });
  },

  get: async (id: string) => {
    return retryRequest(async () => {
      const response = await apiClient.get<Artifact>(`/api/v1/artifacts/${id}`);
      return response.data;
    });
  },

  create: async (data: ArtifactCreate) => {
    // Don't retry mutations by default
    const response = await apiClient.post<Artifact>('/api/v1/artifacts', data);
    return response.data;
  },

  update: async (id: string, data: ArtifactUpdate) => {
    // Don't retry mutations by default
    const response = await apiClient.put<Artifact>(`/api/v1/artifacts/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    // Don't retry delete operations
    await apiClient.delete(`/api/v1/artifacts/${id}`);
  },

  search: async (query: string, signal?: AbortSignal) => {
    return retryRequest(async () => {
      const params = { q: query };
      const response = await apiClient.get<ArtifactSearchResult[]>(
        '/api/v1/artifacts/search',
        { params, signal }
      );
      return response.data;
    });
  },
};

export const apiKeyApi = {
  list: async () => {
    return retryRequest(async () => {
      const response = await apiClient.get<ApiKeyList>('/api/v1/api-keys');
      return response.data;
    });
  },

  create: async (data: ApiKeyCreate) => {
    // Don't retry mutations
    const response = await apiClient.post<ApiKeyCreated>('/api/v1/api-keys', data);
    return response.data;
  },

  update: async (id: string, data: ApiKeyUpdate) => {
    // Don't retry mutations
    const response = await apiClient.put<ApiKey>(`/api/v1/api-keys/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    // Don't retry delete operations
    await apiClient.delete(`/api/v1/api-keys/${id}`);
  },
};
