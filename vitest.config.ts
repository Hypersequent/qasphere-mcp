import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    testTimeout: 30000, // 30 seconds for integration tests
    hookTimeout: 30000,
    include: ['src/tests/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    globalSetup: ['src/tests/integration/setup.ts'],
  },
})
