// src/design/tokens.ts
export const tokens = {
  color: {
    bg:    { base: "#0B0F14", surface: "#11161C", elevated: "#161C24" },
    text:  { primary: "#E6EEF8", secondary: "#A9B6C6", muted: "#7E8BA0" },
    brand: { 600: "#4C8CF6", 700: "#3976EA", 800: "#295FCC" },
    success: "#15B77E",
    warning: "#F5A524",
    error:   "#F04438",
    chip:    { border: "#213044", bg: "#132033" }
  },
  radius: { sm: 6, md: 10, lg: 14, xl: 20 },
  space:  { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },
  shadow: { sm: "0 1px 2px rgba(0,0,0,.25)", md: "0 6px 16px rgba(0,0,0,.35)" },
  font:   { family: `"Inter", ui-sans-serif, system-ui`, size: { sm: 12, md: 14, lg: 16, xl: 18, h1: 28, h2: 22 } }
};