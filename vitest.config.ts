import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    // Integration tests share one Postgres; run files sequentially to avoid races.
    fileParallelism: false,
    testTimeout: 15000,
  },
});
