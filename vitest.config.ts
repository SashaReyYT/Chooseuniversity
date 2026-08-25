import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    // Playwright specs live under e2e/ and run through their own runner.
    exclude: ["**/node_modules/**", "e2e/**"],
  },
});