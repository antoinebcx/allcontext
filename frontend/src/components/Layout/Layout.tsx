import React from 'react';
import { Box, Container, Toolbar } from '@mui/material';
import { Navbar } from './Navbar';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      
      {/* Toolbar spacer to push content below fixed navbar */}
      <Toolbar />
      
      {/* Main content */}
      <Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default', py: 3 }}>
        <Container maxWidth="lg">
          {children}
        </Container>
      </Box>
    </Box>
  );
};