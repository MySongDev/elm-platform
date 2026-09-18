import { cwd } from 'node:process'
import { createApiProxy, createElmSvgIconsPlugin, createScssOptions, createSrcAlias } from '@elm-platform/vite-config'
import { VantResolver } from '@vant/auto-import-resolver'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { defineConfig, loadEnv } from 'vite'
import { viteMockServe } from 'vite-plugin-mock'
import vueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, cwd(), '')
  const useMock = command === 'serve' && (mode === 'mock' || env.VITE_USE_MOCK === 'true')

  return {
    base: process.env.BASE_URL || '/elm-platform/user/',
    server: {
      // 支付请求已并入全局 /api 实例，不再需要 /pay-api 独立代理前缀
      proxy: createApiProxy(),
      middlewareMode: false,
    },
    plugins: [
      vue(),
      vueDevTools(),
      viteMockServe({
        mockPath: 'mock/routes',
        ignore: /\.test\.[cm]?[jt]s$/,
        enable: useMock,
        watchFiles: true,
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
