import React from 'react';
import { Box, Container, Link, Divider, Typography, IconButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

export const Footer: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { mode, toggleTheme } = useTheme();

  const handleLegalLinkClick = (docId: string) => {
    navigate(`/legal/${docId}`);
  };

  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 4,
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'center',
            alignItems: 'center',
            gap: 3,
          }}
        >
            <Typography
              variant="body2"
              color="text.secondary"
            >
              © 2025 Allcontext
            </Typography>

            <Divider orientation="vertical" flexItem sx={{ height: 16, alignSelf: 'center' }} />

            {/* Legal Links */}
            <Box
              sx={{
                display: 'flex',
                gap: 3,
                alignItems: 'center',
              }}
            >
              <Link
                component="button"
                variant="body2"
                color="text.secondary"
                onClick={() => handleLegalLinkClick('terms-of-service')}
                sx={{
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline',
                    color: 'primary.main',
                  },
                  cursor: 'pointer',
                  border: 'none',
                  background: 'none',
                  padding: 0,
                  font: 'inherit',
                }}
              >
                Terms of Service
              </Link>

              <Divider orientation="vertical" flexItem sx={{ height: 16, alignSelf: 'center' }} />

              <Link
                component="button"
                variant="body2"
                color="text.secondary"
                onClick={() => handleLegalLinkClick('privacy-policy')}
                sx={{
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline',
                    color: 'primary.main',
                  },
                  cursor: 'pointer',
                  border: 'none',
                  background: 'none',
                  padding: 0,
                  font: 'inherit',
                }}
              >
                Privacy Policy
              </Link>

              {/* Theme Toggle for non-authenticated users */}
              {!user && (
                <>
                  <Divider orientation="vertical" flexItem sx={{ height: 16, alignSelf: 'center' }} />
                  <IconButton
                    onClick={toggleTheme}
                    size="small"
                    title={mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
                    sx={{ color: 'text.secondary' }}
                  >
                    {mode === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                  </IconButton>
                </>
              )}
            </Box>
          </Box>
        </Container>
      </Box>
  );
};
