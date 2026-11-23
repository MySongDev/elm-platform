/**
 * @file 管理端测试配置
 * @domain tooling/testing
 * @description 为单元测试与业务编辑器挂载分别选择 SSR 和客户端编译。
 */

import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { configDefaults, defineConfig } from 'vitest/config'

const editorTests = [
  'src/pages/system/user/ui/__tests__/UserFormDialog.test.ts',
  'src/pages/platform/tenant/ui/__tests__/TenantFormDialog.test.ts',
  'src/pages/system/menu/ui/__tests__/MenuFormDialog.test.ts',
]

export default defineConfig({
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    // node 默认编译 SSR 模板，无法客户端挂载；只有编辑器回归使用 client，其他测试保持原环境。
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['src/**/*.{test,spec}.ts', 'mock/**/*.test.ts'],
          exclude: [
            ...configDefaults.exclude,
            ...editorTests,
          ],
        },
      },
      {
        extends: true,
        test: {
          name: 'editors',
          include: editorTests,
          environment: './src/pages/system/user/ui/__tests__/client-node.ts',
        },
      },
    ],
    environment: 'node',
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
