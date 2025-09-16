import { useMemo } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, CircularProgress } from '@mui/material';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';

import { createAppTheme } from './theme';
import { Layout } from './components/Layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { Settings } from './pages/Settings';
import { Docs } from './pages/Docs';
import { LoginPage } from './pages/LoginPage';
import { LegalPage } from './pages/LegalPage';
import { AuthCallback } from './pages/AuthCallback';
import { useAuth } from './contexts/AuthContext';
import { useTheme } from './contexts/ThemeContext';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  const { user, loading } = useAuth();
  const { mode } = useTheme();

  // Create theme based on current mode
  const theme = useMemo(() => createAppTheme(mode), [mode]);

  if (loading) {
    return (
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        bgcolor: mode === 'dark' ? '#121212' : '#fafafa'
      }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <Routes>
            {/* Login route without layout */}
            <Route path="/login" element={<LoginPage />} />

            {/* OAuth callback route */}
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* Legal routes without layout */}
            <Route path="/legal/:documentId" element={<LegalPage />} />

            {/* All other routes with layout */}
            <Route path="*" element={
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/docs" element={<Docs />} />
                  <Route path="/docs/:docId" element={<Docs />} />
                  <Route
                    path="/settings"
                    element={user ? <Settings /> : <Navigate to="/login?redirect=/settings" replace />}
                  />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Layout>
            } />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
