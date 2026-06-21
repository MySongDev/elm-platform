# Vite 8 升级设计

## 目标

将工作区中的 Vite 从 7.x 升级到当前稳定的 Vite 8.x，同时保持 admin、user 两个 Vue 应用的开发、测试、mock 和生产构建行为稳定。

## 变更范围

- 在 `pnpm-workspace.yaml` 中将 catalog 的 `vite` 更新至 Vite 8 稳定版本，并刷新 `pnpm-lock.yaml`。
- 保持 `@vitejs/plugin-vue` 及已声明兼容 Vite 8 的插件版本；仅在安装或验证暴露实际兼容问题时升级对应插件。
- 将 admin 配置中已被 Vite 8 移除的对象式 `build.rollupOptions.output.manualChunks` 迁移为 `build.rolldownOptions.output.codeSplitting.groups`。
- 保留现有 `vue-vendor` 分组意图，只匹配 `vue`、`vue-router`、`pinia` 和 `vue-i18n`，不扩大为整个 `node_modules`。
- 不修改业务代码，不处理与升级无关的现有构建警告。

## 兼容策略

项目使用 Node.js 22.14.0，满足 Vite 8 的 `^20.19.0 || >=22.12.0` 要求。Vue 插件、Vue DevTools 和 bundle visualizer 已声明 Vite 8 或 Rolldown 兼容；`vite-plugin-mock` 与 `vite-plugin-svg-icons` 的 peer 范围也接受 Vite 8，但需要通过实际运行验证。

共享包 `@elm-platform/vite-config` 只使用 Vite 类型、代理配置和标准插件接口，不依赖 Rollup 私有 API，因此不需要结构调整。

## 验证标准

升级完成需同时满足：

1. workspace 安装无 Vite peer dependency 冲突。
2. `@elm-platform/vite-config` 构建通过。
3. admin 与 user 类型检查通过。
4. admin 与 user 单元测试通过。
5. admin 与 user 的 Vite 8 生产构建通过。
6. admin mock 模式和 user 自定义 mock 模式能够启动，且没有 Vite 8 配置错误。
7. admin 构建仍产出 `vue-vendor` chunk；若 Rolldown 因模块关系调整实际 chunk 名称，则验证目标模块未被错误重复打包。

## 风险与回退

主要风险是旧插件在 peer dependency 声明之外存在运行时不兼容，以及 Rolldown 分包结果与 Rollup 不完全一致。出现问题时先升级单个插件并保留最小配置；如果仅自定义分包导致异常，则暂时移除该分组并采用 Vite 8 默认分包，而不回退整个 Vite 版本。

回退只需恢复 `pnpm-workspace.yaml`、`pnpm-lock.yaml` 和 admin Vite 配置三处升级改动。
