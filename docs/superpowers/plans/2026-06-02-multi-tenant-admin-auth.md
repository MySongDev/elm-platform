# 多租户后台用户权限与 Auth Profile Implementation Plan

> **For agentic workers:** Execute this plan task-by-task. Do not implement multiple tasks in one pass. After each task, run the listed verification command and report results before continuing. If `superpowers:subagent-driven-development` or `superpowers:executing-plans` is available in the current environment, use one of them; otherwise execute inline with explicit checkpoints. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将后台登�?profile、用户管�?DTO、用户管理服务、菜单权限接入租户字段和数据范围规则�?
**Architecture:** 角色/权限决定“能不能进入功能”，`dataScope`/`tenantId`/`boundShopIds` 决定“能看哪些数据”。用户创建和更新既要校验目标 payload 组合是否合法，也要根据当前操作�?`TenantContext` 校验是否允许创建或修改该目标用户�?
**Tech Stack:** NestJS 10, Prisma, Jest, pnpm workspace.

---

## Source of truth

- Design spec: `docs/superpowers/specs/2026-06-02-multi-tenant-saas-state-machine-design.md`
- Master plan: `docs/superpowers/plans/2026-06-02-multi-tenant-saas-state-machine.md`
- Depends on: `docs/superpowers/plans/2026-06-02-multi-tenant-backend-foundation.md`
- Covers master plan Task 5.

---

## File Structure

- Modify: `apps/server/src/modules/auth/auth.service.ts` - 登录返回租户信息、数据范围、绑定店铺�?- Modify: `apps/server/src/modules/auth/strategies/jwt.strategy.ts` - JWT validate 保留后台用户身份，租户上下文从数据库读取�?- Modify: `apps/server/src/modules/admin/dto/admin.dto.ts` - 用户 DTO 增加租户字段�?- Modify: `apps/server/src/modules/admin/admin.service.ts` - 用户字段组合校验和当前操作者越权校验�?- Modify: `apps/server/src/modules/admin/constants/admin-permissions.ts` - 新增租户管理权限�?- Modify: `apps/server/src/modules/admin/constants/admin-fallback-data.ts` - 新增租户管理菜单和示例权限�?- Test: `apps/server/src/modules/auth/auth.service.spec.ts`
- Test: `apps/server/src/modules/admin/admin.service.spec.ts`

---

## Task 1: Auth login/profile tenant fields

- [ ] **Step 1: Extend auth tests**

Update `auth.service.spec.ts` to expect login/profile user payload to include:

```ts
tenant: {
  id: number
  code: string
  name: string
  status: string
} | null
dataScope: 'ALL' | 'TENANT' | 'SHOP' | 'SELF'
boundShopIds: string[]
```

- [ ] **Step 2: Update AuthService**

In `AuthService.login()`, include `tenant`, `dataScope`, and `boundShopIds` in the Prisma select. Return `tenant: null`, `dataScope: 'ALL'`, and `boundShopIds: []` for platform admin users.

- [ ] **Step 3: Verify auth tests**

Run:

```bash
pnpm --filter @elm-platform/server exec jest src/modules/auth/auth.service.spec.ts --runInBand
```

Expected: PASS.

---

## Task 2: Admin user DTO and payload validation

- [ ] **Step 1: Extend admin DTO**

Add fields to admin user create/update DTOs:

```ts
@IsOptional()
@IsInt()
tenantId?: number | null

@IsOptional()
@IsIn(['ALL', 'TENANT', 'SHOP'])
dataScope?: string

@IsOptional()
@IsArray()
@IsString({ each: true })
boundShopIds?: string[]
```

Do not accept `SELF` in admin user forms in this phase.

- [ ] **Step 2: Add target payload validator**

In `AdminService`, add `assertUserTenantScope(dto)`. It must reject:

1. `ALL` with `tenantId`.
2. `TENANT` without `tenantId`.
3. `SHOP` without `tenantId`.
4. `SHOP` with empty `boundShopIds`.

- [ ] **Step 3: Add tests**

Update `admin.service.spec.ts` to cover all four rejected combinations and one valid combination for each `ALL`, `TENANT`, and `SHOP`.

- [ ] **Step 4: Run admin tests**

Run:

```bash
pnpm --filter @elm-platform/server exec jest src/modules/admin/admin.service.spec.ts --runInBand
```

Expected: PASS.

---

## Task 3: Current actor user-mutation boundary

- [ ] **Step 1: Add actor boundary tests**

In `admin.service.spec.ts`, cover:

1. Platform admin can create a valid tenant admin.
2. Platform admin can create a valid shop operator.
3. Tenant admin cannot create or update an `ALL` user.
4. Tenant admin cannot bind a user to another tenant.
5. Tenant admin can create a `SHOP` user inside own tenant.

- [ ] **Step 2: Implement actor validator**

Add `assertUserMutationAllowed(actorContext, target)`:

```ts
private assertUserMutationAllowed(
  actor: TenantContext,
  target: { tenantId?: number | null, dataScope?: string, boundShopIds?: string[] },
) {
  if (actor.dataScope === 'ALL')
    return

  if (!actor.tenantId)
    throw new ForbiddenException('当前账号未绑定租�?)

  if ((target.dataScope || 'ALL') === 'ALL')
    throw new ForbiddenException('租户管理员不能创建或修改平台管理�?)

  if (target.tenantId !== actor.tenantId)
    throw new ForbiddenException('租户管理员不能管理其它租户用�?)
}
```

Call `assertUserTenantScope(dto)` first, then `assertUserMutationAllowed(actorContext, dto)` before Prisma writes.

- [ ] **Step 3: Verify tests**

Run:

```bash
pnpm --filter @elm-platform/server exec jest src/modules/admin/admin.service.spec.ts --runInBand
```

Expected: PASS.

---

## Task 4: Tenant management permissions and menu

- [ ] **Step 1: Add permissions**

Add:

```ts
platform:tenant:view
platform:tenant:create
platform:tenant:update
platform:tenant:transition
```

- [ ] **Step 2: Add fallback menu entry**

Add a menu item:

```ts
{
  title: '租户管理',
  path: '/platform/tenant',
  name: 'PlatformTenant',
  permission: 'platform:tenant:view',
  component: 'PlatformTenantView',
  type: 'menu',
}
```

- [ ] **Step 3: Run auth/admin tests and build**

Run:

```bash
pnpm --filter @elm-platform/server exec jest src/modules/auth/auth.service.spec.ts src/modules/admin/admin.service.spec.ts --runInBand
pnpm --filter @elm-platform/server run build
```

Expected: PASS.

---

## Completion criteria

- Login/profile returns tenant context fields.
- Admin user DTO accepts only `ALL`, `TENANT`, and `SHOP` in this phase.
- Invalid target payload combinations are rejected.
- Tenant admins cannot create platform admins or cross-tenant users.
- Tenant management permissions and fallback menu exist.

