import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import 'preline';
import { NodePage } from "./routes/NodePage";
import { ViewModeProvider } from "./ctx/ViewModeContext";

const router = createBrowserRouter([
  { path: "/:org/*", element: <NodePage /> },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ViewModeProvider>
      <RouterProvider router={router} />
    </ViewModeProvider>
  </React.StrictMode>
);
