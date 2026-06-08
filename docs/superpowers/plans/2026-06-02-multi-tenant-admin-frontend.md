# 多租户管理端页面与数据范围展�?Implementation Plan

> **For agentic workers:** Execute this plan task-by-task. Do not implement multiple tasks in one pass. After each task, run the listed verification command and report results before continuing. If `superpowers:subagent-driven-development` or `superpowers:executing-plans` is available in the current environment, use one of them; otherwise execute inline with explicit checkpoints. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在管理端实现租户管理页面、用户管理租户字段、顶部租户上下文、业务页面数据范围提示和租户状态错误码提示�?
**Architecture:** 前端只展示当前身份、数据范围和后端返回的可执行动作，不作为安全边界。租户生命周期按钮只依赖后端返回�?`availableActions`，不在前端重新计算状态机流转�?
**Tech Stack:** Vue 3, TypeScript, Element Plus, Pinia, Vue Router, Vite, Vitest, pnpm workspace.

---

## Source of truth

- Design spec: `docs/superpowers/specs/2026-06-02-multi-tenant-saas-state-machine-design.md`
- Master plan: `docs/superpowers/plans/2026-06-02-multi-tenant-saas-state-machine.md`
- Depends on backend API plans:
  - `docs/superpowers/plans/2026-06-02-multi-tenant-backend-foundation.md`
  - `docs/superpowers/plans/2026-06-02-multi-tenant-admin-auth.md`
- Covers master plan Tasks 7 and 8.

---

## File Structure

- Modify: `apps/web-admin/src/shared/api/endpoints.ts` - 租户接口地址�?- Modify: `apps/web-admin/src/shared/config/access.ts` - 租户权限常量�?- Create: `apps/web-admin/src/entities/tenant/model/types.ts` - 租户类型�?payload 类型�?- Create: `apps/web-admin/src/entities/tenant/api/index.ts` - 租户 API 封装�?- Create: `apps/web-admin/src/features/tenant-management/config/workflow.ts` - 状态、事件、按钮文案配置�?- Create: `apps/web-admin/src/features/tenant-management/config/workflow.test.ts` - 状态动作可见性测试�?- Create: `apps/web-admin/src/features/tenant-management/config/fields.ts` - 搜索字段和表格列�?- Create: `apps/web-admin/src/features/tenant-management/model/useTenantManagement.ts` - 页面组合式逻辑�?- Create: `apps/web-admin/src/features/tenant-management/model/useTenantManagement.test.ts` - 页面逻辑测试�?- Create: `apps/web-admin/src/features/tenant-management/ui/TenantTable.vue` - 租户表格�?- Create: `apps/web-admin/src/features/tenant-management/ui/TenantFormDialog.vue` - 租户表单�?- Create: `apps/web-admin/src/features/tenant-management/ui/TenantActionLogDrawer.vue` - 日志抽屉�?- Create: `apps/web-admin/src/features/tenant-management/index.ts` - 导出�?- Create: `apps/web-admin/src/pages/platform/tenant/index.vue` - 租户管理页面�?- Modify: `apps/web-admin/src/app/router/component-map.ts` - 注册 `PlatformTenantView`�?- Modify: `apps/web-admin/src/entities/session/model/types.ts` - session 增加租户字段�?- Modify: `apps/web-admin/src/entities/session/model/store.ts` - 保存租户上下文�?- Modify: `apps/web-admin/src/entities/session/model/dev-auth.ts` - dev mock 增加平台管理员上下文�?- Modify: `apps/web-admin/src/features/user-management/config/fields.ts` - 用户租户字段�?- Modify: `apps/web-admin/src/features/user-management/model/useUserManagement.ts` - 保存租户字段�?- Modify: `apps/web-admin/src/widgets/admin-layout/ui/TopNavigation/NotificationBell/index.vue` or adjacent top area - 展示当前身份和范围�?- Modify: `apps/web-admin/src/pages/commerce/order/index.vue` - 订单页数据范围提示�?- Modify: `apps/web-admin/src/pages/commerce/restaurant/index.vue` if present - 餐厅页数据范围提示�?- Modify: `apps/web-admin/src/pages/commerce/food/index.vue` if present - 商品页数据范围提示�?- Modify: `apps/web-admin/src/shared/i18n/lang/zh-CN.ts` - 中文文案�?- Modify: `apps/web-admin/src/shared/i18n/lang/en.ts` - 英文文案�?- Create or Modify: `apps/web-admin/src/shared/api/tenant-error.test.ts` - 租户状态错误码提示测试�?
---

## Task 1: Tenant API, types, and workflow config

- [ ] **Step 1: Add endpoint keys**

Add:

```ts
tenants: '/admin/tenants',
tenantDetail: (id: number | string) => `/admin/tenants/${id}`,
tenantEvent: (id: number | string, event: string) => `/admin/tenants/${id}/events/${event}`,
tenantActionLogs: (id: number | string) => `/admin/tenants/${id}/action-logs`,
```

- [ ] **Step 2: Add tenant types**

Create types:

```ts
export type TenantStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'DISABLED' | 'EXPIRED' | 'ARCHIVED'
export type TenantEvent = 'APPROVE' | 'REJECT' | 'SUSPEND' | 'RESUME' | 'DISABLE' | 'ACTIVATE' | 'EXPIRE' | 'RENEW' | 'ARCHIVE'
export type DataScope = 'ALL' | 'TENANT' | 'SHOP' | 'SELF'

export interface CreateTenantPayload {
  code: string
  name: string
  contactName?: string
  contactPhone?: string
  contactEmail?: string
  planCode?: string
  remark?: string
}

export type UpdateTenantPayload = Omit<CreateTenantPayload, 'code'>
```

- [ ] **Step 3: Add API functions**

Create `getTenants`, `createTenant`, `updateTenant`, `getTenantDetail`, `transitionTenant`, and `getTenantActionLogs` using existing admin HTTP client patterns.

- [ ] **Step 4: Add workflow config tests**

Create `workflow.test.ts` covering:

1. `PENDING` shows `APPROVE` and `REJECT`.
2. `ACTIVE` shows `SUSPEND`, `DISABLE`, `EXPIRE`.
3. `ARCHIVED` shows no actions.

- [ ] **Step 5: Run workflow tests**

Run:

```bash
pnpm --filter @elm-platform/web-admin exec vitest run src/features/tenant-management/config/workflow.test.ts
```

Expected: PASS.

---

## Task 2: Tenant management page model and UI

- [ ] **Step 1: Implement and test composable**

Create `useTenantManagement.ts` with `rows`, `loading`, `formVisible`, `logVisible`, `selectedTenant`, `fetchRows`, `openCreate`, `openEdit`, `submitTenant`, `executeEvent`, and `openLogs`.

Create `useTenantManagement.test.ts` covering:

1. `fetchRows()` calls `getTenants()` and fills `rows`.
2. `submitTenant()` calls `createTenant()` when no selected tenant exists.
3. `submitTenant()` calls `updateTenant()` when selected tenant exists.
4. `executeEvent()` calls `transitionTenant()` and refreshes rows.
5. `openLogs()` calls `getTenantActionLogs()` and opens drawer.

- [ ] **Step 2: Implement components**

Create components with these contracts:

```ts
// TenantTable.vue
props: { rows: TenantRecord[], loading: boolean }
emits: { edit: [row: TenantRecord], event: [row: TenantRecord, event: TenantEvent], logs: [row: TenantRecord] }
```

`TenantTable` must render buttons only from `row.availableActions`.

```ts
// TenantFormDialog.vue
props: { modelValue: boolean, tenant: TenantRecord | null }
emits: { 'update:modelValue': [value: boolean], submit: [payload: CreateTenantPayload | UpdateTenantPayload] }
```

Disable `code` when editing.

```ts
// TenantActionLogDrawer.vue
props: { modelValue: boolean, logs: TenantActionLog[], loading: boolean }
emits: { 'update:modelValue': [value: boolean] }
```

- [ ] **Step 3: Implement page and route mapping**

Create `pages/platform/tenant/index.vue` to wire composable and components only. Register `PlatformTenantView` in `component-map.ts`.

- [ ] **Step 4: Run tenant page tests and type-check**

Run:

```bash
pnpm --filter @elm-platform/web-admin exec vitest run src/features/tenant-management/config/workflow.test.ts src/features/tenant-management/model/useTenantManagement.test.ts
pnpm --filter @elm-platform/web-admin run type-check
```

Expected: PASS.

---

## Task 3: Session, user form, and data range display

- [ ] **Step 1: Extend session model**

Session user includes:

```ts
tenant: { id: number, code: string, name: string, status: string } | null
dataScope: 'ALL' | 'TENANT' | 'SHOP' | 'SELF'
boundShopIds: string[]
```

Dev auth admin uses `tenant: null`, `dataScope: 'ALL'`, `boundShopIds: []`.

- [ ] **Step 2: Add user management fields**

Add `tenantId`, `dataScope`, and `boundShopIds`. Form options expose only `ALL`, `TENANT`, and `SHOP`; do not expose `SELF`.

UI rules:

1. `ALL`: clear and hide tenant/shop fields.
2. `TENANT`: require tenant and clear shop ids.
3. `SHOP`: require tenant and at least one shop id.

- [ ] **Step 3: Add top navigation context**

Display:

```text
平台管理�?· 全部租户
租户管理�?· <tenant.name>
店铺运营 · <tenant.name> / <boundShopIds>
```

Use the existing top navigation area that best fits current layout; do not force this into notification UI if an adjacent identity area exists.

- [ ] **Step 4: Add business page scope hint**

Add neutral hints to order page and restaurant/food pages if present:

```text
当前数据范围：全部租�?当前数据范围�?tenant.name>
当前数据范围�?tenant.name> / 店铺 <ids>
```

- [ ] **Step 5: Add display tests**

Cover session persistence, user form field visibility/requirements for `ALL`/`TENANT`/`SHOP`, and top navigation text for all three scopes.

- [ ] **Step 6: Run admin tests**

Run:

```bash
pnpm --filter @elm-platform/web-admin run test:unit
pnpm --filter @elm-platform/web-admin run type-check
```

Expected: PASS.

---

## Task 4: Tenant status error-code messages

- [ ] **Step 1: Add message mapping**

Find admin HTTP error handling in `apps/web-admin/src/shared/api` or `apps/web-admin/src/app/providers/http.ts`. Add mapping or i18n keys for:

```ts
TENANT_PENDING: '当前租户尚未启用，请联系平台管理员�?
TENANT_SUSPENDED_READONLY: '当前租户状态不允许执行该操作，请联系平台管理员�?
TENANT_DISABLED: '当前租户已停用，请联系平台管理员�?
TENANT_EXPIRED_READONLY: '当前租户状态不允许执行该操作，请联系平台管理员�?
TENANT_ARCHIVED: '当前租户已归档，请联系平台管理员�?
```

- [ ] **Step 2: Add tenant error tests**

Create or update `apps/web-admin/src/shared/api/tenant-error.test.ts` to verify every code maps to the expected Chinese message. If existing implementation uses i18n keys, test keys and ensure `zh-CN.ts` contains messages.

- [ ] **Step 3: Run error tests and build**

Run:

```bash
pnpm --filter @elm-platform/web-admin exec vitest run src/shared/api/tenant-error.test.ts
pnpm --filter @elm-platform/web-admin run type-check
pnpm --filter @elm-platform/web-admin run build
```

Expected: PASS.

---

## Completion criteria

- Tenant management page renders and uses backend `availableActions` only.
- Tenant create/update/status/log flows are covered by frontend tests.
- User form exposes only `ALL`, `TENANT`, and `SHOP`.
- Top navigation and business pages show current data range.
- Tenant status error codes map to clear messages.
- Admin build and type-check pass.

