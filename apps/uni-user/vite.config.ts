import { fileURLToPath } from 'node:url'
import uni from '@dcloudio/vite-plugin-uni'
import { defineConfig } from 'vite'

// ⚠️ 本文件刻意不复用 packages/vite-config：那个包依赖 catalog 的 Vite ^8，
// 而 @dcloudio/vite-plugin-uni 的 peerDependencies 精确锁 vite 5.2.8（迁移方案 B 节）。
export default defineConfig({
  plugins: [uni()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        // 沿用 web-user 的全局注入约定（packages/vite-config 的 createScssOptions）。
        // ⚠️ 两处与 web-user 不同，均为实测踩坑所得：
        // 1. 文件名不带 _ 前缀：uni-app 的 customResolver 走 resolve.sync 找确切文件名，
        //    不认 Sass 的 partial 约定（web-user 靠 Vite 原生 sass 解析，_ 前缀可用）。
        // 2. 用 @use 而非 @import：@import 在 Dart Sass 3.0 将移除（构建期会告警）。
        additionalData: '@use "@/assets/styles/mixins.scss" as *; @use "@/assets/styles/variables.scss" as *;',
      },
    },
  },
  server: {
    // ⚠️ 仅 H5 端生效。小程序端请求不经过 dev server，proxy 无效 —— 见 config/index.ts
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
    },
  },
})
