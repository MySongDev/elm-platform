# Top Navigation Rename Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename the admin layout `Header` component folder to the more semantic `TopNavigation` name.

**Architecture:** The folder rename is local to `src/widgets/admin-layout/ui`. `TopNavigation/index.vue` remains the public entry for the top navigation area, while `Breadcrumb.vue`, `Hamburger.vue`, and `LangSwitcher.vue` stay colocated internal child components. `AdminLayout.vue` imports the renamed entry component.

**Tech Stack:** Vue 3 SFC, TypeScript, Vite aliasing, `vue-tsc --noEmit` validation.

---

### Task 1: Rename Header Folder to TopNavigation

**Files:**
- Move: `src/widgets/admin-layout/ui/Header/` → `src/widgets/admin-layout/ui/TopNavigation/`
- Modify: `src/widgets/admin-layout/ui/AdminLayout.vue`
- Modify: `src/widgets/admin-layout/ui/TopNavigation/index.vue`

- [ ] **Step 1: Move the folder**

Run from `apps/web-admin`:

```powershell
Move-Item "src/widgets/admin-layout/ui/Header" "src/widgets/admin-layout/ui/TopNavigation"
```

Expected: `src/widgets/admin-layout/ui/TopNavigation/index.vue` exists and `src/widgets/admin-layout/ui/Header` no longer exists.

- [ ] **Step 2: Update the layout import and template usage**

In `src/widgets/admin-layout/ui/AdminLayout.vue`, change:

```ts
import Header from './Header/index.vue'
```

To:

```ts
import TopNavigation from './TopNavigation/index.vue'
```

And change template usage:

```vue
<Header />
```

To:

```vue
<TopNavigation />
```

- [ ] **Step 3: Update the component name**

In `src/widgets/admin-layout/ui/TopNavigation/index.vue`, change:

```ts
defineOptions({ name: 'AppHeader' })
```

To:

```ts
defineOptions({ name: 'TopNavigation' })
```

---

### Task 2: Verify References and Types

**Files:**
- Inspect: `src/**/*.ts`
- Inspect: `src/**/*.vue`
- Generated declaration may update later: `src/typings/components.d.ts`

- [ ] **Step 1: Search for stale Header paths**

Run:

```bash
rg "widgets/admin-layout/ui/Header|\.\/Header|Header/index.vue|<Header\b" src
```

Expected: no output, except generated stale entries in `src/typings/components.d.ts` if auto-generated component typings have not been refreshed.

- [ ] **Step 2: Run Vue type check**

Run:

```bash
npx vue-tsc --noEmit
```

Expected: exits `0` with no output.

- [ ] **Step 3: If component typings are stale, update them only if needed**

If `vue-tsc` reports `src/typings/components.d.ts` stale imports for `Header`, edit that generated declaration to replace old paths:

```ts
Header: typeof import('./../widgets/admin-layout/ui/Header/index.vue').default
```

With the new semantic component entry if the declaration still includes the component:

```ts
TopNavigation: typeof import('./../widgets/admin-layout/ui/TopNavigation/index.vue').default
```

Then rerun:

```bash
npx vue-tsc --noEmit
```

Expected: exits `0` with no output.

---

## Self-Review

- Spec coverage: plan renames the folder, updates the only layout import, updates the component name, checks stale references, and validates TypeScript.
- Placeholder scan: no placeholders remain; commands and target code are explicit.
- Type consistency: component folder, import identifier, template tag, and `defineOptions` name all use `TopNavigation`.
