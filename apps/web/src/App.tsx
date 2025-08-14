import { useState } from "react";
import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import { lightTheme, darkTheme } from "./theme";
import { AppShell } from "./shell/AppShell";
import { RepoProvider } from "./hooks/useRepo";
import { ViewModeProvider } from "./ctx/ViewModeContext";

export function App() {
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  return (
    <ThemeProvider theme={isDark ? darkTheme : lightTheme}>
      <CssBaseline />
      <RepoProvider>
        <ViewModeProvider>
          <AppShell isDark={isDark} onThemeToggle={toggleTheme} />
        </ViewModeProvider>
      </RepoProvider>
    </ThemeProvider>
  );
}