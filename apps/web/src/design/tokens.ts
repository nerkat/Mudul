// src/design/tokens.ts

// Base tokens with unitless values
const baseTokens = {
  radius: { sm: 6, md: 10, lg: 14, xl: 20 },
  space:  { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },
  shadow: { 
    sm: [0, 1, 2, 0.25], // [x, y, blur, alpha] 
    md: [0, 6, 16, 0.35] 
  },
  font:   { 
    family: '"Inter", ui-sans-serif, system-ui', 
    size: { sm: 12, md: 14, lg: 16, xl: 18, h1: 28, h2: 22 } 
  }
} as const;

// Dark theme colors
const darkColors = {
  bg:    { base: "#0B0F14", surface: "#11161C", elevated: "#161C24" },
  text:  { primary: "#E6EEF8", secondary: "#A9B6C6", muted: "#7E8BA0" },
  brand: { 
    base: "#4C8CF6", 
    hover: "#3976EA", 
    active: "#295FCC",
    // Legacy support
    600: "#4C8CF6", 
    700: "#3976EA", 
    800: "#295FCC" 
  },
  success: "#15B77E",
  warning: "#F5A524",
  error:   "#F04438",
  chip:    { border: "#213044", bg: "#132033" }
};

// Light theme colors
const lightColors = {
  bg:    { base: "#FFFFFF", surface: "#F8FAFC", elevated: "#FFFFFF" },
  text:  { primary: "#1A202C", secondary: "#4A5568", muted: "#718096" },
  brand: { 
    base: "#3182CE", 
    hover: "#2C5282", 
    active: "#2A4365",
    // Legacy support
    600: "#3182CE", 
    700: "#2C5282", 
    800: "#2A4365" 
  },
  success: "#38A169",
  warning: "#D69E2E",
  error:   "#E53E3E",
  chip:    { border: "#E2E8F0", bg: "#F7FAFC" }
};

// Current tokens (dark by default)
export const tokens = {
  color: darkColors,
  ...baseTokens
} as const;

// Function to get tokens for specific theme
export const getTokensForTheme = (mode: 'light' | 'dark') => ({
  color: mode === 'light' ? lightColors : darkColors,
  ...baseTokens
});

// Helper functions for unit conversion
export const px = (n: number) => `${n}px`;
export const rem = (n: number) => `${n / 16}rem`;
export const shadow = (values: readonly number[]) => {
  const [x, y, blur, alpha] = values;
  return `${x}px ${y}px ${blur}px rgba(0,0,0,${alpha})`;
};

// Define the tokens type
export type Tokens = typeof tokens;

// CSS variables emission utility
export function toCssVars(tokensInput: Tokens): Record<string, string> {
  return {
    // Colors
    '--bg-base': tokensInput.color.bg.base,
    '--bg-surface': tokensInput.color.bg.surface,
    '--bg-elevated': tokensInput.color.bg.elevated,
    '--text-primary': tokensInput.color.text.primary,
    '--text-secondary': tokensInput.color.text.secondary,
    '--text-muted': tokensInput.color.text.muted,
    '--brand-base': tokensInput.color.brand.base,
    '--brand-hover': tokensInput.color.brand.hover,
    '--brand-active': tokensInput.color.brand.active,
    '--success': tokensInput.color.success,
    '--warning': tokensInput.color.warning,
    '--error': tokensInput.color.error,
    '--chip-border': tokensInput.color.chip.border,
    '--chip-bg': tokensInput.color.chip.bg,
    
    // Spacing
    '--space-xs': px(tokensInput.space.xs),
    '--space-sm': px(tokensInput.space.sm),
    '--space-md': px(tokensInput.space.md),
    '--space-lg': px(tokensInput.space.lg),
    '--space-xl': px(tokensInput.space.xl),
    '--space-xxl': px(tokensInput.space.xxl),
    
    // Radius
    '--radius-sm': px(tokensInput.radius.sm),
    '--radius-md': px(tokensInput.radius.md),
    '--radius-lg': px(tokensInput.radius.lg),
    '--radius-xl': px(tokensInput.radius.xl),
    
    // Shadows
    '--shadow-sm': shadow(tokensInput.shadow.sm),
    '--shadow-md': shadow(tokensInput.shadow.md),
    
    // Typography
    '--font-family': tokensInput.font.family,
    '--font-size-sm': px(tokensInput.font.size.sm),
    '--font-size-md': px(tokensInput.font.size.md),
    '--font-size-lg': px(tokensInput.font.size.lg),
    '--font-size-xl': px(tokensInput.font.size.xl),
    '--font-size-h1': px(tokensInput.font.size.h1),
    '--font-size-h2': px(tokensInput.font.size.h2),
  };
}

// Inject CSS variables into document root
export function injectCssVars(tokensInput: Tokens): void {
  // Guard for SSR
  if (typeof window === 'undefined') return;
  if (typeof document === 'undefined') return;
  
  const root = document.documentElement;
  const vars = toCssVars(tokensInput);
  
  Object.entries(vars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}