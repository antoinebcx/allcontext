import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Box, Button, Typography, Paper, Container } from '@mui/material';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details in development
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Update state with error details
    this.setState({
      error,
      errorInfo,
    });

    // Auto-retry after 5 seconds (up to 3 times)
    if (this.state.retryCount < 3) {
      this.retryTimeoutId = setTimeout(() => {
        this.handleReset();
      }, 5000);
    }
  }

  componentWillUnmount() {
    // Clean up timeout if component unmounts
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  handleReset = () => {
    // Clear timeout if exists
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
      this.retryTimeoutId = null;
    }

    // Reset error state and increment retry count
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
    }));
  };

  handleRefresh = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      // Default error UI
      return (
        <Container maxWidth="sm">
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '100vh',
              textAlign: 'center',
              py: 4,
            }}
          >
            <Paper
              elevation={0}
              sx={{
                p: 4,
                width: '100%',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
              }}
            >
              <AlertTriangle
                size={48}
                style={{
                  color: '#ff9800',
                  marginBottom: '16px',
                }}
              />

              <Typography variant="h5" gutterBottom fontWeight={600}>
                Something went wrong
              </Typography>

              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ mb: 3 }}
              >
                We encountered an unexpected error. The application will try to
                recover automatically, or you can try refreshing the page.
              </Typography>

              {import.meta.env.DEV && this.state.error && (
                <Paper
                  sx={{
                    p: 2,
                    mb: 3,
                    bgcolor: 'grey.100',
                    border: '1px solid',
                    borderColor: 'grey.300',
                    borderRadius: 1,
                  }}
                >
                  <Typography
                    variant="caption"
                    component="pre"
                    sx={{
                      textAlign: 'left',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      fontFamily: 'monospace',
                    }}
                  >
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </Typography>
                </Paper>
              )}

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  onClick={this.handleReset}
                  startIcon={<RefreshCw size={18} />}
                  disabled={this.state.retryCount >= 3}
                >
                  Try Again
                </Button>

                <Button
                  variant="outlined"
                  onClick={this.handleRefresh}
                >
                  Refresh Page
                </Button>
              </Box>

              {this.state.retryCount > 0 && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 2, display: 'block' }}
                >
                  Retry attempt {this.state.retryCount} of 3
                </Typography>
              )}
            </Paper>
          </Box>
        </Container>
      );
    }

    return this.props.children;
  }
}
