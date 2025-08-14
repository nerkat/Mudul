import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./app.css";
import { NodePage } from "./routes/NodePage";
import { ViewModeProvider } from "./ctx/ViewModeContext";
import { ThemeProvider } from "./theme/theme";
import { AppShell } from "./components/AppShell";

const router = createBrowserRouter([
  { path: "/:org/*", element: <NodePage /> },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <ViewModeProvider>
        <AppShell>
          <RouterProvider router={router} />
        </AppShell>
      </ViewModeProvider>
    </ThemeProvider>
  </React.StrictMode>
);
