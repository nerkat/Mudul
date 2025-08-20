import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { CssBaseline } from "@mui/material";
import { MuiThemeProvider } from "./design/MuiThemeProvider";
import { AuthProvider } from "./auth/AuthContext";
import { AuthGuard } from "./auth/AuthGuard";
import { App } from "./App";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { CallsPage } from "./pages/CallsPage";
import { CallDashboardPage } from "./pages/CallDashboardPage";
import { SettingsPage } from "./pages/SettingsPage";
import { NewCallPage } from "./pages/NewCallPage";
import { NewClientPage } from "./pages/NewClientPage";
import { NewActionItemPage } from "./pages/NewActionItemPage";
import { QAPage } from "./pages/QAPage";

const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />
  },
  {
    path: "/",
    element: (
      <AuthGuard>
        <App />
      </AuthGuard>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "node/:nodeId", element: <DashboardPage /> },
      { path: "calls", element: <CallsPage /> },
      { path: "calls/new", element: <NewCallPage /> },
      { path: "calls/:id", element: <CallDashboardPage /> },
      { path: "clients/new", element: <NewClientPage /> },
      { path: "clients/:clientId/actions/new", element: <NewActionItemPage /> },
      { path: "qa", element: <QAPage /> },
      { path: "settings", element: <SettingsPage /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <MuiThemeProvider>
      <CssBaseline />
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </MuiThemeProvider>
  </React.StrictMode>
);
