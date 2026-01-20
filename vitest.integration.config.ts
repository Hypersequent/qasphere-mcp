import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    testTimeout: 30000,
    hookTimeout: 30000,
    include: ['src/tests/integration/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    globalSetup: ['src/tests/integration/setup.ts'],
    // Run test files sequentially to avoid rate limiting from parallel login attempts
    fileParallelism: false,
  },
})
