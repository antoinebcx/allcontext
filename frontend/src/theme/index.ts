import { createTheme, type PaletteMode } from '@mui/material/styles';

// Create theme based on mode
export const createAppTheme = (mode: PaletteMode) => {
  const isLight = mode === 'light';

  return createTheme({
    palette: {
      mode,
      primary: {
        main: isLight ? '#000000' : '#ffffff',
      },
      secondary: {
        main: isLight ? '#666666' : '#999999',
      },
      background: {
        default: isLight ? '#fafafa' : '#121212',
        paper: isLight ? '#ffffff' : '#1a1a1a',
      },
      text: {
        primary: isLight ? '#1a1a1a' : 'rgba(255, 255, 255, 0.87)',
        secondary: isLight ? '#666666' : 'rgba(255, 255, 255, 0.6)',
      },
      divider: isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)',
    },
    typography: {
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      h1: {
        fontSize: '2rem',
        fontWeight: 600,
      },
      h2: {
        fontSize: '1.5rem',
        fontWeight: 600,
      },
      h6: {
        fontSize: '1rem',
        fontWeight: 600,
      },
      body1: {
        fontSize: '0.875rem',
        lineHeight: 1.6,
      },
      caption: {
        fontSize: '0.75rem',
        color: isLight ? '#666666' : 'rgba(255, 255, 255, 0.6)',
      },
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiCard: {
        defaultProps: {
          variant: 'outlined',
          elevation: 0,
        },
        styleOverrides: {
          root: {
            borderColor: isLight ? '#e0e0e0' : 'rgba(255, 255, 255, 0.12)',
            transition: 'border-color 0.2s ease',
            '&:hover': {
              borderColor: isLight ? '#000000' : '#ffffff',
            },
          },
        },
      },
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 500,
            padding: '8px 16px',
          },
          contained: {
            backgroundColor: isLight ? '#000000' : '#ffffff',
            color: isLight ? '#ffffff' : '#000000',
            '&:hover': {
              backgroundColor: isLight ? '#1a1a1a' : '#f5f5f5',
            },
          },
          outlined: {
            borderColor: isLight ? '#e0e0e0' : 'rgba(255, 255, 255, 0.23)',
            color: isLight ? '#000000' : '#ffffff',
            '&:hover': {
              borderColor: isLight ? '#000000' : '#ffffff',
              backgroundColor: 'transparent',
            },
          },
        },
      },
      MuiTextField: {
        defaultProps: {
          variant: 'outlined',
          size: 'small',
        },
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: isLight ? '#e0e0e0' : 'rgba(255, 255, 255, 0.23)',
              },
              '&:hover fieldset': {
                borderColor: isLight ? '#999999' : 'rgba(255, 255, 255, 0.4)',
              },
              '&.Mui-focused fieldset': {
                borderColor: isLight ? '#000000' : '#ffffff',
              },
            },
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            padding: 8,
            '&:hover': {
              backgroundColor: isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.08)',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            backgroundImage: 'none',
            borderRadius: 8,
            marginTop: 8,
            minWidth: 180,
            border: '1px solid',
            borderColor: isLight ? '#e0e0e0' : 'rgba(255, 255, 255, 0.12)',
          },
        },
      },
      MuiDivider: {
        styleOverrides: {
          root: {
            borderColor: isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)',
          },
        },
      },
    },
  });
};

// Export default light theme for backwards compatibility
export const theme = createAppTheme('light');