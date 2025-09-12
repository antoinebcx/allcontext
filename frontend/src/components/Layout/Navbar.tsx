import React, { useState } from 'react';
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
import { User, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

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

  return (
    <AppBar 
      position="fixed" 
      elevation={0}
      sx={{ 
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
        color: 'text.primary'
      }}
    >
      <Toolbar sx={{ gap: 2 }}>
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
          <MenuItem onClick={handleSettingsClick}>
            <Settings size={16} style={{ marginRight: 8 }} />
            Settings
          </MenuItem>
          <MenuItem onClick={handleLogout}>
            <LogOut size={16} style={{ marginRight: 8 }} />
            Logout
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};