# Sidebar Pure Admin Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align the admin Sidebar with the selected vue-pure-admin core behavior and visual experience while preserving this project's current layout architecture.

**Architecture:** Keep `AdminLayout.vue` as the single owner of collapse state, then let `Sidebar/index.vue` expose local center and bottom collapse controls through a `toggleCollapse` event. Keep menu data and active/open state in `Sidebar/index.vue`, recursive rendering in `SidebarItem.vue`, and add small local helper components for link wrapping and collapse controls.

**Tech Stack:** Vue 3 SFCs with `<script setup lang="ts">`, Vue Router 4, Pinia, Element Plus `el-menu`, project-local SVG icons, SCSS variables from `apps/web-admin/src/shared/styles/_variables.scss`.

---

## File Structure

- Modify: `apps/web-admin/src/widgets/admin-layout/ui/AdminLayout.vue`
  - Wire Sidebar's new `toggleCollapse` event to the existing `toggleCollapse()` function.
- Modify: `apps/web-admin/src/widgets/admin-layout/ui/Sidebar/index.vue`
  - Add hover state, emit contract, `unique-opened`, `collapse-transition=false`, popper class, center/bottom collapse controls, and reference-inspired scroll sizing and active/collapsed styles.
- Modify: `apps/web-admin/src/widgets/admin-layout/ui/Sidebar/SidebarItem.vue`
  - Refine recursive item rendering, path resolving, one-child flattening, link wrapping, nested classes, external link support, and safer hidden child filtering.
- Modify: `apps/web-admin/src/widgets/admin-layout/ui/Sidebar/Logo.vue`
  - Adjust logo height, title alignment, and collapsed presentation to match the reference-style sidebar.
- Create: `apps/web-admin/src/widgets/admin-layout/ui/Sidebar/SidebarLinkItem.vue`
  - Wrap internal items with `router-link` and external items with an anchor tag.
- Create: `apps/web-admin/src/widgets/admin-layout/ui/Sidebar/SidebarCenterCollapse.vue`
  - Floating center collapse control shown on hover or when collapsed.
- Create: `apps/web-admin/src/widgets/admin-layout/ui/Sidebar/SidebarLeftCollapse.vue`
  - Bottom collapse control.

## Task 1: Wire Sidebar Collapse Event

**Files:**
- Modify: `apps/web-admin/src/widgets/admin-layout/ui/AdminLayout.vue`

- [ ] **Step 1: Update Sidebar usage to listen for the collapse event**

Replace the Sidebar invocation with:

```vue
<Sidebar :collapse="isCollapse" @toggle-collapse="toggleCollapse" />
```

The template should become:

```vue
<template>
  <div class="app-wrapper">
    <Sidebar :collapse="isCollapse" @toggle-collapse="toggleCollapse" />
    <div class="main-container" :class="{ collapse: isCollapse }">
      <TopNavigation :collapse="isCollapse" @toggle-collapse="toggleCollapse" />
      <TabBar />
      <MainContent />
    </div>
  </div>
</template>
```

- [ ] **Step 2: Verify the file compiles syntactically**

Run:

```bash
pnpm build
```

Expected: the command may still reveal later Sidebar errors if subsequent tasks are already partially applied, but `AdminLayout.vue` must not report a template event or missing identifier error.

- [ ] **Step 3: Commit**

```bash
git add apps/web-admin/src/widgets/admin-layout/ui/AdminLayout.vue
git commit -m "feat: wire sidebar collapse event"
```

## Task 2: Add Sidebar Link Wrapper

**Files:**
- Create: `apps/web-admin/src/widgets/admin-layout/ui/Sidebar/SidebarLinkItem.vue`

- [ ] **Step 1: Create the wrapper component**

Create `SidebarLinkItem.vue` with:

```vue
<script setup lang="ts">
import type { RouteRecordRaw } from 'vue-router'

defineOptions({ name: 'SidebarLinkItem' })

const props = defineProps<{
  to: RouteRecordRaw | string
}>()

const HTTP_URL_RE = /^https?:\/\//i

const isExternalLink = computed(() => {
  if (typeof props.to === 'string')
    return HTTP_URL_RE.test(props.to)

  return HTTP_URL_RE.test(props.to.path) || (typeof props.to.name === 'string' && HTTP_URL_RE.test(props.to.name))
})

const linkProps = computed(() => {
  if (typeof props.to === 'string') {
    return isExternalLink.value
      ? { href: props.to, target: '_blank', rel: 'noopener' }
      : { to: props.to }
  }

  if (isExternalLink.value) {
    const href = typeof props.to.name === 'string' && HTTP_URL_RE.test(props.to.name)
      ? props.to.name
      : props.to.path
    return { href, target: '_blank', rel: 'noopener' }
  }

  return { to: props.to.path }
})
</script>

<template>
  <component :is="isExternalLink ? 'a' : 'router-link'" v-bind="linkProps">
    <slot />
  </component>
</template>
```

- [ ] **Step 2: Run build to catch type/template issues**

Run:

```bash
pnpm build
```

Expected: no errors from `SidebarLinkItem.vue`.

- [ ] **Step 3: Commit**

```bash
git add apps/web-admin/src/widgets/admin-layout/ui/Sidebar/SidebarLinkItem.vue
git commit -m "feat: add sidebar link wrapper"
```

## Task 3: Add Collapse Control Components

**Files:**
- Create: `apps/web-admin/src/widgets/admin-layout/ui/Sidebar/SidebarCenterCollapse.vue`
- Create: `apps/web-admin/src/widgets/admin-layout/ui/Sidebar/SidebarLeftCollapse.vue`

- [ ] **Step 1: Create center collapse control**

Create `SidebarCenterCollapse.vue` with:

```vue
<script setup lang="ts">
import {
  IconArrowLeft as IconEpArrowLeft,
} from '@iconify-prerendered/vue-ep'

defineOptions({ name: 'SidebarCenterCollapse' })

withDefaults(defineProps<{
  isActive?: boolean
}>(), {
  isActive: false,
})

defineEmits<{
  toggleClick: []
}>()
</script>

<template>
  <el-tooltip :content="isActive ? '鐐瑰嚮鎶樺彔' : '鐐瑰嚮灞曞紑'" placement="right">
    <button class="center-collapse" type="button" @click="$emit('toggleClick')">
      <el-icon :size="16" :style="{ transform: isActive ? 'none' : 'rotateY(180deg)' }">
        <IconEpArrowLeft />
      </el-icon>
    </button>
  </el-tooltip>
</template>

<style scoped lang="scss">
.center-collapse {
  position: absolute;
  top: 50%;
  right: 2px;
  z-index: 1002;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 34px;
  padding: 0;
  color: $primary-color;
  cursor: pointer;
  background: $bg-white;
  border: 1px solid $border-light;
  border-radius: 4px;
  transform: translate(12px, -50%);

  .el-icon {
    transition: transform 0.1s;
  }
}
</style>
```

- [ ] **Step 2: Create bottom collapse control**

Create `SidebarLeftCollapse.vue` with:

```vue
<script setup lang="ts">
import {
  IconFold as IconEpFold,
} from '@iconify-prerendered/vue-ep'

defineOptions({ name: 'SidebarLeftCollapse' })

withDefaults(defineProps<{
  isActive?: boolean
}>(), {
  isActive: false,
})

defineEmits<{
  toggleClick: []
}>()
</script>

<template>
  <div class="left-collapse">
    <el-tooltip :content="isActive ? '鐐瑰嚮鎶樺彔' : '鐐瑰嚮灞曞紑'" placement="right">
      <button class="left-collapse__button" type="button" @click="$emit('toggleClick')">
        <el-icon :size="18" :style="{ transform: isActive ? 'none' : 'rotateY(180deg)' }">
          <IconEpFold />
        </el-icon>
      </button>
    </el-tooltip>
  </div>
</template>

<style scoped lang="scss">
.left-collapse {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 40px;
  line-height: 40px;
  box-shadow: 0 0 6px -3px $primary-color;
}

.left-collapse__button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 0;
  color: $sidebar-text;
  cursor: pointer;
  background: transparent;
  border: 0;

  &:hover {
    color: $white-color;
  }

  .el-icon {
    transition: transform 0.1s;
  }
}
</style>
```

- [ ] **Step 3: Run build**

Run:

```bash
pnpm build
```

Expected: no missing icon or component type errors from the two new collapse controls.

- [ ] **Step 4: Commit**

```bash
git add apps/web-admin/src/widgets/admin-layout/ui/Sidebar/SidebarCenterCollapse.vue apps/web-admin/src/widgets/admin-layout/ui/Sidebar/SidebarLeftCollapse.vue
git commit -m "feat: add sidebar collapse controls"
```

## Task 4: Refine Recursive Sidebar Items

**Files:**
- Modify: `apps/web-admin/src/widgets/admin-layout/ui/Sidebar/SidebarItem.vue`

- [ ] **Step 1: Replace the script section**

Use this script:

```vue
<script setup lang="ts">
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/entities/session'
import { transformI18n } from '@/shared/i18n'
import { filterRoutesByAccess } from '@/shared/lib/permission'
import SidebarLinkItem from './SidebarLinkItem.vue'

defineOptions({ name: 'SidebarItem' })

const props = withDefaults(defineProps<{
  route: RouteRecordRaw
  basePath?: string
  isNest?: boolean
}>(), {
  basePath: '',
  isNest: false,
})

const authStore = useAuthStore()

function normalizePath(path: string): string {
  return path.replace(/\/+/g, '/')
}

function resolvePath(routePath: string): string {
  if (/^https?:\/\//i.test(routePath) || /^https?:\/\//i.test(props.basePath))
    return routePath || props.basePath

  if (routePath.startsWith('/'))
    return normalizePath(routePath)

  return normalizePath(`${props.basePath}/${routePath}`)
}

function getTitle(meta?: RouteRecordRaw['meta']): string {
  if (!meta)
    return ''

  return transformI18n(meta.title)
}

const visibleChildren = computed(() => {
  const userRole = authStore.userInfo?.role
  const children = props.route.children ?? []
  return filterRoutesByAccess(children, userRole, authStore.permissions)
    .filter(child => !child.meta?.hidden)
})

const onlyChild = computed(() => visibleChildren.value[0])

const hasOneShowingChild = computed(() => {
  if (props.route.meta?.alwaysShow)
    return false

  return visibleChildren.value.length === 1
})

const fullPath = computed(() => resolvePath(props.route.path))

const leafRoute = computed(() => {
  if (hasOneShowingChild.value && onlyChild.value)
    return onlyChild.value

  return props.route
})

const leafPath = computed(() => {
  if (hasOneShowingChild.value && onlyChild.value)
    return normalizePath(`${fullPath.value}/${onlyChild.value.path}`)

  return fullPath.value
})

const leafIcon = computed(() => {
  return (leafRoute.value.meta?.icon || props.route.meta?.icon) as string | undefined
})

const leafTitle = computed(() => {
  return getTitle(leafRoute.value.meta) || getTitle(props.route.meta)
})
</script>
```

- [ ] **Step 2: Replace the template section**

Use this template:

```vue
<template>
  <template v-if="!route.meta?.hidden">
    <SidebarLinkItem
      v-if="visibleChildren.length === 0 || hasOneShowingChild"
      :to="leafPath"
    >
      <el-menu-item
        :index="leafPath"
        :class="[
          { 'submenu-title-noDropdown': !isNest },
          { 'nest-menu': isNest },
        ]"
      >
        <SvgIcon v-if="leafIcon" :icon-name="leafIcon" icon-class="sidebar-menu-icon" />
        <template #title>
          <span class="menu-title">{{ leafTitle }}</span>
        </template>
      </el-menu-item>
    </SidebarLinkItem>

    <el-sub-menu v-else :index="fullPath" :class="{ 'nest-menu': isNest }">
      <template #title>
        <SvgIcon v-if="route.meta?.icon" :icon-name="route.meta.icon" icon-class="sidebar-menu-icon" />
        <span class="menu-title">{{ getTitle(route.meta) }}</span>
      </template>
      <SidebarItem
        v-for="child in visibleChildren"
        :key="child.path"
        :route="child"
        :base-path="fullPath"
        :is-nest="true"
      />
    </el-sub-menu>
  </template>
</template>
```

- [ ] **Step 3: Run build**

Run:

```bash
pnpm build
```

Expected: no TypeScript or template errors from `SidebarItem.vue`.

- [ ] **Step 4: Commit**

```bash
git add apps/web-admin/src/widgets/admin-layout/ui/Sidebar/SidebarItem.vue
git commit -m "feat: align sidebar item behavior"
```

## Task 5: Integrate Controls And Menu Shell

**Files:**
- Modify: `apps/web-admin/src/widgets/admin-layout/ui/Sidebar/index.vue`

- [ ] **Step 1: Update imports, emits, and hover state**

Add the new imports:

```ts
import SidebarCenterCollapse from './SidebarCenterCollapse.vue'
import SidebarLeftCollapse from './SidebarLeftCollapse.vue'
```

Add emits after props:

```ts
const emit = defineEmits<{
  toggleCollapse: []
}>()
```

Add hover state:

```ts
const isSidebarHover = ref(false)
```

- [ ] **Step 2: Simplify the menu synchronization watcher**

Keep the existing `filteredRoutes`, `activeMenu`, `resolveOpenKeys`, `syncOpenKeys`, `handleOpen`, and `handleClose` logic. Update the watcher source so it also responds when menu routes are loaded:

```ts
watch(
  () => [route.path, filteredRoutes.value] as const,
  ([newPath]) => {
    const targetKeys = resolveOpenKeys(newPath, filteredRoutes.value) ?? []
    nextTick(() => syncOpenKeys(targetKeys))
  },
  { immediate: true },
)
```

- [ ] **Step 3: Replace the template section**

Use:

```vue
<template>
  <div
    class="sidebar-container has-logo"
    :class="{ collapse: props.collapse }"
    @mouseenter.prevent="isSidebarHover = true"
    @mouseleave.prevent="isSidebarHover = false"
  >
    <Logo :collapse="props.collapse" />
    <el-scrollbar wrap-class="scrollbar-wrapper" class="sidebar-scrollbar">
      <el-menu
        ref="menuRef"
        unique-opened
        mode="vertical"
        popper-class="sidebar-menu-popper"
        class="outer-most select-none"
        :default-active="activeMenu"
        :collapse="props.collapse"
        :collapse-transition="false"
        background-color="#001529"
        text-color="rgb(254 254 254 / 65%)"
        active-text-color="#409eff"
        router
        @open="handleOpen"
        @close="handleClose"
      >
        <SidebarItem
          v-for="route in filteredRoutes"
          :key="route.path"
          :route="route"
          :base-path="route.path"
          class="outer-most select-none"
        />
      </el-menu>
    </el-scrollbar>
    <SidebarCenterCollapse
      v-if="isSidebarHover || props.collapse"
      :is-active="!props.collapse"
      @toggle-click="emit('toggleCollapse')"
    />
    <SidebarLeftCollapse
      :is-active="!props.collapse"
      @toggle-click="emit('toggleCollapse')"
    />
  </div>
</template>
```

- [ ] **Step 4: Replace Sidebar root sizing styles**

At the top of the scoped style block, keep `.sidebar-container` and update these core rules:

```scss
.sidebar-container {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  z-index: 1001;
  width: $sidebar-width !important;
  height: 100%;
  overflow: visible;
  font-size: 0;
  background: $sidebar-bg !important;
  border-right: 1px solid $border-light;
  transition: width var(--app-transition-duration);

  &.has-logo {
    .sidebar-scrollbar {
      height: calc(100% - 90px);
    }
  }

  a {
    display: flex;
    flex-wrap: wrap;
    width: 100%;
    color: inherit;
    text-decoration: none;
  }
}
```

- [ ] **Step 5: Add active and collapsed state rules**

Ensure the style block contains these rules, replacing overlapping older active/collapse rules where necessary:

```scss
:deep(.el-menu-item.is-active.nest-menu > *),
:deep(.is-active.submenu-title-noDropdown.outer-most > *) {
  z-index: 1;
  color: $white-color;
}

:deep(.el-menu-item.is-active.nest-menu::before),
:deep(.is-active.submenu-title-noDropdown.outer-most::before) {
  position: absolute;
  inset: 0 8px;
  clear: both;
  margin: 4px 0;
  content: '';
  background: var(--el-color-primary) !important;
  border-radius: 3px;
}

&.collapse {
  width: $sidebar-collapsed-width !important;

  :deep(.el-menu-item),
  :deep(.el-sub-menu__title) {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 !important;
  }

  :deep(.el-menu--collapse .is-active.outer-most.el-sub-menu > .el-sub-menu__title::before),
  :deep(.is-active.submenu-title-noDropdown.outer-most::before) {
    position: absolute;
    top: 0;
    left: 0;
    inset: unset;
    width: 2px;
    height: 100%;
    margin: 0;
    content: '';
    background-color: var(--el-color-primary);
    border-radius: 0;
    transform: translateY(0);
    transition: all var(--app-transition-duration) ease-in-out;
  }

  :deep(.sidebar-menu-icon) {
    margin: 0;
  }

  :deep(.menu-title) {
    width: 0;
    min-width: 0;
    margin: 0;
    overflow: hidden;
    opacity: 0;
    transition-delay: 0s;
  }

  :deep(.el-sub-menu__icon-arrow) {
    display: none;
  }
}
```

- [ ] **Step 6: Add popup style outside scoped deep limitations if needed**

If `popper-class="sidebar-menu-popper"` is not affected by the scoped rules, add a non-scoped style block at the end of `index.vue`:

```vue
<style lang="scss">
.sidebar-menu-popper {
  background: #120000 !important;

  .el-menu {
    background: #120000 !important;
  }

  .el-menu-item,
  .el-sub-menu__title {
    color: rgb(254 254 254 / 78%);
    background: #120000 !important;

    &:hover {
      color: $white-color;
      background: #1a0505 !important;
    }
  }
}
</style>
```

- [ ] **Step 7: Run build**

Run:

```bash
pnpm build
```

Expected: no Vue template or SCSS errors from `Sidebar/index.vue`.

- [ ] **Step 8: Commit**

```bash
git add apps/web-admin/src/widgets/admin-layout/ui/Sidebar/index.vue
git commit -m "feat: align sidebar shell experience"
```

## Task 6: Align Logo Presentation

**Files:**
- Modify: `apps/web-admin/src/widgets/admin-layout/ui/Sidebar/Logo.vue`

- [ ] **Step 1: Replace the template with a stable logo structure**

Use:

```vue
<template>
  <div class="sidebar-logo-container" :class="{ collapses: collapse }">
    <transition name="sidebarLogoFade">
      <router-link :key="collapse ? 'collapse' : 'expand'" class="sidebar-logo-link" to="/">
        <span class="sidebar-title">{{ collapse ? 'EA' : 'Elm Admin' }}</span>
      </router-link>
    </transition>
  </div>
</template>
```

- [ ] **Step 2: Update logo styles**

Use:

```scss
.sidebar-logo-container {
  position: relative;
  width: 100%;
  height: 50px;
  overflow: hidden;
  background-color: #002140;

  .sidebar-logo-link {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 0 10px;
    text-decoration: none;

    .sidebar-title {
      display: inline-block;
      max-width: 100%;
      height: 32px;
      overflow: hidden;
      text-overflow: ellipsis;
      font-size: 18px;
      font-weight: 600;
      line-height: 32px;
      color: #fff;
      white-space: nowrap;
    }
  }
}

.sidebar-logo-container.collapses {
  .sidebar-logo-link {
    padding: 0;
  }

  .sidebar-title {
    font-size: 16px;
  }
}
```

Keep the existing `sidebarLogoFade-*` transition rules.

- [ ] **Step 3: Run build**

Run:

```bash
pnpm build
```

Expected: no errors from `Logo.vue`.

- [ ] **Step 4: Commit**

```bash
git add apps/web-admin/src/widgets/admin-layout/ui/Sidebar/Logo.vue
git commit -m "style: align sidebar logo"
```

## Task 7: Final Verification And Cleanup

**Files:**
- Verify: `apps/web-admin/src/widgets/admin-layout/ui/AdminLayout.vue`
- Verify: `apps/web-admin/src/widgets/admin-layout/ui/Sidebar/index.vue`
- Verify: `apps/web-admin/src/widgets/admin-layout/ui/Sidebar/SidebarItem.vue`
- Verify: `apps/web-admin/src/widgets/admin-layout/ui/Sidebar/Logo.vue`
- Verify: `apps/web-admin/src/widgets/admin-layout/ui/Sidebar/SidebarLinkItem.vue`
- Verify: `apps/web-admin/src/widgets/admin-layout/ui/Sidebar/SidebarCenterCollapse.vue`
- Verify: `apps/web-admin/src/widgets/admin-layout/ui/Sidebar/SidebarLeftCollapse.vue`

- [ ] **Step 1: Run full build**

Run:

```bash
pnpm build
```

Expected: command exits with code 0.

- [ ] **Step 2: Inspect changed files**

Run:

```bash
git diff -- apps/web-admin/src/widgets/admin-layout/ui/AdminLayout.vue apps/web-admin/src/widgets/admin-layout/ui/Sidebar/index.vue apps/web-admin/src/widgets/admin-layout/ui/Sidebar/SidebarItem.vue apps/web-admin/src/widgets/admin-layout/ui/Sidebar/Logo.vue apps/web-admin/src/widgets/admin-layout/ui/Sidebar/SidebarLinkItem.vue apps/web-admin/src/widgets/admin-layout/ui/Sidebar/SidebarCenterCollapse.vue apps/web-admin/src/widgets/admin-layout/ui/Sidebar/SidebarLeftCollapse.vue
```

Expected:

- No unrelated files are changed.
- No reference-project imports such as `@pureadmin/utils`, `@/layout/hooks/useNav`, `path-browserify`, or `~icons/...` are introduced.
- Sidebar controls emit to the existing `toggleCollapse()` function.
- Menu rendering still uses project-local `SvgIcon` and `transformI18n`.

- [ ] **Step 3: Optional local interaction check**

Run the dev server if visual verification is needed:

```bash
pnpm --filter @elm-platform/web-admin dev
```

Expected:

- Sidebar expands and collapses from the top hamburger, center control, and bottom control.
- Active nested routes highlight correctly.
- Collapsed top-level active items show a left indicator.
- Single-child menu branches render as direct leaf menu items unless `meta.alwaysShow` is set.

- [ ] **Step 4: Commit final cleanup if any**

If Step 2 or Step 3 required cleanup changes:

```bash
git add apps/web-admin/src/widgets/admin-layout/ui/AdminLayout.vue apps/web-admin/src/widgets/admin-layout/ui/Sidebar/index.vue apps/web-admin/src/widgets/admin-layout/ui/Sidebar/SidebarItem.vue apps/web-admin/src/widgets/admin-layout/ui/Sidebar/Logo.vue apps/web-admin/src/widgets/admin-layout/ui/Sidebar/SidebarLinkItem.vue apps/web-admin/src/widgets/admin-layout/ui/Sidebar/SidebarCenterCollapse.vue apps/web-admin/src/widgets/admin-layout/ui/Sidebar/SidebarLeftCollapse.vue
git commit -m "chore: verify sidebar pure-admin alignment"
```

Expected: commit only contains cleanup found during final verification.

## Self-Review

- Spec coverage: The plan covers route filtering, active path, open key synchronization, one-child flattening, hidden routes, external links, collapse controls, scroll sizing, active styles, popup styles, and build verification.
- Placeholder scan: The plan contains no deferred placeholders; each task names concrete files, code snippets, commands, and expected results.
- Type consistency: Event names are `toggleCollapse` in script contracts and `@toggle-collapse` in templates; collapse control emits are `toggleClick` in script contracts and `@toggle-click` in templates; route item props remain `route`, `basePath`, and `isNest`.

