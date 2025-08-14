import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./app.css";
import { NodePage } from "./routes/NodePage";
import { ViewModeProvider } from "./ctx/ViewModeContext";
import { ThemeProvider } from "./theme/theme";
import { AppShell } from "./components/AppShell";

function App() {
  const router = createBrowserRouter([
    { 
      path: "/:org/*", 
      element: (
        <AppShell>
          <NodePage />
        </AppShell>
      )
    },
  ]);

  return (
    <ThemeProvider>
      <ViewModeProvider>
        <RouterProvider router={router} />
      </ViewModeProvider>
    </ThemeProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
