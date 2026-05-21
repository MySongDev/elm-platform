import path from 'node:path'
import { cwd } from 'node:process'
import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/vite'
import { defineConfig, loadEnv } from 'vite'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, cwd(), '')

  return {
    server: {
      watch: {
        ignored: [
          '**/src/typings/auto-imports.d.ts',
          '**/src/typings/components.d.ts',
        ],
      },
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:3000',
          changeOrigin: true,
        },
      },
    },
    plugins: [
      vue(),
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
      createSvgIconsPlugin({
        iconDirs: [path.resolve(cwd(), 'src/shared/icons/svg')],
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
          @use "@/shared/styles/_mixins.scss" as *;
          @use "@/shared/styles/_variables.scss" as *;
        `,
        },
      },
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
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
