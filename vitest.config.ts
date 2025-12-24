import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    testTimeout: 10000,
    hookTimeout: 10000,
    include: ['src/tests/unit/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
  },
})
