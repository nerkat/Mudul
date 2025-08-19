import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import { AppShell } from "./shell/AppShell";
import { RepoProvider } from "./hooks/useRepo";
import { ViewModeProvider, useViewMode } from "./ctx/ViewModeContext";
import { MuiThemeProvider } from "./design/MuiThemeProvider";
import { useEffect } from "react";
import "./design/print.css";
import "./core/widgets/paper/print.css";

function AppContent() {
  const { mode } = useViewMode();
  
  // Add data attribute for paper mode to enable print styles
  useEffect(() => {
    if (mode === "paper") {
      document.documentElement.setAttribute("data-paper-mode", "true");
    } else {
      document.documentElement.removeAttribute("data-paper-mode");
    }
  }, [mode]);

  return <AppShell />;
}

export function App() {
  return (
    <MuiThemeProvider>
      <CssBaseline />
      <RepoProvider>
        <ViewModeProvider>
          <AppContent />
        </ViewModeProvider>
      </RepoProvider>
    </MuiThemeProvider>
  );
}