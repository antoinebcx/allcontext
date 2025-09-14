import React from 'react';
import { Box, Typography, Button, Alert } from '@mui/material';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ErrorFallbackProps {
  error?: Error | string;
  resetError?: () => void;
  message?: string;
  showHomeButton?: boolean;
  compact?: boolean;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetError,
  message,
  showHomeButton = true,
  compact = false,
}) => {
  const navigate = useNavigate();

  const errorMessage = message || 'Something went wrong. Please try again.';
  const errorDetail = error instanceof Error ? error.message : error;

  const handleGoHome = () => {
    navigate('/');
    if (resetError) {
      resetError();
    }
  };

  // Compact version for inline errors
  if (compact) {
    return (
      <Alert
        severity="error"
        action={
          resetError && (
            <Button
              color="inherit"
              size="small"
              onClick={resetError}
              startIcon={<RefreshCw size={16} />}
            >
              Retry
            </Button>
          )
        }
      >
        {errorMessage}
      </Alert>
    );
  }

  // Full page error fallback
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
        p: 3,
      }}
    >
      <AlertCircle
        size={64}
        style={{
          color: '#f44336',
          marginBottom: '24px',
        }}
      />

      <Typography variant="h5" gutterBottom fontWeight={600}>
        Oops! Something went wrong
      </Typography>

      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ mb: 3, maxWidth: 500 }}
      >
        {errorMessage}
      </Typography>

      {import.meta.env.DEV && errorDetail && (
        <Alert
          severity="error"
          sx={{
            mb: 3,
            maxWidth: 600,
            width: '100%',
            textAlign: 'left',
          }}
        >
          <Typography variant="caption" component="pre">
            {errorDetail}
          </Typography>
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 2 }}>
        {resetError && (
          <Button
            variant="contained"
            onClick={resetError}
            startIcon={<RefreshCw size={18} />}
          >
            Try Again
          </Button>
        )}

        {showHomeButton && (
          <Button
            variant={resetError ? 'outlined' : 'contained'}
            onClick={handleGoHome}
            startIcon={<Home size={18} />}
          >
            Go Home
          </Button>
        )}
      </Box>
    </Box>
  );
};
