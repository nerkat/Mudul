import React, { useEffect, useMemo } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { createAppTheme } from './theme';
import { getTokensForTheme, injectCssVars } from './tokens';
import { ThemeProvider as AppThemeProvider } from '../theme/theme';
import { useTheme as useAppTheme } from '../theme/hooks';

// Inject initial CSS variables synchronously before first render
if (typeof window !== 'undefined') {
  const initialTokens = getTokensForTheme('dark'); // Default to dark theme
  injectCssVars(initialTokens);
}

function MuiThemeProviderInner({ children }: { children: React.ReactNode }) {
  const { theme: appTheme } = useAppTheme();
  
  // Resolve effective theme mode
  const effectiveMode = useMemo(() => {
    if (appTheme === 'system') {
      // Check system preference
      if (typeof window !== 'undefined') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      return 'dark'; // Default fallback
    }
    return appTheme;
  }, [appTheme]);
  
  // Create MUI theme based on effective mode
  const muiTheme = useMemo(() => {
    return createAppTheme(effectiveMode);
  }, [effectiveMode]);
  
  // Inject CSS variables when theme changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const tokens = getTokensForTheme(effectiveMode);
      injectCssVars(tokens);
    }
  }, [effectiveMode]);
  
  return (
    <ThemeProvider theme={muiTheme}>
      {children}
    </ThemeProvider>
  );
}

export function MuiThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <AppThemeProvider>
      <MuiThemeProviderInner>
        {children}
      </MuiThemeProviderInner>
    </AppThemeProvider>
  );
}