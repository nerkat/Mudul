import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import { appTheme } from "./design/theme";
import { tokens, injectCssVars } from "./design/tokens";
import { AppShell } from "./shell/AppShell";
import { RepoProvider } from "./hooks/useRepo";
import { ViewModeProvider } from "./ctx/ViewModeContext";
import { useEffect } from "react";
import "./design/print.css";

export function App() {
  // Inject CSS variables on mount
  useEffect(() => {
    injectCssVars(tokens);
  }, []);

  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <RepoProvider>
        <ViewModeProvider>
          <AppShell />
        </ViewModeProvider>
      </RepoProvider>
    </ThemeProvider>
  );
}