# 第二阶段多租�?SaaS 基座 Implementation Plan

> **For agentic workers:** Execute this plan task-by-task. Do not implement multiple tasks in one pass. After each task, run the listed verification command and report results before continuing. If `superpowers:subagent-driven-development` or `superpowers:executing-plans` is available in the current environment, use one of them; otherwise execute inline with explicit checkpoints. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 基于现有订单履约与退款审批能力，补齐租户模型、租户生命周期状态机、后台用户数据范围和商家数据隔离，让项目具备可展示的多租�?SaaS 运营平台基础�?
**Architecture:** 后端�?`Tenant`、`TenantActionLog`、`TenantContext`、`TenantAccessService`、`TenantStateMachineService` 为核心边界，所有安全隔离在服务层完成，前端只展示当前身份和可操作入口。餐�?商品仍沿用当�?elm 兼容内存数据结构，本阶段先在后台管理链路�?`tenantId` 并过滤，不重构用户端公共浏览链路�?
**Tech Stack:** NestJS 10, Prisma, PostgreSQL, Jest, Vue 3, TypeScript, Element Plus, Pinia, Vue Router, Vite, Vitest, pnpm workspace.

## Split Execution Plans

This master plan is the full-stage reference. For safer execution, prefer running these smaller plans in order:

1. `docs/superpowers/plans/2026-06-02-multi-tenant-backend-foundation.md` - Backend schema, seed, tenant state machine, tenant module.
2. `docs/superpowers/plans/2026-06-02-multi-tenant-admin-auth.md` - Auth/profile, admin user tenant fields, actor mutation boundaries, permissions and menu.
3. `docs/superpowers/plans/2026-06-02-multi-tenant-backend-isolation.md` - Tenant context/access service, orders/refunds/restaurants/foods/operation-log isolation.
4. `docs/superpowers/plans/2026-06-02-multi-tenant-admin-frontend.md` - Admin tenant UI, user form fields, identity/data-scope display, tenant error messages.

Use the master plan for cross-cutting coverage checks and final verification; use the split plans for actual implementation tasks.

---

## Scope

实现设计文档 `docs/superpowers/specs/2026-06-02-multi-tenant-saas-state-machine-design.md` 的第二阶段核心切片：

- 租户模型、租户动作日志、后台用户数据范围字段�?- 租户生命周期状态机和可执行动作计算�?- 后台请求级租户上下文和数据访问策略�?- 订单、退款审批、餐厅、商品、操作日志的后台数据隔离�?- 管理端租户管理页、用户管理租户字段、顶部身�?数据范围展示�?
不实现套餐计费、域名识别、分库分表、租户主题、资源配额、账单中心，也不引入 XState�?
`SELF` 数据范围仅作为类型预留：本阶段不在后台用户表单开�?`SELF`，seed 不创�?`SELF` 用户，业务接口也不依�?`SELF` 作为验收条件�?
---

## File Structure

### Backend

- Modify: `apps/server/prisma/schema.prisma` - 新增 `Tenant`、`TenantActionLog`，扩�?`User`、`PaymentOrder`、`OrderActionLog`、`OperationLog`�?- Create: `apps/server/prisma/migrations/20260602010000_multi_tenant_saas_foundation/migration.sql` - 第二阶段数据库迁移�?- Modify: `apps/server/prisma/seed.ts` - 增加两个示例租户、平台管理员、租户管理员、店铺运营人员，并给示例订单绑定租户�?- Create: `apps/server/src/modules/tenant/tenant.types.ts` - 租户状态、事件、数据范围、上下文、动作权限类型�?- Create: `apps/server/src/modules/tenant/tenant-state-machine.policy.ts` - 纯状态机策略、状态流转、actor 权限和可执行动作计算�?- Create: `apps/server/src/modules/tenant/tenant-state-machine.policy.spec.ts` - 状态机单测�?- Create: `apps/server/src/modules/tenant/tenant-access.service.ts` - 数据范围过滤、请求筛选收窄校验、业务写操作状态校验�?- Create: `apps/server/src/modules/tenant/tenant-access.service.spec.ts` - 数据范围策略单测�?- Create: `apps/server/src/modules/tenant/tenant-context.service.ts` - 从后�?JWT 用户和数据库用户记录构�?`TenantContext`�?- Create: `apps/server/src/modules/tenant/tenant-state-machine.service.ts` - 事务更新租户状态，同时�?`TenantActionLog` �?`OperationLog`�?- Create: `apps/server/src/modules/tenant/tenant.service.ts` - 租户 CRUD、详情、动作日志、统计摘要�?- Create: `apps/server/src/modules/tenant/tenant.controller.ts` - `/api/admin/tenants` 管理接口�?- Create: `apps/server/src/modules/tenant/tenant.module.ts` - 导出租户上下文和访问服务�?- Create: `apps/server/src/modules/tenant/dto/tenant.dto.ts` - 租户创建、更新、事�?DTO�?- Modify: `apps/server/src/app.module.ts` - 引入 `TenantModule`�?- Modify: `apps/server/src/modules/auth/auth.service.ts` - 登录返回用户租户信息、数据范围和绑定店铺�?- Modify: `apps/server/src/modules/auth/strategies/jwt.strategy.ts` - JWT validate 保留后台用户身份，租户上下文仍从数据库读取�?- Modify: `apps/server/src/modules/admin/dto/admin.dto.ts` - 后台用户表单 DTO 增加 `tenantId`、`dataScope`、`boundShopIds`�?- Modify: `apps/server/src/modules/admin/admin.service.ts` - 用户创建/更新校验数据范围组合，角�?用户列表返回租户字段�?- Modify: `apps/server/src/modules/admin/constants/admin-permissions.ts` - 新增租户管理页面和动作权限�?- Modify: `apps/server/src/modules/admin/constants/admin-fallback-data.ts` - 菜单补租户管理入口，示例角色补权限�?- Modify: `apps/server/src/modules/elm/controllers/elm-admin.controller.ts` - 后台餐厅、商品、订单、退款动作接�?`TenantContext`�?- Modify: `apps/server/src/modules/elm/services/elm-restaurant.service.ts` - 后台餐厅列表/写操作按租户范围过滤和校验�?- Modify: `apps/server/src/modules/elm/services/elm-food.service.ts` - 后台商品列表/写操作按店铺范围过滤和校验�?- Modify: `apps/server/src/modules/elm/types/elm.types.ts` - 餐厅和商品记录补 `tenantId`�?- Modify: `apps/server/src/modules/elm/factories/elm.factories.ts` - seed 工厂透传 `tenantId`�?- Modify: `apps/server/src/modules/elm/data/elm.seed.ts` - 示例餐厅/商品绑定租户�?- Modify: `apps/server/src/modules/payment/payment.service.ts` - 创建订单写入租户，后台订单列表按租户过滤�?- Modify: `apps/server/src/modules/order/order-workflow.service.ts` - 订单详情、履约动作、退款审批接入租户访问校验并写日志租户字段�?- Modify: `apps/server/src/modules/admin/admin.service.ts` - 后台操作日志查询�?`TenantContext` 过滤，用户创�?更新按当前操作者校验租户边界�?- Modify: `apps/server/src/modules/payment/payment.service.spec.ts` - 覆盖订单租户归属和后台列表过滤�?- Modify: `apps/server/src/modules/order/order-workflow.service.spec.ts` - 覆盖跨租户订单动作拒绝�?- Modify: `apps/server/src/modules/elm/controllers/elm-admin.controller.spec.ts` - 覆盖后台 controller 传递租户上下文�?
### Admin Web

- Modify: `apps/web-admin/src/shared/api/endpoints.ts` - 增加租户管理接口地址�?- Modify: `apps/web-admin/src/shared/config/access.ts` - 增加租户管理权限常量�?- Create: `apps/web-admin/src/entities/tenant/model/types.ts` - 租户、状态、事件、数据范围类型�?- Create: `apps/web-admin/src/entities/tenant/api/index.ts` - 租户 API 封装�?- Create: `apps/web-admin/src/features/tenant-management/config/workflow.ts` - 租户状态、事件、按钮配置�?- Create: `apps/web-admin/src/features/tenant-management/config/workflow.test.ts` - 租户动作可见性测试�?- Create: `apps/web-admin/src/features/tenant-management/config/fields.ts` - 租户搜索字段和表格列配置�?- Create: `apps/web-admin/src/features/tenant-management/model/useTenantManagement.ts` - 列表、详情、创建、编辑、状态事件提交�?- Create: `apps/web-admin/src/features/tenant-management/model/useTenantManagement.test.ts` - 状态事件提交、刷新和日志加载测试�?- Create: `apps/web-admin/src/features/tenant-management/ui/TenantTable.vue` - 租户表格和行操作�?- Create: `apps/web-admin/src/features/tenant-management/ui/TenantFormDialog.vue` - 租户新增/编辑弹窗�?- Create: `apps/web-admin/src/features/tenant-management/ui/TenantActionLogDrawer.vue` - 租户动作日志抽屉�?- Create: `apps/web-admin/src/features/tenant-management/index.ts` - 功能模块导出�?- Create: `apps/web-admin/src/pages/platform/tenant/index.vue` - 租户管理页面�?- Modify: `apps/web-admin/src/app/router/component-map.ts` - 注册租户管理页面组件 key�?- Modify: `apps/web-admin/src/entities/session/model/types.ts` - 当前用户补租户和数据范围字段�?- Modify: `apps/web-admin/src/entities/session/model/dev-auth.ts` - dev mock 用户补平台管理员数据范围�?- Modify: `apps/web-admin/src/entities/session/model/store.ts` - 保存和暴露租户上下文�?- Modify: `apps/web-admin/src/features/user-management/config/fields.ts` - 用户表单增加租户、数据范围、绑定店铺字段�?- Modify: `apps/web-admin/src/features/user-management/model/useUserManagement.ts` - 用户保存/编辑透传租户字段�?- Modify: `apps/web-admin/src/widgets/admin-layout/ui/TopNavigation/NotificationBell/index.vue` 或相邻顶部区�?- 展示当前身份和数据范围�?- Modify: `apps/web-admin/src/pages/commerce/order/index.vue` - 展示当前数据范围提示�?- Modify: `apps/web-admin/src/pages/commerce/restaurant/index.vue` if present - 展示当前数据范围提示�?- Modify: `apps/web-admin/src/pages/commerce/food/index.vue` if present - 展示当前数据范围提示�?- Modify: `apps/web-admin/src/shared/i18n/lang/zh-CN.ts` - 增加租户、数据范围中文文案�?- Modify: `apps/web-admin/src/shared/i18n/lang/en.ts` - 增加租户、数据范围英文文案�?- Create or Modify: `apps/web-admin/src/shared/api/tenant-error.test.ts` - 租户状态错误码提示映射测试�?
---

## Task 1: Prisma schema, migration, and seed data

**Files:**
- Modify: `apps/server/prisma/schema.prisma`
- Create: `apps/server/prisma/migrations/20260602010000_multi_tenant_saas_foundation/migration.sql`
- Modify: `apps/server/prisma/seed.ts`

- [ ] **Step 1: Extend Prisma schema**

Update `apps/server/prisma/schema.prisma` with these model changes:

```prisma
model Tenant {
  id           Int      @id @default(autoincrement())
  code         String   @unique
  name         String
  status       String   @default("PENDING")
  contactName  String?  @map("contact_name")
  contactPhone String?  @map("contact_phone")
  contactEmail String?  @map("contact_email")
  planCode     String   @default("standard") @map("plan_code")
  settings     Json?
  remark       String?
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  users      User[]
  orders     PaymentOrder[]
  orderLogs  OrderActionLog[]
  actionLogs TenantActionLog[]

  @@map("tenants")
}

model TenantActionLog {
  id         Int      @id @default(autoincrement())
  tenantId   Int      @map("tenant_id")
  event      String
  fromStatus String   @map("from_status")
  toStatus   String   @map("to_status")
  actorId    String   @map("actor_id")
  actorName  String   @map("actor_name")
  actorType  String   @map("actor_type")
  reason     String?
  remark     String?
  requestId  String?  @map("request_id")
  createdAt  DateTime @default(now()) @map("created_at")

  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([tenantId])
  @@map("tenant_action_logs")
}
```

Add these fields to `User`:

```prisma
tenantId     Int?     @map("tenant_id")
dataScope    String   @default("ALL") @map("data_scope")
boundShopIds String[] @default([]) @map("bound_shop_ids")

tenant Tenant? @relation(fields: [tenantId], references: [id])
```

Add these fields to `PaymentOrder`:

```prisma
tenantId Int?    @map("tenant_id")
tenant   Tenant? @relation(fields: [tenantId], references: [id])

@@index([tenantId])
@@index([tenantId, shopId])
```

Add these fields to `OrderActionLog`:

```prisma
tenantId Int?    @map("tenant_id")
tenant   Tenant? @relation(fields: [tenantId], references: [id])

@@index([tenantId])
```

Add these fields to `OperationLog` if the model exists in the file:

```prisma
tenantId   Int?    @map("tenant_id")
tenantCode String? @map("tenant_code")
```

- [ ] **Step 2: Add migration SQL**

Create `apps/server/prisma/migrations/20260602010000_multi_tenant_saas_foundation/migration.sql` as a standard Prisma migration. Do not mix partially-idempotent SQL with non-idempotent foreign-key constraints; this migration is expected to run once through Prisma Migrate:

```sql
CREATE TABLE "tenants" (
  "id" SERIAL PRIMARY KEY,
  "code" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "contact_name" TEXT,
  "contact_phone" TEXT,
  "contact_email" TEXT,
  "plan_code" TEXT NOT NULL DEFAULT 'standard',
  "settings" JSONB,
  "remark" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "tenant_action_logs" (
  "id" SERIAL PRIMARY KEY,
  "tenant_id" INTEGER NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "event" TEXT NOT NULL,
  "from_status" TEXT NOT NULL,
  "to_status" TEXT NOT NULL,
  "actor_id" TEXT NOT NULL,
  "actor_name" TEXT NOT NULL,
  "actor_type" TEXT NOT NULL,
  "reason" TEXT,
  "remark" TEXT,
  "request_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "users" ADD COLUMN "tenant_id" INTEGER;
ALTER TABLE "users" ADD COLUMN "data_scope" TEXT NOT NULL DEFAULT 'ALL';
ALTER TABLE "users" ADD COLUMN "bound_shop_ids" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "payment_orders" ADD COLUMN "tenant_id" INTEGER;
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "order_action_logs" ADD COLUMN "tenant_id" INTEGER;
ALTER TABLE "order_action_logs" ADD CONSTRAINT "order_action_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "operation_logs" ADD COLUMN "tenant_id" INTEGER;
ALTER TABLE "operation_logs" ADD COLUMN "tenant_code" TEXT;

CREATE INDEX "tenant_action_logs_tenant_id_idx" ON "tenant_action_logs"("tenant_id");
CREATE INDEX "payment_orders_tenant_id_idx" ON "payment_orders"("tenant_id");
CREATE INDEX "order_action_logs_tenant_id_idx" ON "order_action_logs"("tenant_id");
```

Before adding a compound order index, inspect the existing `PaymentOrder` shop/restaurant field in `schema.prisma`. If the Prisma field is `shopId`, add `@@index([tenantId, shopId])` and add the matching SQL index using the actual mapped database column generated by Prisma; if the field is named differently, use that exact field instead. The Prisma schema and migration SQL must define the same indexes.

- [ ] **Step 3: Update seed data**

In `apps/server/prisma/seed.ts`, create two tenants before seeding users/orders:

```ts
const tenants = [
  {
    code: 'flower-cake',
    name: '鲜花蛋糕租户',
    status: 'ACTIVE',
    contactName: '花店运营',
    contactPhone: '13800000001',
    planCode: 'standard',
  },
  {
    code: 'fast-food',
    name: '快餐便当租户',
    status: 'ACTIVE',
    contactName: '快餐运营',
    contactPhone: '13800000002',
    planCode: 'standard',
  },
]
```

Upsert them by `code`, then seed users with:

```ts
{
  username: 'admin',
  role: 'admin',
  dataScope: 'ALL',
  tenantId: null,
  boundShopIds: [],
}
{
  username: 'tenant_admin',
  role: 'tenant_admin',
  dataScope: 'TENANT',
  tenantId: flowerCakeTenant.id,
  boundShopIds: [],
}
{
  username: 'shop_operator',
  role: 'shop_operator',
  dataScope: 'SHOP',
  tenantId: flowerCakeTenant.id,
  boundShopIds: ['1'],
}
```

When seeding payment orders, map `shopId = '1'` to `flowerCakeTenant.id`, `shopId = '2'` to `fastFoodTenant.id`, and keep unknown shop orders with `tenantId: null`.

- [ ] **Step 4: Generate Prisma client**

Run:

```bash
pnpm --filter @elm-platform/server run prisma:generate
```

Expected: PASS.

---

## Task 2: Tenant lifecycle state machine

**Files:**
- Create: `apps/server/src/modules/tenant/tenant.types.ts`
- Create: `apps/server/src/modules/tenant/tenant-state-machine.policy.ts`
- Test: `apps/server/src/modules/tenant/tenant-state-machine.policy.spec.ts`

- [ ] **Step 1: Write failing state machine tests**

Create `apps/server/src/modules/tenant/tenant-state-machine.policy.spec.ts`:

```ts
import { ConflictException, ForbiddenException } from '@nestjs/common'
import {
  assertTenantActorCanTrigger,
  getAvailableTenantEvents,
  getNextTenantStatus,
} from './tenant-state-machine.policy'

describe('tenantStateMachinePolicy', () => {
  it('calculates valid tenant transitions', () => {
    expect(getNextTenantStatus('PENDING', 'APPROVE')).toBe('ACTIVE')
    expect(getNextTenantStatus('PENDING', 'REJECT')).toBe('ARCHIVED')
    expect(getNextTenantStatus('ACTIVE', 'SUSPEND')).toBe('SUSPENDED')
    expect(getNextTenantStatus('SUSPENDED', 'RESUME')).toBe('ACTIVE')
    expect(getNextTenantStatus('DISABLED', 'ACTIVATE')).toBe('ACTIVE')
    expect(getNextTenantStatus('EXPIRED', 'RENEW')).toBe('ACTIVE')
  })

  it('rejects invalid transitions and archived recovery', () => {
    expect(() => getNextTenantStatus('PENDING', 'EXPIRE')).toThrow(ConflictException)
    expect(() => getNextTenantStatus('ACTIVE', 'ARCHIVE')).toThrow(ConflictException)
    expect(() => getNextTenantStatus('ARCHIVED', 'ACTIVATE')).toThrow(ConflictException)
  })

  it('returns available events from current status', () => {
    expect(getAvailableTenantEvents('PENDING')).toEqual(['APPROVE', 'REJECT'])
    expect(getAvailableTenantEvents('ACTIVE')).toEqual(['SUSPEND', 'DISABLE', 'EXPIRE'])
    expect(getAvailableTenantEvents('ARCHIVED')).toEqual([])
  })

  it('allows only platform admin or system actors to trigger lifecycle events', () => {
    expect(() => assertTenantActorCanTrigger('APPROVE', 'PLATFORM_ADMIN')).not.toThrow()
    expect(() => assertTenantActorCanTrigger('EXPIRE', 'SYSTEM')).not.toThrow()
    expect(() => assertTenantActorCanTrigger('APPROVE', 'TENANT_ADMIN')).toThrow(ForbiddenException)
    expect(() => assertTenantActorCanTrigger('DISABLE', 'SHOP_OPERATOR')).toThrow(ForbiddenException)
  })
})
```

- [ ] **Step 2: Run test and verify failure**

Run:

```bash
pnpm --filter @elm-platform/server exec jest src/modules/tenant/tenant-state-machine.policy.spec.ts --runInBand
```

Expected: FAIL because tenant policy files do not exist.

- [ ] **Step 3: Create tenant types**

Create `apps/server/src/modules/tenant/tenant.types.ts`:

```ts
export const tenantStatuses = ['PENDING', 'ACTIVE', 'SUSPENDED', 'DISABLED', 'EXPIRED', 'ARCHIVED'] as const
export type TenantStatus = (typeof tenantStatuses)[number]

export const tenantEvents = ['APPROVE', 'REJECT', 'SUSPEND', 'RESUME', 'DISABLE', 'ACTIVATE', 'EXPIRE', 'RENEW', 'ARCHIVE'] as const
export type TenantEvent = (typeof tenantEvents)[number]

export const dataScopes = ['ALL', 'TENANT', 'SHOP', 'SELF'] as const
export type DataScope = (typeof dataScopes)[number]

export const tenantActorTypes = ['PLATFORM_ADMIN', 'TENANT_ADMIN', 'SHOP_OPERATOR', 'SYSTEM'] as const
export type TenantActorType = (typeof tenantActorTypes)[number]

export interface TenantStateActor {
  id: number | 'system'
  name: string
  type: TenantActorType
}

export interface TenantContext {
  userId: number
  username: string
  tenantId: number | null
  tenantCode: string | null
  tenantName: string | null
  tenantStatus: TenantStatus | null
  dataScope: DataScope
  boundShopIds: string[]
  isPlatformAdmin: boolean
}

export interface TenantResourceFilter {
  tenantId?: number | { in: number[] }
  shopId?: string | { in: string[] }
  createdBy?: number
}
```

- [ ] **Step 4: Implement tenant state policy**

Create `apps/server/src/modules/tenant/tenant-state-machine.policy.ts`:

```ts
import { ConflictException, ForbiddenException } from '@nestjs/common'
import type { TenantActorType, TenantEvent, TenantStatus } from './tenant.types'

const tenantTransitions: Record<TenantStatus, Partial<Record<TenantEvent, TenantStatus>>> = {
  PENDING: { APPROVE: 'ACTIVE', REJECT: 'ARCHIVED' },
  ACTIVE: { SUSPEND: 'SUSPENDED', DISABLE: 'DISABLED', EXPIRE: 'EXPIRED' },
  SUSPENDED: { RESUME: 'ACTIVE', DISABLE: 'DISABLED', ARCHIVE: 'ARCHIVED' },
  DISABLED: { ACTIVATE: 'ACTIVE', ARCHIVE: 'ARCHIVED' },
  EXPIRED: { RENEW: 'ACTIVE', ARCHIVE: 'ARCHIVED' },
  ARCHIVED: {},
}

const allowedActorMap: Record<TenantEvent, TenantActorType[]> = {
  APPROVE: ['PLATFORM_ADMIN'],
  REJECT: ['PLATFORM_ADMIN'],
  SUSPEND: ['PLATFORM_ADMIN'],
  RESUME: ['PLATFORM_ADMIN'],
  DISABLE: ['PLATFORM_ADMIN'],
  ACTIVATE: ['PLATFORM_ADMIN'],
  EXPIRE: ['PLATFORM_ADMIN', 'SYSTEM'],
  RENEW: ['PLATFORM_ADMIN', 'SYSTEM'],
  ARCHIVE: ['PLATFORM_ADMIN'],
}

export function getNextTenantStatus(status: TenantStatus, event: TenantEvent): TenantStatus {
  const next = tenantTransitions[status]?.[event]

  if (!next)
    throw new ConflictException('当前租户状态不允许执行该动�?)

  return next
}

export function getAvailableTenantEvents(status: TenantStatus): TenantEvent[] {
  return Object.keys(tenantTransitions[status] || {}) as TenantEvent[]
}

export function assertTenantActorCanTrigger(event: TenantEvent, actorType: TenantActorType) {
  if (!allowedActorMap[event]?.includes(actorType)) {
    throw new ForbiddenException('无权变更租户生命周期状�?)
  }
}
```

- [ ] **Step 5: Run policy tests**

Run:

```bash
pnpm --filter @elm-platform/server exec jest src/modules/tenant/tenant-state-machine.policy.spec.ts --runInBand
```

Expected: PASS.

---

## Task 3: Tenant context and access strategy

**Files:**
- Create: `apps/server/src/modules/tenant/tenant-access.service.ts`
- Create: `apps/server/src/modules/tenant/tenant-access.service.spec.ts`
- Create: `apps/server/src/modules/tenant/tenant-context.service.ts`

- [ ] **Step 1: Write access strategy tests**

Create `apps/server/src/modules/tenant/tenant-access.service.spec.ts`:

```ts
import { ForbiddenException } from '@nestjs/common'
import { TenantAccessService } from './tenant-access.service'
import type { TenantContext } from './tenant.types'

const service = new TenantAccessService()

function context(overrides: Partial<TenantContext> = {}): TenantContext {
  return {
    userId: 1,
    username: 'tester',
    tenantId: 10,
    tenantCode: 'tenant-a',
    tenantName: 'Tenant A',
    tenantStatus: 'ACTIVE',
    dataScope: 'TENANT',
    boundShopIds: [],
    isPlatformAdmin: false,
    ...overrides,
  }
}

describe('TenantAccessService', () => {
  it('returns empty resource filter for platform admins', () => {
    expect(service.buildResourceWhere(context({ dataScope: 'ALL', tenantId: null, isPlatformAdmin: true }))).toEqual({})
  })

  it('filters tenant scope by tenant id', () => {
    expect(service.buildResourceWhere(context())).toEqual({ tenantId: 10 })
  })

  it('filters shop scope by tenant id and bound shop ids', () => {
    expect(service.buildResourceWhere(context({ dataScope: 'SHOP', boundShopIds: ['1', '2'] }))).toEqual({
      tenantId: 10,
      shopId: { in: ['1', '2'] },
    })
  })

  it('rejects shop scope without bound shops', () => {
    expect(() => service.buildResourceWhere(context({ dataScope: 'SHOP', boundShopIds: [] }))).toThrow(ForbiddenException)
  })

  it('rejects write operations for readonly tenant statuses', () => {
    expect(() => service.assertCanWrite(context({ tenantStatus: 'ACTIVE' }))).not.toThrow()
    expect(() => service.assertCanWrite(context({ tenantStatus: 'SUSPENDED' }))).toThrow(ForbiddenException)
    expect(() => service.assertCanWrite(context({ tenantStatus: 'EXPIRED' }))).toThrow(ForbiddenException)
  })

  it('rejects read operations for inactive terminal statuses', () => {
    expect(() => service.assertCanRead(context({ tenantStatus: 'ACTIVE' }))).not.toThrow()
    expect(() => service.assertCanRead(context({ tenantStatus: 'DISABLED' }))).toThrow(ForbiddenException)
    expect(() => service.assertCanRead(context({ tenantStatus: 'ARCHIVED' }))).toThrow(ForbiddenException)
  })

  it('allows platform admins to narrow requested scope', () => {
    expect(service.buildScopedWhere(context({ dataScope: 'ALL', tenantId: null, isPlatformAdmin: true }), { tenantId: 20 })).toEqual({ tenantId: 20 })
    expect(service.buildScopedWhere(context({ dataScope: 'ALL', tenantId: null, isPlatformAdmin: true }), { shopId: '2' })).toEqual({ shopId: '2' })
  })

  it('rejects tenant users requesting another tenant id', () => {
    expect(() => service.buildScopedWhere(context(), { tenantId: 20 })).toThrow(ForbiddenException)
  })

  it('rejects shop users requesting unbound shop id', () => {
    expect(() => service.buildScopedWhere(context({ dataScope: 'SHOP', boundShopIds: ['1', '2'] }), { shopId: '3' })).toThrow(ForbiddenException)
  })

  it('defaults shop users to all bound shops when shop id is omitted', () => {
    expect(service.buildScopedWhere(context({ dataScope: 'SHOP', boundShopIds: ['1', '2'] }))).toEqual({
      tenantId: 10,
      shopId: { in: ['1', '2'] },
    })
  })
})
```

- [ ] **Step 2: Implement access strategy**

Create `apps/server/src/modules/tenant/tenant-access.service.ts`:

```ts
import { ForbiddenException, Injectable } from '@nestjs/common'
import type { TenantContext, TenantResourceFilter } from './tenant.types'

@Injectable()
export class TenantAccessService {
  buildResourceWhere(context: TenantContext): TenantResourceFilter {
    if (context.dataScope === 'ALL')
      return {}

    if (!context.tenantId)
      throw new ForbiddenException('当前账号未绑定租�?)

    if (context.dataScope === 'TENANT')
      return { tenantId: context.tenantId }

    if (context.dataScope === 'SHOP') {
      if (!context.boundShopIds.length)
        throw new ForbiddenException('当前账号未绑定店�?)

      return {
        tenantId: context.tenantId,
        shopId: { in: context.boundShopIds },
      }
    }

    return {
      tenantId: context.tenantId,
      createdBy: context.userId,
    }
  }

  buildScopedWhere(
    context: TenantContext,
    query: { tenantId?: number | string | null, shopId?: string | number | null } = {},
  ): TenantResourceFilter {
    this.assertRequestedScopeAllowed(context, query)

    const base = this.buildResourceWhere(context)

    if (context.dataScope === 'ALL') {
      return {
        ...(query.tenantId ? { tenantId: Number(query.tenantId) } : {}),
        ...(query.shopId ? { shopId: String(query.shopId) } : {}),
      }
    }

    if (query.shopId)
      return { ...base, shopId: String(query.shopId) }

    return base
  }

  assertRequestedScopeAllowed(
    context: TenantContext,
    query: { tenantId?: number | string | null, shopId?: string | number | null } = {},
  ) {
    if (context.dataScope === 'ALL')
      return

    if (query.tenantId && Number(query.tenantId) !== context.tenantId) {
      throw new ForbiddenException('无权筛选其它租户数�?)
    }

    if (context.dataScope === 'SHOP' && query.shopId && !context.boundShopIds.includes(String(query.shopId))) {
      throw new ForbiddenException('无权筛选未绑定店铺数据')
    }
  }

  assertCanRead(context: TenantContext) {
    if (context.isPlatformAdmin)
      return

    if (!context.tenantStatus)
      throw new ForbiddenException('当前账号未绑定租�?)

    if (['PENDING', 'DISABLED', 'ARCHIVED'].includes(context.tenantStatus)) {
      throw new ForbiddenException('当前租户状态不允许访问业务数据')
    }
  }

  assertCanWrite(context: TenantContext) {
    if (context.isPlatformAdmin)
      return

    if (!context.tenantStatus)
      throw new ForbiddenException('当前账号未绑定租�?)

    if (context.tenantStatus !== 'ACTIVE') {
      throw new ForbiddenException('当前租户状态不允许执行该操�?)
    }
  }

  assertShopAllowed(context: TenantContext, shopId?: string | null) {
    if (context.dataScope !== 'SHOP')
      return

    if (!shopId || !context.boundShopIds.includes(String(shopId))) {
      throw new ForbiddenException('无权访问该店铺数�?)
    }
  }
}
```

- [ ] **Step 3: Implement tenant context service**

Create `apps/server/src/modules/tenant/tenant-context.service.ts`:

```ts
import { ForbiddenException, Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import type { DataScope, TenantContext, TenantStatus } from './tenant.types'

@Injectable()
export class TenantContextService {
  constructor(private readonly prisma: PrismaService) {}

  async fromRequestUser(user: { id?: number, username?: string }): Promise<TenantContext> {
    if (!user?.id)
      throw new ForbiddenException('后台登录状态无�?)

    const record = await this.prisma.user.findUnique({
      where: { id: Number(user.id) },
      select: {
        id: true,
        username: true,
        role: true,
        dataScope: true,
        boundShopIds: true,
        tenant: {
          select: {
            id: true,
            code: true,
            name: true,
            status: true,
          },
        },
      },
    })

    if (!record)
      throw new ForbiddenException('后台用户不存�?)

    const dataScope = (record.dataScope || 'ALL') as DataScope

    return {
      userId: record.id,
      username: record.username,
      tenantId: record.tenant?.id ?? null,
      tenantCode: record.tenant?.code ?? null,
      tenantName: record.tenant?.name ?? null,
      tenantStatus: (record.tenant?.status ?? null) as TenantStatus | null,
      dataScope,
      boundShopIds: record.boundShopIds ?? [],
      isPlatformAdmin: dataScope === 'ALL',
    }
  }
}
```

- [ ] **Step 4: Run access tests**

Run:

```bash
pnpm --filter @elm-platform/server exec jest src/modules/tenant/tenant-access.service.spec.ts --runInBand
```

Expected: PASS.

---

## Task 4: Tenant module, service, controller, and lifecycle logs

**Files:**
- Create: `apps/server/src/modules/tenant/dto/tenant.dto.ts`
- Create: `apps/server/src/modules/tenant/tenant-state-machine.service.ts`
- Create: `apps/server/src/modules/tenant/tenant.service.ts`
- Create: `apps/server/src/modules/tenant/tenant.controller.ts`
- Create: `apps/server/src/modules/tenant/tenant.module.ts`
- Modify: `apps/server/src/app.module.ts`

- [ ] **Step 1: Add DTOs**

Create `apps/server/src/modules/tenant/dto/tenant.dto.ts`:

```ts
import { IsEmail, IsIn, IsOptional, IsString, Length } from 'class-validator'
import { tenantEvents } from '../tenant.types'

export class CreateTenantDto {
  @IsString()
  @Length(2, 64)
  name!: string

  @IsString()
  @Length(2, 64)
  code!: string

  @IsOptional()
  @IsString()
  contactName?: string

  @IsOptional()
  @IsString()
  contactPhone?: string

  @IsOptional()
  @IsEmail()
  contactEmail?: string

  @IsOptional()
  @IsString()
  planCode?: string

  @IsOptional()
  @IsString()
  remark?: string
}

export class UpdateTenantDto {
  @IsString()
  @Length(2, 64)
  name!: string

  @IsOptional()
  @IsString()
  contactName?: string

  @IsOptional()
  @IsString()
  contactPhone?: string

  @IsOptional()
  @IsEmail()
  contactEmail?: string

  @IsOptional()
  @IsString()
  planCode?: string

  @IsOptional()
  @IsString()
  remark?: string
}

export class TenantTransitionDto {
  @IsOptional()
  @IsString()
  reason?: string

  @IsOptional()
  @IsString()
  remark?: string
}

export class TenantEventParamDto {
  @IsIn(tenantEvents)
  event!: string
}
```

- [ ] **Step 2: Write state machine service tests**

Create `apps/server/src/modules/tenant/tenant-state-machine.service.spec.ts` before implementation. Cover:

1. Valid transition updates tenant status and returns `availableActions`.
2. Valid transition creates one `TenantActionLog` record.
3. Valid transition creates one `OperationLog` record with `tenantId` and `tenantCode`.
4. Invalid transition throws `ConflictException` and creates no logs.
5. Non-platform actor throws `ForbiddenException` and creates no logs.
6. Concurrent status change where `updateMany().count` is `0` throws `ConflictException`.

Run:

```bash
pnpm --filter @elm-platform/server exec jest src/modules/tenant/tenant-state-machine.service.spec.ts --runInBand
```

Expected: FAIL before implementation.

- [ ] **Step 3: Implement state machine service**

Create `apps/server/src/modules/tenant/tenant-state-machine.service.ts` with methods:

```ts
transitionTenant(payload: {
  tenantId: number
  event: TenantEvent
  actor: TenantStateActor
  reason?: string
  remark?: string
  requestId?: string
})
```

The method must:

1. Load tenant by id and remember `currentStatus`.
2. Call `assertTenantActorCanTrigger`.
3. Call `getNextTenantStatus`.
4. In one Prisma transaction:
   - update tenant with `updateMany({ where: { id: tenantId, status: currentStatus }, data: { status: nextStatus } })`
   - throw `ConflictException` if `count !== 1`, because another request already changed the status
   - create `tenantActionLog`
   - create `operationLog` with `tenantId`, `tenantCode`, actor information, event, from/to status, reason, remark, and requestId if the `OperationLog` model exists
5. Reload and return updated tenant plus `availableActions`.
6. Do not write either log when the transition or actor permission check fails.

- [ ] **Step 4: Implement tenant service**

Create `apps/server/src/modules/tenant/tenant.service.ts` with:

```ts
listTenants()
createTenant(dto: CreateTenantDto)
updateTenant(id: number, dto: UpdateTenantDto)
getTenantDetail(id: number)
getTenantActionLogs(id: number)
transitionTenant(id: number, event: TenantEvent, actor: TenantStateActor, dto: TenantTransitionDto)
```

Each returned tenant should include:

```ts
availableActions: getAvailableTenantEvents(tenant.status as TenantStatus)
```

- [ ] **Step 5: Implement tenant controller**

Create `apps/server/src/modules/tenant/tenant.controller.ts`:

```ts
@ApiTags('租户管理')
@ApiBearerAuth()
@Controller('admin/tenants')
@UseGuards(AdminAuthGuard, RolesGuard)
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Get()
  @RequirePermissions('platform:tenant:view')
  listTenants() {}

  @Post()
  @RequirePermissions('platform:tenant:create')
  createTenant(@Body() dto: CreateTenantDto) {}

  @Get(':id')
  @RequirePermissions('platform:tenant:view')
  getTenantDetail(@Param('id', ParseIntPipe) id: number) {}

  @Patch(':id')
  @RequirePermissions('platform:tenant:update')
  updateTenant(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTenantDto) {}

  @Post(':id/events/:event')
  @RequirePermissions('platform:tenant:transition')
  transitionTenant(@Param('id', ParseIntPipe) id: number, @Param() params: TenantEventParamDto, @Body() dto: TenantTransitionDto, @Request() req: any) {}

  @Get(':id/action-logs')
  @RequirePermissions('platform:tenant:view')
  getTenantActionLogs(@Param('id', ParseIntPipe) id: number) {}
}
```

Use `params.event as TenantEvent` only after `TenantEventParamDto` validation has run. Do not pass raw route strings directly into `TenantStateMachineService`.

Use actor:

```ts
{
  id: req.user.id,
  name: req.user.username || `admin#${req.user.id}`,
  type: 'PLATFORM_ADMIN',
}
```

- [ ] **Step 6: Register module**

Create `apps/server/src/modules/tenant/tenant.module.ts` exporting:

```ts
TenantAccessService
TenantContextService
TenantStateMachineService
TenantService
```

Import `TenantModule` in `apps/server/src/app.module.ts`.

- [ ] **Step 7: Run tenant policy/access/service tests**

Run:

```bash
pnpm --filter @elm-platform/server exec jest src/modules/tenant --runInBand
```

Expected: PASS.

---

## Task 5: Admin user tenant fields and auth profile

**Files:**
- Modify: `apps/server/src/modules/auth/auth.service.ts`
- Modify: `apps/server/src/modules/admin/dto/admin.dto.ts`
- Modify: `apps/server/src/modules/admin/admin.service.ts`
- Modify: `apps/server/src/modules/admin/constants/admin-permissions.ts`
- Modify: `apps/server/src/modules/admin/constants/admin-fallback-data.ts`
- Test: `apps/server/src/modules/auth/auth.service.spec.ts`
- Test: `apps/server/src/modules/admin/admin.service.spec.ts`

- [ ] **Step 1: Extend auth login select and response**

In `AuthService.login()`, include:

```ts
tenant: {
  select: {
    id: true,
    code: true,
    name: true,
    status: true,
  },
},
dataScope: true,
boundShopIds: true,
```

Return in `user`:

```ts
tenant: user.tenant
  ? {
      id: user.tenant.id,
      code: user.tenant.code,
      name: user.tenant.name,
      status: user.tenant.status,
    }
  : null,
dataScope: user.dataScope || 'ALL',
boundShopIds: user.boundShopIds || [],
```

- [ ] **Step 2: Extend admin DTOs**

In `apps/server/src/modules/admin/dto/admin.dto.ts`, add:

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

- [ ] **Step 3: Validate user tenant payload combinations**

In `AdminService`, add a private validator:

```ts
private assertUserTenantScope(dto: { tenantId?: number | null, dataScope?: string, boundShopIds?: string[] }) {
  const dataScope = dto.dataScope || 'ALL'
  const boundShopIds = dto.boundShopIds || []

  if (dataScope === 'ALL' && dto.tenantId) {
    throw new BadRequestException('平台管理员不能绑定租�?)
  }

  if ((dataScope === 'TENANT' || dataScope === 'SHOP') && !dto.tenantId) {
    throw new BadRequestException('租户账号必须绑定租户')
  }

  if (dataScope === 'SHOP' && boundShopIds.length === 0) {
    throw new BadRequestException('店铺运营账号必须绑定至少一个店�?)
  }
}
```

Call it in create/update user paths before Prisma writes.

- [ ] **Step 4: Validate current actor can mutate the target user**

Inject or build `TenantContext` for the current admin user in user create/update flows. Add a second validator in `AdminService`:

```ts
private assertUserMutationAllowed(
  actor: TenantContext,
  target: { tenantId?: number | null, dataScope?: string, boundShopIds?: string[] },
) {
  if (actor.dataScope === 'ALL')
    return

  if (!actor.tenantId)
    throw new ForbiddenException('当前账号未绑定租�?)

  if ((target.dataScope || 'ALL') === 'ALL') {
    throw new ForbiddenException('租户管理员不能创建或修改平台管理�?)
  }

  if (target.tenantId !== actor.tenantId) {
    throw new ForbiddenException('租户管理员不能管理其它租户用�?)
  }
}
```

Call `assertUserTenantScope(dto)` first, then `assertUserMutationAllowed(actorContext, dto)` before writing. Platform admins may create any valid target user. Tenant admins may only create or update users in their own tenant and may not set `dataScope` to `ALL`. Do not expose or accept `SELF` from the admin form in this phase.

- [ ] **Step 5: Add permissions and menu**

Add permissions:

```ts
platform:tenant:view
platform:tenant:create
platform:tenant:update
platform:tenant:transition
```

Add menu under platform/system area:

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

- [ ] **Step 6: Update tests**

Add tests that:

1. Login response includes `tenant`, `dataScope`, `boundShopIds`.
2. `ALL + tenantId` rejects.
3. `TENANT` without tenant rejects.
4. `SHOP` without shop ids rejects.
5. Tenant admin creating or updating an `ALL` user returns 403.
6. Tenant admin binding a user to another tenant returns 403.
7. Tenant admin creating a `SHOP` user in the same tenant succeeds.
8. Platform admin creating a valid tenant admin succeeds.

- [ ] **Step 7: Run backend admin/auth tests**

Run:

```bash
pnpm --filter @elm-platform/server exec jest src/modules/auth/auth.service.spec.ts src/modules/admin/admin.service.spec.ts --runInBand
```

Expected: PASS.

---

## Task 6: Backend business data isolation

**Files:**
- Modify: `apps/server/src/modules/elm/controllers/elm-admin.controller.ts`
- Modify: `apps/server/src/modules/elm/services/elm-restaurant.service.ts`
- Modify: `apps/server/src/modules/elm/services/elm-food.service.ts`
- Modify: `apps/server/src/modules/elm/types/elm.types.ts`
- Modify: `apps/server/src/modules/elm/factories/elm.factories.ts`
- Modify: `apps/server/src/modules/elm/data/elm.seed.ts`
- Modify: `apps/server/src/modules/payment/payment.service.ts`
- Modify: `apps/server/src/modules/order/order-workflow.service.ts`
- Test: `apps/server/src/modules/payment/payment.service.spec.ts`
- Test: `apps/server/src/modules/order/order-workflow.service.spec.ts`
- Test: `apps/server/src/modules/elm/controllers/elm-admin.controller.spec.ts`

- [ ] **Step 1: Add tenant fields to elm records**

In `RestaurantRecord`, `FoodRecord`, and seed inputs, add:

```ts
tenantId?: number | null
```

In factories and seed data, assign tenant ids from the tenant objects returned by `seed.ts`, never from hard-coded database ids:

```ts
restaurant 1 -> tenantId: flowerCakeTenant.id
restaurant 2 -> tenantId: fastFoodTenant.id
restaurant 3 -> tenantId: flowerCakeTenant.id
```

If elm seed files cannot import Prisma seed variables directly, pass a `{ flowerCakeTenantId, fastFoodTenantId }` mapping into the factory layer and keep the mapping in one place.

- [ ] **Step 2: Filter restaurant service**

Change backend admin list calls to pass `TenantContext`. Add methods or optional query fields:

```ts
listRestaurants(query, context?: TenantContext) {
  let list = [...this.store.restaurants]
  if (context?.dataScope === 'TENANT')
    list = list.filter(item => item.tenantId === context.tenantId)
  if (context?.dataScope === 'SHOP')
    list = list.filter(item => context.boundShopIds.includes(String(item.id)))
  return list.slice(offset, offset + limit)
}
```

Before create/update/delete, call:

```ts
tenantAccess.assertCanWrite(context)
tenantAccess.assertShopAllowed(context, String(id))
```

- [ ] **Step 3: Filter food service**

For `SHOP`, allow only foods whose `restaurant_id` is in `context.boundShopIds`. For `TENANT`, allow foods whose restaurant belongs to `context.tenantId`.

- [ ] **Step 4: Filter admin orders**

Change `PaymentService.listAdminOrders(context, query)`:

```ts
const where = this.tenantAccess.buildScopedWhere(context, {
  tenantId: query.tenantId,
  shopId: query.shopId,
})
```

Use `where` in `paymentOrder.findMany`. This must return 403 when a `TENANT` user requests another `tenantId` or a `SHOP` user requests an unbound `shopId`; it must allow an `ALL` user to pass `tenantId` or `shopId` to narrow the result set.

- [ ] **Step 5: Validate workflow actions**

Change `OrderWorkflowService` admin methods to accept `TenantContext`:

```ts
getAdminOrderDetail(orderNo: string, context: TenantContext)
acceptOrder(orderNo: string, operator: OrderWorkflowOperator, context: TenantContext)
approveRefund(orderNo: string, operator: OrderWorkflowOperator, remark: string | undefined, context: TenantContext)
```

Before returning or writing:

```ts
this.tenantAccess.assertCanRead(context)
this.assertOrderInScope(order, context)
this.tenantAccess.assertCanWrite(context)
```

When creating `orderActionLog`, include:

```ts
tenantId: before.tenantId ?? null
```

- [ ] **Step 6: Wire controller context**

In `ElmAdminController`, inject `TenantContextService`, then for each backend admin route:

```ts
const context = await this.tenantContext.fromRequestUser(req.user)
```

Pass `context` to service calls.

- [ ] **Step 7: Filter operation logs**

Find the existing backend operation log list method in `AdminService` or the corresponding admin log service. Change it to accept `TenantContext` and request query filters. Build the Prisma `where` with `tenantAccess.buildScopedWhere(context, query)`, then adapt the returned filter to fields that actually exist on `OperationLog`. If `OperationLog` has no `shopId` field, drop `shopId` from the Prisma `where` after using it only for authorization checks.

Rules:

1. `ALL` users can see all operation logs, including legacy logs with `tenantId: null`; optional `tenantId` only narrows the result.
2. `TENANT` users only see logs with their own `tenantId`; requesting another `tenantId` returns 403.
3. `SHOP` users only see logs with their own `tenantId`; if operation logs include `shopId`, also restrict to `boundShopIds`.
4. Legacy logs with `tenantId: null` are visible only to `ALL` users.

Add tests for platform admin, tenant admin, shop operator, and legacy null-tenant logs.

- [ ] **Step 8: Add isolation tests**

Backend tests must cover:

1. `TENANT` user sees only same `tenantId` orders.
2. `TENANT` user requesting another `tenantId` returns 403.
3. `SHOP` user sees only bound shop orders.
4. `SHOP` user requesting an unbound `shopId` returns 403.
5. `SHOP` user cannot accept unbound shop order.
6. `SUSPENDED` tenant can read but cannot write.
7. `DISABLED` tenant cannot read business orders.
8. Operation log list filters by tenant context and hides `tenantId: null` logs from non-platform users.

- [ ] **Step 9: Run backend isolation tests**

Run:

```bash
pnpm --filter @elm-platform/server exec jest src/modules/payment/payment.service.spec.ts src/modules/order/order-workflow.service.spec.ts src/modules/elm/controllers/elm-admin.controller.spec.ts --runInBand
```

Expected: PASS.

---

## Task 7: Admin tenant API and tenant management page

**Files:**
- Modify: `apps/web-admin/src/shared/api/endpoints.ts`
- Modify: `apps/web-admin/src/shared/config/access.ts`
- Create: `apps/web-admin/src/entities/tenant/model/types.ts`
- Create: `apps/web-admin/src/entities/tenant/api/index.ts`
- Create: `apps/web-admin/src/features/tenant-management/config/workflow.ts`
- Create: `apps/web-admin/src/features/tenant-management/config/workflow.test.ts`
- Create: `apps/web-admin/src/features/tenant-management/config/fields.ts`
- Create: `apps/web-admin/src/features/tenant-management/model/useTenantManagement.ts`
- Create: `apps/web-admin/src/features/tenant-management/ui/TenantTable.vue`
- Create: `apps/web-admin/src/features/tenant-management/ui/TenantFormDialog.vue`
- Create: `apps/web-admin/src/features/tenant-management/ui/TenantActionLogDrawer.vue`
- Create: `apps/web-admin/src/features/tenant-management/index.ts`
- Create: `apps/web-admin/src/pages/platform/tenant/index.vue`
- Modify: `apps/web-admin/src/app/router/component-map.ts`

- [ ] **Step 1: Add tenant endpoints and types**

Add endpoint keys:

```ts
tenants: '/admin/tenants',
tenantDetail: (id: number | string) => `/admin/tenants/${id}`,
tenantEvent: (id: number | string, event: string) => `/admin/tenants/${id}/events/${event}`,
tenantActionLogs: (id: number | string) => `/admin/tenants/${id}/action-logs`,
```

Create tenant types:

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

- [ ] **Step 2: Add tenant API functions**

Create functions:

```ts
getTenants()
createTenant(payload)
updateTenant(id, payload)
getTenantDetail(id)
transitionTenant(id, event, payload)
getTenantActionLogs(id)
```

- [ ] **Step 3: Add workflow config and test**

`workflow.ts` maps statuses and events to labels/colors/confirm text. Test should verify:

1. `PENDING` shows `APPROVE` and `REJECT`.
2. `ACTIVE` shows `SUSPEND`, `DISABLE`, `EXPIRE`.
3. `ARCHIVED` shows no actions.

- [ ] **Step 4: Build and test page model**

`useTenantManagement.ts` owns:

```ts
rows
loading
formVisible
logVisible
selectedTenant
fetchRows
openCreate
openEdit
submitTenant
executeEvent
openLogs
```

`executeEvent(row, event)` must call `transitionTenant(row.id, event, payload)`, close the confirmation state if any, then call `fetchRows()` again. `openLogs(row)` must set `selectedTenant`, load `getTenantActionLogs(row.id)`, and show the drawer.

Create `apps/web-admin/src/features/tenant-management/model/useTenantManagement.test.ts` and cover:

1. `fetchRows()` calls `getTenants()` and fills `rows`.
2. `submitTenant()` calls `createTenant()` when no selected tenant exists.
3. `submitTenant()` calls `updateTenant()` when selected tenant exists.
4. `executeEvent()` calls `transitionTenant()` and refreshes rows.
5. `openLogs()` calls `getTenantActionLogs()` and opens the drawer.

- [ ] **Step 5: Build tenant page components**

Page should use existing `AdminTablePage`, `AdminSearchForm`, and config CRUD/table style. Cards should be avoided except for repeated row/action surfaces already established by the app.

Implement components with these contracts:

```ts
// TenantTable.vue
props: {
  rows: TenantRecord[]
  loading: boolean
}
emits: {
  edit: [row: TenantRecord]
  event: [row: TenantRecord, event: TenantEvent]
  logs: [row: TenantRecord]
}
```

`TenantTable` must render lifecycle buttons only from `row.availableActions`; it must not recompute valid transitions on the frontend.

```ts
// TenantFormDialog.vue
props: {
  modelValue: boolean
  tenant: TenantRecord | null
}
emits: {
  'update:modelValue': [value: boolean]
  submit: [payload: CreateTenantPayload | UpdateTenantPayload]
}
```

The form fields are `name`, `code`, `contactName`, `contactPhone`, `contactEmail`, `planCode`, and `remark`. Disable `code` when editing an existing tenant.

```ts
// TenantActionLogDrawer.vue
props: {
  modelValue: boolean
  logs: TenantActionLog[]
  loading: boolean
}
emits: {
  'update:modelValue': [value: boolean]
}
```

`pages/platform/tenant/index.vue` wires the composable and components only; it should not duplicate API calls outside `useTenantManagement`.

- [ ] **Step 6: Register route component**

Map `PlatformTenantView` to:

```ts
() => import('@/pages/platform/tenant/index.vue')
```

- [ ] **Step 7: Run admin tenant tests**

Run:

```bash
pnpm --filter @elm-platform/web-admin exec vitest run src/features/tenant-management/config/workflow.test.ts src/features/tenant-management/model/useTenantManagement.test.ts
pnpm --filter @elm-platform/web-admin run type-check
```

Expected: PASS.

---

## Task 8: Admin user tenant fields and tenant context display

**Files:**
- Modify: `apps/web-admin/src/entities/session/model/types.ts`
- Modify: `apps/web-admin/src/entities/session/model/store.ts`
- Modify: `apps/web-admin/src/entities/session/model/dev-auth.ts`
- Modify: `apps/web-admin/src/features/user-management/config/fields.ts`
- Modify: `apps/web-admin/src/features/user-management/model/useUserManagement.ts`
- Modify: `apps/web-admin/src/widgets/admin-layout/ui/TopNavigation/NotificationBell/index.vue`
- Modify: `apps/web-admin/src/pages/commerce/order/index.vue`
- Modify: `apps/web-admin/src/shared/i18n/lang/zh-CN.ts`
- Modify: `apps/web-admin/src/shared/i18n/lang/en.ts`
- Create or Modify: `apps/web-admin/src/shared/api/tenant-error.test.ts`

- [ ] **Step 1: Extend session user type**

Add:

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

- [ ] **Step 2: Add dev auth tenant context**

Mock dev admin as:

```ts
tenant: null,
dataScope: 'ALL',
boundShopIds: [],
```

- [ ] **Step 3: Add user management fields**

Add fields:

```ts
tenantId
dataScope
boundShopIds
```

Use `select` for `dataScope` with only `ALL`, `TENANT`, and `SHOP` options. Do not expose `SELF` in this phase. Use a tenant select for `tenantId`, and use a multi-select or comma-split input for `boundShopIds` if the existing config renderer does not support dynamic multi-select.

UI rules:

1. `ALL`: clear and hide `tenantId` and `boundShopIds`.
2. `TENANT`: require `tenantId`, clear and hide `boundShopIds`.
3. `SHOP`: require `tenantId` and at least one `boundShopIds` value.

- [ ] **Step 4: Add top navigation context**

Display compact text:

```text
平台管理�?· 全部租户
租户管理�?· <tenant.name>
店铺运营 · <tenant.name> / <boundShopIds>
```

- [ ] **Step 5: Add order page scope hint**

At top of `apps/web-admin/src/pages/commerce/order/index.vue`, render a small neutral hint using current session:

```text
当前数据范围：全部租�?当前数据范围�?tenant.name>
当前数据范围�?tenant.name> / 店铺 <ids>
```

- [ ] **Step 6: Add admin display tests**

Add or extend frontend unit tests to cover:

1. Session store persists `tenant`, `dataScope`, and `boundShopIds` from login/profile payloads.
2. User management fields hide tenant/shop controls for `ALL`.
3. User management fields require tenant for `TENANT`.
4. User management fields require tenant and shops for `SHOP`.
5. Top navigation renders `平台管理�?· 全部租户` for `ALL`.
6. Top navigation renders tenant name for `TENANT`.
7. Top navigation renders tenant name and shop ids for `SHOP`.

- [ ] **Step 7: Add tenant status error-code tests**

Find the admin HTTP error handling hook in `apps/web-admin/src/shared/api` or `apps/web-admin/src/app/providers/http.ts`. Add a small mapping helper if one does not already exist, then test that tenant status error codes produce clear user-facing messages.

Test these codes:

```ts
const tenantErrorMessages = {
  TENANT_PENDING: '当前租户尚未启用，请联系平台管理员�?,
  TENANT_SUSPENDED_READONLY: '当前租户状态不允许执行该操作，请联系平台管理员�?,
  TENANT_DISABLED: '当前租户已停用，请联系平台管理员�?,
  TENANT_EXPIRED_READONLY: '当前租户状态不允许执行该操作，请联系平台管理员�?,
  TENANT_ARCHIVED: '当前租户已归档，请联系平台管理员�?,
}
```

Create or update `apps/web-admin/src/shared/api/tenant-error.test.ts` to verify every code above maps to the expected Chinese message. If the existing HTTP provider maps errors through i18n keys instead of plain strings, test the i18n keys and ensure `zh-CN.ts` contains these Chinese messages.

- [ ] **Step 8: Run admin tests and type-check**

Run:

```bash
pnpm --filter @elm-platform/web-admin exec vitest run src/shared/api/tenant-error.test.ts
pnpm --filter @elm-platform/web-admin run test:unit
pnpm --filter @elm-platform/web-admin run type-check
```

Expected: PASS.

---

## Task 9: End-to-end verification and cleanup

**Files:**
- Verify all files changed in Tasks 1-8.

- [ ] **Step 1: Generate Prisma client**

Run:

```bash
pnpm --filter @elm-platform/server run prisma:generate
```

Expected: PASS.

- [ ] **Step 2: Run backend test and build**

Run:

```bash
pnpm --filter @elm-platform/server run build
pnpm --filter @elm-platform/server run test
```

Expected: PASS.

- [ ] **Step 3: Run admin tests and build**

Run:

```bash
pnpm --filter @elm-platform/web-admin run test:unit
pnpm --filter @elm-platform/web-admin run build
```

Expected: PASS.

- [ ] **Step 4: Run workspace lint**

Run:

```bash
pnpm lint
pnpm --filter @elm-platform/web-admin run lint:style
```

Expected: PASS. If `.understand-anything` directories still exist and are not ignored by config, add them to `eslint.config.mjs` ignores instead of deleting user files.

- [ ] **Step 5: Run user app only if touched**

If user web files changed during implementation, run:

```bash
pnpm --filter @elm-platform/web-user run test
pnpm --filter @elm-platform/web-user run build
```

Expected: PASS.

- [ ] **Step 6: Manual smoke checks**

Start backend and admin:

```bash
pnpm dev:server
pnpm dev:admin
```

Verify:

1. Platform admin can open tenant management and see all tenants.
2. Tenant lifecycle actions update status and create both tenant action logs and operation logs.
3. Tenant admin sees only own tenant orders/restaurants/foods.
4. Shop operator sees only bound shop data.
5. Shop operator cannot operate another shop order.
6. Suspended tenant can read list/detail but cannot perform write actions.
7. Disabled or archived tenant cannot access business data.
8. Top navigation shows the current identity and data range.

---

## Spec Coverage Check

- Tenant model and lifecycle: Tasks 1, 2, 4.
- Tenant action audit logs: Tasks 1, 4.
- Tenant state changes also write OperationLog: Task 4.
- Tenant context and data access policy: Task 3.
- Requested tenant/shop filters can only narrow scope: Tasks 3, 6.
- Orders/refunds/restaurants/foods/operation-log isolation: Task 6.
- Admin profile and user data scope: Task 5, Task 8.
- Current actor cannot manage users across tenant boundaries: Task 5.
- Tenant management UI: Task 7.
- Data range display and tenant status error-code messages: Task 8.
- Verification commands: Task 9.


