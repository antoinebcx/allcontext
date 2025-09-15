import React from 'react';
import { Box, Container, Link, Divider, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export const Footer: React.FC = () => {
  const navigate = useNavigate();

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

            <Divider orientation="vertical" flexItem sx={{ height: 16 }} />

            {/* Legal Links */}
            <Box
              sx={{
                display: 'flex',
                gap: 2,
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

              <Divider orientation="vertical" flexItem sx={{ height: 16 }} />

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
            </Box>
          </Box>
        </Container>
      </Box>
  );
};
