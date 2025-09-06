import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { initializeFirebase } from "@budget/api";
import { createRouter, RouterProvider } from "@tanstack/react-router";

// initialize Firebase before rendering anything
await initializeFirebase();

// Create a new router instance
import { routeTree } from "./routeTree.gen";
const router = createRouter({ routeTree });

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
