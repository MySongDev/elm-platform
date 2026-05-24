import path from 'node:path'
import { cwd } from 'node:process'
import { fileURLToPath, URL } from 'node:url'
import { VantResolver } from '@vant/auto-import-resolver'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { defineConfig, loadEnv } from 'vite'
import { viteMockServe } from 'vite-plugin-mock'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'
import vueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, cwd(), '')
  const useMock = command === 'serve' && (mode === 'mock' || env.VITE_USE_MOCK === 'true')

  return {
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
        '/ele-api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          rewrite: path => path.replace(/^\/ele-api/, '/api'),
        },
        '/pay-api': {
          target: 'http://localhost:3000/api',
          changeOrigin: true,
          rewrite: path => path.replace(/^\/pay-api/, ''),
        },
      },
      middlewareMode: false,
    },
    plugins: [
      vue(),
      vueDevTools(),
      viteMockServe({
        mockPath: 'mock',
        enable: useMock,
        logger: true,
      }),
      AutoImport({
        dts: false,
        imports: ['vue', 'vue-router', 'pinia'],
        dirs: ['./src/stores'],
        resolvers: [VantResolver()],
      }),
      Components({
        dts: false,
        dirs: ['src/components/common'],
        resolvers: [VantResolver()],
      }),
      createSvgIconsPlugin({
        iconDirs: [path.resolve(cwd(), 'src/icons/svg')],
        symbolId: 'icon-[name]',
        inject: 'body-last',
        customDomId: '__svg__icons__dom__',
        svgoOptions: {
          plugins: [
            {
              name: 'preset-default',
              params: {
                overrides: {
                  removeViewBox: false,
                  // 禁用 preset 自带的 removeUselessStrokeAndFill，避免冲突
                  removeUselessStrokeAndFill: false,
                },
              },
            },
            'removeDimensions',
            {
              name: 'removeAttrs',
              params: {
                attrs: ['fill', 'stroke', 'class', 'style', 'id'],
              },
            },
          ],
        },
      }),
    ],
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
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  }
})
