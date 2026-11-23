import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import { fileURLToPath } from 'node:url'
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  base: '/',
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  plugins: [vue(), AutoImport({ dts: false, imports: ['vue', 'vue-router', 'pinia', 'vue-i18n'] })],
  server: { host: '127.0.0.1', port: 5187, strictPort: true },
})
