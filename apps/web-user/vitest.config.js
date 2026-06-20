import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom',
    globals: true,
    include: ['src/**/*.test.{js,ts}', 'mock/**/*.test.js'],
    setupFiles: ['src/test/setup.js'],
    coverage: {
      thresholds: {
        branches: 32,
        functions: 28,
        lines: 36,
        statements: 36,
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `
          @use "@/assets/styles/mixins.scss" as *;
          @use "@/assets/styles/variables.scss" as *;
        `,
      },
    },
  },
})
