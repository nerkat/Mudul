import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import { appTheme } from "./design/theme";
import { AppShell } from "./shell/AppShell";
import { RepoProvider } from "./hooks/useRepo";
import { ViewModeProvider } from "./ctx/ViewModeContext";

export function App() {
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