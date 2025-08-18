// src/design/theme.ts
import { createTheme } from '@mui/material/styles';
import { tokens } from './tokens';

export const appTheme = createTheme({
  palette: {
    mode: 'dark',
    primary:   { main: tokens.color.brand[600] },
    success:   { main: tokens.color.success },
    warning:   { main: tokens.color.warning },
    error:     { main: tokens.color.error },
    background:{ default: tokens.color.bg.base, paper: tokens.color.bg.surface },
    text:      { primary: tokens.color.text.primary, secondary: tokens.color.text.secondary }
  },
  shape: { borderRadius: tokens.radius.md },
  typography: {
    fontFamily: tokens.font.family,
    h1: { fontSize: tokens.font.size.h1, fontWeight: 600 },
    h2: { fontSize: tokens.font.size.h2, fontWeight: 600 },
    body1: { fontSize: tokens.font.size.lg },
    body2: { fontSize: tokens.font.size.md }
  },
  components: {
    MuiButton: { styleOverrides: { root: { borderRadius: tokens.radius.lg } } },
    MuiChip:   { styleOverrides: { root: { borderColor: tokens.color.chip.border, background: tokens.color.chip.bg } } },
    MuiPaper:  { styleOverrides: { root: { borderRadius: tokens.radius.lg, boxShadow: tokens.shadow.md } } },
  }
});