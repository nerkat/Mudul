import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./app.css";
import { NodePage } from "./routes/NodePage";
import { ViewModeProvider } from "./ctx/ViewModeContext";
import { ThemeProvider } from "./theme/theme";
import { AppShell } from "./components/AppShell";

// Initialize Preline components
const initializePreline = () => {
  if (typeof window !== 'undefined') {
    import('preline/preline').then(() => {
      // @ts-ignore - Preline adds HSStaticMethods to window
      window.HSStaticMethods?.autoInit();
    });
  }
};

// App component to handle Preline initialization
function App() {
  useEffect(() => {
    initializePreline();
  }, []);

  const router = createBrowserRouter([
    { path: "/:org/*", element: <NodePage /> },
  ]);

  return (
    <ThemeProvider>
      <ViewModeProvider>
        <AppShell>
          <RouterProvider router={router} />
        </AppShell>
      </ViewModeProvider>
    </ThemeProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
