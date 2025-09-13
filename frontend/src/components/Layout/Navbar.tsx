import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Box,
  Divider,
} from '@mui/material';
import { User, LogOut, Settings, Moon, Sun, BookOpen } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { mode, toggleTheme } = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll detection
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      setScrolled(isScrolled);
    };

    // Set initial state
    handleScroll();

    // Add event listener
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await logout();
    handleUserMenuClose();
  };

  const handleSettingsClick = () => {
    navigate('/settings');
    handleUserMenuClose();
  };

  const handleThemeToggle = () => {
    toggleTheme();
    handleUserMenuClose();
  };

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        bgcolor: 'transparent',
        borderBottom: scrolled ? 1 : 0,
        borderColor: 'divider',
        color: 'text.primary',
        backdropFilter: 'blur(8px)',
        transition: 'border-bottom 0.3s ease'
      }}
    >
      <Toolbar sx={{ gap: 1 }}>
        {/* Logo/Brand */}
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 600,
            cursor: 'pointer',
            mr: 2
          }}
          onClick={() => navigate('/')}
        >
          Contexthub
        </Typography>

        {/* Spacer */}
        <Box sx={{ flexGrow: 1 }} />

        {/* Navigation */}
        {user ? (
          <>
            {/* Authenticated user UI */}
            <Button
              startIcon={<BookOpen size={18} />}
              onClick={() => navigate('/docs')}
              sx={{
                color: location.pathname.startsWith('/docs') ? 'primary.main' : 'text.secondary',
                fontWeight: location.pathname.startsWith('/docs') ? 600 : 400,
                mr: -0.75
              }}
            >
              Docs
            </Button>

            <Button
              startIcon={<Settings size={18} />}
              onClick={() => navigate('/settings')}
              sx={{
                color: location.pathname === '/settings' ? 'primary.main' : 'text.secondary',
                fontWeight: location.pathname === '/settings' ? 600 : 400
              }}
            >
              Settings
            </Button>

            {/* User Menu */}
            <IconButton
              onClick={handleUserMenuOpen}
              size="small"
              sx={{
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <User size={18} />
            </IconButton>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleUserMenuClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              <MenuItem disabled>
                <Typography variant="body2" color="text.secondary">
                  {user?.email}
                </Typography>
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleThemeToggle}>
                {mode === 'light' ? (
                  <Moon size={16} style={{ marginRight: 8 }} />
                ) : (
                  <Sun size={16} style={{ marginRight: 8 }} />
                )}
                {mode === 'light' ? 'Dark Mode' : 'Light Mode'}
              </MenuItem>
              <MenuItem onClick={handleSettingsClick}>
                <Settings size={16} style={{ marginRight: 8 }} />
                Settings
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <LogOut size={16} style={{ marginRight: 8 }} />
                Logout
              </MenuItem>
            </Menu>
          </>
        ) : (
          <>
            {/* Non-authenticated user UI */}
            <Button
              startIcon={<BookOpen size={18} />}
              onClick={() => navigate('/docs')}
              sx={{
                color: location.pathname.startsWith('/docs') ? 'primary.main' : 'text.secondary',
                fontWeight: location.pathname.startsWith('/docs') ? 600 : 400
              }}
            >
              Docs
            </Button>
            <IconButton
              onClick={toggleTheme}
              size="small"
              title={mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              {mode === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </IconButton>
            <Button
              onClick={() => navigate('/login')}
              sx={{
                color: 'text.secondary',
                fontWeight: 400
              }}
            >
              Sign In
            </Button>
            <Button
              variant="contained"
              onClick={() => navigate('/login?signup=true')}
              sx={{
                fontWeight: 500
              }}
            >
              Sign Up
            </Button>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
};
