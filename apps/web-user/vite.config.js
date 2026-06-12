import { cwd } from 'node:process'
import { createApiProxy, createElmSvgIconsPlugin, createScssOptions, createSrcAlias } from '@elm-platform/vite-config'
import { VantResolver } from '@vant/auto-import-resolver'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { defineConfig, loadEnv } from 'vite'
import vueDevTools from 'vite-plugin-vue-devtools'
import { createWebUserMockPlugin } from './mock/mock-plugin.js'

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, cwd(), '')
  const useMock = command === 'serve' && (mode === 'mock' || env.VITE_USE_MOCK === 'true')
  const localApiTarget = 'http://127.0.0.1:3000'

  return {
    base: process.env.BASE_URL || '/',
    server: {
      proxy: createApiProxy({
        prefixes: {
          '/ele-api': {
            rewrite: path => path.replace(/^\/ele-api/, '/api'),
          },
          '/pay-api': {
            target: `${localApiTarget}/api`,
            rewrite: path => path.replace(/^\/pay-api/, ''),
          },
        },
      }),
      middlewareMode: false,
    },
    plugins: [
      vue(),
      vueDevTools(),
      createWebUserMockPlugin({ enable: useMock }),
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
      createElmSvgIconsPlugin('src/icons/svg'),
    ],
    css: {
      preprocessorOptions: createScssOptions({
        mixinsPath: '@/assets/styles/mixins.scss',
        variablesPath: '@/assets/styles/variables.scss',
      }),
    },
    resolve: {
      alias: createSrcAlias(import.meta.url),
    },
  }
})
