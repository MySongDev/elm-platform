# Route Menu Protocol Isolation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce a thin internal `RouteMenuNode` model so backend menu payloads no longer drive Vue Router directly, while preserving existing behavior and allowing backend-provided titles.

**Architecture:** Keep the current dynamic route mechanism, but split responsibilities into schema validation/normalization, backend-to-route-menu adaptation, title fallback configuration, and route construction. `build-routes.ts` becomes a compatibility facade that accepts backend menus, adapts them, and delegates to `buildRoutesFromRouteMenus()`.

**Tech Stack:** Vue 3, Vue Router 4, TypeScript strict mode, Vitest, Vite path alias `@`.

---

## File Structure

- Create: `apps/web-admin/src/app/router/route-menu.types.ts`
  - Defines the frontend-owned `RouteMenuNode` model used by route construction.
- Create: `apps/web-admin/src/app/router/route-title-map.ts`
  - Holds legacy route name to title fallback mapping and fallback resolver.
- Create: `apps/web-admin/src/app/router/menu-adapter.ts`
  - Converts normalized backend menu nodes into `RouteMenuNode[]`.
- Modify: `apps/web-admin/src/app/router/menu-schema.ts`
  - Accept `unknown` at the boundary and return normalized `BackendMenuNode[]`; treat blank titles as valid backend data so title fallback can happen in the adapter.
- Modify: `apps/web-admin/src/app/router/build-routes.ts`
  - Build routes only from `RouteMenuNode`; keep `buildRoutes(menus)` as the public compatibility entry.
- Modify: `apps/web-admin/src/app/router/__tests__/build-routes.test.ts`
  - Update tests for backend title strategy, adapter boundary, and route construction from internal model.

---

### Task 1: Add the Internal Route Menu Model

**Files:**
- Create: `apps/web-admin/src/app/router/route-menu.types.ts`

- [ ] **Step 1: Create `RouteMenuNode` type**

Write `apps/web-admin/src/app/router/route-menu.types.ts`:

```ts
export interface RouteMenuNode {
  path: string
  name?: string
  component?: string
  title?: string
  icon?: string
  order?: number
  auths?: string[]
  cacheName?: string
  hidden?: boolean
  children?: RouteMenuNode[]
}
```

- [ ] **Step 2: Run type check**

Run from `apps/web-admin`:

```bash
pnpm type-check
```

Expected: PASS, because the new type is not used yet.

- [ ] **Step 3: Commit**

```bash
git add src/app/router/route-menu.types.ts
git commit -m "refactor: add route menu model"
```

---

### Task 2: Extract Route Title Fallback Mapping

**Files:**
- Create: `apps/web-admin/src/app/router/route-title-map.ts`
- Modify: `apps/web-admin/src/app/router/build-routes.ts`
- Test: `apps/web-admin/src/app/router/__tests__/build-routes.test.ts`

- [ ] **Step 1: Add failing test for backend-provided plain titles**

In `apps/web-admin/src/app/router/__tests__/build-routes.test.ts`, replace the test named `converts backend menu titles to route locale keys from route names` with this test:

```ts
it('keeps backend-provided titles when title is a non-empty string', () => {
  const routes = buildRoutes([
    createMenu({
      title: '仪表盘',
      path: '/dashboard/index',
      name: 'DashboardView',
    }),
    createMenu({
      id: 2,
      title: 'route.systemLog',
      path: '/monitor/system-logs',
      name: 'SystemLogs',
    }),
  ])

  expect(routes.map(route => route.meta?.title)).toEqual([
    '仪表盘',
    'route.systemLog',
  ])
})
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run from `apps/web-admin`:

```bash
pnpm vitest run src/app/router/__tests__/build-routes.test.ts
```

Expected: FAIL. The first title is currently converted to `route.dashboard` instead of keeping `仪表盘`.

- [ ] **Step 3: Create title fallback module**

Write `apps/web-admin/src/app/router/route-title-map.ts`:

```ts
import { normalizePath } from './utils'

const routeTitleKeyByName: Record<string, string> = {
  Dashboard: 'route.dashboard',
  DashboardView: 'route.dashboard',
  Permission: 'route.permissionManagement',
  PagePermission: 'route.pagePermission',
  ButtonPermission: 'route.buttonPermission',
  Monitor: 'route.systemMonitor',
  OnlineUser: 'route.onlineUser',
  LoginLogs: 'route.loginLog',
  OperationLogs: 'route.operationLog',
  SystemLogs: 'route.systemLog',
  System: 'route.systemManagement',
  UserList: 'route.userList',
  RoleManagement: 'route.roleManagement',
  MenuManagement: 'route.menuManagement',
  DeptManagement: 'route.deptManagement',
  Commerce: 'route.commerceManagement',
  CommerceRestaurantView: 'route.restaurantManagement',
  CommerceFoodView: 'route.foodManagement',
  CommerceOrderView: 'route.orderManagement',
  Nested: 'route.nestedMenu',
  NestedMenu1: 'route.menu1',
  NestedMenu11View: 'route.menu11',
  NestedMenu12: 'route.menu12',
  NestedMenu121View: 'route.menu121',
  NestedMenu122View: 'route.menu122',
  NestedMenu13View: 'route.menu13',
  NestedMenu2View: 'route.menu2',
}

export function resolveRouteTitleFallback(name: string | undefined, path: string): string {
  if (name && routeTitleKeyByName[name])
    return routeTitleKeyByName[name]

  return `route.${normalizeTitleSegment(path)}`
}

function normalizeTitleSegment(path: string): string {
  const segment = normalizePath(path).split('/').filter(Boolean).at(-1) ?? path
  return segment.replace(/-([a-z])/g, (_, char: string) => char.toUpperCase())
}
```

- [ ] **Step 4: Use backend title before fallback in `build-routes.ts`**

In `apps/web-admin/src/app/router/build-routes.ts`:

1. Add import:

```ts
import { resolveRouteTitleFallback } from './route-title-map'
```

2. Replace `resolveRouteTitle(menu)` with:

```ts
function resolveRouteTitle(menu: BackendMenuNode): string {
  const title = typeof menu.title === 'string' ? menu.title.trim() : ''
  if (title)
    return title

  return resolveRouteTitleFallback(menu.name ?? undefined, menu.path)
}
```

3. Delete the local `routeTitleKeyByName` object and `normalizeTitleSegment()` function from `build-routes.ts`.

- [ ] **Step 5: Run the focused tests**

Run from `apps/web-admin`:

```bash
pnpm vitest run src/app/router/__tests__/build-routes.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app/router/build-routes.ts src/app/router/route-title-map.ts src/app/router/__tests__/build-routes.test.ts
git commit -m "refactor: prefer backend route titles"
```

---

### Task 3: Add Backend Menu Adapter

**Files:**
- Create: `apps/web-admin/src/app/router/menu-adapter.ts`
- Test: `apps/web-admin/src/app/router/__tests__/build-routes.test.ts`

- [ ] **Step 1: Add failing adapter test**

In `apps/web-admin/src/app/router/__tests__/build-routes.test.ts`, add this import:

```ts
import { adaptBackendMenusToRouteMenus } from '../menu-adapter'
```

Add this `describe` block before `describe('buildRoutes', ...)`:

```ts
describe('adaptBackendMenusToRouteMenus', () => {
  it('converts backend menu fields into frontend route menu fields', () => {
    const routeMenus = adaptBackendMenusToRouteMenus([
      createMenu({
        title: '用户列表',
        path: '/system/user',
        name: 'UserList',
        icon: 'user',
        permission: 'system:user:list',
        component: 'system/user',
        sort: 10,
        status: 1,
      }),
    ])

    expect(routeMenus).toEqual([
      {
        path: '/system/user',
        name: 'UserList',
        component: 'system/user',
        title: '用户列表',
        icon: 'user',
        order: 10,
        auths: ['system:user:list'],
        cacheName: 'UserList',
      },
    ])
  })
})
```

- [ ] **Step 2: Run the test and verify it fails**

Run from `apps/web-admin`:

```bash
pnpm vitest run src/app/router/__tests__/build-routes.test.ts
```

Expected: FAIL because `../menu-adapter` does not exist.

- [ ] **Step 3: Implement the adapter**

Write `apps/web-admin/src/app/router/menu-adapter.ts`:

```ts
import type { BackendMenuNode } from './build-routes'
import type { RouteMenuNode } from './route-menu.types'
import { resolveRouteTitleFallback } from './route-title-map'

export function adaptBackendMenusToRouteMenus(menus: BackendMenuNode[]): RouteMenuNode[] {
  return menus.map(menu => adaptBackendMenuToRouteMenu(menu))
}

function adaptBackendMenuToRouteMenu(menu: BackendMenuNode): RouteMenuNode {
  const title = menu.title.trim() || resolveRouteTitleFallback(menu.name ?? undefined, menu.path)
  const children = menu.children?.map(child => adaptBackendMenuToRouteMenu(child))

  return {
    path: menu.path,
    ...(menu.name ? { name: menu.name } : {}),
    ...(menu.component ? { component: menu.component } : {}),
    title,
    ...(menu.icon ? { icon: menu.icon } : {}),
    ...(menu.sort !== undefined ? { order: menu.sort } : {}),
    ...(menu.permission ? { auths: [menu.permission] } : {}),
    ...(menu.name ? { cacheName: menu.name } : {}),
    ...(children?.length ? { children } : {}),
  }
}
```

- [ ] **Step 4: Run the focused tests**

Run from `apps/web-admin`:

```bash
pnpm vitest run src/app/router/__tests__/build-routes.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/router/menu-adapter.ts src/app/router/__tests__/build-routes.test.ts
git commit -m "refactor: adapt backend menus to route menus"
```

---

### Task 4: Make Route Construction Consume RouteMenuNode

**Files:**
- Modify: `apps/web-admin/src/app/router/build-routes.ts`
- Test: `apps/web-admin/src/app/router/__tests__/build-routes.test.ts`

- [ ] **Step 1: Add test for internal route menu route construction**

In `apps/web-admin/src/app/router/__tests__/build-routes.test.ts`, update the import from build routes:

```ts
import { buildRoutes, buildRoutesFromRouteMenus } from '../build-routes'
```

Add this test inside `describe('buildRoutes', ...)`:

```ts
it('builds Vue Router records from internal route menu nodes', () => {
  const routes = buildRoutesFromRouteMenus([
    {
      path: '/system',
      title: '系统管理',
      icon: 'setting',
      order: 1,
      children: [
        {
          path: 'user',
          name: 'UserList',
          component: 'system/user',
          title: '用户列表',
          auths: ['system:user:list'],
          cacheName: 'UserList',
          order: 2,
        },
      ],
    },
  ])

  expect(routes[0]).toMatchObject({
    path: '/system',
    redirect: '/system/user',
    meta: {
      title: '系统管理',
      icon: 'setting',
      order: 1,
    },
  })
  expect(routes[0].children?.[0]).toMatchObject({
    path: 'user',
    name: 'UserList',
    meta: {
      title: '用户列表',
      auths: ['system:user:list'],
      cacheName: 'UserList',
      order: 2,
    },
  })
})
```

- [ ] **Step 2: Run the test and verify it fails**

Run from `apps/web-admin`:

```bash
pnpm vitest run src/app/router/__tests__/build-routes.test.ts
```

Expected: FAIL because `buildRoutesFromRouteMenus` does not exist.

- [ ] **Step 3: Refactor `build-routes.ts` to use `RouteMenuNode` internally**

Replace `apps/web-admin/src/app/router/build-routes.ts` with:

```ts
import type { RouteRecordRaw } from 'vue-router'
import type { RouteMenuNode } from './route-menu.types'
import type { UserMenuNode } from '@/entities/session'
import { layoutComponent, resolveComponent } from './component-map'
import { adaptBackendMenusToRouteMenus } from './menu-adapter'
import { normalizeMenuTree } from './menu-schema'
import { normalizePath } from './utils'

export type BackendMenuNode = UserMenuNode

function joinPath(parentPath: string, path: string): string {
  return normalizePath(`${parentPath.replace(/\/$/, '')}/${path.replace(/^\//, '')}`)
}

function resolveFullPath(path: string, parentFullPath?: string): string {
  if (path.startsWith('/'))
    return normalizePath(path)

  return joinPath(parentFullPath ?? '', path)
}

function resolveRoutePath(path: string, fullPath: string, parentFullPath?: string): string {
  if (!parentFullPath)
    return fullPath

  const normalizedParent = normalizePath(parentFullPath)
  if (fullPath.startsWith(`${normalizedParent}/`))
    return fullPath.slice(normalizedParent.length + 1)

  return path.startsWith('/') ? fullPath : path
}

export function buildRoutes(menus: BackendMenuNode[]): RouteRecordRaw[] {
  const routeMenus = adaptBackendMenusToRouteMenus(filterEnabled(normalizeMenuTree(menus)))
  return buildRoutesFromRouteMenus(routeMenus)
}

export function buildRoutesFromRouteMenus(menus: RouteMenuNode[]): RouteRecordRaw[] {
  return menus
    .map(menu => buildRouteNode(menu))
    .filter((route): route is RouteRecordRaw => route !== null)
    .sort(sortRoutes)
}

function filterEnabled(menus: BackendMenuNode[]): BackendMenuNode[] {
  return menus
    .filter(menu => menu.status === 1)
    .map(menu => ({
      ...menu,
      children: menu.children ? filterEnabled(menu.children) : undefined,
    }))
}

function buildRouteNode(
  menu: RouteMenuNode,
  parentFullPath?: string,
): RouteRecordRaw | null {
  const fullPath = resolveFullPath(menu.path, parentFullPath)
  const routePath = resolveRoutePath(menu.path, fullPath, parentFullPath)
  const children = menu.children
    ?.map(child => buildRouteNode(child, fullPath))
    .filter((route): route is RouteRecordRaw => route !== null)
    .sort(sortRoutes)

  const meta: RouteRecordRaw['meta'] = {
    ...(menu.title ? { title: menu.title } : {}),
    ...(menu.icon ? { icon: menu.icon } : {}),
    ...(menu.auths?.length ? { auths: menu.auths } : {}),
    ...(menu.order !== undefined ? { order: menu.order } : {}),
    ...(menu.cacheName ? { cacheName: menu.cacheName } : {}),
    ...(menu.hidden !== undefined ? { hidden: menu.hidden } : {}),
  }

  if (children?.length) {
    const redirect = resolveFirstReachablePath(children, fullPath)
    const shouldAlwaysShow = children.length > 1 || children.some(child => child.children?.length)
    const catalogMeta = shouldAlwaysShow ? { ...meta, alwaysShow: true } : meta

    if (!parentFullPath) {
      return {
        path: routePath,
        component: layoutComponent,
        redirect,
        meta: catalogMeta,
        children,
      }
    }

    return {
      path: routePath,
      redirect,
      meta: catalogMeta,
      children,
    }
  }

  return {
    path: routePath,
    name: menu.name,
    component: resolveComponent(menu.component ?? fullPath.replace(/^\//, '')),
    meta,
  }
}

function sortRoutes(a: RouteRecordRaw, b: RouteRecordRaw): number {
  return (a.meta?.order ?? 99) - (b.meta?.order ?? 99)
}

function resolveFirstReachablePath(
  routes: RouteRecordRaw[],
  parentFullPath: string,
): string | undefined {
  const firstRoute = routes[0]
  if (!firstRoute)
    return undefined

  if (typeof firstRoute.redirect === 'string')
    return firstRoute.redirect

  const fullPath = firstRoute.path.startsWith('/')
    ? normalizePath(firstRoute.path)
    : joinPath(parentFullPath, firstRoute.path)

  if (firstRoute.children?.length)
    return resolveFirstReachablePath(firstRoute.children, fullPath)

  return fullPath
}
```

- [ ] **Step 4: Run focused tests**

Run from `apps/web-admin`:

```bash
pnpm vitest run src/app/router/__tests__/build-routes.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/router/build-routes.ts src/app/router/__tests__/build-routes.test.ts
git commit -m "refactor: build routes from internal menu model"
```

---

### Task 5: Relax Backend Title Validation for Fallback Strategy

**Files:**
- Modify: `apps/web-admin/src/app/router/menu-schema.ts`
- Test: `apps/web-admin/src/app/router/__tests__/build-routes.test.ts`

- [ ] **Step 1: Add failing test for blank backend title fallback**

In `apps/web-admin/src/app/router/__tests__/build-routes.test.ts`, add this test inside `describe('buildRoutes', ...)`:

```ts
it('falls back to legacy title mapping when backend title is blank', () => {
  const routes = buildRoutes([
    createMenu({
      title: '   ',
      path: '/monitor/system-logs',
      name: 'SystemLogs',
    }),
  ])

  expect(routes[0].meta?.title).toBe('route.systemLog')
})
```

- [ ] **Step 2: Run the test and verify it fails**

Run from `apps/web-admin`:

```bash
pnpm vitest run src/app/router/__tests__/build-routes.test.ts
```

Expected: FAIL because `menu-schema.ts` currently treats blank titles as invalid and drops the node.

- [ ] **Step 3: Relax title validation in `menu-schema.ts`**

In `apps/web-admin/src/app/router/menu-schema.ts`:

1. Replace this line in `validateMenuNode()`:

```ts
validateRequiredString(menu, 'title', location, issues)
```

with:

```ts
validateOptionalString(menu, 'title', location, issues)
```

2. Add this function after `validateRequiredString()`:

```ts
function validateOptionalString(
  menu: Record<string, unknown>,
  field: string,
  location: string,
  issues: MenuValidationIssue[],
) {
  if (menu[field] !== undefined && typeof menu[field] !== 'string') {
    issues.push({
      severity: 'error',
      location,
      field,
      message: `Menu ${field} must be a string when provided.`,
    })
  }
}
```

3. Replace this part of `isValidMenuNode()`:

```text
    && typeof menu.title === 'string'
    && !!menu.title
```

with:

```text
    && (menu.title === undefined || typeof menu.title === 'string')
```

- [ ] **Step 4: Run focused tests**

Run from `apps/web-admin`:

```bash
pnpm vitest run src/app/router/__tests__/build-routes.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/router/menu-schema.ts src/app/router/__tests__/build-routes.test.ts
git commit -m "refactor: allow route title fallback"
```

---

### Task 6: Run Full Verification

**Files:**
- Verify all changed files under `apps/web-admin/src/app/router/`

- [ ] **Step 1: Run router tests**

Run from `apps/web-admin`:

```bash
pnpm vitest run src/app/router/__tests__/build-routes.test.ts src/app/router/__tests__/dynamic-routes.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run unit test suite**

Run from `apps/web-admin`:

```bash
pnpm test:unit
```

Expected: PASS.

- [ ] **Step 3: Run type check**

Run from `apps/web-admin`:

```bash
pnpm type-check
```

Expected: PASS.

- [ ] **Step 4: Run lint**

Run from `apps/web-admin`:

```bash
pnpm lint
```

Expected: PASS. If lint auto-fixes formatting, review `git diff` before committing.

- [ ] **Step 5: Commit verification fixes if needed**

If any formatting-only changes were made by lint:

```bash
git add src/app/router/build-routes.ts src/app/router/menu-adapter.ts src/app/router/menu-schema.ts src/app/router/route-menu.types.ts src/app/router/route-title-map.ts src/app/router/__tests__/build-routes.test.ts
git commit -m "style: format router menu isolation"
```

If no files changed, do not create a commit.

---

## Self-Review

- Spec coverage: The plan introduces `RouteMenuNode`, separates backend schema validation, adds a backend adapter, moves legacy title fallback mapping, allows backend-provided plain/i18n titles, and preserves existing dynamic route registration.
- Placeholder scan: No placeholder-only steps remain; every code step includes exact file path and code.
- Type consistency: `RouteMenuNode`, `adaptBackendMenusToRouteMenus`, `buildRoutesFromRouteMenus`, and `resolveRouteTitleFallback` use consistent names across tasks.
