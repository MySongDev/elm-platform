# Three App Stability Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve backend, admin web, and user web stability while making small, behavior-preserving structure refactors.

**Architecture:** Keep public behavior unchanged. Extract backend static admin data out of `AdminService`, refine existing admin `config-crud` shared boundaries, and clean mobile app debug/scroll lifecycle risks without redesigning UI.

**Tech Stack:** NestJS 10, Prisma, Jest, Vue 3 Composition API, Element Plus, Vant, Pinia, Vite, Vitest, pnpm workspace.

---

## File Structure

- Create: `apps/server/src/modules/admin/model/admin-records.ts`
  - Owns admin service record/tree/view types.
- Create: `apps/server/src/modules/admin/constants/admin-permissions.ts`
  - Owns static page and button permission catalogs.
- Create: `apps/server/src/modules/admin/constants/admin-fallback-data.ts`
  - Owns in-memory fallback role, menu, and dept seed data.
- Modify: `apps/server/src/modules/admin/admin.service.ts`
  - Import extracted types/constants and keep service methods unchanged.
- Modify: `apps/server/src/modules/auth/guards/roles.guard.ts`
  - Keep null-safe permission handling already present and verify with tests.
- Modify: `apps/server/src/modules/elm/utils/elm-query.ts`
  - Keep array/null/blank parsing behavior already present and verify with tests.
- Modify: `apps/web-admin/src/shared/config-crud/model/*`
  - Keep default option and dynamic save-message contracts stable.
- Modify: `apps/web-admin/src/shared/config-crud/components/*`
  - Keep table/form/action components aligned to the shared model contracts.
- Modify: `apps/web-user/src/views/msite/msite.vue`
  - Remove debug logs and centralize scroll listener binding/unbinding.
- Modify: selected `apps/web-user/src/views/**/*.vue`
  - Remove production-facing debug `console.log` calls while preserving behavior.

## Task 1: Backend Admin Constants Extraction

**Files:**
- Create: `apps/server/src/modules/admin/model/admin-records.ts`
- Create: `apps/server/src/modules/admin/constants/admin-permissions.ts`
- Create: `apps/server/src/modules/admin/constants/admin-fallback-data.ts`
- Modify: `apps/server/src/modules/admin/admin.service.ts`

- [ ] **Step 1: Create shared admin record types**

Add `apps/server/src/modules/admin/model/admin-records.ts`:

```ts
export type TreeNode<T> = T & { id: number, parentId: number | null, children?: TreeNode<T>[] }

export interface RoleRecord {
  id: number
  name: string
  code: string
  status: number
  remark: string | null
  permissions: string[]
  createdAt: string
}

export interface MenuRecord {
  id: number
  parentId: number | null
  title: string
  path: string
  name: string | null
  icon: string | null
  permission: string | null
  type: 'catalog' | 'menu' | 'button'
  sort: number
  status: number
}

export interface DeptRecord {
  id: number
  parentId: number | null
  name: string
  leader: string | null
  phone: string | null
  email: string | null
  sort: number
  status: number
}

export interface LoginLogView {
  id: number
  userId: number
  username: string
  ip: string | null
  address: string | null
  browser: string | null
  os: string | null
  status: number
  message: string | null
  createdAt: Date
}

export interface ButtonPermissionRecord {
  code: string
  name: string
  group: string
}

export interface PagePermissionRecord {
  path: string
  name: string
  title: string
  roles: string[]
  auths: string[]
}
```

- [ ] **Step 2: Create permission constants**

Create `apps/server/src/modules/admin/constants/admin-permissions.ts` with the import below, then move the complete existing `buttonPermissions` and `pagePermissions` array literals from `admin.service.ts` into this file. Keep every record value the same and only add the exported type annotations.

```ts
import type { ButtonPermissionRecord, PagePermissionRecord } from '../model/admin-records'

export const buttonPermissions: ButtonPermissionRecord[] = [
  { code: 'permission:page:view', name: '页面权限查看', group: '权限管理' },
  { code: 'permission:button:view', name: '按钮权限查看', group: '权限管理' },
  { code: 'user:view', name: '用户查看', group: '系统管理' },
  { code: 'user:add', name: '用户新增', group: '系统管理' },
  { code: 'user:edit', name: '用户编辑', group: '系统管理' },
  { code: 'user:delete', name: '用户删除', group: '系统管理' },
  { code: 'role:view', name: '角色查看', group: '系统管理' },
  { code: 'role:add', name: '角色新增', group: '系统管理' },
  { code: 'role:edit', name: '角色编辑', group: '系统管理' },
  { code: 'role:delete', name: '角色删除', group: '系统管理' },
  { code: 'menu:view', name: '菜单查看', group: '系统管理' },
  { code: 'menu:add', name: '菜单新增', group: '系统管理' },
  { code: 'menu:edit', name: '菜单编辑', group: '系统管理' },
  { code: 'menu:delete', name: '菜单删除', group: '系统管理' },
  { code: 'dept:view', name: '部门查看', group: '系统管理' },
  { code: 'dept:add', name: '部门新增', group: '系统管理' },
  { code: 'dept:edit', name: '部门编辑', group: '系统管理' },
  { code: 'dept:delete', name: '部门删除', group: '系统管理' },
  { code: 'commerce:restaurant:view', name: '商家查看', group: '业务管理' },
  { code: 'commerce:restaurant:add', name: '商家新增', group: '业务管理' },
  { code: 'commerce:restaurant:edit', name: '商家编辑', group: '业务管理' },
  { code: 'commerce:restaurant:delete', name: '商家删除', group: '业务管理' },
  { code: 'commerce:food:view', name: '商品查看', group: '业务管理' },
  { code: 'commerce:food:add', name: '商品新增', group: '业务管理' },
  { code: 'commerce:food:edit', name: '商品编辑', group: '业务管理' },
  { code: 'commerce:food:delete', name: '商品删除', group: '业务管理' },
  { code: 'commerce:order:view', name: '订单查看', group: '业务管理' },
  { code: 'commerce:order:edit', name: '订单编辑', group: '业务管理' },
  { code: 'monitor:online:view', name: '在线用户查看', group: '系统监控' },
  { code: 'monitor:online:force-logout', name: '强制下线', group: '系统监控' },
  { code: 'log:login:view', name: '登录日志查看', group: '系统监控' },
  { code: 'log:operation:view', name: '操作日志查看', group: '系统监控' },
  { code: 'log:system:view', name: '系统日志查看', group: '系统监控' },
]

export const pagePermissions: PagePermissionRecord[] = [
  { path: '/dashboard/index', name: 'DashboardView', title: '仪表盘', roles: ['admin', 'user'], auths: [] },
  { path: '/permission/page', name: 'PagePermission', title: '页面权限', roles: ['admin', 'user'], auths: ['permission:page:view'] },
  { path: '/permission/button', name: 'ButtonPermission', title: '按钮权限', roles: ['admin', 'user'], auths: ['permission:button:view'] },
  { path: '/monitor/online-user', name: 'OnlineUser', title: '在线用户', roles: ['admin'], auths: ['monitor:online:view'] },
  { path: '/monitor/login-logs', name: 'LoginLogs', title: '登录日志', roles: ['admin'], auths: ['log:login:view'] },
  { path: '/monitor/operation-logs', name: 'OperationLogs', title: '操作日志', roles: ['admin'], auths: ['log:operation:view'] },
  { path: '/monitor/system-logs', name: 'SystemLogs', title: '系统日志', roles: ['admin'], auths: ['log:system:view'] },
  { path: '/system/user', name: 'UserList', title: '用户管理', roles: ['admin'], auths: ['user:view'] },
  { path: '/system/role', name: 'RoleManagement', title: '角色管理', roles: ['admin'], auths: ['role:view'] },
  { path: '/system/menu', name: 'MenuManagement', title: '菜单管理', roles: ['admin'], auths: ['menu:view'] },
  { path: '/system/dept', name: 'DeptManagement', title: '部门管理', roles: ['admin'], auths: ['dept:view'] },
  { path: '/commerce/restaurant', name: 'CommerceRestaurant', title: '商家管理', roles: ['admin'], auths: ['commerce:restaurant:view'] },
  { path: '/commerce/food', name: 'CommerceFood', title: '商品管理', roles: ['admin'], auths: ['commerce:food:view'] },
  { path: '/commerce/order', name: 'CommerceOrder', title: '订单管理', roles: ['admin'], auths: ['commerce:order:view'] },
  { path: '/nested/menu1/menu1-1', name: 'NestedMenu11View', title: '菜单1-1', roles: ['admin', 'user'], auths: [] },
  { path: '/nested/menu1/menu1-2/menu1-2-1', name: 'NestedMenu121View', title: '菜单1-2-1', roles: ['admin', 'user'], auths: [] },
  { path: '/nested/menu1/menu1-2/menu1-2-2', name: 'NestedMenu122View', title: '菜单1-2-2', roles: ['admin', 'user'], auths: [] },
  { path: '/nested/menu1/menu1-3', name: 'NestedMenu13View', title: '菜单1-3', roles: ['admin', 'user'], auths: [] },
  { path: '/nested/menu2', name: 'NestedMenu2View', title: '菜单2', roles: ['admin', 'user'], auths: [] },
]
```

- [ ] **Step 3: Create fallback data constants**

Create `apps/server/src/modules/admin/constants/admin-fallback-data.ts` with the import below, then move the complete existing `fallbackRoles`, `fallbackMenus`, and `fallbackDepts` array literals from `admin.service.ts` into this file. Keep every record value the same and only add the exported type annotations.

```ts
import type { DeptRecord, MenuRecord, RoleRecord } from '../model/admin-records'

export const fallbackRoles: RoleRecord[] = [
  { id: 1, name: '超级管理员', code: 'admin', status: 1, remark: '拥有系统全部权限', permissions: ['*:*:*'], createdAt: new Date().toISOString() },
  { id: 2, name: '普通用户', code: 'user', status: 1, remark: '拥有基础访问权限', permissions: ['permission:page:view', 'permission:button:view'], createdAt: new Date().toISOString() },
]

export const fallbackMenus: MenuRecord[] = [
  { id: 14, parentId: null, title: '仪表盘', path: '/dashboard', name: 'Dashboard', icon: 'dashboard', permission: null, type: 'catalog', sort: 1, status: 1 },
  { id: 15, parentId: 14, title: '仪表盘', path: '/dashboard/index', name: 'DashboardView', icon: 'dashboard', permission: null, type: 'menu', sort: 1, status: 1 },
  { id: 1, parentId: null, title: '权限管理', path: '/permission', name: 'Permission', icon: 'permission', permission: null, type: 'catalog', sort: 20, status: 1 },
  { id: 2, parentId: 1, title: '页面权限', path: '/permission/page', name: 'PagePermission', icon: 'permission', permission: 'permission:page:view', type: 'menu', sort: 1, status: 1 },
  { id: 3, parentId: 1, title: '按钮权限', path: '/permission/button', name: 'ButtonPermission', icon: 'permission', permission: 'permission:button:view', type: 'menu', sort: 2, status: 1 },
  { id: 4, parentId: null, title: '系统监控', path: '/monitor', name: 'Monitor', icon: 'monitor', permission: null, type: 'catalog', sort: 30, status: 1 },
  { id: 5, parentId: 4, title: '在线用户', path: '/monitor/online-user', name: 'OnlineUser', icon: 'monitor', permission: 'monitor:online:view', type: 'menu', sort: 1, status: 1 },
  { id: 6, parentId: 4, title: '登录日志', path: '/monitor/login-logs', name: 'LoginLogs', icon: 'monitor', permission: 'log:login:view', type: 'menu', sort: 2, status: 1 },
  { id: 7, parentId: 4, title: '操作日志', path: '/monitor/operation-logs', name: 'OperationLogs', icon: 'monitor', permission: 'log:operation:view', type: 'menu', sort: 3, status: 1 },
  { id: 8, parentId: 4, title: '系统日志', path: '/monitor/system-logs', name: 'SystemLogs', icon: 'monitor', permission: 'log:system:view', type: 'menu', sort: 4, status: 1 },
  { id: 9, parentId: null, title: '系统管理', path: '/system', name: 'System', icon: 'system', permission: null, type: 'catalog', sort: 40, status: 1 },
  { id: 10, parentId: 9, title: '用户管理', path: '/system/user', name: 'UserList', icon: 'user', permission: 'user:view', type: 'menu', sort: 1, status: 1 },
  { id: 11, parentId: 9, title: '角色管理', path: '/system/role', name: 'RoleManagement', icon: 'role', permission: 'role:view', type: 'menu', sort: 2, status: 1 },
  { id: 12, parentId: 9, title: '菜单管理', path: '/system/menu', name: 'MenuManagement', icon: 'menu', permission: 'menu:view', type: 'menu', sort: 3, status: 1 },
  { id: 13, parentId: 9, title: '部门管理', path: '/system/dept', name: 'DeptManagement', icon: 'dept', permission: 'dept:view', type: 'menu', sort: 4, status: 1 },
  { id: 20, parentId: null, title: '业务管理', path: '/commerce', name: 'Commerce', icon: 'document', permission: null, type: 'catalog', sort: 35, status: 1 },
  { id: 21, parentId: 20, title: '商家管理', path: '/commerce/restaurant', name: 'CommerceRestaurantView', icon: 'document', permission: 'commerce:restaurant:view', type: 'menu', sort: 1, status: 1 },
  { id: 22, parentId: 20, title: '商品管理', path: '/commerce/food', name: 'CommerceFoodView', icon: 'document', permission: 'commerce:food:view', type: 'menu', sort: 2, status: 1 },
  { id: 23, parentId: 20, title: '订单管理', path: '/commerce/order', name: 'CommerceOrderView', icon: 'document', permission: 'commerce:order:view', type: 'menu', sort: 3, status: 1 },
  { id: 30, parentId: null, title: '多级菜单', path: '/nested', name: 'Nested', icon: 'nested', permission: null, type: 'catalog', sort: 50, status: 1 },
  { id: 31, parentId: 30, title: '菜单1', path: '/nested/menu1', name: 'NestedMenu1', icon: 'nested', permission: null, type: 'catalog', sort: 1, status: 1 },
  { id: 32, parentId: 31, title: '菜单1-1', path: '/nested/menu1/menu1-1', name: 'NestedMenu11View', icon: 'nested', permission: null, type: 'menu', sort: 1, status: 1 },
  { id: 33, parentId: 31, title: '菜单1-2', path: '/nested/menu1/menu1-2', name: 'NestedMenu12', icon: 'nested', permission: null, type: 'catalog', sort: 2, status: 1 },
  { id: 34, parentId: 33, title: '菜单1-2-1', path: '/nested/menu1/menu1-2/menu1-2-1', name: 'NestedMenu121View', icon: 'nested', permission: null, type: 'menu', sort: 1, status: 1 },
  { id: 35, parentId: 33, title: '菜单1-2-2', path: '/nested/menu1/menu1-2/menu1-2-2', name: 'NestedMenu122View', icon: 'nested', permission: null, type: 'menu', sort: 2, status: 1 },
  { id: 36, parentId: 31, title: '菜单1-3', path: '/nested/menu1/menu1-3', name: 'NestedMenu13View', icon: 'nested', permission: null, type: 'menu', sort: 3, status: 1 },
  { id: 37, parentId: 30, title: '菜单2', path: '/nested/menu2', name: 'NestedMenu2View', icon: 'nested', permission: null, type: 'menu', sort: 2, status: 1 },
  { id: 101, parentId: 5, title: '强制下线', path: '/monitor/online-user', name: null, icon: null, permission: 'monitor:online:force-logout', type: 'button', sort: 1, status: 1 },
  { id: 110, parentId: 10, title: '新增用户', path: '/system/user', name: null, icon: null, permission: 'user:add', type: 'button', sort: 1, status: 1 },
  { id: 111, parentId: 10, title: '编辑用户', path: '/system/user', name: null, icon: null, permission: 'user:edit', type: 'button', sort: 2, status: 1 },
  { id: 112, parentId: 10, title: '删除用户', path: '/system/user', name: null, icon: null, permission: 'user:delete', type: 'button', sort: 3, status: 1 },
  { id: 120, parentId: 11, title: '新增角色', path: '/system/role', name: null, icon: null, permission: 'role:add', type: 'button', sort: 1, status: 1 },
  { id: 121, parentId: 11, title: '编辑角色', path: '/system/role', name: null, icon: null, permission: 'role:edit', type: 'button', sort: 2, status: 1 },
  { id: 122, parentId: 11, title: '删除角色', path: '/system/role', name: null, icon: null, permission: 'role:delete', type: 'button', sort: 3, status: 1 },
  { id: 130, parentId: 12, title: '新增菜单', path: '/system/menu', name: null, icon: null, permission: 'menu:add', type: 'button', sort: 1, status: 1 },
  { id: 131, parentId: 12, title: '编辑菜单', path: '/system/menu', name: null, icon: null, permission: 'menu:edit', type: 'button', sort: 2, status: 1 },
  { id: 132, parentId: 12, title: '删除菜单', path: '/system/menu', name: null, icon: null, permission: 'menu:delete', type: 'button', sort: 3, status: 1 },
  { id: 140, parentId: 13, title: '新增部门', path: '/system/dept', name: null, icon: null, permission: 'dept:add', type: 'button', sort: 1, status: 1 },
  { id: 141, parentId: 13, title: '编辑部门', path: '/system/dept', name: null, icon: null, permission: 'dept:edit', type: 'button', sort: 2, status: 1 },
  { id: 142, parentId: 13, title: '删除部门', path: '/system/dept', name: null, icon: null, permission: 'dept:delete', type: 'button', sort: 3, status: 1 },
  { id: 150, parentId: 21, title: '新增商家', path: '/commerce/restaurant', name: null, icon: null, permission: 'commerce:restaurant:add', type: 'button', sort: 1, status: 1 },
  { id: 151, parentId: 21, title: '编辑商家', path: '/commerce/restaurant', name: null, icon: null, permission: 'commerce:restaurant:edit', type: 'button', sort: 2, status: 1 },
  { id: 152, parentId: 21, title: '删除商家', path: '/commerce/restaurant', name: null, icon: null, permission: 'commerce:restaurant:delete', type: 'button', sort: 3, status: 1 },
  { id: 160, parentId: 22, title: '新增商品', path: '/commerce/food', name: null, icon: null, permission: 'commerce:food:add', type: 'button', sort: 1, status: 1 },
  { id: 161, parentId: 22, title: '编辑商品', path: '/commerce/food', name: null, icon: null, permission: 'commerce:food:edit', type: 'button', sort: 2, status: 1 },
  { id: 162, parentId: 22, title: '删除商品', path: '/commerce/food', name: null, icon: null, permission: 'commerce:food:delete', type: 'button', sort: 3, status: 1 },
  { id: 170, parentId: 23, title: '编辑订单', path: '/commerce/order', name: null, icon: null, permission: 'commerce:order:edit', type: 'button', sort: 1, status: 1 },
]

export const fallbackDepts: DeptRecord[] = [
  { id: 1, parentId: null, name: '总公司', leader: '管理员', phone: '13800138000', email: 'admin@example.com', sort: 1, status: 1 },
  { id: 2, parentId: 1, name: '研发部门', leader: '研发负责人', phone: '13800138001', email: 'rd@example.com', sort: 1, status: 1 },
  { id: 3, parentId: 1, name: '运营部门', leader: '运营负责人', phone: '13800138002', email: 'ops@example.com', sort: 2, status: 1 },
]
```

- [ ] **Step 4: Modify AdminService imports**

At the top of `apps/server/src/modules/admin/admin.service.ts`, replace local type and constant declarations with:

```ts
import type { LoginLogView, TreeNode } from './model/admin-records'
import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { RedisService } from '../../redis/redis.service'
import { fallbackDepts, fallbackMenus, fallbackRoles } from './constants/admin-fallback-data'
import { buttonPermissions, pagePermissions } from './constants/admin-permissions'
import { UpsertDeptDto, UpsertMenuDto, UpsertRoleDto } from './dto/admin.dto'
```

Keep the `AdminService` class body behavior unchanged.

- [ ] **Step 5: Verify backend extraction**

Run: `pnpm --filter vue3-elm-node run test -- roles.guard.spec.ts elm-query.spec.ts transform.interceptor.spec.ts`

Expected: Jest exits with passing tests for the focused backend specs.

## Task 2: Backend Stability Tests And Edges

**Files:**
- Modify: `apps/server/src/modules/auth/guards/roles.guard.ts`
- Modify: `apps/server/src/modules/elm/utils/elm-query.ts`
- Test: `apps/server/src/modules/auth/guards/roles.guard.spec.ts`
- Test: `apps/server/src/modules/elm/utils/elm-query.spec.ts`

- [ ] **Step 1: Keep null-safe guard implementation**

Ensure `roles.guard.ts` contains this null-safe permission helper:

```ts
private hasPermissions(
  userPermissions: string[] | null | undefined,
  requiredPermissions: string[],
) {
  const permissions = userPermissions ?? [];

  if (permissions.includes('*:*:*')) {
    return true;
  }

  return requiredPermissions.every((permission) => permissions.includes(permission));
}
```

- [ ] **Step 2: Keep query parsing implementation**

Ensure `elm-query.ts` keeps these parsing behaviors:

```ts
export function toStringValue(value: unknown, fallback = '') {
  const source = Array.isArray(value) ? value[0] : value
  if (typeof source === 'string')
    return source
  if (source === null || source === undefined)
    return fallback
  return String(source)
}

export function toNumberValue(value: unknown, fallback = 0) {
  const source = Array.isArray(value) ? value[0] : value
  if (source === null || source === undefined)
    return fallback
  if (typeof source === 'string' && source.trim() === '')
    return fallback

  const result = Number(source)
  return Number.isFinite(result) ? result : fallback
}
```

- [ ] **Step 3: Verify backend focused tests**

Run: `pnpm --filter vue3-elm-node run test -- roles.guard.spec.ts elm-query.spec.ts transform.interceptor.spec.ts`

Expected: PASS.

## Task 3: Admin Config CRUD Stabilization

**Files:**
- Modify: `apps/web-admin/src/shared/config-crud/model/form.ts`
- Modify: `apps/web-admin/src/shared/config-crud/model/table.ts`
- Modify: `apps/web-admin/src/shared/config-crud/model/useConfigCrud.ts`
- Modify: `apps/web-admin/src/shared/config-crud/model/useConfigCrud.types.ts`
- Modify: `apps/web-admin/src/shared/config-crud/components/ConfigDataTable/index.vue`
- Modify: `apps/web-admin/src/shared/config-crud/components/ConfigFormDialog/index.vue`
- Modify: `apps/web-admin/src/shared/config-crud/components/CrudActionColumn/index.vue`
- Test: `apps/web-admin/src/shared/config-crud/model/__tests__/useConfigCrud.test.ts`
- Test: `apps/web-admin/src/shared/config-crud/model/__tests__/table.test.ts`

- [ ] **Step 1: Keep centralized default options**

Ensure `form.ts` exports `DialogOptions`, `FormOptions`, `ActionOptions`, `DEFAULT_DIALOG_OPTIONS`, `DEFAULT_FORM_OPTIONS`, and `DEFAULT_ACTION_OPTIONS`.

- [ ] **Step 2: Keep table/action model options**

Ensure `table.ts` exports `ConfigDataTableOptions`, `DEFAULT_CONFIG_DATA_TABLE_OPTIONS`, `CrudActionColumnOptions`, `CrudActionPreset`, `shouldRenderCrudActionPreset`, and `DEFAULT_CRUD_ACTION_COLUMN_OPTIONS`.

- [ ] **Step 3: Keep dynamic save success messages**

Ensure `useConfigCrud.ts` resolves save messages through the current form id:

```ts
function resolveSaveSuccessMessage(id: ReturnType<typeof options.getFormId>) {
  const message = options.saveSuccessMessage ?? '保存成功'
  if (typeof message === 'function') {
    return message({
      form,
      id,
      isEdit: Boolean(id),
    })
  }
  return message
}
```

- [ ] **Step 4: Verify admin focused tests**

Run: `pnpm --filter elm-web-admin run test:unit -- src/shared/config-crud/model/__tests__/useConfigCrud.test.ts src/shared/config-crud/model/__tests__/table.test.ts src/features/user-management/model/__tests__/useUserManagement.test.ts`

Expected: Vitest exits with passing tests for the focused admin specs.

## Task 4: User Web Debug Cleanup And Scroll Lifecycle

**Files:**
- Modify: `apps/web-user/src/views/msite/msite.vue`
- Modify: `apps/web-user/src/views/shop/ProductDetail.vue`
- Modify: `apps/web-user/src/views/download/download.vue`
- Modify: `apps/web-user/src/views/city/city.vue`
- Modify: `apps/web-user/src/views/profile/info/setusername.vue`
- Modify: `apps/web-user/src/views/login/login.vue`

- [ ] **Step 1: Remove production-facing debug logs**

Remove `console.log` calls from user-facing Vue views under `apps/web-user/src/views`. Keep local server logs in `apps/web-user/src/server.js` untouched because those are operational dev-server logs.

- [ ] **Step 2: Make msite scroll listener idempotent**

In `msite.vue`, replace direct add/remove calls with binding helpers:

```js
let isScrollListenerBound = false

function bindScrollListener() {
  if (!msiteRef.value || isScrollListenerBound)
    return
  msiteRef.value.addEventListener('scroll', handleWindowScroll, { passive: true })
  isScrollListenerBound = true
}

function unbindScrollListener() {
  if (!msiteRef.value || !isScrollListenerBound)
    return
  msiteRef.value.removeEventListener('scroll', handleWindowScroll)
  isScrollListenerBound = false
}
```

Use `bindScrollListener()` in `onMounted` and `onActivated`, and `unbindScrollListener()` in `onBeforeUnmount` and `onDeactivated`.

- [ ] **Step 3: Verify user focused tests**

Run: `pnpm --filter vue3-elm-js run test -- src/services/http/policies.test.js src/composables/features/home/useHomeLocation.test.ts src/stores/modules/store-locations.test.js`

Expected: Vitest exits with passing tests for the focused user specs.

## Task 5: Final Verification

**Files:**
- Inspect all modified files from Tasks 1-4.

- [ ] **Step 1: Search for remaining user-view debug logs**

Run: `rg "console\\.log" apps/web-user/src/views -n`

Expected: no production-facing debug logs remain in user views. If the command exits with code 1 because no matches are found, treat that as success.

- [ ] **Step 2: Run broader build**

Run: `pnpm build`

Expected: all three apps build successfully. If build fails because of pre-existing unrelated work, report the failure and include the first relevant error.

- [ ] **Step 3: Review git diff**

Run: `git diff --stat`

Expected: changed files match the approved A+C scope: backend static extraction/stability, admin config-crud stabilization, user debug/scroll cleanup, and this plan file.
