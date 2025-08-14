import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import "./app.css";
import { NodePage } from "./routes/NodePage";
import { ViewModeProvider } from "./ctx/ViewModeContext";
import { ThemeProvider } from "./theme/theme";
import { AppShell } from "./components/AppShell";

// Wrapper component that includes AppShell inside the router context
function App() {
  return (
    <AppShell>
      <NodePage />
    </AppShell>
  );
}

const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/acme" replace /> },
  { path: "/:org/*", element: <App /> },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <ViewModeProvider>
        <RouterProvider router={router} />
      </ViewModeProvider>
    </ThemeProvider>
  </React.StrictMode>
);
