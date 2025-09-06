import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import path from "path";

export default defineConfig({
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@budget/core": path.resolve(__dirname, "../../packages/core/src"),
      "@budget/api": path.resolve(__dirname, "../../packages/api/src"),
      "@budget/state": path.resolve(__dirname, "../../packages/state/src"),
      "@budget/ui": path.resolve(__dirname, "../../packages/ui/src"),
    },
  },
  server: {
    port: 3000,
  },
});
