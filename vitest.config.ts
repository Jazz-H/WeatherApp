import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    css: false,
    // .next holds compiled copies of anything under pages/; without this a
    // stale build artifact gets collected as a second, broken test file.
    exclude: ["**/node_modules/**", "**/dist/**", "**/.next/**"],
  },
});
