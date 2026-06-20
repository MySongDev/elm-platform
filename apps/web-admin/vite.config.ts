import { cwd } from 'node:process'
import { createApiProxy, createElmSvgIconsPlugin, createScssOptions, createSrcAlias } from '@elm-platform/vite-config'
import vue from '@vitejs/plugin-vue'
import { visualizer } from 'rollup-plugin-visualizer'
import AutoImport from 'unplugin-auto-import/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/vite'
import { defineConfig, loadEnv } from 'vite'
import { viteMockServe } from 'vite-plugin-mock'

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, cwd(), '')
  const isAnalyze = env.VITE_ANALYZE === 'true'
  const enableMock = command === 'serve' && mode === 'mock'

  return {
    base: process.env.BASE_URL || '/',
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vue-vendor': ['vue', 'vue-router', 'pinia', 'vue-i18n'],
          },
        },
      },
      chunkSizeWarningLimit: 600,
    },
    server: {
      watch: {
        ignored: [
          '**/src/typings/auto-imports.d.ts',
          '**/src/typings/components.d.ts',
        ],
      },
      proxy: createApiProxy(),
    },
    plugins: [
      vue(),
      viteMockServe({
        mockPath: 'mock/routes',
        enable: enableMock,
        watchFiles: true,
        logger: true,
      }),
      AutoImport({
        dts: 'src/typings/auto-imports.d.ts',
        imports: ['vue', 'vue-router', 'pinia', 'vue-i18n'],
        resolvers: [ElementPlusResolver()],
      }),
      Components({
        dts: 'src/typings/components.d.ts',
        dirs: ['src/shared/ui', 'src/widgets'],
        resolvers: [ElementPlusResolver()],
      }),
      createElmSvgIconsPlugin('src/shared/icons/svg'),
      isAnalyze && visualizer({
        open: true,
        brotliSize: true,
        filename: 'stats.html',
      }),
    ].filter(Boolean),
    css: {
      preprocessorOptions: createScssOptions({
        mixinsPath: '@/shared/styles/_mixins.scss',
        variablesPath: '@/shared/styles/_variables.scss',
      }),
    },
    resolve: {
      alias: createSrcAlias(import.meta.url),
    },
    optimizeDeps: {
      include: [
        '@vueuse/core',
        'axios',
        'element-plus',
        'element-plus/es/locale/lang/en',
        'element-plus/es/locale/lang/zh-cn',
        'mitt',
        'nprogress',
        'pinia',
        'pinia-plugin-persistedstate',
        'vue',
        'vue-i18n',
        'vue-router',
      ],
    },
  }
})
