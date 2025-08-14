import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./app.css";
import { ViewModeProvider } from "./ctx/ViewModeContext";
import { ThemeProvider } from "./theme/theme";
import { AppShell } from "./components/AppShell";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "calls", element: <CallsPage /> },
      { path: "calls/:id", element: <CallDashboardPage /> },
      { path: "settings", element: <SettingsPage /> },
    ],
  },
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
