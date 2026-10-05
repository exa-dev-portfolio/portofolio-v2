import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./tests/env-setup.ts", "./tests/setup.ts"],
    testTimeout: 60000,
    hookTimeout: 60000,
    include: ["tests/**/*.test.ts"],
    fileParallelism: false,
    env: {
      TESTCONTAINERS_RYUK_DISABLED: "true",
      NODE_ENV: "test",
    },
  },
  resolve: {
    alias: {
      "~~": path.resolve(__dirname, "."),
      "@@": path.resolve(__dirname, "."),
      "~": path.resolve(__dirname, "./app"),
      "@": path.resolve(__dirname, "./app"),
    },
  },
});
