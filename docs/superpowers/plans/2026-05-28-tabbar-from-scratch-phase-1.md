# TabBarFromScratch Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新建 `TabBarFromScratch` 的最小可用版本：能读取现有 tabs store、渲染页签、高亮当前路由，并点击切换路由。

**Architecture:** 阶段 1 不替换现有 `TabBar`，也不实现关闭、滚动、右键菜单。新增一个纯展示辅助函数文件承载可测试逻辑，新增一个 Vue SFC 承载最小 UI；数据仍来自 `entities/tab`，导航仍通过 Vue Router。

**Tech Stack:** Vue 3 `<script setup lang="ts">`、Vue Router 4、Pinia、Element Plus 全局组件、Vitest、vue-tsc。

---

## Scope

本计划只覆盖阶段 1。阶段 2 会抽出 `TabBarItem.vue`，阶段 3 会加入关闭页签，阶段 4 会加入滚动、右键菜单和批量操作。

阶段 1 不修改 `apps/web-admin/src/widgets/admin-layout/ui/AdminLayout.vue` 的正式 import；需要肉眼验证时，只做临时切换并在验证后改回。

## File Structure

- Create: `apps/web-admin/src/widgets/admin-layout/ui/TabBarFromScratch/tabPresentation.ts`
  - 负责纯展示判断：当前 tab 是否 active、tab 根节点 class 如何生成。
- Create: `apps/web-admin/src/widgets/admin-layout/ui/TabBarFromScratch/__tests__/tabPresentation.test.ts`
  - 覆盖阶段 1 的纯逻辑，适配当前 `vitest.config.ts` 的 `node` 环境。
- Create: `apps/web-admin/src/widgets/admin-layout/ui/TabBarFromScratch/index.vue`
  - 阶段 1 的最小页签栏组件：读取 store、渲染 tabs、点击时 `router.push()`。

## Component Map

- `TabBarFromScratch/index.vue`
  - 单一职责：把现有 `tabsStore.tabs` 渲染成可点击页签列表。
  - 依赖：`useTabsStore()`、`useRoute()`、`useRouter()`、`transformI18n()`、`tabPresentation.ts`。
  - 不接收 props，不发出 emits，因为它是 layout 内部组件。

- `tabPresentation.ts`
  - 单一职责：保存不依赖 Vue runtime 的展示判断，方便用 Vitest 先测后写。
  - 不导入 Vue，不导入 router，不导入 store。

## Task 1: Write Failing Presentation Tests

**Files:**
- Create: `apps/web-admin/src/widgets/admin-layout/ui/TabBarFromScratch/__tests__/tabPresentation.test.ts`

- [ ] **Step 1: Create the test file**

```ts
import { describe, expect, it } from 'vitest'
import { getTabItemClass, isActiveTab } from '../tabPresentation'

describe('TabBarFromScratch presentation', () => {
  it('marks a tab active only when its fullPath matches the current route', () => {
    expect(isActiveTab('/dashboard', '/dashboard')).toBe(true)
    expect(isActiveTab('/dashboard?from=menu', '/dashboard')).toBe(false)
    expect(isActiveTab('/system/user', '/dashboard')).toBe(false)
  })

  it('builds stable tab item classes for active and fixed states', () => {
    expect(getTabItemClass({ active: true, fixed: true })).toEqual({
      'is-active': true,
      'is-fixed': true,
    })

    expect(getTabItemClass({ active: false, fixed: false })).toEqual({
      'is-active': false,
      'is-fixed': false,
    })
  })
})
```

- [ ] **Step 2: Run the focused test and confirm it fails**

Run:

```bash
pnpm --filter elm-web-admin exec vitest run src/widgets/admin-layout/ui/TabBarFromScratch/__tests__/tabPresentation.test.ts
```

Expected: FAIL，错误信息包含 `tabPresentation`，因为实现文件还不存在。

## Task 2: Implement Presentation Helpers

**Files:**
- Create: `apps/web-admin/src/widgets/admin-layout/ui/TabBarFromScratch/tabPresentation.ts`
- Test: `apps/web-admin/src/widgets/admin-layout/ui/TabBarFromScratch/__tests__/tabPresentation.test.ts`

- [ ] **Step 1: Create the helper implementation**

```ts
interface TabItemClassOptions {
  active: boolean
  fixed: boolean
}

export function isActiveTab(tabFullPath: string, currentFullPath: string): boolean {
  return tabFullPath === currentFullPath
}

export function getTabItemClass(options: TabItemClassOptions) {
  return {
    'is-active': options.active,
    'is-fixed': options.fixed,
  }
}
```

- [ ] **Step 2: Run the focused test and confirm it passes**

Run:

```bash
pnpm --filter elm-web-admin exec vitest run src/widgets/admin-layout/ui/TabBarFromScratch/__tests__/tabPresentation.test.ts
```

Expected: PASS，`2 tests` 通过。

- [ ] **Step 3: Commit the tested helper**

Run:

```bash
git add apps/web-admin/src/widgets/admin-layout/ui/TabBarFromScratch/tabPresentation.ts apps/web-admin/src/widgets/admin-layout/ui/TabBarFromScratch/__tests__/tabPresentation.test.ts
git commit -m "test: add tabbar from scratch presentation helpers"
```

Expected: commit 只包含 `TabBarFromScratch` 下的 helper 和 test。

## Task 3: Create the Minimal Vue Component

**Files:**
- Create: `apps/web-admin/src/widgets/admin-layout/ui/TabBarFromScratch/index.vue`
- Read: `apps/web-admin/src/entities/tab/model/store.ts`
- Read: `apps/web-admin/src/entities/tab/model/types.ts`

- [ ] **Step 1: Create `index.vue`**

```vue
<script setup lang="ts">
import type { TabItem } from '@/entities/tab'
import { useRoute, useRouter } from 'vue-router'
import { useTabsStore } from '@/entities/tab'
import { transformI18n } from '@/shared/i18n'
import { getTabItemClass, isActiveTab } from './tabPresentation'

defineOptions({ name: 'TabBarFromScratch' })

const route = useRoute()
const router = useRouter()
const tabsStore = useTabsStore()

function getTabTitle(tab: TabItem) {
  return tabsStore.getTitle(tab, transformI18n)
}

function handleTabClick(fullPath: string) {
  if (isActiveTab(fullPath, route.fullPath))
    return

  router.push(fullPath)
}
</script>

<template>
  <div class="tab-bar-from-scratch">
    <div class="tab-track" role="tablist" aria-label="已打开页面">
      <button
        v-for="tab in tabsStore.tabs"
        :key="tab.fullPath"
        class="tab-item"
        :class="getTabItemClass({
          active: isActiveTab(tab.fullPath, route.fullPath),
          fixed: tab.fixed,
        })"
        type="button"
        role="tab"
        :aria-selected="isActiveTab(tab.fullPath, route.fullPath)"
        :title="getTabTitle(tab)"
        @click="handleTabClick(tab.fullPath)"
      >
        <el-icon v-if="tab.icon" class="tab-icon">
          <SvgIcon :icon-name="tab.icon" />
        </el-icon>
        <span class="tab-title">{{ getTabTitle(tab) }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.tab-bar-from-scratch {
  display: flex;
  align-items: center;
  height: $tab-bar-height;
  user-select: none;
  background: $bg-white;
  border-bottom: 1px solid $border-light;
  box-shadow: 0 0 1px rgb(0 0 0 / 42%);
}

.tab-track {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  width: 100%;
  min-width: 0;
  height: 100%;
  padding: 0 8px;
  overflow: hidden;
  white-space: nowrap;
}

.tab-item {
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
  gap: 6px;
  align-items: center;
  justify-content: center;
  max-width: 180px;
  height: 30px;
  padding: 0 12px;
  margin-right: 4px;
  font: inherit;
  font-size: 12px;
  line-height: 30px;
  color: $text-regular;
  white-space: nowrap;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 4px;
  transition:
    color 0.2s,
    background 0.2s,
    box-shadow 0.2s;
}

.tab-item:hover {
  color: $primary-color;
  background: rgba($primary-color, 0.08);
}

.tab-item.is-active {
  font-weight: 500;
  color: $primary-color;
  background: rgba($primary-color, 0.1);
  box-shadow: 0 0 0 1px rgba($primary-color, 0.14) inset;
}

.tab-item.is-active::after {
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 16px;
  height: 2px;
  content: '';
  background: $primary-color;
  border-radius: 1px;
  transform: translateX(-50%);
}

.tab-title {
  overflow: hidden;
  text-overflow: ellipsis;
}

.tab-icon {
  flex-shrink: 0;
  font-size: 14px;
}
</style>
```

- [ ] **Step 2: Run type-check**

Run:

```bash
pnpm --filter elm-web-admin run type-check
```

Expected: PASS，`vue-tsc --noEmit` 完成且退出码为 `0`。

- [ ] **Step 3: Run the focused helper test again**

Run:

```bash
pnpm --filter elm-web-admin exec vitest run src/widgets/admin-layout/ui/TabBarFromScratch/__tests__/tabPresentation.test.ts
```

Expected: PASS，`2 tests` 通过。

- [ ] **Step 4: Commit the minimal component**

Run:

```bash
git add apps/web-admin/src/widgets/admin-layout/ui/TabBarFromScratch/index.vue
git commit -m "feat: add tabbar from scratch basic view"
```

Expected: commit 只包含 `TabBarFromScratch/index.vue`。

## Task 4: Optional Manual Integration Check

**Files:**
- Temporarily modify: `apps/web-admin/src/widgets/admin-layout/ui/AdminLayout.vue`
- Restore before commit: `apps/web-admin/src/widgets/admin-layout/ui/AdminLayout.vue`

- [ ] **Step 1: Temporarily import the practice component**

Change this line:

```ts
import TabBar from './TabBar/index.vue'
```

to:

```ts
import TabBar from './TabBarFromScratch/index.vue'
```

- [ ] **Step 2: Start the admin dev server**

Run:

```bash
pnpm --filter elm-web-admin run dev
```

Expected: Vite prints a local URL, usually `http://localhost:5173/` or the next available port.

- [ ] **Step 3: Check the UI manually**

In the browser:

- The TabBar row appears between TopNavigation and MainContent.
- Existing opened tabs render as compact buttons.
- The current route tab has active styling.
- Clicking another tab navigates to that tab.
- No close button, scroll button, right-click menu, or more menu appears in phase 1.

- [ ] **Step 4: Restore the original import**

Change this line back:

```ts
import TabBar from './TabBar/index.vue'
```

- [ ] **Step 5: Confirm no permanent layout diff remains**

Run:

```bash
git diff -- apps/web-admin/src/widgets/admin-layout/ui/AdminLayout.vue
```

Expected: no output.

## Verification Before Moving To Phase 2

- [ ] `pnpm --filter elm-web-admin exec vitest run src/widgets/admin-layout/ui/TabBarFromScratch/__tests__/tabPresentation.test.ts` passes.
- [ ] `pnpm --filter elm-web-admin run type-check` passes.
- [ ] `apps/web-admin/src/widgets/admin-layout/ui/AdminLayout.vue` has no committed diff.
- [ ] Phase 1 commits only contain files under `apps/web-admin/src/widgets/admin-layout/ui/TabBarFromScratch/`.

## Self-Review Notes

- Spec coverage: this plan covers the phase 1 requirements from `docs/superpowers/specs/2026-05-28-tabbar-teaching-rewrite-design.md`: render tabs, active state, click routing, and no enhanced UI.
- Placeholder scan: all code and command steps are concrete; later-stage functions are outside this phase 1 scope.
- Type consistency: `TabItem`, `useTabsStore`, `transformI18n`, `route.fullPath`, and `router.push()` match the existing admin app APIs.
