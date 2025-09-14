import React, { createContext, useState, useEffect, useContext } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config/env';
import { logger } from '../utils/logger';
import { getErrorMessage } from '../utils/errors';

// Initialize Supabase client with error handling
let supabase: SupabaseClient;

try {
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } else {
    logger.warn('Supabase configuration missing');
    // Create a dummy client that will fail gracefully
    supabase = {} as SupabaseClient;
  }
} catch (error) {
  logger.error('Failed to initialize Supabase client', { error });
  supabase = {} as SupabaseClient;
}

// Types
interface User {
  id: string;
  email?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error?: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError?: () => void;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Export hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if Supabase is properly initialized
    if (!supabase.auth) {
      logger.warn('Supabase auth not available');
      setLoading(false);
      return;
    }

    // Check for existing session on mount
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          logger.error('Failed to get session', { error });
          setError(getErrorMessage(error));
        } else if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email
          });
          logger.info('User authenticated', { userId: session.user.id });
        }
      } catch (error) {
        logger.error('Auth initialization error', { error });
        setError('Failed to initialize authentication');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth state changes
    let subscription: any;
    try {
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email
          });
          setError(null);
        } else {
          setUser(null);
        }
      });
      subscription = data.subscription;
    } catch (error) {
      logger.error('Failed to setup auth listener', { error });
    }

    // Cleanup subscription
    return () => {
      if (subscription?.unsubscribe) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const login = async (email: string, password: string) => {
    if (!supabase.auth) {
      throw new Error('Authentication service is not available');
    }

    try {
      setError(null);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        logger.error('Login failed', { error, email });
        throw error;
      }

      if (data.user) {
        setUser({
          id: data.user.id,
          email: data.user.email
        });
        logger.info('User logged in', { userId: data.user.id });
      }
    } catch (error) {
      const message = getErrorMessage(error);
      setError(message);
      throw error;
    }
  };

  const signup = async (email: string, password: string) => {
    if (!supabase.auth) {
      throw new Error('Authentication service is not available');
    }

    try {
      setError(null);
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      });

      if (error) {
        logger.error('Signup failed', { error, email });
        throw error;
      }

      if (data.user) {
        setUser({
          id: data.user.id,
          email: data.user.email
        });
        logger.info('User signed up', { userId: data.user.id });
      }
    } catch (error) {
      const message = getErrorMessage(error);
      setError(message);
      throw error;
    }
  };

  const logout = async () => {
    if (!supabase.auth) {
      setUser(null);
      return;
    }

    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        logger.error('Logout error', { error });
        // Still clear the user even if logout fails
      }
      setUser(null);
      setError(null);
      logger.info('User logged out');
    } catch (error) {
      logger.error('Logout failed', { error });
      // Clear user state anyway
      setUser(null);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider value={{ user, loading, error, login, signup, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
};

// Export supabase client for use in other components
export { supabase };