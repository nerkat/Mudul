// src/design/theme.ts
import { createTheme, type Theme } from '@mui/material/styles';
import { getTokensForTheme, px, shadow } from './tokens';

export function createAppTheme(mode: 'light' | 'dark' = 'dark'): Theme {
  const tokens = getTokensForTheme(mode);
  
  return createTheme({
    palette: {
      mode,
      primary:   { main: tokens.color.brand.base },
      success:   { main: tokens.color.success },
      warning:   { main: tokens.color.warning },
      error:     { main: tokens.color.error },
      background:{ default: tokens.color.bg.base, paper: tokens.color.bg.surface },
      text:      { 
        primary: tokens.color.text.primary, 
        secondary: tokens.color.text.secondary,
        disabled: tokens.color.text.muted  // Map muted to disabled for consistency
      }
    },
    shape: { borderRadius: tokens.radius.lg },
    spacing: (factor: number) => `${tokens.space.xs * factor}px`, // Use token-based spacing
    typography: {
      fontFamily: tokens.font.family,
      h1: { fontSize: px(tokens.font.size.h1), fontWeight: 600 },
      h2: { fontSize: px(tokens.font.size.h2), fontWeight: 600 },
      h6: { fontSize: px(tokens.font.size.lg), fontWeight: 600 }, // Used for widget titles
      body1: { fontSize: px(tokens.font.size.lg) },
      body2: { fontSize: px(tokens.font.size.md) },
      caption: { fontSize: px(tokens.font.size.sm) }
    },
    components: {
      MuiButton: { 
        styleOverrides: { 
          root: { 
            borderRadius: px(tokens.radius.lg),
            textTransform: 'none', // Prevent uppercase transformation
            fontWeight: 500
          } 
        } 
      },
      MuiChip: { 
        styleOverrides: { 
          root: { 
            borderColor: tokens.color.chip.border, 
            backgroundColor: tokens.color.chip.bg,
            borderRadius: px(tokens.radius.sm)
          } 
        } 
      },
      MuiPaper: { 
        styleOverrides: { 
          root: { 
            borderRadius: px(tokens.radius.lg), 
            boxShadow: shadow(tokens.shadow.md),
            border: `1px solid ${tokens.color.chip.border}`, // Add subtle border
          } 
        } 
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: px(tokens.radius.lg),
          },
          standardError: {
            backgroundColor: `${tokens.color.error}15`, // 15% opacity
            border: `1px solid ${tokens.color.error}30`,
            color: tokens.color.error,
          },
          standardWarning: {
            backgroundColor: `${tokens.color.warning}15`,
            border: `1px solid ${tokens.color.warning}30`, 
            color: tokens.color.warning,
          }
        }
      },
      MuiList: {
        styleOverrides: {
          root: {
            padding: 0, // Remove default padding for dense lists
          }
        }
      },
      MuiListItem: {
        styleOverrides: {
          root: {
            paddingLeft: 0,
            paddingRight: 0,
          }
        }
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: tokens.color.bg.surface,
            borderRadius: 0,
            border: 0,
            boxShadow: 'none',
            borderRight: `1px solid ${tokens.color.chip.border}`,
          }
        }
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: tokens.color.bg.surface,
            borderRadius: 0,
            border: 0,
            borderBottom: `1px solid ${tokens.color.chip.border}`,
            boxShadow: 'none', // Remove default shadow
          }
        }
      }
    }
  });
}

// Default dark theme
export const appTheme = createAppTheme('dark');