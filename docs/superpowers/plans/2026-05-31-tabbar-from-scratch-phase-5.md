# TabBarFromScratch Phase 5 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 `TabBarFromScratch` 添加右键上下文菜单，复用阶段 4 的命令配置和命令执行逻辑。

**Architecture:** `tabCommands.ts` 扩展为 `dropdown` / `contextmenu` 双来源；`tabMenu.ts` 保存可测试的菜单坐标计算；`useMenu.ts` 管理右键菜单状态和全局关闭监听；`TabBarContextMenu.vue` 只负责菜单展示和 command emit；`index.vue` 负责组合 tab、菜单目标和命令执行。

**Tech Stack:** Vue 3 `<script setup lang="ts">`、Teleport、Pinia tabs store、Vue Router、Vitest、vue-tsc。

---

## Task 1: Extend Command Rules For Context Menu

- [x] Update `tabCommands.test.ts` to call `getTabCommands(source, state)`.
- [x] Add context menu test: `close-left` is hidden when right-click target has no closable tab on its left.
- [x] Update `tabCommands.ts` with `TabCommandSource`, target closable/fixed fields, source filtering.

## Task 2: Add Menu Position Helper

- [x] Create failing `tabMenu.test.ts` for viewport clamping.
- [x] Create `tabMenu.ts` with `getContextMenuPosition()`.

## Task 3: Add Context Menu UI And State

- [x] Create `TabBarContextMenu.vue`.
- [x] Create `useMenu.ts`.
- [x] Update `TabBarItem.vue` to emit `contextmenu(event, fullPath)`.

## Task 4: Wire Context Menu Into Parent

- [x] Update `useTabActions.ts` to accept context menu target and close callback.
- [x] Update `index.vue` to initialize `useMenuManager()`, pass right-click event to tab items, render `TabBarContextMenu`, and route commands through `handleContextMenuCommand()`.

## Task 5: Verify And Commit

- [x] `.\node_modules\.bin\vue-tsc.CMD --noEmit`
- [x] `.\node_modules\.bin\vitest.CMD run src/widgets/admin-layout/ui/TabBarFromScratch/__tests__/tabCommands.test.ts src/widgets/admin-layout/ui/TabBarFromScratch/__tests__/tabMenu.test.ts src/widgets/admin-layout/ui/TabBarFromScratch/__tests__/tabScroll.test.ts src/widgets/admin-layout/ui/TabBarFromScratch/__tests__/tabPresentation.test.ts`
- [x] `.\node_modules\.bin\eslint.CMD src/widgets/admin-layout/ui/TabBarFromScratch`
- [x] `.\node_modules\.bin\stylelint.CMD "src/widgets/admin-layout/ui/TabBarFromScratch/**/*.{vue,scss,css}" --config ../../stylelint.config.mjs`
- [x] Vite serves `index.vue`, `TabBarContextMenu.vue`, and `useMenu.ts` with HTTP 200.
- [x] Stage only `TabBarFromScratch` phase 5 files and this plan.
- [x] Do not stage `AdminLayout.vue`.
- [x] Commit with `feat: add tabbar from scratch context menu`.
