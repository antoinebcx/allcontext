import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { supabase } from '../contexts/AuthContext';
import { logger } from '../utils/logger';

export const AuthCallback: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the hash from the URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');

        if (accessToken) {
          // Token is already handled by Supabase client automatically
          logger.info('OAuth callback received', { hasToken: true });
        }

        // Get the current session - Supabase handles the OAuth flow automatically
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          logger.error('OAuth callback error', { error });
          throw error;
        }

        if (session) {
          logger.info('OAuth successful', {
            provider: session.user?.app_metadata?.provider || 'unknown',
            email: session.user?.email
          });
          // Navigate to home or the originally requested page
          const redirectTo = sessionStorage.getItem('oauth_redirect') || '/';
          sessionStorage.removeItem('oauth_redirect');
          navigate(redirectTo);
        } else {
          logger.warn('No session after OAuth callback');
          navigate('/login');
        }
      } catch (error) {
        logger.error('OAuth callback error', { error });
        navigate('/login');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        bgcolor: 'background.default'
      }}
    >
      <CircularProgress size={40} thickness={2} />
      <Typography variant="body1" sx={{ mt: 2 }} color="text.secondary">
        Completing sign in...
      </Typography>
    </Box>
  );
};
