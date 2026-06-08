# 多租户后端上下文与业务隔�?Implementation Plan

> **For agentic workers:** Execute this plan task-by-task. Do not implement multiple tasks in one pass. After each task, run the listed verification command and report results before continuing. If `superpowers:subagent-driven-development` or `superpowers:executing-plans` is available in the current environment, use one of them; otherwise execute inline with explicit checkpoints. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将租户上下文、数据范围策略、订�?退�?餐厅/商品/操作日志隔离接入后台业务链路�?
**Architecture:** 后端从当前登录用户和数据库记录构�?`TenantContext`。所有后台业务查询和动作通过 `TenantAccessService` 收窄范围，前端请求参数只能缩小范围，不能扩大范围。历�?`tenantId = null` 业务数据仅平台管理员可见�?
**Tech Stack:** NestJS 10, Prisma, PostgreSQL, Jest, pnpm workspace.

---

## Source of truth

- Design spec: `docs/superpowers/specs/2026-06-02-multi-tenant-saas-state-machine-design.md`
- Master plan: `docs/superpowers/plans/2026-06-02-multi-tenant-saas-state-machine.md`
- Depends on: `docs/superpowers/plans/2026-06-02-multi-tenant-backend-foundation.md`
- Covers master plan Tasks 3 and 6.

---

## File Structure

- Create: `apps/server/src/modules/tenant/tenant-access.service.ts` - 数据范围、请求筛选、读写状态校验�?- Create: `apps/server/src/modules/tenant/tenant-access.service.spec.ts` - 访问策略单测�?- Create: `apps/server/src/modules/tenant/tenant-context.service.ts` - �?request user 构造租户上下文�?- Modify: `apps/server/src/modules/elm/controllers/elm-admin.controller.ts` - 后台 elm 接口传�?`TenantContext`�?- Modify: `apps/server/src/modules/elm/services/elm-restaurant.service.ts` - 餐厅后台列表和写操作隔离�?- Modify: `apps/server/src/modules/elm/services/elm-food.service.ts` - 商品后台列表和写操作隔离�?- Modify: `apps/server/src/modules/elm/types/elm.types.ts` - 餐厅/商品记录�?`tenantId`�?- Modify: `apps/server/src/modules/elm/factories/elm.factories.ts` - 透传租户归属�?- Modify: `apps/server/src/modules/elm/data/elm.seed.ts` - 示例餐厅/商品绑定租户�?- Modify: `apps/server/src/modules/payment/payment.service.ts` - 后台订单列表和新订单租户归属�?- Modify: `apps/server/src/modules/order/order-workflow.service.ts` - 订单详情、履约、退款审批隔离�?- Modify: `apps/server/src/modules/admin/admin.service.ts` or relevant log service - 操作日志查询隔离�?- Test: `apps/server/src/modules/payment/payment.service.spec.ts`
- Test: `apps/server/src/modules/order/order-workflow.service.spec.ts`
- Test: `apps/server/src/modules/elm/controllers/elm-admin.controller.spec.ts`

---

## Task 1: TenantAccessService and TenantContextService

- [ ] **Step 1: Write access tests**

Create `apps/server/src/modules/tenant/tenant-access.service.spec.ts`. Cover:

1. `ALL` returns empty base filter.
2. `TENANT` returns `{ tenantId }`.
3. `SHOP` returns `{ tenantId, shopId: { in: boundShopIds } }`.
4. `SHOP` without bound shops throws 403.
5. `SUSPENDED`/`EXPIRED` read-only states reject writes.
6. `PENDING`/`DISABLED`/`ARCHIVED` reject business reads.
7. `ALL` can narrow by `tenantId` or `shopId`.
8. `TENANT` requesting another `tenantId` throws 403.
9. `SHOP` requesting unbound `shopId` throws 403.
10. `SHOP` without `shopId` defaults to all bound shops.

- [ ] **Step 2: Implement services**

Implement `TenantAccessService` with `buildResourceWhere()`, `buildScopedWhere()`, `assertRequestedScopeAllowed()`, `assertCanRead()`, `assertCanWrite()`, and `assertShopAllowed()`.

Implement `TenantContextService.fromRequestUser()` by reloading the user from Prisma and selecting tenant id/code/name/status, `dataScope`, and `boundShopIds`. Do not trust `tenantId` from frontend request parameters.

- [ ] **Step 3: Run access tests**

Run:

```bash
pnpm --filter @elm-platform/server exec jest src/modules/tenant/tenant-access.service.spec.ts --runInBand
```

Expected: PASS.

---

## Task 2: Elm restaurant and food isolation

- [ ] **Step 1: Add tenant ids to elm records**

Add `tenantId?: number | null` to restaurant/food records and factories. Use tenant ids passed from seed return values; do not hard-code database ids.

- [ ] **Step 2: Filter restaurant admin service**

Pass `TenantContext` into backend admin restaurant list/write methods. `TENANT` sees only matching `tenantId`; `SHOP` sees only bound shop ids. Before write/delete, call `assertCanWrite()` and `assertShopAllowed()`.

- [ ] **Step 3: Filter food admin service**

For `SHOP`, allow only foods whose restaurant id is in `boundShopIds`. For `TENANT`, resolve the restaurant's tenant and require it to match `context.tenantId`.

- [ ] **Step 4: Wire controller context**

Inject `TenantContextService` into `ElmAdminController`, call `fromRequestUser(req.user)` for backend admin routes, and pass context into services.

- [ ] **Step 5: Run elm admin tests**

Run:

```bash
pnpm --filter @elm-platform/server exec jest src/modules/elm/controllers/elm-admin.controller.spec.ts --runInBand
```

Expected: PASS.

---

## Task 3: Payment order and workflow isolation

- [ ] **Step 1: Filter admin orders**

Change admin order list to accept `TenantContext` and request query. Use `tenantAccess.buildScopedWhere(context, { tenantId: query.tenantId, shopId: query.shopId })` in Prisma `findMany`.

- [ ] **Step 2: Persist tenant id on new orders**

When creating an order from a known shop/restaurant, resolve and write `tenantId`. Unknown legacy shops may remain `tenantId: null`; those orders are visible only to platform admins.

- [ ] **Step 3: Guard workflow actions**

Change admin workflow methods to accept `TenantContext`. Before detail or write actions, call `assertCanRead(context)`, check order is in scope, then call `assertCanWrite(context)` for writes. Include `tenantId` when creating `OrderActionLog`.

- [ ] **Step 4: Add isolation tests**

Cover:

1. `TENANT` sees only same-tenant orders.
2. `TENANT` requesting another `tenantId` returns 403.
3. `SHOP` sees only bound shop orders.
4. `SHOP` requesting unbound `shopId` returns 403.
5. `SHOP` cannot accept unbound shop order.
6. `SUSPENDED` tenant can read but cannot write.
7. `DISABLED` tenant cannot read business orders.

- [ ] **Step 5: Run payment/workflow tests**

Run:

```bash
pnpm --filter @elm-platform/server exec jest src/modules/payment/payment.service.spec.ts src/modules/order/order-workflow.service.spec.ts --runInBand
```

Expected: PASS.

---

## Task 4: OperationLog query isolation

- [ ] **Step 1: Locate operation log list method**

Find whether operation logs are listed in `AdminService` or a dedicated log service. Change that method to accept `TenantContext` and query filters.

- [ ] **Step 2: Apply tenant filtering**

Use `tenantAccess.buildScopedWhere(context, query)` for authorization. Adapt the result to fields that exist on `OperationLog`; if `OperationLog` has no `shopId`, use `shopId` only for authorization and do not include it in Prisma `where`.

Rules:

1. `ALL` sees all logs, including `tenantId: null`.
2. `ALL` may pass `tenantId` to narrow.
3. `TENANT` sees only own `tenantId`.
4. `SHOP` sees at least own `tenantId`; if log has shop field, also restrict by bound shops.
5. Non-platform users never see `tenantId: null` logs.

- [ ] **Step 3: Add operation log tests**

Cover platform admin, tenant admin, shop operator, and legacy null-tenant logs.

- [ ] **Step 4: Run backend isolation tests**

Run:

```bash
pnpm --filter @elm-platform/server exec jest src/modules/payment/payment.service.spec.ts src/modules/order/order-workflow.service.spec.ts src/modules/elm/controllers/elm-admin.controller.spec.ts --runInBand
```

Expected: PASS.

---

## Completion criteria

- `TenantAccessService` tests pass.
- Admin order, refund workflow, restaurant, food, and operation-log paths enforce tenant context.
- Request query filters can only narrow scope.
- Legacy `tenantId = null` data is visible only to platform admins.

