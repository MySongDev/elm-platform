# TabBarFromScratch Phase 4 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** �?`TabBarFromScratch` 添加阶段 4 能力：右侧更多操作下拉菜单、批量关闭命令、横向滚动按钮、滚轮横向滚动和 active tab 自动滚入视图�?
**Architecture:** 命令规则放在 `tabCommands.ts`，由测试保护；命令执行放�?`useTabActions.ts`，统一复用阶段 3 的关�?跳转语义；滚�?DOM 细节放在 `useScroll.ts`，可测试的滚动计算放�?`tabScroll.ts`。`index.vue` 只负责组合这些能力。`AdminLayout.vue` 会临时接�?`TabBarFromScratch` 作为测试页面，但不提交�?
**Tech Stack:** Vue 3 `<script setup lang="ts">`、Element Plus Dropdown、Iconify Element Plus icons、Vue Router、Pinia tabs store、Vitest、vue-tsc�?
---

## File Structure

- Create: `apps/web-admin/src/widgets/admin-layout/ui/TabBarFromScratch/tabCommands.ts`
  - 更多操作菜单命令配置、禁�?隐藏规则�?- Create: `apps/web-admin/src/widgets/admin-layout/ui/TabBarFromScratch/__tests__/tabCommands.test.ts`
  - 验证命令隐藏/禁用规则�?- Create: `apps/web-admin/src/widgets/admin-layout/ui/TabBarFromScratch/TabBarActions.vue`
  - 右侧更多操作按钮�?`el-dropdown` 菜单�?- Create: `apps/web-admin/src/widgets/admin-layout/ui/TabBarFromScratch/useTabActions.ts`
  - 将命令转�?tabs store + router 操作�?- Create: `apps/web-admin/src/widgets/admin-layout/ui/TabBarFromScratch/tabScroll.ts`
  - 可测试的滚动距离和滚动状态计算�?- Create: `apps/web-admin/src/widgets/admin-layout/ui/TabBarFromScratch/__tests__/tabScroll.test.ts`
  - 验证滚动计算�?- Create: `apps/web-admin/src/widgets/admin-layout/ui/TabBarFromScratch/useScroll.ts`
  - DOM 滚动、ResizeObserver、active tab 自动滚入视图�?- Modify: `apps/web-admin/src/widgets/admin-layout/ui/TabBarFromScratch/index.vue`
  - 接入滚动按钮、`TabBarActions`、`useTabActions`、`useScroll`�?- Temporary modify: `apps/web-admin/src/widgets/admin-layout/ui/AdminLayout.vue`
  - 临时切到 `TabBarFromScratch` 作为手动测试页面，不提交�?
## Task 1: Test And Implement Dropdown Command Rules

- [ ] Write failing tests in `__tests__/tabCommands.test.ts` for:
  - single tab only shows reload
  - close-current disabled when current tab is fixed or not closable
  - close-others disabled when there is only one closable tab
- [ ] Implement `tabCommands.ts`.
- [ ] Run focused command tests and confirm pass.

## Task 2: Test And Implement Scroll Pure Helpers

- [ ] Write failing tests in `__tests__/tabScroll.test.ts` for:
  - max scroll never below 0
  - overflow and left/right flags
  - scroll distance is at least 220 and otherwise 60% of viewport width
- [ ] Implement `tabScroll.ts`.
- [ ] Run focused scroll tests and confirm pass.

## Task 3: Add UI Components And Composables

- [ ] Create `TabBarActions.vue`.
- [ ] Create `useTabActions.ts`.
- [ ] Create `useScroll.ts`.
- [ ] Update `index.vue` to compose actions and scrolling.

## Task 4: Temporary Test Page Integration

- [ ] Temporarily change `AdminLayout.vue` from `./TabBar/index.vue` to `./TabBarFromScratch/index.vue`.
- [ ] Keep the dev server at `http://localhost:5177/` available for manual testing.
- [ ] Do not stage or commit `AdminLayout.vue`.

## Task 5: Verify

- [ ] `pnpm --filter @elm-platform/web-admin run type-check`
- [ ] `pnpm --filter @elm-platform/web-admin exec vitest run src/widgets/admin-layout/ui/TabBarFromScratch/__tests__/tabCommands.test.ts src/widgets/admin-layout/ui/TabBarFromScratch/__tests__/tabScroll.test.ts src/widgets/admin-layout/ui/TabBarFromScratch/__tests__/tabPresentation.test.ts`
- [ ] Vite serves `TabBarFromScratch/index.vue`, `TabBarActions.vue`, and `useScroll.ts` with HTTP 200.

## Task 6: Commit

- [ ] Stage only `TabBarFromScratch` phase 4 files and this plan.
- [ ] Do not stage `AdminLayout.vue`.
- [ ] Commit with `feat: add tabbar from scratch actions and scroll`.

