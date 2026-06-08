# TabBarFromScratch Phase 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将阶�?1 里单�?tab 的模板、样式和事件边界抽成 `TabBarItem.vue`，保持现有渲染与点击切换行为不变�?
**Architecture:** `TabBarFromScratch/index.vue` 继续负责读取 `tabsStore`、计�?`tabViews`、调�?`router.push()`；`TabBarItem.vue` 只负责展示一�?tab，并通过 emits 把点击事件交还给父组件。当�?`AdminLayout.vue` 的临时接入仅用于手动验证，不纳入本阶段提交�?
**Tech Stack:** Vue 3 `<script setup lang="ts">`、typed `defineProps`/`defineEmits`、Vitest、vue-tsc�?
---

## File Structure

- Create: `apps/web-admin/src/widgets/admin-layout/ui/TabBarFromScratch/TabBarItem.vue`
  - 单个页签按钮，接�?`tab`、`title`、`active`、`itemClass`，发�?`click(fullPath)`�?- Modify: `apps/web-admin/src/widgets/admin-layout/ui/TabBarFromScratch/index.vue`
  - 引入 `TabBarItem`，用组件替换内联 button 模板�?- Keep unstaged: `apps/web-admin/src/widgets/admin-layout/ui/AdminLayout.vue`
  - 保持临时指向 `TabBarFromScratch`，方便浏览器热更新验证；不要提交�?
## Component Contract

`TabBarItem.vue`:

```ts
defineProps<{
  tab: TabItem
  title: string
  active: boolean
  itemClass: Record<string, boolean>
}>()

defineEmits<{
  click: [fullPath: string]
}>()
```

## Task 1: Create `TabBarItem.vue`

**Files:**
- Create: `apps/web-admin/src/widgets/admin-layout/ui/TabBarFromScratch/TabBarItem.vue`

- [ ] **Step 1: Add the child component**

```vue
<script setup lang="ts">
import type { TabItem } from '@/entities/tab'

defineOptions({ name: 'TabBarFromScratchItem' })

defineProps<{
  tab: TabItem
  title: string
  active: boolean
  itemClass: Record<string, boolean>
}>()

const emit = defineEmits<{
  click: [fullPath: string]
}>()
</script>

<template>
  <button
    class="tab-item"
    :class="itemClass"
    type="button"
    role="tab"
    :aria-selected="active"
    :title="title"
    @click="emit('click', tab.fullPath)"
  >
    <el-icon v-if="tab.icon" class="tab-icon">
      <SvgIcon :icon-name="tab.icon" />
    </el-icon>
    <span class="tab-title">{{ title }}</span>
  </button>
</template>
```

Move the `.tab-item`, `.tab-title`, and `.tab-icon` scoped styles from `index.vue` into this component.

## Task 2: Refactor `index.vue` To Use `TabBarItem`

**Files:**
- Modify: `apps/web-admin/src/widgets/admin-layout/ui/TabBarFromScratch/index.vue`

- [ ] **Step 1: Import the child component**

```ts
import TabBarItem from './TabBarItem.vue'
```

- [ ] **Step 2: Replace the inline button**

```vue
<TabBarItem
  v-for="item in tabViews"
  :key="item.tab.fullPath"
  :tab="item.tab"
  :title="item.title"
  :active="item.active"
  :item-class="item.itemClass"
  @click="handleTabClick"
/>
```

- [ ] **Step 3: Keep only container styles in `index.vue`**

`index.vue` should keep `.tab-bar-from-scratch` and `.tab-track`; button styles live in `TabBarItem.vue`.

## Task 3: Verify

- [ ] **Step 1: Run type-check**

```bash
pnpm --filter @elm-platform/web-admin run type-check
```

Expected: PASS.

- [ ] **Step 2: Run focused tests**

```bash
pnpm --filter @elm-platform/web-admin exec vitest run src/widgets/admin-layout/ui/TabBarFromScratch/__tests__/tabPresentation.test.ts
```

Expected: PASS.

- [ ] **Step 3: Verify dev server still serves the temporary page**

```bash
Invoke-WebRequest -UseBasicParsing -Uri 'http://localhost:5177/src/widgets/admin-layout/ui/TabBarFromScratch/TabBarItem.vue'
```

Expected: HTTP 200.

## Task 4: Commit Phase 2

- [ ] **Step 1: Stage only phase 2 files**

```bash
git add apps/web-admin/src/widgets/admin-layout/ui/TabBarFromScratch/TabBarItem.vue apps/web-admin/src/widgets/admin-layout/ui/TabBarFromScratch/index.vue docs/superpowers/plans/2026-05-28-tabbar-from-scratch-phase-2.md
```

Do not stage `apps/web-admin/src/widgets/admin-layout/ui/AdminLayout.vue`.

- [ ] **Step 2: Commit**

```bash
git commit -m "refactor: extract tabbar from scratch item"
```

