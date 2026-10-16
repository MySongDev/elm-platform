import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

/**
 * ⚠️ 刻意独立于 vite.config.ts，不复用它：
 * 那个配置挂了 @dcloudio/vite-plugin-uni，会在测试运行时触发小程序编译流程
 * （实测输出「编译器版本：5.26（vue3）」「已开启 uni统计」），拖慢且无必要。
 *
 * environment 用 node 而非 happy-dom（迁移方案「测试策略」）：
 * 只搬端无关的纯逻辑测试，不需要 DOM。
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,ts}'],
    // turbo 会自动把本包纳入 `turbo run test:unit`（CI 无需改配置）。
    // 测试文件要等迁移到对应批次才搬进来（4 个直接搬 + 2 个改后搬），
    // 在此之前没有测试文件不应让 CI 失败 → 按 AI_TEST_POLICY 默认不加测试，只放行空集。
    passWithNoTests: true,
  },
})
