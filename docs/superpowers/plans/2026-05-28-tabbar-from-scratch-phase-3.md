# TabBarFromScratch Phase 3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** �?`TabBarFromScratch` 添加关闭页签能力：可关闭 tab 显示关闭按钮，点击关闭时调用 `tabsStore.closeTab()`，关闭当前页时跳转到 store 返回的下一个页签�?
**Architecture:** `index.vue` 继续拥有 tabs store �?router 操作；`TabBarItem.vue` 只显示关闭按钮并发出 `close(fullPath)` 事件。关闭按钮是否显示由父组件根�?`isTabClosable(tab)` �?tab 数量计算，避免子组件理解业务规则�?
**Tech Stack:** Vue 3 `<script setup lang="ts">`、Pinia tabs store、Vue Router、Element Plus/Iconify close icon、Vitest、vue-tsc�?
---

## File Structure

- Modify: `apps/web-admin/src/widgets/admin-layout/ui/TabBarFromScratch/tabPresentation.ts`
  - 新增 `shouldShowCloseButton(tabClosable, totalTabs)` 纯函数�?- Modify: `apps/web-admin/src/widgets/admin-layout/ui/TabBarFromScratch/__tests__/tabPresentation.test.ts`
  - 覆盖关闭按钮展示规则�?- Modify: `apps/web-admin/src/widgets/admin-layout/ui/TabBarFromScratch/TabBarItem.vue`
  - 新增 `closable` prop、关闭按钮、`close(fullPath)` emit�?- Modify: `apps/web-admin/src/widgets/admin-layout/ui/TabBarFromScratch/index.vue`
  - 计算每个 tab 是否可关闭；新增 `handleCloseTab()` �?store 并按返回路径跳转�?- Keep unstaged: `apps/web-admin/src/widgets/admin-layout/ui/AdminLayout.vue`
  - 继续作为手动验证用临时接入，不提交�?
## Task 1: Add Failing Close Visibility Test

- [ ] **Step 1: Extend the focused helper test**

```ts
expect(shouldShowCloseButton(true, 2)).toBe(true)
expect(shouldShowCloseButton(true, 1)).toBe(false)
expect(shouldShowCloseButton(false, 3)).toBe(false)
```

- [ ] **Step 2: Run focused test**

```bash
pnpm --filter @elm-platform/web-admin exec vitest run src/widgets/admin-layout/ui/TabBarFromScratch/__tests__/tabPresentation.test.ts
```

Expected: FAIL because `shouldShowCloseButton` is not implemented yet.

## Task 2: Implement Close Visibility Helper

- [ ] **Step 1: Add helper**

```ts
export function shouldShowCloseButton(tabClosable: boolean, totalTabs: number): boolean {
  return tabClosable && totalTabs > 1
}
```

- [ ] **Step 2: Run focused test**

```bash
pnpm --filter @elm-platform/web-admin exec vitest run src/widgets/admin-layout/ui/TabBarFromScratch/__tests__/tabPresentation.test.ts
```

Expected: PASS.

## Task 3: Add Close Button To TabBarItem

- [ ] **Step 1: Add close icon import**

```ts
import { IconClose as IconEpClose } from '@iconify-prerendered/vue-ep'
```

- [ ] **Step 2: Add `closable` prop and `close` emit**

```ts
defineProps<{
  tab: TabItem
  title: string
  active: boolean
  closable: boolean
  itemClass: Record<string, boolean>
}>()

const emit = defineEmits<{
  click: [fullPath: string]
  close: [fullPath: string]
}>()
```

- [ ] **Step 3: Add close button**

```vue
<el-icon
  v-if="closable"
  class="tab-close"
  role="button"
  tabindex="-1"
  aria-label="关闭页签"
  @click.stop="emit('close', tab.fullPath)"
>
  <IconEpClose />
</el-icon>
```

## Task 4: Wire Close Behavior In Parent

- [ ] **Step 1: Import rules**

```ts
import { isTabClosable, useTabsStore } from '@/entities/tab'
import { getTabItemClass, isActiveTab, shouldNavigateTab, shouldShowCloseButton } from './tabPresentation'
```

- [ ] **Step 2: Add `closable` into `tabViews`**

```ts
closable: shouldShowCloseButton(isTabClosable(tab), tabsStore.tabs.length),
```

- [ ] **Step 3: Add close handler**

```ts
function handleCloseTab(fullPath: string) {
  const next = tabsStore.closeTab(fullPath)
  if (next && shouldNavigateTab(next, route.fullPath))
    router.push(next)
}
```

- [ ] **Step 4: Pass props/events to child**

```vue
:closable="item.closable"
@close="handleCloseTab"
```

## Task 5: Verify

- [ ] **Step 1: Type-check**

```bash
pnpm --filter @elm-platform/web-admin run type-check
```

Expected: PASS.

- [ ] **Step 2: Focused test**

```bash
pnpm --filter @elm-platform/web-admin exec vitest run src/widgets/admin-layout/ui/TabBarFromScratch/__tests__/tabPresentation.test.ts
```

Expected: PASS.

- [ ] **Step 3: Vite temporary manual page still serves components**

```bash
Invoke-WebRequest -UseBasicParsing -Uri 'http://localhost:5177/src/widgets/admin-layout/ui/TabBarFromScratch/index.vue'
Invoke-WebRequest -UseBasicParsing -Uri 'http://localhost:5177/src/widgets/admin-layout/ui/TabBarFromScratch/TabBarItem.vue'
```

Expected: HTTP 200.

## Task 6: Commit Phase 3

- [ ] **Step 1: Stage only phase 3 files**

```bash
git add apps/web-admin/src/widgets/admin-layout/ui/TabBarFromScratch/tabPresentation.ts apps/web-admin/src/widgets/admin-layout/ui/TabBarFromScratch/__tests__/tabPresentation.test.ts apps/web-admin/src/widgets/admin-layout/ui/TabBarFromScratch/TabBarItem.vue apps/web-admin/src/widgets/admin-layout/ui/TabBarFromScratch/index.vue docs/superpowers/plans/2026-05-28-tabbar-from-scratch-phase-3.md
```

Do not stage `apps/web-admin/src/widgets/admin-layout/ui/AdminLayout.vue`.

- [ ] **Step 2: Commit**

```bash
git commit -m "feat: add tabbar from scratch close action"
```

