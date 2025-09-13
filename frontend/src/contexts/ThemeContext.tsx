import React, { createContext, useState, useEffect, useContext, useMemo } from 'react';
import { useMediaQuery } from '@mui/material';

type ThemeMode = 'light' | 'dark' | 'system';
type ResolvedMode = 'light' | 'dark';

interface ThemeContextType {
  mode: ResolvedMode;           // The actual mode being used (resolved)
  themeMode: ThemeMode;         // User's preference (can be 'system')
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'theme-mode';

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Detect system preference
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  // Get stored preference or default to 'system'
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
    return 'system';
  });

  // Resolve the actual mode to use
  const mode = useMemo<ResolvedMode>(() => {
    if (themeMode === 'system') {
      return prefersDarkMode ? 'dark' : 'light';
    }
    return themeMode;
  }, [themeMode, prefersDarkMode]);

  // Save preference to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, themeMode);
  }, [themeMode]);

  // Toggle between light and dark (not system)
  const toggleTheme = () => {
    setThemeMode(prevMode => {
      // If currently system, switch to opposite of current resolved mode
      if (prevMode === 'system') {
        return mode === 'light' ? 'dark' : 'light';
      }
      // Otherwise just toggle between light and dark
      return prevMode === 'light' ? 'dark' : 'light';
    });
  };

  const value = useMemo(
    () => ({
      mode,
      themeMode,
      setThemeMode,
      toggleTheme,
    }),
    [mode, themeMode]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};