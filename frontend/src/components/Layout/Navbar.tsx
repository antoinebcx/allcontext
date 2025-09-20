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
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  useTheme as useMuiTheme,
} from '@mui/material';
import { User, LogOut, Settings, Moon, Sun, BookOpen, Menu as MenuIcon, X, Home } from 'lucide-react';
import { GitHub as GitHubIcon } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { mode, toggleTheme } = useTheme();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Handle scroll detection
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const isScrolled = scrollY > 10;
      setScrolled(isScrolled);

      // Progress from 0 to 1 over 80px of scroll
      const progress = Math.min(Math.max(scrollY - 20, 0) / 80, 1);
      setScrollProgress(progress);
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

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuOpen(false);
  };

  const handleMobileNavigation = (path: string) => {
    navigate(path);
    handleMobileMenuClose();
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
          <Box component="span" sx={{ display: 'inline-flex', alignItems: 'baseline' }}>
            {'{ '}All
            {!isMobile && (
              <Box
                component="span"
                sx={{
                  display: 'inline-block',
                  maxWidth: `${(1 - scrollProgress) * 65}px`,
                  opacity: 1 - scrollProgress,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                }}
              >
                context
              </Box>
            )}
            <span>&nbsp;</span>
            {'}'}
          </Box>
        </Typography>

        {/* Spacer */}
        <Box sx={{ flexGrow: 1 }} />

        {/* Desktop Navigation */}
        {!isMobile && user ? (
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
              <MenuItem
                component="a"
                href="https://github.com/antoinebcx/allcontext"
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  color: 'inherit',
                  textDecoration: 'none',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                <GitHubIcon sx={{ fontSize: 16, mr: 1 }} />
                GitHub
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <LogOut size={16} style={{ marginRight: 8 }} />
                Logout
              </MenuItem>
            </Menu>
          </>
        ) : !isMobile && !user ? (
          <>
            {/* Non-authenticated Desktop UI */}
            <Button
              startIcon={<BookOpen size={18} />}
              onClick={() => navigate('/docs')}
              sx={{
                color: location.pathname.startsWith('/docs') ? 'primary.main' : 'text.secondary',
                fontWeight: location.pathname.startsWith('/docs') ? 600 : 400,
                mr: -0.5
              }}
            >
              Docs
            </Button>
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
        ) : null}

        {/* Mobile Menu Button - Right Side */}
        {isMobile && (
          <IconButton
            edge="end"
            onClick={handleMobileMenuToggle}
            sx={{
              ml: 1,
              mr: -0.5,
              color: 'text.secondary'
            }}
          >
            {mobileMenuOpen ? <X size={24} /> : <MenuIcon size={24} />}
          </IconButton>
        )}
      </Toolbar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="left"
        open={mobileMenuOpen}
        onClose={handleMobileMenuClose}
        sx={{
          '& .MuiDrawer-paper': {
            width: 280,
            bgcolor: 'background.default',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        <Box sx={{ p: 2, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
            Menu
          </Typography>

          <List sx={{ flexGrow: 1 }}>
            {/* Home Link */}
            <ListItem disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                onClick={() => handleMobileNavigation('/')}
                selected={location.pathname === '/'}
                sx={{ borderRadius: 1 }}
              >
                <ListItemIcon>
                  <Home size={20} />
                </ListItemIcon>
                <ListItemText primary="Home" />
              </ListItemButton>
            </ListItem>

            {/* Docs Link */}
            <ListItem disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                onClick={() => handleMobileNavigation('/docs')}
                selected={location.pathname.startsWith('/docs')}
                sx={{ borderRadius: 1 }}
              >
                <ListItemIcon>
                  <BookOpen size={20} />
                </ListItemIcon>
                <ListItemText primary="Documentation" />
              </ListItemButton>
            </ListItem>

            {/* Settings Link (authenticated only) */}
            {user && (
              <ListItem disablePadding sx={{ mb: 1 }}>
                <ListItemButton
                  onClick={() => handleMobileNavigation('/settings')}
                  selected={location.pathname === '/settings'}
                  sx={{ borderRadius: 1 }}
                >
                  <ListItemIcon>
                    <Settings size={20} />
                  </ListItemIcon>
                  <ListItemText primary="Settings" />
                </ListItemButton>
              </ListItem>
            )}

            {/* Theme Toggle */}
            <ListItem disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                onClick={() => {
                  toggleTheme();
                  handleMobileMenuClose();
                }}
                sx={{ borderRadius: 1 }}
              >
                <ListItemIcon>
                  {mode === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </ListItemIcon>
                <ListItemText primary={mode === 'light' ? 'Dark Mode' : 'Light Mode'} />
              </ListItemButton>
            </ListItem>

            {/* GitHub Link */}
            <ListItem disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                component="a"
                href="https://github.com/antoinebcx/allcontext"
                target="_blank"
                rel="noopener noreferrer"
                sx={{ borderRadius: 1 }}
              >
                <ListItemIcon>
                  <GitHubIcon sx={{ fontSize: 20 }} />
                </ListItemIcon>
                <ListItemText primary="GitHub" />
              </ListItemButton>
            </ListItem>

            {/* Auth Links */}
            {!user && (
              <>
                <Divider sx={{ my: 2 }} />
                <ListItem disablePadding sx={{ mb: 1 }}>
                  <ListItemButton
                    onClick={() => handleMobileNavigation('/login')}
                    sx={{ borderRadius: 1 }}
                  >
                    <ListItemText primary="Sign In" />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={() => handleMobileNavigation('/login?signup=true')}
                    sx={{
                      borderRadius: 1,
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      '&:hover': {
                        bgcolor: 'primary.dark',
                      },
                    }}
                  >
                    <ListItemText primary="Sign Up" />
                  </ListItemButton>
                </ListItem>
              </>
            )}
          </List>

          {/* User Section at Bottom */}
          {user && (
            <>
              <Divider sx={{ mt: 2, mb: 2 }} />
              <Box sx={{ px: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, px: 1 }}>
                  {user.email}
                </Typography>
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={() => {
                      handleLogout();
                      handleMobileMenuClose();
                    }}
                    sx={{ borderRadius: 1 }}
                  >
                    <ListItemIcon>
                      <LogOut size={20} />
                    </ListItemIcon>
                    <ListItemText primary="Logout" />
                  </ListItemButton>
                </ListItem>
              </Box>
            </>
          )}
        </Box>
      </Drawer>
    </AppBar>
  );
};
