import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/e2e/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    testTimeout: 30_000,
    hookTimeout: 60_000,
    pool: 'forks',
    // Run all test files in one fork with shared module state so the singleton
    // MCP server in helpers/mcp-client.ts is spawned exactly once per run.
    // `fileParallelism: false` already pins maxWorkers to 1; `isolate: false`
    // keeps module state across files within that fork.
    fileParallelism: false,
    isolate: false,
  },
})
