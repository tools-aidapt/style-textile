/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  build: {
    rollupOptions: {
      output: {
        // React and the router change on their own release cadence, not this
        // app's, so keeping them in their own chunk keeps them cached across
        // deploys instead of being invalidated by every content change
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          query: ["@tanstack/react-query"],
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    // src/lib/config.ts reads import.meta.env once at module load, so the
    // values have to exist before a test file imports anything
    env: {
      VITE_JOBS_WEBHOOK_URL: "https://webhook.test/careers-positions",
      VITE_APPLICATION_WEBHOOK_URL: "https://webhook.test/careers-application",
      VITE_SITE_URL: "https://careers.test",
      VITE_REQUISITION_SCHEMA_URL: "https://webhook.test/requisition-schema",
      VITE_REQUISITION_WEBHOOK_URL: "https://webhook.test/requisition-submit",
      VITE_EMPLOYEES_WEBHOOK_URL: "https://webhook.test/kenafric/employees-with-avatars",
      VITE_USERS_WEBHOOK_URL: "https://webhook.test/kenafric/users",
    },
    globals: true,
    css: false,
    coverage: {
      provider: "v8",
      // The vendored shadcn catalogue and the design tokens are not this
      // project's code to cover
      exclude: ["src/components/ui/**", "src/aidapt/**", "src/test/**", "**/*.d.ts"],
    },
  },
}));
