import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: [
      'src/**/*.{test,spec}.ts',
      'mock/**/*.test.ts',
    ],
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      thresholds: {
        branches: 58,
        functions: 64,
        lines: 68,
        statements: 67,
      },
    },
  },
})
