import { createTheme, type Theme } from '@mui/material/styles';

export function createMuiTheme(mode: 'light' | 'dark'): Theme {
  return createTheme({
    palette: {
      mode,
      primary: {
        main: mode === 'dark' ? '#3b82f6' : '#2563eb',
      },
      secondary: {
        main: mode === 'dark' ? '#10b981' : '#059669',
      },
      background: {
        default: mode === 'dark' ? '#0f172a' : '#ffffff',
        paper: mode === 'dark' ? '#1e293b' : '#f8fafc',
      },
      text: {
        primary: mode === 'dark' ? '#f1f5f9' : '#0f172a',
        secondary: mode === 'dark' ? '#94a3b8' : '#475569',
      },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 8,
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
    },
  });
}