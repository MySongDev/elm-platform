# 多租户后端基础与状态机 Implementation Plan

> **For agentic workers:** Execute this plan task-by-task. Do not implement multiple tasks in one pass. After each task, run the listed verification command and report results before continuing. If `superpowers:subagent-driven-development` or `superpowers:executing-plans` is available in the current environment, use one of them; otherwise execute inline with explicit checkpoints. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立多租户后端基础模型、seed、租户类型、生命周期状态机和租户管理接口�?
**Architecture:** 本计划只处理后端基础能力，不接入订单/餐厅/商品业务隔离，也不实现管理端页面。状态机规则集中�?`tenant-state-machine.policy.ts`，状态变更服务负责事务更新、并发保护、`TenantActionLog` �?`OperationLog` 写入�?
**Tech Stack:** NestJS 10, Prisma, PostgreSQL, Jest, pnpm workspace.

---

## Source of truth

- Design spec: `docs/superpowers/specs/2026-06-02-multi-tenant-saas-state-machine-design.md`
- Master plan: `docs/superpowers/plans/2026-06-02-multi-tenant-saas-state-machine.md`
- Covers master plan Tasks 1, 2, and 4.

---

## File Structure

- Modify: `apps/server/prisma/schema.prisma` - 新增 `Tenant`、`TenantActionLog`，扩�?`User`、`PaymentOrder`、`OrderActionLog`、`OperationLog`�?- Create: `apps/server/prisma/migrations/20260602010000_multi_tenant_saas_foundation/migration.sql` - 标准 Prisma migration�?- Modify: `apps/server/prisma/seed.ts` - seed 两个租户和示例后台用户�?- Create: `apps/server/src/modules/tenant/tenant.types.ts` - 租户状态、事件、数据范围、上下文类型�?- Create: `apps/server/src/modules/tenant/tenant-state-machine.policy.ts` - 纯状态机策略�?- Create: `apps/server/src/modules/tenant/tenant-state-machine.policy.spec.ts` - 状态机策略单测�?- Create: `apps/server/src/modules/tenant/tenant-state-machine.service.ts` - 状态变更事务服务�?- Create: `apps/server/src/modules/tenant/tenant-state-machine.service.spec.ts` - 状态变更服务单测�?- Create: `apps/server/src/modules/tenant/dto/tenant.dto.ts` - 租户 DTO�?- Create: `apps/server/src/modules/tenant/tenant.service.ts` - 租户 CRUD、详情、动作日志�?- Create: `apps/server/src/modules/tenant/tenant.controller.ts` - `/api/admin/tenants` 接口�?- Create: `apps/server/src/modules/tenant/tenant.module.ts` - 租户模块�?- Modify: `apps/server/src/app.module.ts` - 注册 `TenantModule`�?
---

## Task 1: Prisma schema, migration, and seed

- [ ] **Step 1: Update Prisma schema**

Apply the model and field changes from master plan Task 1. `tenantId` is nullable only for migration compatibility. New orders/logs must write a tenant when one is known.

- [ ] **Step 2: Add standard Prisma migration**

Create `apps/server/prisma/migrations/20260602010000_multi_tenant_saas_foundation/migration.sql` using standard one-time Prisma migration SQL. Do not mix `IF NOT EXISTS` with non-idempotent constraints.

Before adding a compound order index, inspect `PaymentOrder` in `schema.prisma`; use the real shop/restaurant field name and keep Prisma schema indexes aligned with SQL indexes.

- [ ] **Step 3: Update seed data**

Seed tenants by `code`, then use returned ids such as `flowerCakeTenant.id` and `fastFoodTenant.id`. Do not hard-code tenant ids like `1` or `2`.

- [ ] **Step 4: Generate Prisma client**

Run:

```bash
pnpm --filter @elm-platform/server run prisma:generate
```

Expected: PASS.

---

## Task 2: Tenant state-machine policy

- [ ] **Step 1: Write policy tests**

Create `apps/server/src/modules/tenant/tenant-state-machine.policy.spec.ts`. Cover valid transitions, invalid transitions, `ARCHIVED` as terminal state, available events, and actor permission rules.

- [ ] **Step 2: Verify tests fail before implementation**

Run:

```bash
pnpm --filter @elm-platform/server exec jest src/modules/tenant/tenant-state-machine.policy.spec.ts --runInBand
```

Expected: FAIL because policy files do not exist.

- [ ] **Step 3: Implement types and policy**

Create `tenant.types.ts` and `tenant-state-machine.policy.ts` as described in master plan Task 2. Keep `SELF` in type definitions but do not seed or expose it in this phase.

- [ ] **Step 4: Run policy tests**

Run:

```bash
pnpm --filter @elm-platform/server exec jest src/modules/tenant/tenant-state-machine.policy.spec.ts --runInBand
```

Expected: PASS.

---

## Task 3: Tenant module and lifecycle service

- [ ] **Step 1: Add DTOs**

Create `apps/server/src/modules/tenant/dto/tenant.dto.ts` with `CreateTenantDto`, `UpdateTenantDto`, `TenantTransitionDto`, and `TenantEventParamDto`. `UpdateTenantDto` must not include `code`.

- [ ] **Step 2: Write lifecycle service tests**

Create `apps/server/src/modules/tenant/tenant-state-machine.service.spec.ts`. Cover:

1. Valid transition updates status and returns `availableActions`.
2. Valid transition creates `TenantActionLog`.
3. Valid transition creates `OperationLog`.
4. Invalid transition creates no logs.
5. Unauthorized actor creates no logs.
6. `updateMany().count === 0` returns conflict and creates no logs.

- [ ] **Step 3: Implement lifecycle service**

Implement `TenantStateMachineService.transitionTenant()`. Load current status, validate actor and event, update with `where: { id, status: currentStatus }`, write both logs in the transaction, then reload tenant.

- [ ] **Step 4: Implement tenant service/controller/module**

Create `TenantService`, `TenantController`, and `TenantModule`. Use `TenantEventParamDto` for route event validation; pass `params.event as TenantEvent` only after validation.

- [ ] **Step 5: Register module and verify**

Import `TenantModule` in `app.module.ts`, then run:

```bash
pnpm --filter @elm-platform/server exec jest src/modules/tenant --runInBand
pnpm --filter @elm-platform/server run build
```

Expected: PASS.

---

## Completion criteria

- Prisma client generates successfully.
- Tenant policy tests pass.
- Tenant state-machine service tests pass.
- Tenant module builds.
- State changes write both `TenantActionLog` and `OperationLog`.
- `code` cannot be modified through ordinary tenant update DTO.

