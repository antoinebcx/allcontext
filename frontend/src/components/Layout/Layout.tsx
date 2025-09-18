import React from 'react';
import { useLocation } from 'react-router-dom';
import { Box, Container, Toolbar } from '@mui/material';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { useAuth } from '../../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { user } = useAuth();
  const isDocsRoute = location.pathname.startsWith('/docs');

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />

      {/* Toolbar spacer to push content below fixed navbar */}
      <Toolbar />

      {/* Main content */}
      {isDocsRoute ? (
        // Docs route - no container, full width, fixed height
        <Box component="main" sx={{
          flexGrow: 1,
          bgcolor: 'background.default',
          display: 'flex',
          height: 'calc(100vh - 64px)',
          overflow: 'hidden'
        }}>
          {children}
        </Box>
      ) : (
        // Other routes - with container and padding
        <Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default', py: 3 }}>
          <Container maxWidth="lg">
            {children}
          </Container>
        </Box>
      )}

      {/* Footer - shown for non-authenticated users (except on docs pages) */}
      {!user && !isDocsRoute && <Footer />}
    </Box>
  );
};
