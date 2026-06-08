# 订单履约与退款审批中台化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把现有支付订单升级为可审计、可审批、受按钮权限约束的订单履约与退款闭环�?
**Architecture:** 保留 `PaymentOrder.status` 作为支付状态，新增 `fulfillmentStatus` �?`refundStatus` 作为履约/退款维度。后端新�?`OrderWorkflowService` �?`OrderTransitionPolicy` 承载状态机、冲突判断、动作日志和可执行动作计算；管理端和用户端只调用动作接口，不直接提交目标状态�?
**Tech Stack:** NestJS 10、Prisma、PostgreSQL、Jest、Vue 3、TypeScript、Element Plus、Vant、Vitest、pnpm workspace、GitHub Actions�?
---

## Scope

本计划只实现第一期：订单履约状态机、用户退款申请、后台退款审批、按钮权限、订单业务动作日志、管理端动作/详情抽屉、用户端退款入口、后端健康检查和最�?CI�?
不实现商家级数据权限、商家入驻审批、Docker Compose、Nginx、真实支付宝退款、通用审批流引擎、独立订单详情路由�?
---

## File Structure

### Backend

- Modify: `apps/server/prisma/schema.prisma` �?�?`PaymentOrder` 增加履约/退款字段，新增 `OrderActionLog` 模型�?- Create: `apps/server/prisma/migrations/20260602000000_order_fulfillment_refund_approval/migration.sql` �?数据库迁移�?- Modify: `apps/server/prisma/seed.ts` �?增加一个带履约/退款字段的演示订单�?- Create: `apps/server/src/modules/order/order.types.ts` �?定义支付、履约、退款、动作、操作者类型�?- Create: `apps/server/src/modules/order/order-transition.policy.ts` �?纯状态机策略、可执行动作、冲突判断�?- Create: `apps/server/src/modules/order/order-transition.policy.spec.ts` �?状态机单测�?- Create: `apps/server/src/modules/order/order-workflow.service.ts` �?事务更新订单、写 `OrderActionLog`、输出详情和可执行动作�?- Create: `apps/server/src/modules/order/order-workflow.service.spec.ts` �?工作流服务单测�?- Create: `apps/server/src/modules/order/order.module.ts` �?导出订单工作流服务�?- Create: `apps/server/src/modules/order/dto/request-refund.dto.ts` �?用户退款申�?DTO�?- Create: `apps/server/src/modules/order/dto/reject-refund.dto.ts` �?后台退款驳�?DTO�?- Modify: `apps/server/src/modules/payment/payment.module.ts` �?引入 `OrderModule`�?- Modify: `apps/server/src/modules/payment/payment.service.ts` �?创建/支付状态刷�?回调时同步履约状态，订单摘要返回履约/退款字段�?- Modify: `apps/server/src/modules/payment/payment.service.spec.ts` �?增加订单工作�?mock，覆盖支付到履约同步�?- Modify: `apps/server/src/modules/payment/payment.controller.ts` �?增加用户退款申请接口�?- Modify: `apps/server/src/modules/payment/payment.controller.spec.ts` �?覆盖退款申请接口只信任 token 用户�?- Modify: `apps/server/src/modules/elm/elm.module.ts` �?引入 `OrderModule`�?- Modify: `apps/server/src/modules/elm/controllers/elm-admin.controller.ts` �?增加订单详情和后台动作接口，接入 `RequirePermissions`�?- Modify: `apps/server/src/modules/elm/controllers/elm-admin.controller.spec.ts` �?覆盖后台动作调用工作流服务�?- Modify: `apps/server/src/modules/admin/constants/admin-permissions.ts` �?增加订单动作按钮权限�?- Modify: `apps/server/src/modules/admin/constants/admin-fallback-data.ts` �?保持订单菜单权限�?`commerce:order:view`，不新增页面�?- Create: `apps/server/src/health/health.service.ts` �?检查运行态、数据库�?Redis�?- Create: `apps/server/src/health/health.controller.ts` �?暴露 `/api/health`�?- Create: `apps/server/src/health/health.module.ts` �?健康检查模块�?- Create: `apps/server/src/health/health.service.spec.ts` �?健康检查单测�?- Modify: `apps/server/src/app.module.ts` �?引入 `HealthModule`�?
### Admin web

- Modify: `apps/web-admin/src/entities/order/model/types.ts` �?扩展订单类型、动作类型、日志类型�?- Modify: `apps/web-admin/src/entities/order/api/index.ts` �?增加订单详情和动�?API�?- Modify: `apps/web-admin/src/shared/api/endpoints.ts` �?增加订单动作 endpoint�?- Modify: `apps/web-admin/src/shared/config/access.ts` �?增加订单动作权限常量�?- Create: `apps/web-admin/src/features/order-management/config/workflow.ts` �?状态文案、动作文案、权限映射和可见动作计算�?- Create: `apps/web-admin/src/features/order-management/config/workflow.test.ts` �?管理端动作可见性单测�?- Modify: `apps/web-admin/src/features/order-management/config/fields.ts` �?增加履约状�?退款状态查询和表格列�?- Modify: `apps/web-admin/src/features/order-management/model/useOrderManagement.ts` �?增加订单详情、动作执行、退款驳回状态�?- Create: `apps/web-admin/src/features/order-management/ui/OrderActionColumn.vue` �?行动作按钮�?- Create: `apps/web-admin/src/features/order-management/ui/OrderDetailDrawer.vue` �?订单详情、时间线、动作日志�?- Create: `apps/web-admin/src/features/order-management/ui/RefundRejectDialog.vue` �?退款驳回原因弹窗�?- Modify: `apps/web-admin/src/features/order-management/ui/OrderTable.vue` �?插入动作列并透传事件�?- Modify: `apps/web-admin/src/features/order-management/index.ts` �?导出新增组件/配置�?- Modify: `apps/web-admin/src/pages/commerce/order/index.vue` �?接入详情抽屉、动作执行、驳回弹窗�?- Modify: `apps/web-admin/src/shared/i18n/lang/zh-CN.ts` �?增加中文文案�?- Modify: `apps/web-admin/src/shared/i18n/lang/en.ts` �?增加英文文案�?
### User web

- Modify: `apps/web-user/src/services/api/endpoints/payment.endpoints.js` �?增加退款申�?endpoint�?- Modify: `apps/web-user/src/services/api/api-payment.js` �?增加 `requestOrderRefund()`�?- Modify: `apps/web-user/src/services/api/api-payment.test.js` �?覆盖退款申�?API�?- Modify: `apps/web-user/src/views/order/components/OrderCard.vue` �?展示履约/退款状态和“申请退款”�?- Modify: `apps/web-user/src/views/order/components/OrderCard.test.js` �?覆盖退款按钮和状态展示�?- Create: `apps/web-user/src/views/order/composables/useRequestRefund.js` �?用户端退款申请流程�?- Modify: `apps/web-user/src/views/order/order.vue` �?接入退款申请流程�?
### CI

- Create: `.github/workflows/ci.yml` �?最小质量门禁�?
---

## Task 1: Backend order transition policy

**Files:**
- Create: `apps/server/src/modules/order/order.types.ts`
- Create: `apps/server/src/modules/order/order-transition.policy.ts`
- Test: `apps/server/src/modules/order/order-transition.policy.spec.ts`

- [ ] **Step 1: Write the failing transition policy test**

Create `apps/server/src/modules/order/order-transition.policy.spec.ts`:

```ts
import { ConflictException } from '@nestjs/common'
import {
  assertAdminActionAllowed,
  assertRefundRequestAllowed,
  assertRefundReviewAllowed,
  getAdminAvailableActions,
  getCustomerAvailableActions,
  getNextFulfillmentStatus,
  normalizeFulfillmentStatus,
  normalizeRefundStatus,
} from './order-transition.policy'

function createOrder(overrides: Record<string, unknown> = {}) {
  return {
    status: 'PAID',
    fulfillmentStatus: 'AWAITING_ACCEPTANCE',
    refundStatus: 'NONE',
    ...overrides,
  }
}

describe('orderTransitionPolicy', () => {
  it('normalizes missing workflow fields from payment status', () => {
    expect(normalizeFulfillmentStatus(createOrder({ fulfillmentStatus: null, status: 'PENDING' }))).toBe('PENDING_PAYMENT')
    expect(normalizeFulfillmentStatus(createOrder({ fulfillmentStatus: null, status: 'PAID' }))).toBe('AWAITING_ACCEPTANCE')
    expect(normalizeRefundStatus(createOrder({ refundStatus: null }))).toBe('NONE')
  })

  it('returns admin actions from the current fulfillment status', () => {
    expect(getAdminAvailableActions(createOrder())).toEqual(['ACCEPT'])
    expect(getAdminAvailableActions(createOrder({ fulfillmentStatus: 'ACCEPTED' }))).toEqual(['START_PREPARING'])
    expect(getAdminAvailableActions(createOrder({ fulfillmentStatus: 'PREPARING' }))).toEqual(['START_DELIVERY'])
    expect(getAdminAvailableActions(createOrder({ fulfillmentStatus: 'DELIVERING' }))).toEqual(['COMPLETE'])
  })

  it('returns refund review actions only when refund is requested', () => {
    const order = createOrder({ fulfillmentStatus: 'PREPARING', refundStatus: 'REQUESTED' })

    expect(getAdminAvailableActions(order)).toEqual(['START_DELIVERY', 'APPROVE_REFUND', 'REJECT_REFUND'])
  })

  it('returns customer refund action only for paid active orders without an existing refund', () => {
    expect(getCustomerAvailableActions(createOrder())).toEqual(['REQUEST_REFUND'])
    expect(getCustomerAvailableActions(createOrder({ status: 'PENDING' }))).toEqual([])
    expect(getCustomerAvailableActions(createOrder({ fulfillmentStatus: 'COMPLETED' }))).toEqual([])
    expect(getCustomerAvailableActions(createOrder({ refundStatus: 'REQUESTED' }))).toEqual([])
  })

  it('calculates the next fulfillment status for valid admin actions', () => {
    expect(getNextFulfillmentStatus(createOrder(), 'ACCEPT')).toBe('ACCEPTED')
    expect(getNextFulfillmentStatus(createOrder({ fulfillmentStatus: 'ACCEPTED' }), 'START_PREPARING')).toBe('PREPARING')
    expect(getNextFulfillmentStatus(createOrder({ fulfillmentStatus: 'PREPARING' }), 'START_DELIVERY')).toBe('DELIVERING')
    expect(getNextFulfillmentStatus(createOrder({ fulfillmentStatus: 'DELIVERING' }), 'COMPLETE')).toBe('COMPLETED')
  })

  it('rejects invalid fulfillment transitions with conflict errors', () => {
    expect(() => assertAdminActionAllowed(createOrder(), 'COMPLETE')).toThrow(ConflictException)
    expect(() => assertAdminActionAllowed(createOrder({ status: 'PENDING' }), 'ACCEPT')).toThrow(ConflictException)
  })

  it('rejects invalid refund requests with conflict errors', () => {
    expect(() => assertRefundRequestAllowed(createOrder())).not.toThrow()
    expect(() => assertRefundRequestAllowed(createOrder({ refundStatus: 'REQUESTED' }))).toThrow(ConflictException)
    expect(() => assertRefundRequestAllowed(createOrder({ fulfillmentStatus: 'COMPLETED' }))).toThrow(ConflictException)
  })

  it('rejects refund review when the refund is not requested', () => {
    expect(() => assertRefundReviewAllowed(createOrder({ refundStatus: 'REQUESTED' }))).not.toThrow()
    expect(() => assertRefundReviewAllowed(createOrder({ refundStatus: 'APPROVED' }))).toThrow(ConflictException)
    expect(() => assertRefundReviewAllowed(createOrder({ refundStatus: 'NONE' }))).toThrow(ConflictException)
  })
})
```

- [ ] **Step 2: Run the policy test and verify it fails**

Run:

```bash
pnpm --filter @elm-platform/server run test -- order-transition.policy.spec.ts
```

Expected: FAIL because `order-transition.policy.ts` and `order.types.ts` do not exist.

- [ ] **Step 3: Create workflow types**

Create `apps/server/src/modules/order/order.types.ts`:

```ts
export const paymentStatuses = ['PENDING', 'PAID', 'CLOSED'] as const
export type PaymentStatus = (typeof paymentStatuses)[number]

export const fulfillmentStatuses = [
  'PENDING_PAYMENT',
  'AWAITING_ACCEPTANCE',
  'ACCEPTED',
  'PREPARING',
  'DELIVERING',
  'COMPLETED',
  'CANCELED',
] as const
export type FulfillmentStatus = (typeof fulfillmentStatuses)[number]

export const refundStatuses = ['NONE', 'REQUESTED', 'APPROVED', 'REJECTED'] as const
export type RefundStatus = (typeof refundStatuses)[number]

export const adminOrderActions = [
  'ACCEPT',
  'START_PREPARING',
  'START_DELIVERY',
  'COMPLETE',
  'APPROVE_REFUND',
  'REJECT_REFUND',
] as const
export type AdminOrderAction = (typeof adminOrderActions)[number]

export const customerOrderActions = ['REQUEST_REFUND'] as const
export type CustomerOrderAction = (typeof customerOrderActions)[number]

export const systemOrderActions = ['SYNC_PAYMENT_PAID', 'SYNC_PAYMENT_CLOSED'] as const
export type SystemOrderAction = (typeof systemOrderActions)[number]

export type OrderWorkflowAction = AdminOrderAction | CustomerOrderAction | SystemOrderAction

export const operatorTypes = ['ADMIN', 'CUSTOMER', 'SYSTEM'] as const
export type OperatorType = (typeof operatorTypes)[number]

export interface OrderWorkflowSnapshot {
  status?: string | null
  fulfillmentStatus?: string | null
  refundStatus?: string | null
}

export interface OrderWorkflowOperator {
  operatorId: string
  operatorName: string
  operatorType: OperatorType
  requestId?: string
}

export interface OrderWorkflowRemark {
  reason?: string
  remark?: string
}

export const orderActionPermissionMap: Record<AdminOrderAction, string> = {
  ACCEPT: 'commerce:order:accept',
  START_PREPARING: 'commerce:order:prepare',
  START_DELIVERY: 'commerce:order:deliver',
  COMPLETE: 'commerce:order:complete',
  APPROVE_REFUND: 'commerce:order:refund:approve',
  REJECT_REFUND: 'commerce:order:refund:reject',
}
```

- [ ] **Step 4: Implement the transition policy**

Create `apps/server/src/modules/order/order-transition.policy.ts`:

```ts
import { ConflictException } from '@nestjs/common'
import type {
  AdminOrderAction,
  CustomerOrderAction,
  FulfillmentStatus,
  OrderWorkflowSnapshot,
  RefundStatus,
} from './order.types'

const fulfillmentTransitionMap: Partial<Record<AdminOrderAction, Partial<Record<FulfillmentStatus, FulfillmentStatus>>>> = {
  ACCEPT: {
    AWAITING_ACCEPTANCE: 'ACCEPTED',
  },
  START_PREPARING: {
    ACCEPTED: 'PREPARING',
  },
  START_DELIVERY: {
    PREPARING: 'DELIVERING',
  },
  COMPLETE: {
    DELIVERING: 'COMPLETED',
  },
}

const refundableFulfillmentStatuses: FulfillmentStatus[] = [
  'AWAITING_ACCEPTANCE',
  'ACCEPTED',
  'PREPARING',
]

export function normalizeFulfillmentStatus(order: OrderWorkflowSnapshot): FulfillmentStatus {
  if (order.fulfillmentStatus)
    return order.fulfillmentStatus as FulfillmentStatus

  if (order.status === 'PAID')
    return 'AWAITING_ACCEPTANCE'

  if (order.status === 'CLOSED')
    return 'CANCELED'

  return 'PENDING_PAYMENT'
}

export function normalizeRefundStatus(order: OrderWorkflowSnapshot): RefundStatus {
  return (order.refundStatus || 'NONE') as RefundStatus
}

export function canUseFulfillmentActions(order: OrderWorkflowSnapshot) {
  return order.status === 'PAID'
}

export function getNextFulfillmentStatus(order: OrderWorkflowSnapshot, action: AdminOrderAction): FulfillmentStatus {
  const current = normalizeFulfillmentStatus(order)
  const next = fulfillmentTransitionMap[action]?.[current]

  if (!next)
    throw new ConflictException('当前订单状态不允许该操�?)

  return next
}

export function getAdminAvailableActions(order: OrderWorkflowSnapshot): AdminOrderAction[] {
  if (!canUseFulfillmentActions(order))
    return []

  const current = normalizeFulfillmentStatus(order)
  const refundStatus = normalizeRefundStatus(order)
  const actions = Object.entries(fulfillmentTransitionMap)
    .filter(([, transitions]) => Boolean(transitions[current]))
    .map(([action]) => action as AdminOrderAction)

  if (refundStatus === 'REQUESTED') {
    actions.push('APPROVE_REFUND', 'REJECT_REFUND')
  }

  return actions
}

export function getCustomerAvailableActions(order: OrderWorkflowSnapshot): CustomerOrderAction[] {
  return canRequestRefund(order) ? ['REQUEST_REFUND'] : []
}

export function canRequestRefund(order: OrderWorkflowSnapshot) {
  return order.status === 'PAID'
    && normalizeRefundStatus(order) === 'NONE'
    && refundableFulfillmentStatuses.includes(normalizeFulfillmentStatus(order))
}

export function assertAdminActionAllowed(order: OrderWorkflowSnapshot, action: AdminOrderAction) {
  if (!canUseFulfillmentActions(order)) {
    throw new ConflictException('未支付或已关闭订单不能执行履约操�?)
  }

  if (action === 'APPROVE_REFUND' || action === 'REJECT_REFUND') {
    assertRefundReviewAllowed(order)
    return
  }

  getNextFulfillmentStatus(order, action)
}

export function assertRefundRequestAllowed(order: OrderWorkflowSnapshot) {
  if (!canRequestRefund(order)) {
    throw new ConflictException('当前订单状态不允许申请退�?)
  }
}

export function assertRefundReviewAllowed(order: OrderWorkflowSnapshot) {
  if (normalizeRefundStatus(order) !== 'REQUESTED') {
    throw new ConflictException('当前退款状态不允许审批')
  }
}
```

- [ ] **Step 5: Run the policy test and verify it passes**

Run:

```bash
pnpm --filter @elm-platform/server run test -- order-transition.policy.spec.ts
```

Expected: PASS.

- [ ] **Step 6: Commit the transition policy**

```bash
git add apps/server/src/modules/order/order.types.ts apps/server/src/modules/order/order-transition.policy.ts apps/server/src/modules/order/order-transition.policy.spec.ts
git commit -m "feat(server): add order transition policy"
```

---

## Task 2: Prisma schema, migration, and seed data

**Files:**
- Modify: `apps/server/prisma/schema.prisma`
- Create: `apps/server/prisma/migrations/20260602000000_order_fulfillment_refund_approval/migration.sql`
- Modify: `apps/server/prisma/seed.ts`

- [ ] **Step 1: Extend `PaymentOrder` and add `OrderActionLog` in Prisma schema**

In `apps/server/prisma/schema.prisma`, replace the existing `PaymentOrder` model with:

```prisma
model PaymentOrder {
  id                          Int      @id @default(autoincrement())
  orderNo                     String   @unique
  userId                      String
  shopId                      String?
  shopName                    String
  status                      String   @default("PENDING")
  tradeStatus                 String   @default("WAIT_BUYER_PAY")
  fulfillmentStatus           String   @default("PENDING_PAYMENT") @map("fulfillment_status")
  refundStatus                String   @default("NONE") @map("refund_status")
  refundBaseFulfillmentStatus String?  @map("refund_base_fulfillment_status")
  refundReason                String?  @map("refund_reason")
  refundRejectReason          String?  @map("refund_reject_reason")
  tradeNo                     String?
  subject                     String
  goodsAmount                 Decimal  @db.Decimal(10, 2)
  deliveryFee                 Decimal  @db.Decimal(10, 2)
  payableAmount               Decimal  @db.Decimal(10, 2)
  cartItems                   Json
  notifyPayload               Json?
  queryPayload                Json?
  buyerPayAmount              Decimal? @db.Decimal(10, 2)
  paidAt                      DateTime?
  acceptedAt                  DateTime? @map("accepted_at")
  preparingAt                 DateTime? @map("preparing_at")
  deliveringAt                DateTime? @map("delivering_at")
  completedAt                 DateTime? @map("completed_at")
  canceledAt                  DateTime? @map("canceled_at")
  refundRequestedAt           DateTime? @map("refund_requested_at")
  refundedAt                  DateTime? @map("refunded_at")
  refundRejectedAt            DateTime? @map("refund_rejected_at")
  createdAt                   DateTime @default(now())
  updatedAt                   DateTime @updatedAt

  actionLogs OrderActionLog[] @relation("PaymentOrderActionLogs")

  @@map("payment_orders")
}
```

Then add this model after `PaymentOrder`:

```prisma
model OrderActionLog {
  id                    Int      @id @default(autoincrement())
  orderNo               String   @map("order_no")
  operatorId            String   @map("operator_id")
  operatorName          String   @map("operator_name")
  operatorType          String   @map("operator_type")
  action                String
  fromFulfillmentStatus String?  @map("from_fulfillment_status")
  toFulfillmentStatus   String?  @map("to_fulfillment_status")
  fromRefundStatus      String?  @map("from_refund_status")
  toRefundStatus        String?  @map("to_refund_status")
  reason                String?
  remark                String?
  requestId             String?  @map("request_id")
  createdAt             DateTime @default(now()) @map("created_at")

  order PaymentOrder @relation("PaymentOrderActionLogs", fields: [orderNo], references: [orderNo], onDelete: Cascade)

  @@index([orderNo])
  @@map("order_action_logs")
}
```

- [ ] **Step 2: Create migration SQL**

Create `apps/server/prisma/migrations/20260602000000_order_fulfillment_refund_approval/migration.sql`:

```sql
ALTER TABLE "payment_orders"
  ADD COLUMN "fulfillment_status" TEXT NOT NULL DEFAULT 'PENDING_PAYMENT',
  ADD COLUMN "refund_status" TEXT NOT NULL DEFAULT 'NONE',
  ADD COLUMN "refund_base_fulfillment_status" TEXT,
  ADD COLUMN "refund_reason" TEXT,
  ADD COLUMN "refund_reject_reason" TEXT,
  ADD COLUMN "accepted_at" TIMESTAMP(3),
  ADD COLUMN "preparing_at" TIMESTAMP(3),
  ADD COLUMN "delivering_at" TIMESTAMP(3),
  ADD COLUMN "completed_at" TIMESTAMP(3),
  ADD COLUMN "canceled_at" TIMESTAMP(3),
  ADD COLUMN "refund_requested_at" TIMESTAMP(3),
  ADD COLUMN "refunded_at" TIMESTAMP(3),
  ADD COLUMN "refund_rejected_at" TIMESTAMP(3);

UPDATE "payment_orders"
SET "fulfillment_status" = CASE
  WHEN "status" = 'PAID' THEN 'AWAITING_ACCEPTANCE'
  WHEN "status" = 'CLOSED' THEN 'CANCELED'
  ELSE 'PENDING_PAYMENT'
END
WHERE "fulfillment_status" = 'PENDING_PAYMENT';

CREATE TABLE "order_action_logs" (
  "id" SERIAL NOT NULL,
  "order_no" TEXT NOT NULL,
  "operator_id" TEXT NOT NULL,
  "operator_name" TEXT NOT NULL,
  "operator_type" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "from_fulfillment_status" TEXT,
  "to_fulfillment_status" TEXT,
  "from_refund_status" TEXT,
  "to_refund_status" TEXT,
  "reason" TEXT,
  "remark" TEXT,
  "request_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "order_action_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "order_action_logs_order_no_idx" ON "order_action_logs"("order_no");

ALTER TABLE "order_action_logs"
  ADD CONSTRAINT "order_action_logs_order_no_fkey"
  FOREIGN KEY ("order_no") REFERENCES "payment_orders"("orderNo")
  ON DELETE CASCADE ON UPDATE CASCADE;
```

- [ ] **Step 3: Add a demo workflow order to seed**

In `apps/server/prisma/seed.ts`, after the customer user upsert block and before role upserts, add:

```ts
  await (prisma as any).paymentOrder.upsert({
    where: { orderNo: 'ELMDEMO202606020001' },
    update: {
      status: 'PAID',
      tradeStatus: 'TRADE_SUCCESS',
      fulfillmentStatus: 'AWAITING_ACCEPTANCE',
      refundStatus: 'NONE',
      paidAt: new Date('2026-06-02T10:00:00.000Z'),
    },
    create: {
      orderNo: 'ELMDEMO202606020001',
      userId: String(customerUser.id),
      shopId: '1',
      shopName: '示例商家',
      status: 'PAID',
      tradeStatus: 'TRADE_SUCCESS',
      fulfillmentStatus: 'AWAITING_ACCEPTANCE',
      refundStatus: 'NONE',
      subject: '示例商家 外卖订单',
      goodsAmount: 24,
      deliveryFee: 5,
      payableAmount: 29,
      cartItems: [{
        itemId: '1001',
        skuId: '1001',
        title: '示例商品',
        qty: 2,
        unitPrice: 12,
        totalPrice: 24,
      }],
      paidAt: new Date('2026-06-02T10:00:00.000Z'),
    },
  })
```

- [ ] **Step 4: Generate Prisma client**

Run:

```bash
pnpm --filter @elm-platform/server run prisma:generate
```

Expected: Prisma client generation succeeds.

- [ ] **Step 5: Commit schema and migration**

```bash
git add apps/server/prisma/schema.prisma apps/server/prisma/migrations/20260602000000_order_fulfillment_refund_approval/migration.sql apps/server/prisma/seed.ts
git commit -m "feat(server): extend payment orders for fulfillment workflow"
```

---

## Task 3: Backend order workflow service

**Files:**
- Create: `apps/server/src/modules/order/order-workflow.service.ts`
- Test: `apps/server/src/modules/order/order-workflow.service.spec.ts`

- [ ] **Step 1: Write the failing workflow service test**

Create `apps/server/src/modules/order/order-workflow.service.spec.ts`:

```ts
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common'
import { OrderWorkflowService } from './order-workflow.service'

function createOrder(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    orderNo: 'ELMDEMO202606020001',
    userId: '42',
    shopId: '1',
    shopName: '示例商家',
    status: 'PAID',
    tradeStatus: 'TRADE_SUCCESS',
    fulfillmentStatus: 'AWAITING_ACCEPTANCE',
    refundStatus: 'NONE',
    refundBaseFulfillmentStatus: null,
    refundReason: null,
    refundRejectReason: null,
    goodsAmount: { toNumber: () => 24 },
    deliveryFee: { toNumber: () => 5 },
    payableAmount: { toNumber: () => 29 },
    cartItems: [{ qty: 2 }],
    paidAt: new Date('2026-06-02T10:00:00.000Z'),
    createdAt: new Date('2026-06-02T09:55:00.000Z'),
    updatedAt: new Date('2026-06-02T10:00:00.000Z'),
    actionLogs: [],
    ...overrides,
  }
}

function createService(orderOverrides: Record<string, unknown> = {}) {
  let currentOrder = createOrder(orderOverrides)
  const prisma = {
    $transaction: jest.fn(callback => callback(prisma)),
    paymentOrder: {
      findUnique: jest.fn().mockImplementation(() => Promise.resolve(currentOrder)),
      update: jest.fn().mockImplementation(({ data }) => {
        currentOrder = {
          ...currentOrder,
          ...data,
          updatedAt: new Date('2026-06-02T10:05:00.000Z'),
        }
        return Promise.resolve(currentOrder)
      }),
    },
    orderActionLog: {
      create: jest.fn().mockResolvedValue({ id: 1 }),
      findMany: jest.fn().mockResolvedValue([]),
    },
  } as any

  return {
    service: new OrderWorkflowService(prisma),
    prisma,
    getCurrentOrder: () => currentOrder,
  }
}

const adminOperator = {
  operatorId: '1',
  operatorName: 'admin',
  operatorType: 'ADMIN' as const,
  requestId: 'req-admin-1',
}

const customerOperator = {
  operatorId: '42',
  operatorName: '测试用户',
  operatorType: 'CUSTOMER' as const,
  requestId: 'req-customer-1',
}

describe('orderWorkflowService', () => {
  it('returns admin order detail with available actions and action logs', async () => {
    const { service, prisma } = createService()
    prisma.orderActionLog.findMany.mockResolvedValueOnce([{ id: 1, action: 'ACCEPT' }])

    const result = await service.getAdminOrderDetail('ELMDEMO202606020001')

    expect(result.availableActions).toEqual(['ACCEPT'])
    expect(result.customerAvailableActions).toEqual(['REQUEST_REFUND'])
    expect(result.actionLogs).toEqual([{ id: 1, action: 'ACCEPT' }])
  })

  it('throws when order detail does not exist', async () => {
    const { service, prisma } = createService()
    prisma.paymentOrder.findUnique.mockResolvedValueOnce(null)

    await expect(service.getAdminOrderDetail('missing')).rejects.toThrow(NotFoundException)
  })

  it('accepts a paid awaiting order and writes an action log in the transaction', async () => {
    const { service, prisma } = createService()

    const result = await service.acceptOrder('ELMDEMO202606020001', adminOperator)

    expect(prisma.$transaction).toHaveBeenCalled()
    expect(prisma.paymentOrder.update).toHaveBeenCalledWith({
      where: { orderNo: 'ELMDEMO202606020001' },
      data: expect.objectContaining({
        fulfillmentStatus: 'ACCEPTED',
        acceptedAt: expect.any(Date),
      }),
    })
    expect(prisma.orderActionLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        orderNo: 'ELMDEMO202606020001',
        operatorId: '1',
        operatorName: 'admin',
        operatorType: 'ADMIN',
        action: 'ACCEPT',
        fromFulfillmentStatus: 'AWAITING_ACCEPTANCE',
        toFulfillmentStatus: 'ACCEPTED',
        fromRefundStatus: 'NONE',
        toRefundStatus: 'NONE',
        requestId: 'req-admin-1',
      }),
    })
    expect(result.fulfillmentStatus).toBe('ACCEPTED')
  })

  it('rejects invalid fulfillment actions with conflict', async () => {
    const { service } = createService({ fulfillmentStatus: 'COMPLETED' })

    await expect(service.acceptOrder('ELMDEMO202606020001', adminOperator)).rejects.toThrow(ConflictException)
  })

  it('requests refund only for the order owner', async () => {
    const { service, prisma } = createService({ fulfillmentStatus: 'PREPARING' })

    const result = await service.requestRefund('ELMDEMO202606020001', {
      userId: '42',
      reason: '不想要了',
      operator: customerOperator,
    })

    expect(prisma.paymentOrder.update).toHaveBeenCalledWith({
      where: { orderNo: 'ELMDEMO202606020001' },
      data: expect.objectContaining({
        refundStatus: 'REQUESTED',
        refundBaseFulfillmentStatus: 'PREPARING',
        refundReason: '不想要了',
        refundRequestedAt: expect.any(Date),
      }),
    })
    expect(result.refundStatus).toBe('REQUESTED')
  })

  it('rejects refund request from another customer', async () => {
    const { service } = createService()

    await expect(service.requestRefund('ELMDEMO202606020001', {
      userId: '99',
      reason: '不想要了',
      operator: customerOperator,
    })).rejects.toThrow(ForbiddenException)
  })

  it('approves requested refund and cancels fulfillment', async () => {
    const { service } = createService({ fulfillmentStatus: 'PREPARING', refundStatus: 'REQUESTED' })

    const result = await service.approveRefund('ELMDEMO202606020001', adminOperator, '同意退�?)

    expect(result.refundStatus).toBe('APPROVED')
    expect(result.fulfillmentStatus).toBe('CANCELED')
  })

  it('rejects requested refund and keeps fulfillment status', async () => {
    const { service } = createService({
      fulfillmentStatus: 'PREPARING',
      refundStatus: 'REQUESTED',
      refundBaseFulfillmentStatus: 'PREPARING',
    })

    const result = await service.rejectRefund('ELMDEMO202606020001', adminOperator, '订单已开始制�?)

    expect(result.refundStatus).toBe('REJECTED')
    expect(result.fulfillmentStatus).toBe('PREPARING')
    expect(result.refundRejectReason).toBe('订单已开始制�?)
  })

  it('syncs paid payment status into awaiting acceptance once', async () => {
    const { service, prisma } = createService({ fulfillmentStatus: 'PENDING_PAYMENT', status: 'PAID' })

    const result = await service.syncPaymentStatus(createOrder({ fulfillmentStatus: 'PENDING_PAYMENT', status: 'PAID' }))

    expect(prisma.paymentOrder.update).toHaveBeenCalledWith({
      where: { orderNo: 'ELMDEMO202606020001' },
      data: { fulfillmentStatus: 'AWAITING_ACCEPTANCE' },
    })
    expect(result.fulfillmentStatus).toBe('AWAITING_ACCEPTANCE')
  })

  it('syncs closed unpaid payment status into canceled fulfillment', async () => {
    const { service, prisma } = createService({ fulfillmentStatus: 'PENDING_PAYMENT', status: 'CLOSED' })

    const result = await service.syncPaymentStatus(createOrder({ fulfillmentStatus: 'PENDING_PAYMENT', status: 'CLOSED' }))

    expect(prisma.paymentOrder.update).toHaveBeenCalledWith({
      where: { orderNo: 'ELMDEMO202606020001' },
      data: {
        fulfillmentStatus: 'CANCELED',
        canceledAt: expect.any(Date),
      },
    })
    expect(result.fulfillmentStatus).toBe('CANCELED')
  })
})
```

- [ ] **Step 2: Run the workflow service test and verify it fails**

Run:

```bash
pnpm --filter @elm-platform/server run test -- order-workflow.service.spec.ts
```

Expected: FAIL because `order-workflow.service.ts` does not exist.

- [ ] **Step 3: Implement the workflow service**

Create `apps/server/src/modules/order/order-workflow.service.ts`:

```ts
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import type {
  AdminOrderAction,
  FulfillmentStatus,
  OrderWorkflowOperator,
  RefundStatus,
} from './order.types'
import { PrismaService } from '../../prisma/prisma.service'
import {
  assertAdminActionAllowed,
  assertRefundRequestAllowed,
  assertRefundReviewAllowed,
  getAdminAvailableActions,
  getCustomerAvailableActions,
  getNextFulfillmentStatus,
  normalizeFulfillmentStatus,
  normalizeRefundStatus,
} from './order-transition.policy'

type PaymentOrderRecord = Record<string, any>

interface RequestRefundPayload {
  userId: string
  reason: string
  operator: OrderWorkflowOperator
}

function toPrice(value: unknown) {
  const decimalLike = value as { toNumber?: () => number }
  const amount = typeof decimalLike?.toNumber === 'function'
    ? decimalLike.toNumber()
    : Number.parseFloat(String(value))
  return Number.isFinite(amount) ? Number(amount.toFixed(2)) : 0
}

@Injectable()
export class OrderWorkflowService {
  constructor(private readonly prisma: PrismaService) {}

  getAdminAvailableActions(order: PaymentOrderRecord) {
    return getAdminAvailableActions(order)
  }

  getCustomerAvailableActions(order: PaymentOrderRecord) {
    return getCustomerAvailableActions(order)
  }

  async getAdminOrderDetail(orderNo: string) {
    const order = await this.findOrder(orderNo)
    const actionLogs = await (this.prisma as any).orderActionLog.findMany({
      where: { orderNo },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return {
      ...this.toOrderSummary(order),
      actionLogs,
    }
  }

  async acceptOrder(orderNo: string, operator: OrderWorkflowOperator) {
    return this.applyFulfillmentAction(orderNo, 'ACCEPT', 'acceptedAt', operator)
  }

  async startPreparing(orderNo: string, operator: OrderWorkflowOperator) {
    return this.applyFulfillmentAction(orderNo, 'START_PREPARING', 'preparingAt', operator)
  }

  async startDelivery(orderNo: string, operator: OrderWorkflowOperator) {
    return this.applyFulfillmentAction(orderNo, 'START_DELIVERY', 'deliveringAt', operator)
  }

  async completeOrder(orderNo: string, operator: OrderWorkflowOperator) {
    return this.applyFulfillmentAction(orderNo, 'COMPLETE', 'completedAt', operator)
  }

  async requestRefund(orderNo: string, payload: RequestRefundPayload) {
    const order = await this.findOrder(orderNo)
    if (String(order.userId) !== String(payload.userId)) {
      throw new ForbiddenException('无权操作该订�?)
    }

    assertRefundRequestAllowed(order)
    const fromFulfillmentStatus = normalizeFulfillmentStatus(order)
    const fromRefundStatus = normalizeRefundStatus(order)

    return (this.prisma as any).$transaction(async (tx: any) => {
      const updated = await tx.paymentOrder.update({
        where: { orderNo },
        data: {
          refundStatus: 'REQUESTED',
          refundBaseFulfillmentStatus: fromFulfillmentStatus,
          refundReason: payload.reason,
          refundRequestedAt: new Date(),
        },
      })

      await tx.orderActionLog.create({
        data: this.createLogData(order, updated, 'REQUEST_REFUND', payload.operator, {
          reason: payload.reason,
        }),
      })

      return this.toOrderSummary(updated)
    })
  }

  async approveRefund(orderNo: string, operator: OrderWorkflowOperator, remark?: string) {
    const order = await this.findOrder(orderNo)
    assertRefundReviewAllowed(order)

    return (this.prisma as any).$transaction(async (tx: any) => {
      const updated = await tx.paymentOrder.update({
        where: { orderNo },
        data: {
          fulfillmentStatus: 'CANCELED',
          refundStatus: 'APPROVED',
          refundedAt: new Date(),
          canceledAt: new Date(),
        },
      })

      await tx.orderActionLog.create({
        data: this.createLogData(order, updated, 'APPROVE_REFUND', operator, { remark }),
      })

      return this.toOrderSummary(updated)
    })
  }

  async rejectRefund(orderNo: string, operator: OrderWorkflowOperator, reason: string) {
    const order = await this.findOrder(orderNo)
    assertRefundReviewAllowed(order)
    const baseFulfillmentStatus = order.refundBaseFulfillmentStatus || normalizeFulfillmentStatus(order)

    return (this.prisma as any).$transaction(async (tx: any) => {
      const updated = await tx.paymentOrder.update({
        where: { orderNo },
        data: {
          fulfillmentStatus: baseFulfillmentStatus,
          refundStatus: 'REJECTED',
          refundRejectReason: reason,
          refundRejectedAt: new Date(),
        },
      })

      await tx.orderActionLog.create({
        data: this.createLogData(order, updated, 'REJECT_REFUND', operator, { reason }),
      })

      return this.toOrderSummary(updated)
    })
  }

  async syncPaymentStatus(order: PaymentOrderRecord) {
    const fulfillmentStatus = normalizeFulfillmentStatus(order)

    if (order.status === 'PAID' && fulfillmentStatus === 'PENDING_PAYMENT') {
      const updated = await (this.prisma as any).paymentOrder.update({
        where: { orderNo: order.orderNo },
        data: { fulfillmentStatus: 'AWAITING_ACCEPTANCE' },
      })
      return updated
    }

    if (order.status === 'CLOSED' && fulfillmentStatus === 'PENDING_PAYMENT') {
      const updated = await (this.prisma as any).paymentOrder.update({
        where: { orderNo: order.orderNo },
        data: { fulfillmentStatus: 'CANCELED', canceledAt: new Date() },
      })
      return updated
    }

    return order
  }

  toOrderSummary(order: PaymentOrderRecord) {
    const cartItems = Array.isArray(order.cartItems) ? order.cartItems : []
    const fulfillmentStatus = normalizeFulfillmentStatus(order)
    const refundStatus = normalizeRefundStatus(order)

    return {
      id: order.id,
      orderNo: order.orderNo,
      userId: order.userId,
      shopId: order.shopId,
      shopName: order.shopName,
      status: order.status,
      tradeStatus: order.tradeStatus,
      fulfillmentStatus,
      refundStatus,
      refundBaseFulfillmentStatus: order.refundBaseFulfillmentStatus || null,
      refundReason: order.refundReason || null,
      refundRejectReason: order.refundRejectReason || null,
      payableAmount: toPrice(order.payableAmount),
      goodsAmount: toPrice(order.goodsAmount),
      deliveryFee: toPrice(order.deliveryFee),
      cartItems,
      totalQty: cartItems.reduce((sum: number, item: Record<string, any>) => sum + Number(item.qty || 0), 0),
      paidAt: order.paidAt || null,
      acceptedAt: order.acceptedAt || null,
      preparingAt: order.preparingAt || null,
      deliveringAt: order.deliveringAt || null,
      completedAt: order.completedAt || null,
      canceledAt: order.canceledAt || null,
      refundRequestedAt: order.refundRequestedAt || null,
      refundedAt: order.refundedAt || null,
      refundRejectedAt: order.refundRejectedAt || null,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      tradeNo: order.tradeNo || null,
      availableActions: this.getAdminAvailableActions({ ...order, fulfillmentStatus, refundStatus }),
      customerAvailableActions: this.getCustomerAvailableActions({ ...order, fulfillmentStatus, refundStatus }),
    }
  }

  private async applyFulfillmentAction(
    orderNo: string,
    action: AdminOrderAction,
    timestampField: string,
    operator: OrderWorkflowOperator,
  ) {
    const order = await this.findOrder(orderNo)
    assertAdminActionAllowed(order, action)
    const nextFulfillmentStatus = getNextFulfillmentStatus(order, action)

    return (this.prisma as any).$transaction(async (tx: any) => {
      const updated = await tx.paymentOrder.update({
        where: { orderNo },
        data: {
          fulfillmentStatus: nextFulfillmentStatus,
          [timestampField]: new Date(),
        },
      })

      await tx.orderActionLog.create({
        data: this.createLogData(order, updated, action, operator),
      })

      return this.toOrderSummary(updated)
    })
  }

  private async findOrder(orderNo: string) {
    const order = await (this.prisma as any).paymentOrder.findUnique({ where: { orderNo } })
    if (!order)
      throw new NotFoundException('订单不存�?)
    return order as PaymentOrderRecord
  }

  private createLogData(
    before: PaymentOrderRecord,
    after: PaymentOrderRecord,
    action: string,
    operator: OrderWorkflowOperator,
    options: { reason?: string, remark?: string } = {},
  ) {
    return {
      orderNo: before.orderNo,
      operatorId: operator.operatorId,
      operatorName: operator.operatorName,
      operatorType: operator.operatorType,
      action,
      fromFulfillmentStatus: normalizeFulfillmentStatus(before) as FulfillmentStatus,
      toFulfillmentStatus: normalizeFulfillmentStatus(after) as FulfillmentStatus,
      fromRefundStatus: normalizeRefundStatus(before) as RefundStatus,
      toRefundStatus: normalizeRefundStatus(after) as RefundStatus,
      reason: options.reason,
      remark: options.remark,
      requestId: operator.requestId,
    }
  }
}
```

- [ ] **Step 4: Run the workflow service test and verify it passes**

Run:

```bash
pnpm --filter @elm-platform/server run test -- order-workflow.service.spec.ts
```

Expected: PASS.

- [ ] **Step 5: Commit workflow service**

```bash
git add apps/server/src/modules/order/order-workflow.service.ts apps/server/src/modules/order/order-workflow.service.spec.ts
git commit -m "feat(server): add order workflow service"
```

---

## Task 4: Wire order workflow into payment service

**Files:**
- Create: `apps/server/src/modules/order/order.module.ts`
- Modify: `apps/server/src/modules/payment/payment.module.ts`
- Modify: `apps/server/src/modules/payment/payment.service.ts`
- Modify: `apps/server/src/modules/payment/payment.service.spec.ts`

- [ ] **Step 1: Create order module**

Create `apps/server/src/modules/order/order.module.ts`:

```ts
import { Module } from '@nestjs/common'
import { OrderWorkflowService } from './order-workflow.service'

@Module({
  providers: [OrderWorkflowService],
  exports: [OrderWorkflowService],
})
export class OrderModule {}
```

- [ ] **Step 2: Import order module in payment module**

In `apps/server/src/modules/payment/payment.module.ts`, replace the file with:

```ts
import { Module } from '@nestjs/common'
import { OrderModule } from '../order/order.module'
import { AlipayService } from './alipay/alipay.service'
import { PaymentController } from './payment.controller'
import { PaymentService } from './payment.service'

@Module({
  imports: [OrderModule],
  controllers: [PaymentController],
  providers: [PaymentService, AlipayService],
  exports: [PaymentService],
})
export class PaymentModule {}
```

- [ ] **Step 3: Update payment service constructor and order creation data**

In `apps/server/src/modules/payment/payment.service.ts`, add this import:

```ts
import { OrderWorkflowService } from '../order/order-workflow.service'
```

Replace the constructor with:

```ts
  constructor(
    private readonly prisma: PrismaService,
    private readonly alipay: AlipayService,
    private readonly orderWorkflow: OrderWorkflowService,
  ) {}
```

Inside `createAlipayWapPayment()`, add these fields to the object passed as `paymentOrder.create({ data })`:

```ts
        fulfillmentStatus: 'PENDING_PAYMENT',
        refundStatus: 'NONE',
```

- [ ] **Step 4: Sync payment status through workflow service**

In `getAlipayPaymentStatus()`, replace:

```ts
      return this.toOrderSummary(updatedOrder)
```

with:

```ts
      const syncedOrder = await this.orderWorkflow.syncPaymentStatus(updatedOrder)
      return this.toOrderSummary(syncedOrder)
```

In `refreshOrderFromAlipay()`, replace the final statement that directly returns `paymentOrder.update` with:

```ts
    const updatedOrder = await (this.prisma as any).paymentOrder.update({
      where: { orderNo: order.orderNo },
      data: {
        tradeNo: trade?.trade_no || order.tradeNo,
        tradeStatus,
        status: this.mapTradeStatus(tradeStatus),
        queryPayload: trade || undefined,
        buyerPayAmount: trade?.buyer_pay_amount ? toPrice(trade.buyer_pay_amount) : undefined,
        paidAt: toDate(trade?.send_pay_date || trade?.gmt_payment) || order.paidAt || undefined,
      },
    })

    return this.orderWorkflow.syncPaymentStatus(updatedOrder)
```

In `handleAlipayNotify()`, replace the existing `paymentOrder.update` call that writes `tradeNo`, `tradeStatus`, `status`, `notifyPayload`, and `paidAt` with:

```ts
    const updatedOrder = await (this.prisma as any).paymentOrder.update({
      where: { orderNo },
      data: {
        tradeNo: String(payload.trade_no || order.tradeNo || ''),
        tradeStatus,
        status: this.mapTradeStatus(tradeStatus),
        notifyPayload: payload,
        paidAt: toDate(payload.gmt_payment),
      },
    })
    await this.orderWorkflow.syncPaymentStatus(updatedOrder)
```

- [ ] **Step 5: Return workflow fields in payment order summaries**

In `toOrderSummary(order)`, add these fields after `tradeStatus: order.tradeStatus,`:

```ts
      fulfillmentStatus: order.fulfillmentStatus || (order.status === 'PAID' ? 'AWAITING_ACCEPTANCE' : order.status === 'CLOSED' ? 'CANCELED' : 'PENDING_PAYMENT'),
      refundStatus: order.refundStatus || 'NONE',
      refundBaseFulfillmentStatus: order.refundBaseFulfillmentStatus || null,
      refundReason: order.refundReason || null,
      refundRejectReason: order.refundRejectReason || null,
```

Add these fields before `createdAt: order.createdAt,`:

```ts
      acceptedAt: order.acceptedAt || null,
      preparingAt: order.preparingAt || null,
      deliveringAt: order.deliveringAt || null,
      completedAt: order.completedAt || null,
      canceledAt: order.canceledAt || null,
      refundRequestedAt: order.refundRequestedAt || null,
      refundedAt: order.refundedAt || null,
      refundRejectedAt: order.refundRejectedAt || null,
```

Add these fields before the closing `}` of the returned object:

```ts
      availableActions: this.orderWorkflow.getAdminAvailableActions(order),
      customerAvailableActions: this.orderWorkflow.getCustomerAvailableActions(order),
```

- [ ] **Step 6: Update payment service tests for the workflow dependency**

In `apps/server/src/modules/payment/payment.service.spec.ts`, inside `createOrder()`, add these fields after `tradeStatus: 'WAIT_BUYER_PAY',`:

```ts
    fulfillmentStatus: 'PENDING_PAYMENT',
    refundStatus: 'NONE',
    refundBaseFulfillmentStatus: null,
    refundReason: null,
    refundRejectReason: null,
```

Inside `createService()`, add this object after `alipay`:

```ts
  const orderWorkflow = {
    syncPaymentStatus: jest.fn().mockImplementation(order => Promise.resolve(order)),
    getAdminAvailableActions: jest.fn().mockReturnValue([]),
    getCustomerAvailableActions: jest.fn().mockReturnValue([]),
  } as any
```

Replace `service: new PaymentService(prisma, alipay),` with:

```ts
    service: new PaymentService(prisma, alipay, orderWorkflow),
```

Add `orderWorkflow,` to the returned object.

Add this test after `refreshes status from Alipay when requested`:

```ts
  it('syncs fulfillment status after a paid payment status refresh', async () => {
    const { service, orderWorkflow } = createService()

    await service.getAlipayPaymentStatus('ELMALI202605231234560001', true)

    expect(orderWorkflow.syncPaymentStatus).toHaveBeenCalledWith(expect.objectContaining({
      status: 'PAID',
      tradeStatus: 'TRADE_SUCCESS',
    }))
  })
```

- [ ] **Step 7: Run payment service tests**

Run:

```bash
pnpm --filter @elm-platform/server run test -- payment.service.spec.ts
```

Expected: PASS.

- [ ] **Step 8: Commit payment workflow wiring**

```bash
git add apps/server/src/modules/order/order.module.ts apps/server/src/modules/payment/payment.module.ts apps/server/src/modules/payment/payment.service.ts apps/server/src/modules/payment/payment.service.spec.ts
git commit -m "feat(server): sync payment orders into fulfillment workflow"
```

---

## Task 5: Backend refund and admin action endpoints

**Files:**
- Create: `apps/server/src/modules/order/dto/request-refund.dto.ts`
- Create: `apps/server/src/modules/order/dto/reject-refund.dto.ts`
- Modify: `apps/server/src/modules/payment/payment.controller.ts`
- Modify: `apps/server/src/modules/payment/payment.controller.spec.ts`
- Modify: `apps/server/src/modules/elm/elm.module.ts`
- Modify: `apps/server/src/modules/elm/controllers/elm-admin.controller.ts`
- Modify: `apps/server/src/modules/elm/controllers/elm-admin.controller.spec.ts`
- Modify: `apps/server/src/modules/admin/constants/admin-permissions.ts`

- [ ] **Step 1: Create refund DTOs**

Create `apps/server/src/modules/order/dto/request-refund.dto.ts`:

```ts
import { IsString, MaxLength, MinLength } from 'class-validator'

export class RequestRefundDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  reason!: string
}
```

Create `apps/server/src/modules/order/dto/reject-refund.dto.ts`:

```ts
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator'

export class RejectRefundDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  reason!: string
}

export class ApproveRefundDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  remark?: string
}
```

- [ ] **Step 2: Update payment controller test for customer refund request**

In `apps/server/src/modules/payment/payment.controller.spec.ts`, rename the existing `service` mock to `paymentService`, then add a separate `orderWorkflow` mock:

```ts
  const paymentService = {
    createAlipayWapPayment: jest.fn().mockResolvedValue({
      orderNo: 'ELMALI202605241200000001',
      payUrl: 'https://openapi-sandbox.dl.alipaydev.com/gateway.do?method=alipay.trade.wap.pay',
      payableAmount: 29,
    }),
    resumeAlipayWapPayment: jest.fn().mockResolvedValue({
      orderNo: 'ELMALI202605241200000001',
      payUrl: 'https://openapi-sandbox.dl.alipaydev.com/gateway.do?method=alipay.trade.wap.pay',
      payableAmount: 29,
    }),
    getAlipayPaymentStatus: jest.fn().mockResolvedValue({
      orderNo: 'ELMALI202605241200000001',
      status: 'PENDING',
    }),
    listOrders: jest.fn().mockResolvedValue({
      orders: [],
    }),
  } as any

  const orderWorkflow = {
    requestRefund: jest.fn().mockResolvedValue({
      orderNo: 'ELMALI202605241200000001',
      refundStatus: 'REQUESTED',
    }),
  } as any
```

Return both mocks from `createController()`:

```ts
  return {
    controller: new PaymentController(paymentService, orderWorkflow),
    paymentService,
    orderWorkflow,
  }
```

Update existing expectations in this spec from `service` to `paymentService`. Then add this test before the final `})`:

```ts
  it('requests refund with only the authenticated customer id trusted by the workflow service', async () => {
    const { controller, orderWorkflow } = createController()

    const result = await controller.requestRefund('ELMALI202605241200000001', {
      reason: '不想要了',
    }, request)

    expect(orderWorkflow.requestRefund).toHaveBeenCalledWith('ELMALI202605241200000001', {
      userId: '42',
      reason: '不想要了',
      operator: {
        operatorId: '42',
        operatorName: 'customer#42',
        operatorType: 'CUSTOMER',
      },
    })
    expect(result).toEqual(rawResponse({
      orderNo: 'ELMALI202605241200000001',
      refundStatus: 'REQUESTED',
    }))
  })
```

- [ ] **Step 3: Add customer refund endpoint to payment controller**

In `apps/server/src/modules/payment/payment.controller.ts`, add these imports:

```ts
import { RequestRefundDto } from '../order/dto/request-refund.dto'
import { OrderWorkflowService } from '../order/order-workflow.service'
```

Replace the constructor with:

```ts
  constructor(
    private readonly paymentService: PaymentService,
    private readonly orderWorkflow: OrderWorkflowService,
  ) {}
```

Add this method before `@Post('payments/alipay/notify')`:

```ts
  @Post('orders/:orderNo/refund/request')
  @UseGuards(CustomerAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '用户申请订单退�? })
  async requestRefund(
    @Param('orderNo') orderNo: string,
    @Body() dto: RequestRefundDto,
    @Request() req: any,
  ) {
    const userId = String(req.user.id)
    const result = await this.orderWorkflow.requestRefund(orderNo, {
      userId,
      reason: dto.reason,
      operator: {
        operatorId: userId,
        operatorName: req.user.phone || `customer#${userId}`,
        operatorType: 'CUSTOMER',
      },
    })
    return rawResponse(result)
  }
```

- [ ] **Step 4: Import order module in Elm module**

In `apps/server/src/modules/elm/elm.module.ts`, add:

```ts
import { OrderModule } from '../order/order.module'
```

Replace `imports: [PaymentModule],` with:

```ts
  imports: [PaymentModule, OrderModule],
```

- [ ] **Step 5: Add admin order action endpoints**

In `apps/server/src/modules/elm/controllers/elm-admin.controller.ts`, add these imports:

```ts
import { Request } from '@nestjs/common'
import { RequirePermissions } from '../../auth/decorators/permissions.decorator'
import { ApproveRefundDto, RejectRefundDto } from '../../order/dto/reject-refund.dto'
import { OrderWorkflowService } from '../../order/order-workflow.service'
```

Add `private readonly orderWorkflow: OrderWorkflowService,` to the constructor after `paymentService`.

Replace the current `getOrders()` method decorators and body with:

```ts
  @Get('orders')
  @RequirePermissions('commerce:order:view')
  @ApiOperation({ summary: '管理端真实支付订单列�? })
  getOrders() {
    return this.paymentService.listAdminOrders()
  }
```

Add these methods after `getOrders()`:

```ts
  @Get('orders/:orderNo')
  @RequirePermissions('commerce:order:view')
  @ApiOperation({ summary: '管理端订单详�? })
  getOrderDetail(@Param('orderNo') orderNo: string) {
    return this.orderWorkflow.getAdminOrderDetail(orderNo)
  }

  @Post('orders/:orderNo/accept')
  @RequirePermissions('commerce:order:accept')
  @ApiOperation({ summary: '管理端订单接�? })
  acceptOrder(@Param('orderNo') orderNo: string, @Request() req: any) {
    return this.orderWorkflow.acceptOrder(orderNo, this.toAdminOperator(req))
  }

  @Post('orders/:orderNo/start-preparing')
  @RequirePermissions('commerce:order:prepare')
  @ApiOperation({ summary: '管理端订单开始制�? })
  startPreparing(@Param('orderNo') orderNo: string, @Request() req: any) {
    return this.orderWorkflow.startPreparing(orderNo, this.toAdminOperator(req))
  }

  @Post('orders/:orderNo/start-delivery')
  @RequirePermissions('commerce:order:deliver')
  @ApiOperation({ summary: '管理端订单开始配�? })
  startDelivery(@Param('orderNo') orderNo: string, @Request() req: any) {
    return this.orderWorkflow.startDelivery(orderNo, this.toAdminOperator(req))
  }

  @Post('orders/:orderNo/complete')
  @RequirePermissions('commerce:order:complete')
  @ApiOperation({ summary: '管理端订单完�? })
  completeOrder(@Param('orderNo') orderNo: string, @Request() req: any) {
    return this.orderWorkflow.completeOrder(orderNo, this.toAdminOperator(req))
  }

  @Post('orders/:orderNo/refund/approve')
  @RequirePermissions('commerce:order:refund:approve')
  @ApiOperation({ summary: '管理端同意退�? })
  approveRefund(
    @Param('orderNo') orderNo: string,
    @Body() dto: ApproveRefundDto,
    @Request() req: any,
  ) {
    return this.orderWorkflow.approveRefund(orderNo, this.toAdminOperator(req), dto.remark)
  }

  @Post('orders/:orderNo/refund/reject')
  @RequirePermissions('commerce:order:refund:reject')
  @ApiOperation({ summary: '管理端驳回退�? })
  rejectRefund(
    @Param('orderNo') orderNo: string,
    @Body() dto: RejectRefundDto,
    @Request() req: any,
  ) {
    return this.orderWorkflow.rejectRefund(orderNo, this.toAdminOperator(req), dto.reason)
  }

  private toAdminOperator(req: any) {
    const userId = String(req.user?.id || '')
    return {
      operatorId: userId,
      operatorName: req.user?.username || `admin#${userId}`,
      operatorType: 'ADMIN' as const,
    }
  }
```

- [ ] **Step 6: Add granular order permissions**

In `apps/server/src/modules/admin/constants/admin-permissions.ts`, after the existing `commerce:order:view` permission object, add:

```ts
  {
    code: 'commerce:order:accept',
    name: '订单接单',
    group: '业务管理',
  },
  {
    code: 'commerce:order:prepare',
    name: '订单制作',
    group: '业务管理',
  },
  {
    code: 'commerce:order:deliver',
    name: '订单配�?,
    group: '业务管理',
  },
  {
    code: 'commerce:order:complete',
    name: '订单完成',
    group: '业务管理',
  },
  {
    code: 'commerce:order:refund:approve',
    name: '同意退�?,
    group: '业务管理',
  },
  {
    code: 'commerce:order:refund:reject',
    name: '驳回退�?,
    group: '业务管理',
  },
```

Keep the existing `commerce:order:edit` permission for compatibility during this phase.

- [ ] **Step 7: Replace admin controller spec with workflow endpoint coverage**

Replace `apps/server/src/modules/elm/controllers/elm-admin.controller.spec.ts` with:

```ts
import 'reflect-metadata'
import { PaymentService } from '../../payment/payment.service'
import { OrderWorkflowService } from '../../order/order-workflow.service'
import { ElmAdminController } from './elm-admin.controller'

function createController() {
  const paymentOrders = [{
    orderNo: 'ELMALI202605241200000001',
    status: 'PENDING',
    tradeStatus: 'WAIT_BUYER_PAY',
  }]
  const paymentService = {
    listAdminOrders: jest.fn().mockResolvedValue(paymentOrders),
  }
  const orderWorkflow = {
    getAdminOrderDetail: jest.fn().mockResolvedValue({ orderNo: 'ELMALI202605241200000001' }),
    acceptOrder: jest.fn().mockResolvedValue({ fulfillmentStatus: 'ACCEPTED' }),
    startPreparing: jest.fn().mockResolvedValue({ fulfillmentStatus: 'PREPARING' }),
    startDelivery: jest.fn().mockResolvedValue({ fulfillmentStatus: 'DELIVERING' }),
    completeOrder: jest.fn().mockResolvedValue({ fulfillmentStatus: 'COMPLETED' }),
    approveRefund: jest.fn().mockResolvedValue({ refundStatus: 'APPROVED' }),
    rejectRefund: jest.fn().mockResolvedValue({ refundStatus: 'REJECTED' }),
  }
  const controller = new ElmAdminController({} as any, {} as any, paymentService as any, orderWorkflow as any)
  const request = {
    user: {
      id: 1,
      username: 'admin',
    },
  }

  return {
    controller,
    paymentService,
    orderWorkflow,
    paymentOrders,
    request,
  }
}

describe('ElmAdminController order management', () => {
  it('keeps PaymentService and OrderWorkflowService as runtime dependencies', () => {
    const paramTypes = Reflect.getMetadata('design:paramtypes', ElmAdminController)

    expect(paramTypes).toContain(PaymentService)
    expect(paramTypes).toContain(OrderWorkflowService)
  })

  it('reads admin orders from real payment orders', async () => {
    const { controller, paymentService, paymentOrders } = createController()

    await expect(controller.getOrders()).resolves.toBe(paymentOrders)
    expect(paymentService.listAdminOrders).toHaveBeenCalledTimes(1)
  })

  it('reads admin order detail from the workflow service', async () => {
    const { controller, orderWorkflow } = createController()

    await controller.getOrderDetail('ELMALI202605241200000001')

    expect(orderWorkflow.getAdminOrderDetail).toHaveBeenCalledWith('ELMALI202605241200000001')
  })

  it('runs admin order actions with the authenticated admin operator', async () => {
    const { controller, orderWorkflow, request } = createController()

    await controller.acceptOrder('ELMALI202605241200000001', request)
    await controller.startPreparing('ELMALI202605241200000001', request)
    await controller.startDelivery('ELMALI202605241200000001', request)
    await controller.completeOrder('ELMALI202605241200000001', request)

    expect(orderWorkflow.acceptOrder).toHaveBeenCalledWith('ELMALI202605241200000001', {
      operatorId: '1',
      operatorName: 'admin',
      operatorType: 'ADMIN',
    })
    expect(orderWorkflow.startPreparing).toHaveBeenCalledWith('ELMALI202605241200000001', expect.objectContaining({ operatorType: 'ADMIN' }))
    expect(orderWorkflow.startDelivery).toHaveBeenCalledWith('ELMALI202605241200000001', expect.objectContaining({ operatorType: 'ADMIN' }))
    expect(orderWorkflow.completeOrder).toHaveBeenCalledWith('ELMALI202605241200000001', expect.objectContaining({ operatorType: 'ADMIN' }))
  })

  it('runs refund review actions with dto payloads', async () => {
    const { controller, orderWorkflow, request } = createController()

    await controller.approveRefund('ELMALI202605241200000001', { remark: '同意退�? }, request)
    await controller.rejectRefund('ELMALI202605241200000001', { reason: '订单已开始制�? }, request)

    expect(orderWorkflow.approveRefund).toHaveBeenCalledWith('ELMALI202605241200000001', expect.objectContaining({ operatorType: 'ADMIN' }), '同意退�?)
    expect(orderWorkflow.rejectRefund).toHaveBeenCalledWith('ELMALI202605241200000001', expect.objectContaining({ operatorType: 'ADMIN' }), '订单已开始制�?)
  })
})
```

- [ ] **Step 8: Run controller tests**

Run:

```bash
pnpm --filter @elm-platform/server run test -- payment.controller.spec.ts elm-admin.controller.spec.ts
```

Expected: PASS.

- [ ] **Step 9: Commit backend endpoints**

```bash
git add apps/server/src/modules/order/dto/request-refund.dto.ts apps/server/src/modules/order/dto/reject-refund.dto.ts apps/server/src/modules/payment/payment.controller.ts apps/server/src/modules/payment/payment.controller.spec.ts apps/server/src/modules/elm/elm.module.ts apps/server/src/modules/elm/controllers/elm-admin.controller.ts apps/server/src/modules/elm/controllers/elm-admin.controller.spec.ts apps/server/src/modules/admin/constants/admin-permissions.ts
git commit -m "feat(server): expose order workflow actions"
```

---

## Task 6: Backend health check and CI

**Files:**
- Create: `apps/server/src/health/health.service.ts`
- Create: `apps/server/src/health/health.controller.ts`
- Create: `apps/server/src/health/health.module.ts`
- Test: `apps/server/src/health/health.service.spec.ts`
- Modify: `apps/server/src/app.module.ts`
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Write health service test**

Create `apps/server/src/health/health.service.spec.ts`:

```ts
import { HealthService } from './health.service'

function createService() {
  const prisma = {
    $queryRawUnsafe: jest.fn().mockResolvedValue([{ ok: 1 }]),
  } as any
  const redis = {
    getClient: jest.fn().mockReturnValue({
      ping: jest.fn().mockResolvedValue('PONG'),
    }),
  } as any

  return {
    service: new HealthService(prisma, redis),
    prisma,
    redis,
  }
}

describe('healthService', () => {
  it('returns ok when database and redis are available', async () => {
    const { service } = createService()

    const result = await service.check()

    expect(result.status).toBe('ok')
    expect(result.dependencies.database.status).toBe('ok')
    expect(result.dependencies.redis.status).toBe('ok')
    expect(result.timestamp).toEqual(expect.any(String))
  })

  it('returns degraded when redis is unavailable', async () => {
    const { service, redis } = createService()
    redis.getClient.mockReturnValue({
      ping: jest.fn().mockRejectedValue(new Error('redis down')),
    })

    const result = await service.check()

    expect(result.status).toBe('degraded')
    expect(result.dependencies.redis.status).toBe('error')
  })
})
```

- [ ] **Step 2: Run health test and verify it fails**

Run:

```bash
pnpm --filter @elm-platform/server run test -- health.service.spec.ts
```

Expected: FAIL because health service does not exist.

- [ ] **Step 3: Create health service, controller, and module**

Create `apps/server/src/health/health.service.ts`:

```ts
import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { RedisService } from '../redis/redis.service'

type DependencyStatus = 'ok' | 'error'

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async check() {
    const database = await this.checkDatabase()
    const redis = await this.checkRedis()
    const degraded = database.status === 'error' || redis.status === 'error'

    return {
      status: degraded ? 'degraded' : 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
      dependencies: {
        database,
        redis,
      },
    }
  }

  private async checkDatabase(): Promise<{ status: DependencyStatus, detail: string }> {
    try {
      await this.prisma.$queryRawUnsafe('SELECT 1')
      return { status: 'ok', detail: 'SELECT 1 ok' }
    }
    catch (error) {
      return { status: 'error', detail: error instanceof Error ? error.message : String(error) }
    }
  }

  private async checkRedis(): Promise<{ status: DependencyStatus, detail: string }> {
    try {
      const pong = await this.redis.getClient().ping()
      return { status: 'ok', detail: `PING ${pong}` }
    }
    catch (error) {
      return { status: 'error', detail: error instanceof Error ? error.message : String(error) }
    }
  }
}
```

Create `apps/server/src/health/health.controller.ts`:

```ts
import { Controller, Get } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { HealthService } from './health.service'

@ApiTags('健康检�?)
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: '服务健康检�? })
  check() {
    return this.healthService.check()
  }
}
```

Create `apps/server/src/health/health.module.ts`:

```ts
import { Module } from '@nestjs/common'
import { HealthController } from './health.controller'
import { HealthService } from './health.service'

@Module({
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
```

- [ ] **Step 4: Import health module in app module**

In `apps/server/src/app.module.ts`, add:

```ts
import { HealthModule } from './health/health.module'
```

Add `HealthModule,` to the `imports` array after `RedisModule,`.

- [ ] **Step 5: Create minimal CI workflow**

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches:
      - main
      - "codex/**"
  pull_request:
    branches:
      - main

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10.25.0

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Test server
        run: pnpm --filter @elm-platform/server run test

      - name: Build server
        run: pnpm --filter @elm-platform/server run build

      - name: Type check admin web
        run: pnpm --filter @elm-platform/web-admin run type-check

      - name: Type check user web
        run: pnpm --filter @elm-platform/web-user run type-check
```

- [ ] **Step 6: Run health test and server build**

Run:

```bash
pnpm --filter @elm-platform/server run test -- health.service.spec.ts
pnpm --filter @elm-platform/server run build
```

Expected: PASS for the test and build.

- [ ] **Step 7: Commit health and CI**

```bash
git add apps/server/src/health/health.service.ts apps/server/src/health/health.controller.ts apps/server/src/health/health.module.ts apps/server/src/health/health.service.spec.ts apps/server/src/app.module.ts .github/workflows/ci.yml
git commit -m "feat: add health check and ci gate"
```

---

## Task 7: Admin order workflow types, API, and action config

**Files:**
- Modify: `apps/web-admin/src/entities/order/model/types.ts`
- Modify: `apps/web-admin/src/entities/order/api/index.ts`
- Modify: `apps/web-admin/src/shared/api/endpoints.ts`
- Modify: `apps/web-admin/src/shared/config/access.ts`
- Create: `apps/web-admin/src/features/order-management/config/workflow.ts`
- Test: `apps/web-admin/src/features/order-management/config/workflow.test.ts`

- [ ] **Step 1: Extend admin order types**

Replace `apps/web-admin/src/entities/order/model/types.ts` with:

```ts
export type PaymentOrderStatus = 'PENDING' | 'PAID' | 'CLOSED'

export type FulfillmentStatus =
  | 'PENDING_PAYMENT'
  | 'AWAITING_ACCEPTANCE'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'DELIVERING'
  | 'COMPLETED'
  | 'CANCELED'

export type RefundStatus = 'NONE' | 'REQUESTED' | 'APPROVED' | 'REJECTED'

export type AdminOrderAction =
  | 'ACCEPT'
  | 'START_PREPARING'
  | 'START_DELIVERY'
  | 'COMPLETE'
  | 'APPROVE_REFUND'
  | 'REJECT_REFUND'

export type CustomerOrderAction = 'REQUEST_REFUND'

export interface OrderActionLogItem {
  id: number
  orderNo: string
  operatorId: string
  operatorName: string
  operatorType: 'ADMIN' | 'CUSTOMER' | 'SYSTEM'
  action: string
  fromFulfillmentStatus: FulfillmentStatus | null
  toFulfillmentStatus: FulfillmentStatus | null
  fromRefundStatus: RefundStatus | null
  toRefundStatus: RefundStatus | null
  reason: string | null
  remark: string | null
  requestId: string | null
  createdAt: string
}

export interface OrderItem {
  id: number
  orderNo: string
  userId: string
  shopId: string | null
  shopName: string
  status: PaymentOrderStatus | string
  tradeStatus: string
  fulfillmentStatus: FulfillmentStatus
  refundStatus: RefundStatus
  refundBaseFulfillmentStatus: FulfillmentStatus | null
  refundReason: string | null
  refundRejectReason: string | null
  tradeNo: string | null
  payableAmount: number
  goodsAmount: number
  deliveryFee: number
  cartItems: unknown[]
  totalQty: number
  paidAt: string | null
  acceptedAt: string | null
  preparingAt: string | null
  deliveringAt: string | null
  completedAt: string | null
  canceledAt: string | null
  refundRequestedAt: string | null
  refundedAt: string | null
  refundRejectedAt: string | null
  createdAt: string
  updatedAt: string
  availableActions: AdminOrderAction[]
  customerAvailableActions: CustomerOrderAction[]
  actionLogs?: OrderActionLogItem[]
}
```

- [ ] **Step 2: Add admin endpoints**

In `apps/web-admin/src/shared/api/endpoints.ts`, replace `orders: '/admin/commerce/orders',` with:

```ts
    orders: '/admin/commerce/orders',
    orderDetail: (orderNo: string) => `/admin/commerce/orders/${orderNo}`,
    orderAccept: (orderNo: string) => `/admin/commerce/orders/${orderNo}/accept`,
    orderStartPreparing: (orderNo: string) => `/admin/commerce/orders/${orderNo}/start-preparing`,
    orderStartDelivery: (orderNo: string) => `/admin/commerce/orders/${orderNo}/start-delivery`,
    orderComplete: (orderNo: string) => `/admin/commerce/orders/${orderNo}/complete`,
    orderRefundApprove: (orderNo: string) => `/admin/commerce/orders/${orderNo}/refund/approve`,
    orderRefundReject: (orderNo: string) => `/admin/commerce/orders/${orderNo}/refund/reject`,
```

- [ ] **Step 3: Add frontend permission constants**

In `apps/web-admin/src/shared/config/access.ts`, after `COMMERCE_ORDER_VIEW: 'commerce:order:view',`, add:

```ts
  COMMERCE_ORDER_ACCEPT: 'commerce:order:accept',
  COMMERCE_ORDER_PREPARE: 'commerce:order:prepare',
  COMMERCE_ORDER_DELIVER: 'commerce:order:deliver',
  COMMERCE_ORDER_COMPLETE: 'commerce:order:complete',
  COMMERCE_ORDER_REFUND_APPROVE: 'commerce:order:refund:approve',
  COMMERCE_ORDER_REFUND_REJECT: 'commerce:order:refund:reject',
```

Keep `COMMERCE_ORDER_EDIT` for compatibility during this phase.

- [ ] **Step 4: Add order workflow API functions**

Replace `apps/web-admin/src/entities/order/api/index.ts` with:

```ts
import type { AdminOrderAction, OrderItem } from '../model'
import { adminEndpoints } from '@/shared/api/endpoints'
import request from '@/shared/api/request'

export function getCommerceOrders() {
  return request.get<OrderItem[]>(adminEndpoints.commerce.orders)
}

export function getCommerceOrderDetail(orderNo: string) {
  return request.get<OrderItem>(adminEndpoints.commerce.orderDetail(orderNo))
}

export function runCommerceOrderAction(orderNo: string, action: AdminOrderAction, payload: Record<string, unknown> = {}) {
  const endpointMap: Record<AdminOrderAction, string> = {
    ACCEPT: adminEndpoints.commerce.orderAccept(orderNo),
    START_PREPARING: adminEndpoints.commerce.orderStartPreparing(orderNo),
    START_DELIVERY: adminEndpoints.commerce.orderStartDelivery(orderNo),
    COMPLETE: adminEndpoints.commerce.orderComplete(orderNo),
    APPROVE_REFUND: adminEndpoints.commerce.orderRefundApprove(orderNo),
    REJECT_REFUND: adminEndpoints.commerce.orderRefundReject(orderNo),
  }

  return request.post<OrderItem>(endpointMap[action], payload)
}
```

- [ ] **Step 5: Write admin workflow config test**

Create `apps/web-admin/src/features/order-management/config/workflow.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import type { OrderItem } from '@/entities/order'
import { getVisibleOrderActions } from './workflow'

function createOrder(overrides: Partial<OrderItem> = {}): OrderItem {
  return {
    id: 1,
    orderNo: 'ELMDEMO202606020001',
    userId: '42',
    shopId: '1',
    shopName: '示例商家',
    status: 'PAID',
    tradeStatus: 'TRADE_SUCCESS',
    fulfillmentStatus: 'AWAITING_ACCEPTANCE',
    refundStatus: 'NONE',
    refundBaseFulfillmentStatus: null,
    refundReason: null,
    refundRejectReason: null,
    tradeNo: null,
    payableAmount: 29,
    goodsAmount: 24,
    deliveryFee: 5,
    cartItems: [],
    totalQty: 2,
    paidAt: null,
    acceptedAt: null,
    preparingAt: null,
    deliveringAt: null,
    completedAt: null,
    canceledAt: null,
    refundRequestedAt: null,
    refundedAt: null,
    refundRejectedAt: null,
    createdAt: '2026-06-02T10:00:00.000Z',
    updatedAt: '2026-06-02T10:00:00.000Z',
    availableActions: ['ACCEPT'],
    customerAvailableActions: [],
    ...overrides,
  }
}

describe('order workflow config', () => {
  it('shows only backend-provided actions that the current user can perform', () => {
    const order = createOrder({ availableActions: ['ACCEPT', 'APPROVE_REFUND'] })
    const visible = getVisibleOrderActions(order, permission => permission === 'commerce:order:accept')

    expect(visible.map(item => item.action)).toEqual(['ACCEPT'])
  })

  it('does not show actions when backend returns none', () => {
    const order = createOrder({ availableActions: [] })

    expect(getVisibleOrderActions(order, () => true)).toEqual([])
  })
})
```

- [ ] **Step 6: Create workflow config**

Create `apps/web-admin/src/features/order-management/config/workflow.ts`:

```ts
import type { AdminOrderAction, FulfillmentStatus, OrderItem, PaymentOrderStatus, RefundStatus } from '@/entities/order'
import { Permissions } from '@/shared/config/access'

export const paymentStatusLabelMap: Record<string, string> = {
  PENDING: 'commerce.order.paymentPending',
  PAID: 'commerce.order.paymentPaid',
  CLOSED: 'commerce.order.paymentClosed',
}

export const fulfillmentStatusLabelMap: Record<FulfillmentStatus, string> = {
  PENDING_PAYMENT: 'commerce.order.fulfillmentPendingPayment',
  AWAITING_ACCEPTANCE: 'commerce.order.fulfillmentAwaitingAcceptance',
  ACCEPTED: 'commerce.order.fulfillmentAccepted',
  PREPARING: 'commerce.order.fulfillmentPreparing',
  DELIVERING: 'commerce.order.fulfillmentDelivering',
  COMPLETED: 'commerce.order.fulfillmentCompleted',
  CANCELED: 'commerce.order.fulfillmentCanceled',
}

export const refundStatusLabelMap: Record<RefundStatus, string> = {
  NONE: 'commerce.order.refundNone',
  REQUESTED: 'commerce.order.refundRequested',
  APPROVED: 'commerce.order.refundApproved',
  REJECTED: 'commerce.order.refundRejected',
}

export const orderActionConfig: Record<AdminOrderAction, {
  labelKey: string
  permission: string
  confirmKey: string
  danger?: boolean
}> = {
  ACCEPT: {
    labelKey: 'commerce.order.actionAccept',
    permission: Permissions.COMMERCE_ORDER_ACCEPT,
    confirmKey: 'commerce.order.confirmAccept',
  },
  START_PREPARING: {
    labelKey: 'commerce.order.actionPrepare',
    permission: Permissions.COMMERCE_ORDER_PREPARE,
    confirmKey: 'commerce.order.confirmPrepare',
  },
  START_DELIVERY: {
    labelKey: 'commerce.order.actionDeliver',
    permission: Permissions.COMMERCE_ORDER_DELIVER,
    confirmKey: 'commerce.order.confirmDeliver',
  },
  COMPLETE: {
    labelKey: 'commerce.order.actionComplete',
    permission: Permissions.COMMERCE_ORDER_COMPLETE,
    confirmKey: 'commerce.order.confirmComplete',
  },
  APPROVE_REFUND: {
    labelKey: 'commerce.order.actionApproveRefund',
    permission: Permissions.COMMERCE_ORDER_REFUND_APPROVE,
    confirmKey: 'commerce.order.confirmApproveRefund',
    danger: true,
  },
  REJECT_REFUND: {
    labelKey: 'commerce.order.actionRejectRefund',
    permission: Permissions.COMMERCE_ORDER_REFUND_REJECT,
    confirmKey: 'commerce.order.confirmRejectRefund',
    danger: true,
  },
}

export function getPaymentStatusType(status: PaymentOrderStatus | string) {
  if (status === 'PAID')
    return 'success'
  if (status === 'PENDING')
    return 'warning'
  return 'info'
}

export function getFulfillmentStatusType(status: FulfillmentStatus) {
  if (status === 'COMPLETED')
    return 'success'
  if (status === 'CANCELED')
    return 'info'
  if (status === 'PREPARING' || status === 'DELIVERING')
    return 'primary'
  return 'warning'
}

export function getRefundStatusType(status: RefundStatus) {
  if (status === 'APPROVED')
    return 'success'
  if (status === 'REQUESTED')
    return 'danger'
  if (status === 'REJECTED')
    return 'warning'
  return 'info'
}

export function getVisibleOrderActions(order: OrderItem, hasPermission: (permission: string) => boolean) {
  return (order.availableActions || [])
    .map(action => ({
      action,
      ...orderActionConfig[action],
    }))
    .filter(item => Boolean(item.permission) && hasPermission(item.permission))
}
```

- [ ] **Step 7: Run admin workflow config test**

Run:

```bash
pnpm --filter @elm-platform/web-admin exec vitest run src/features/order-management/config/workflow.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit admin API and config**

```bash
git add apps/web-admin/src/entities/order/model/types.ts apps/web-admin/src/entities/order/api/index.ts apps/web-admin/src/shared/api/endpoints.ts apps/web-admin/src/shared/config/access.ts apps/web-admin/src/features/order-management/config/workflow.ts apps/web-admin/src/features/order-management/config/workflow.test.ts
git commit -m "feat(admin): add order workflow client contract"
```

---

## Task 8: Admin order management UI

**Files:**
- Modify: `apps/web-admin/src/features/order-management/config/fields.ts`
- Modify: `apps/web-admin/src/features/order-management/model/useOrderManagement.ts`
- Create: `apps/web-admin/src/features/order-management/ui/OrderActionColumn.vue`
- Create: `apps/web-admin/src/features/order-management/ui/OrderDetailDrawer.vue`
- Create: `apps/web-admin/src/features/order-management/ui/RefundRejectDialog.vue`
- Modify: `apps/web-admin/src/features/order-management/ui/OrderTable.vue`
- Modify: `apps/web-admin/src/features/order-management/index.ts`
- Modify: `apps/web-admin/src/pages/commerce/order/index.vue`
- Modify: `apps/web-admin/src/shared/i18n/lang/zh-CN.ts`
- Modify: `apps/web-admin/src/shared/i18n/lang/en.ts`

- [ ] **Step 1: Update order table fields**

In `apps/web-admin/src/features/order-management/config/fields.ts`, replace imports with:

```ts
import type { FulfillmentStatus, OrderItem, RefundStatus } from '@/entities/order'
import type { ConfigFormField, ConfigTableColumn, Translate } from '@/shared/config-crud'
import { formatDateTime } from '@/shared/lib/admin-display'
import {
  fulfillmentStatusLabelMap,
  getFulfillmentStatusType,
  getPaymentStatusType,
  getRefundStatusType,
  paymentStatusLabelMap,
  refundStatusLabelMap,
} from './workflow'
```

Replace `createOrderStatusOptions()` with:

```ts
function createOptions<T extends string>(values: T[], labelMap: Record<T, string>, t: Translate) {
  return values.map(value => ({
    label: t(labelMap[value]),
    value,
  }))
}
```

Replace `createOrderSearchFields()` with:

```ts
export function createOrderSearchFields(t: Translate) {
  return [
    {
      prop: 'orderNo',
      label: t('commerce.order.orderNo'),
      type: 'input',
      placeholder: t('commerce.order.orderNoPlaceholder'),
    },
    {
      prop: 'status',
      label: t('commerce.order.paymentStatus'),
      type: 'select',
      placeholder: t('commerce.order.statusPlaceholder'),
      options: createOptions(['PENDING', 'PAID', 'CLOSED'], paymentStatusLabelMap, t),
    },
    {
      prop: 'fulfillmentStatus',
      label: t('commerce.order.fulfillmentStatus'),
      type: 'select',
      placeholder: t('commerce.order.fulfillmentStatusPlaceholder'),
      options: createOptions([
        'PENDING_PAYMENT',
        'AWAITING_ACCEPTANCE',
        'ACCEPTED',
        'PREPARING',
        'DELIVERING',
        'COMPLETED',
        'CANCELED',
      ] as FulfillmentStatus[], fulfillmentStatusLabelMap, t),
    },
    {
      prop: 'refundStatus',
      label: t('commerce.order.refundStatus'),
      type: 'select',
      placeholder: t('commerce.order.refundStatusPlaceholder'),
      options: createOptions(['NONE', 'REQUESTED', 'APPROVED', 'REJECTED'] as RefundStatus[], refundStatusLabelMap, t),
    },
  ] satisfies ConfigFormField[]
}
```

Inside `createOrderTableColumns()`, replace the status column block with these three columns:

```ts
    {
      label: t('commerce.order.paymentStatus'),
      width: 110,
      tag: row => ({
        label: t(paymentStatusLabelMap[row.status] || row.status),
        type: getPaymentStatusType(row.status),
      }),
    },
    {
      label: t('commerce.order.fulfillmentStatus'),
      width: 130,
      tag: row => ({
        label: t(fulfillmentStatusLabelMap[row.fulfillmentStatus]),
        type: getFulfillmentStatusType(row.fulfillmentStatus),
      }),
    },
    {
      label: t('commerce.order.refundStatus'),
      width: 120,
      tag: row => ({
        label: t(refundStatusLabelMap[row.refundStatus]),
        type: getRefundStatusType(row.refundStatus),
      }),
    },
```

- [ ] **Step 2: Update order management model**

Replace `apps/web-admin/src/features/order-management/model/useOrderManagement.ts` with:

```ts
import type { AdminOrderAction, OrderItem } from '@/entities/order'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getCommerceOrderDetail,
  getCommerceOrders,
  runCommerceOrderAction,
} from '@/entities/order'
import { useReadonlyTable } from '@/shared/lib/useReadonlyTable'
import { orderActionConfig } from '../config/workflow'

export interface OrderQuery extends Record<string, unknown> {
  orderNo: string
  status: '' | OrderItem['status']
  fulfillmentStatus: '' | OrderItem['fulfillmentStatus']
  refundStatus: '' | OrderItem['refundStatus']
}

export function useOrderManagement() {
  const { t } = useI18n()
  const detailVisible = ref(false)
  const rejectVisible = ref(false)
  const detailLoading = ref(false)
  const actionSaving = ref(false)
  const selectedOrder = shallowRef<OrderItem | null>(null)
  const rejectOrder = shallowRef<OrderItem | null>(null)

  const table = useReadonlyTable<OrderItem, OrderQuery>({
    queryDefaults: {
      orderNo: '',
      status: '',
      fulfillmentStatus: '',
      refundStatus: '',
    },
    fetchApi: () => getCommerceOrders(),
    filter: (data, query) => data.filter((item) => {
      const orderNoMatched = !query.orderNo || item.orderNo.includes(query.orderNo)
      const statusMatched = !query.status || item.status === query.status
      const fulfillmentMatched = !query.fulfillmentStatus || item.fulfillmentStatus === query.fulfillmentStatus
      const refundMatched = !query.refundStatus || item.refundStatus === query.refundStatus
      return orderNoMatched && statusMatched && fulfillmentMatched && refundMatched
    }),
  })

  async function openDetail(row: OrderItem) {
    detailVisible.value = true
    detailLoading.value = true
    try {
      selectedOrder.value = await getCommerceOrderDetail(row.orderNo)
    }
    finally {
      detailLoading.value = false
    }
  }

  async function executeAction(action: AdminOrderAction, row: OrderItem) {
    if (action === 'REJECT_REFUND') {
      rejectOrder.value = row
      rejectVisible.value = true
      return
    }

    const config = orderActionConfig[action]
    await ElMessageBox.confirm(t(config.confirmKey), t('common.tip'), {
      type: config.danger ? 'warning' : 'info',
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
    })

    actionSaving.value = true
    try {
      await runCommerceOrderAction(row.orderNo, action)
      ElMessage.success(t('commerce.order.actionSuccess'))
      await table.fetchRows()
      if (selectedOrder.value?.orderNo === row.orderNo) {
        selectedOrder.value = await getCommerceOrderDetail(row.orderNo)
      }
    }
    catch (error) {
      ElMessage.error(error instanceof Error ? error.message : t('commerce.order.conflictMessage'))
    }
    finally {
      actionSaving.value = false
    }
  }

  async function submitReject(reason: string) {
    if (!rejectOrder.value)
      return

    actionSaving.value = true
    try {
      await runCommerceOrderAction(rejectOrder.value.orderNo, 'REJECT_REFUND', { reason })
      ElMessage.success(t('commerce.order.actionSuccess'))
      rejectVisible.value = false
      rejectOrder.value = null
      await table.fetchRows()
    }
    catch (error) {
      ElMessage.error(error instanceof Error ? error.message : t('commerce.order.conflictMessage'))
    }
    finally {
      actionSaving.value = false
    }
  }

  return {
    loading: table.loading,
    query: table.query,
    filteredData: table.filteredData,
    resetQuery: table.resetQuery,
    fetchRows: table.fetchRows,
    detailVisible,
    rejectVisible,
    detailLoading,
    actionSaving,
    selectedOrder,
    rejectOrder,
    openDetail,
    executeAction,
    submitReject,
  }
}
```

- [ ] **Step 3: Create order action column**

Create `apps/web-admin/src/features/order-management/ui/OrderActionColumn.vue`:

```vue
<script setup lang="ts">
import type { AdminOrderAction, OrderItem } from '@/entities/order'
import { useAuthStore } from '@/entities/session'
import { getVisibleOrderActions } from '../config/workflow'

const props = defineProps<{
  row: OrderItem
}>()

const emit = defineEmits<{
  detail: [row: OrderItem]
  action: [action: AdminOrderAction, row: OrderItem]
}>()

const { t } = useI18n()
const authStore = useAuthStore()
const visibleActions = computed(() => getVisibleOrderActions(props.row, authStore.hasPermission))
</script>

<template>
  <div class="order-actions">
    <el-button link type="primary" @click="emit('detail', row)">
      {{ t('commerce.order.detail') }}
    </el-button>
    <el-button
      v-for="item in visibleActions"
      :key="item.action"
      link
      :type="item.danger ? 'danger' : 'primary'"
      @click="emit('action', item.action, row)"
    >
      {{ t(item.labelKey) }}
    </el-button>
  </div>
</template>

<style scoped>
.order-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 8px;
}
</style>
```

- [ ] **Step 4: Create order detail drawer**

Create `apps/web-admin/src/features/order-management/ui/OrderDetailDrawer.vue`:

```vue
<script setup lang="ts">
import type { OrderItem } from '@/entities/order'
import { formatDateTime } from '@/shared/lib/admin-display'
import {
  fulfillmentStatusLabelMap,
  paymentStatusLabelMap,
  refundStatusLabelMap,
} from '../config/workflow'

defineProps<{
  visible: boolean
  loading: boolean
  order: OrderItem | null
}>()

const emit = defineEmits<{
  'update:visible': [visible: boolean]
}>()

const { t } = useI18n()

function displayTime(value: string | null) {
  return value ? formatDateTime(value) : '-'
}
</script>

<template>
  <el-drawer
    :model-value="visible"
    :title="t('commerce.order.detail')"
    size="520px"
    @update:model-value="emit('update:visible', $event)"
  >
    <el-skeleton v-if="loading" :rows="8" animated />

    <template v-else-if="order">
      <el-descriptions :column="1" border>
        <el-descriptions-item :label="t('commerce.order.orderNo')">
          {{ order.orderNo }}
        </el-descriptions-item>
        <el-descriptions-item :label="t('commerce.order.restaurant')">
          {{ order.shopName }}
        </el-descriptions-item>
        <el-descriptions-item :label="t('commerce.order.amount')">
          ¥{{ Number(order.payableAmount || 0).toFixed(2) }}
        </el-descriptions-item>
        <el-descriptions-item :label="t('commerce.order.paymentStatus')">
          {{ t(paymentStatusLabelMap[order.status] || order.status) }}
        </el-descriptions-item>
        <el-descriptions-item :label="t('commerce.order.fulfillmentStatus')">
          {{ t(fulfillmentStatusLabelMap[order.fulfillmentStatus]) }}
        </el-descriptions-item>
        <el-descriptions-item :label="t('commerce.order.refundStatus')">
          {{ t(refundStatusLabelMap[order.refundStatus]) }}
        </el-descriptions-item>
        <el-descriptions-item :label="t('commerce.order.refundReason')">
          {{ order.refundReason || '-' }}
        </el-descriptions-item>
        <el-descriptions-item :label="t('commerce.order.refundRejectReason')">
          {{ order.refundRejectReason || '-' }}
        </el-descriptions-item>
      </el-descriptions>

      <el-timeline class="order-timeline">
        <el-timeline-item :timestamp="displayTime(order.paidAt)">
          {{ t('commerce.order.paymentPaid') }}
        </el-timeline-item>
        <el-timeline-item :timestamp="displayTime(order.acceptedAt)">
          {{ t('commerce.order.fulfillmentAccepted') }}
        </el-timeline-item>
        <el-timeline-item :timestamp="displayTime(order.preparingAt)">
          {{ t('commerce.order.fulfillmentPreparing') }}
        </el-timeline-item>
        <el-timeline-item :timestamp="displayTime(order.deliveringAt)">
          {{ t('commerce.order.fulfillmentDelivering') }}
        </el-timeline-item>
        <el-timeline-item :timestamp="displayTime(order.completedAt)">
          {{ t('commerce.order.fulfillmentCompleted') }}
        </el-timeline-item>
        <el-timeline-item :timestamp="displayTime(order.refundRequestedAt)">
          {{ t('commerce.order.refundRequested') }}
        </el-timeline-item>
      </el-timeline>

      <el-table :data="order.actionLogs || []" size="small" class="order-log-table">
        <el-table-column prop="action" :label="t('commerce.order.logAction')" width="150" />
        <el-table-column prop="operatorName" :label="t('commerce.order.logOperator')" width="120" />
        <el-table-column :label="t('commerce.order.logRemark')">
          <template #default="{ row }">
            {{ row.reason || row.remark || '-' }}
          </template>
        </el-table-column>
        <el-table-column :label="t('commerce.order.logTime')" width="180">
          <template #default="{ row }">
            {{ displayTime(row.createdAt) }}
          </template>
        </el-table-column>
      </el-table>
    </template>
  </el-drawer>
</template>

<style scoped>
.order-timeline,
.order-log-table {
  margin-top: 18px;
}
</style>
```

- [ ] **Step 5: Create refund reject dialog**

Create `apps/web-admin/src/features/order-management/ui/RefundRejectDialog.vue`:

```vue
<script setup lang="ts">
const props = defineProps<{
  visible: boolean
  saving: boolean
}>()

const emit = defineEmits<{
  'update:visible': [visible: boolean]
  submit: [reason: string]
}>()

const { t } = useI18n()
const reason = ref('')
const canSubmit = computed(() => reason.value.trim().length >= 2 && !props.saving)

function close() {
  emit('update:visible', false)
}

function submit() {
  if (!canSubmit.value)
    return
  emit('submit', reason.value.trim())
}

watch(() => props.visible, (visible) => {
  if (visible)
    reason.value = ''
})
</script>

<template>
  <el-dialog
    :model-value="visible"
    :title="t('commerce.order.rejectRefundTitle')"
    width="420px"
    @update:model-value="emit('update:visible', $event)"
  >
    <el-input
      v-model="reason"
      type="textarea"
      :rows="4"
      maxlength="200"
      show-word-limit
      :placeholder="t('commerce.order.rejectReasonPlaceholder')"
    />

    <template #footer>
      <el-button :disabled="saving" @click="close">
        {{ t('common.cancel') }}
      </el-button>
      <el-button type="primary" :loading="saving" :disabled="!canSubmit" @click="submit">
        {{ t('common.confirm') }}
      </el-button>
    </template>
  </el-dialog>
</template>
```

- [ ] **Step 6: Wire the action column into the order table**

Replace `apps/web-admin/src/features/order-management/ui/OrderTable.vue` with:

```vue
<script setup lang="ts">
import type { AdminOrderAction, OrderItem } from '@/entities/order'
import { ConfigDataTable } from '@/shared/config-crud'
import { createOrderTableColumns } from '../config/fields'
import OrderActionColumn from './OrderActionColumn.vue'

defineOptions({ name: 'OrderTable' })

defineProps<{
  loading: boolean
  data: OrderItem[]
}>()

const emit = defineEmits<{
  detail: [row: OrderItem]
  action: [action: AdminOrderAction, row: OrderItem]
}>()

const { t } = useI18n()
const columns = computed(() => createOrderTableColumns(t))
</script>

<template>
  <ConfigDataTable :loading="loading" :data="data" :columns="columns">
    <el-table-column :label="t('user.actions')" fixed="right" min-width="220">
      <template #default="{ row }">
        <OrderActionColumn
          :row="row"
          @detail="emit('detail', $event)"
          @action="(action, order) => emit('action', action, order)"
        />
      </template>
    </el-table-column>
  </ConfigDataTable>
</template>
```

- [ ] **Step 7: Export new admin order components**

Replace `apps/web-admin/src/features/order-management/index.ts` with:

```ts
export {
  createOrderSearchFields,
  createOrderTableColumns,
} from './config/fields'
export {
  getVisibleOrderActions,
  orderActionConfig,
} from './config/workflow'
export {
  useOrderManagement,
} from './model/useOrderManagement'
export type {
  OrderQuery,
} from './model/useOrderManagement'
export { default as OrderDetailDrawer } from './ui/OrderDetailDrawer.vue'
export { default as OrderTable } from './ui/OrderTable.vue'
export { default as RefundRejectDialog } from './ui/RefundRejectDialog.vue'
```

- [ ] **Step 8: Wire page state, drawer, and reject dialog**

Replace `apps/web-admin/src/pages/commerce/order/index.vue` with:

```vue
<script setup lang="ts">
import {
  createOrderSearchFields,
  OrderDetailDrawer,
  OrderTable,
  RefundRejectDialog,
  useOrderManagement,
} from '@/features/order-management'
import AdminSearchForm from '@/shared/ui/AdminSearchForm/index.vue'
import AdminTablePage from '@/shared/ui/AdminTablePage/index.vue'

defineOptions({ name: 'CommerceOrderView' })

const { t } = useI18n()
const searchFields = computed(() => createOrderSearchFields(t))
const {
  loading,
  query,
  filteredData,
  resetQuery,
  fetchRows,
  detailVisible,
  rejectVisible,
  detailLoading,
  actionSaving,
  selectedOrder,
  openDetail,
  executeAction,
  submitReject,
} = useOrderManagement()

onMounted(fetchRows)
</script>

<template>
  <AdminTablePage :title="t('commerce.order.title')" :loading="loading" @refresh="fetchRows">
    <template #search>
      <AdminSearchForm v-model:model="query" :fields="searchFields" @reset="resetQuery" />
    </template>

    <OrderTable
      :loading="loading"
      :data="filteredData"
      @detail="openDetail"
      @action="executeAction"
    />

    <OrderDetailDrawer
      v-model:visible="detailVisible"
      :loading="detailLoading"
      :order="selectedOrder"
    />

    <RefundRejectDialog
      v-model:visible="rejectVisible"
      :saving="actionSaving"
      @submit="submitReject"
    />
  </AdminTablePage>
</template>
```

- [ ] **Step 9: Add i18n keys**

In `apps/web-admin/src/shared/i18n/lang/zh-CN.ts`, inside `commerce.order`, add these keys after `closed: '已关�?,`:

```ts
      paymentStatus: '支付状�?,
      paymentPending: '待支�?,
      paymentPaid: '已支�?,
      paymentClosed: '已关�?,
      fulfillmentStatus: '履约状�?,
      fulfillmentStatusPlaceholder: '请选择履约状�?,
      fulfillmentPendingPayment: '待支�?,
      fulfillmentAwaitingAcceptance: '待接�?,
      fulfillmentAccepted: '已接�?,
      fulfillmentPreparing: '制作�?,
      fulfillmentDelivering: '配送中',
      fulfillmentCompleted: '已完�?,
      fulfillmentCanceled: '已取�?,
      refundStatus: '退款状�?,
      refundStatusPlaceholder: '请选择退款状�?,
      refundNone: '无退�?,
      refundRequested: '退款申请中',
      refundApproved: '退款已同意',
      refundRejected: '退款已驳回',
      refundReason: '退款原�?,
      refundRejectReason: '驳回原因',
      detail: '详情',
      actionAccept: '接单',
      actionPrepare: '制作',
      actionDeliver: '配�?,
      actionComplete: '完成',
      actionApproveRefund: '同意退�?,
      actionRejectRefund: '驳回退�?,
      confirmAccept: '确定接单该订单？',
      confirmPrepare: '确定开始制作该订单�?,
      confirmDeliver: '确定开始配送该订单�?,
      confirmComplete: '确定完成该订单？',
      confirmApproveRefund: '确定同意该订单退款？',
      confirmRejectRefund: '请输入驳回原因�?,
      rejectRefundTitle: '驳回退�?,
      rejectReasonPlaceholder: '请输入驳回原�?,
      actionSuccess: '订单操作成功',
      conflictMessage: '当前订单状态已变化，请刷新后重�?,
      logAction: '动作',
      logOperator: '操作�?,
      logRemark: '说明',
      logTime: '时间',
```

In `apps/web-admin/src/shared/i18n/lang/en.ts`, inside `commerce.order`, add these keys after `closed: 'Closed',`:

```ts
      paymentStatus: 'Payment Status',
      paymentPending: 'Pending',
      paymentPaid: 'Paid',
      paymentClosed: 'Closed',
      fulfillmentStatus: 'Fulfillment Status',
      fulfillmentStatusPlaceholder: 'Select fulfillment status',
      fulfillmentPendingPayment: 'Pending Payment',
      fulfillmentAwaitingAcceptance: 'Awaiting Acceptance',
      fulfillmentAccepted: 'Accepted',
      fulfillmentPreparing: 'Preparing',
      fulfillmentDelivering: 'Delivering',
      fulfillmentCompleted: 'Completed',
      fulfillmentCanceled: 'Canceled',
      refundStatus: 'Refund Status',
      refundStatusPlaceholder: 'Select refund status',
      refundNone: 'No Refund',
      refundRequested: 'Refund Requested',
      refundApproved: 'Refund Approved',
      refundRejected: 'Refund Rejected',
      refundReason: 'Refund Reason',
      refundRejectReason: 'Reject Reason',
      detail: 'Detail',
      actionAccept: 'Accept',
      actionPrepare: 'Prepare',
      actionDeliver: 'Deliver',
      actionComplete: 'Complete',
      actionApproveRefund: 'Approve Refund',
      actionRejectRefund: 'Reject Refund',
      confirmAccept: 'Accept this order?',
      confirmPrepare: 'Start preparing this order?',
      confirmDeliver: 'Start delivering this order?',
      confirmComplete: 'Complete this order?',
      confirmApproveRefund: 'Approve refund for this order?',
      confirmRejectRefund: 'Please enter a reject reason.',
      rejectRefundTitle: 'Reject Refund',
      rejectReasonPlaceholder: 'Enter reject reason',
      actionSuccess: 'Order action succeeded',
      conflictMessage: 'Order status changed, please refresh and retry',
      logAction: 'Action',
      logOperator: 'Operator',
      logRemark: 'Remark',
      logTime: 'Time',
```

- [ ] **Step 10: Run admin type-check**

Run:

```bash
pnpm --filter @elm-platform/web-admin run type-check
```

Expected: PASS.

- [ ] **Step 11: Commit admin UI**

```bash
git add apps/web-admin/src/features/order-management/config/fields.ts apps/web-admin/src/features/order-management/model/useOrderManagement.ts apps/web-admin/src/features/order-management/ui/OrderActionColumn.vue apps/web-admin/src/features/order-management/ui/OrderDetailDrawer.vue apps/web-admin/src/features/order-management/ui/RefundRejectDialog.vue apps/web-admin/src/features/order-management/ui/OrderTable.vue apps/web-admin/src/features/order-management/index.ts apps/web-admin/src/pages/commerce/order/index.vue apps/web-admin/src/shared/i18n/lang/zh-CN.ts apps/web-admin/src/shared/i18n/lang/en.ts
git commit -m "feat(admin): add order workflow operations"
```

---

## Task 9: User refund request UI

**Files:**
- Modify: `apps/web-user/src/services/api/endpoints/payment.endpoints.js`
- Modify: `apps/web-user/src/services/api/api-payment.js`
- Modify: `apps/web-user/src/services/api/api-payment.test.js`
- Modify: `apps/web-user/src/views/order/components/OrderCard.vue`
- Modify: `apps/web-user/src/views/order/components/OrderCard.test.js`
- Create: `apps/web-user/src/views/order/composables/useRequestRefund.js`
- Modify: `apps/web-user/src/views/order/order.vue`

- [ ] **Step 1: Add refund API test**

In `apps/web-user/src/services/api/api-payment.test.js`, add `requestOrderRefund` to the import list:

```js
  requestOrderRefund,
```

Add this test before the final `})`:

```js
  it('requests order refund by order number and reason', async () => {
    mocks.paymentClient.post.mockResolvedValueOnce({
      data: {
        orderNo: 'ELMALI202605241200000001',
        refundStatus: 'REQUESTED',
      },
    })

    await requestOrderRefund({
      orderNo: 'ELMALI202605241200000001',
      reason: '不想要了',
    })

    expect(mocks.paymentClient.post).toHaveBeenCalledWith('/orders/ELMALI202605241200000001/refund/request', {
      reason: '不想要了',
    })
  })
```

- [ ] **Step 2: Run user API test and verify it fails**

Run:

```bash
pnpm --filter @elm-platform/web-user exec vitest run src/services/api/api-payment.test.js
```

Expected: FAIL because `requestOrderRefund` is not exported.

- [ ] **Step 3: Add refund endpoint and API function**

In `apps/web-user/src/services/api/endpoints/payment.endpoints.js`, add this property before `orders: '/orders',`:

```js
  requestRefund: orderNo => `/orders/${orderNo}/refund/request`,
```

In `apps/web-user/src/services/api/api-payment.js`, add this function after `resumeAlipayWapPayment()`:

```js
export async function requestOrderRefund({ orderNo, reason }) {
  const response = await paymentRequest.post(paymentEndpoints.requestRefund(orderNo), {
    reason,
  })
  return unwrapResponse(response)
}
```

- [ ] **Step 4: Run user API test and verify it passes**

Run:

```bash
pnpm --filter @elm-platform/web-user exec vitest run src/services/api/api-payment.test.js
```

Expected: PASS.

- [ ] **Step 5: Update order card tests for refund UI**

In `apps/web-user/src/views/order/components/OrderCard.test.js`, inside `createOrder()`, add:

```js
    fulfillmentStatus: 'AWAITING_ACCEPTANCE',
    refundStatus: 'NONE',
    customerAvailableActions: ['REQUEST_REFUND'],
    refundRejectReason: null,
```

In `mountOrderCard()` event listeners, no change is needed.

Add these tests before the final `})`:

```js
  it('shows refund request action when backend marks the order refundable', async () => {
    const wrapper = await mountOrderCard({
      order: createOrder({ status: 'PAID' }),
    })

    expect(wrapper.root.textContent).toContain('申请退�?)

    wrapper.unmount()
  })

  it('emits request-refund when clicking refund action', async () => {
    const order = createOrder({ status: 'PAID' })
    const emitted = []
    const wrapper = await mountOrderCard(
      { order },
      {
        onRequestRefund: payload => emitted.push(payload),
      },
    )

    wrapper.root.querySelector('[data-test="request-refund"]').click()
    await nextTick()

    expect(emitted).toEqual([order])

    wrapper.unmount()
  })

  it('shows refund reject reason when refund is rejected', async () => {
    const wrapper = await mountOrderCard({
      order: createOrder({
        status: 'PAID',
        customerAvailableActions: [],
        refundStatus: 'REJECTED',
        refundRejectReason: '订单已开始制�?,
      }),
    })

    expect(wrapper.root.textContent).toContain('退款已驳回')
    expect(wrapper.root.textContent).toContain('订单已开始制�?)

    wrapper.unmount()
  })
```

- [ ] **Step 6: Update `OrderCard.vue`**

In `apps/web-user/src/views/order/components/OrderCard.vue`, replace `defineEmits` with:

```js
const emit = defineEmits({
  'continue-payment': order => Boolean(order?.orderNo),
  'request-refund': order => Boolean(order?.orderNo),
})
```

Add these computed values after `canContinuePayment`:

```js
const canRequestRefund = computed(() => {
  return Array.isArray(props.order.customerAvailableActions)
    && props.order.customerAvailableActions.includes('REQUEST_REFUND')
})

const fulfillmentStatusMap = {
  PENDING_PAYMENT: '待支�?,
  AWAITING_ACCEPTANCE: '待接�?,
  ACCEPTED: '已接�?,
  PREPARING: '制作�?,
  DELIVERING: '配送中',
  COMPLETED: '已完�?,
  CANCELED: '已取�?,
}

const refundStatusMap = {
  NONE: '',
  REQUESTED: '退款申请中',
  APPROVED: '退款已同意',
  REJECTED: '退款已驳回',
}

const fulfillmentText = computed(() => fulfillmentStatusMap[props.order.fulfillmentStatus] || '')
const refundText = computed(() => refundStatusMap[props.order.refundStatus] || '')
```

In the template, after `<span v-if="order.tradeStatus">{{ order.tradeStatus }}</span>`, add:

```vue
        <span v-if="fulfillmentText">{{ fulfillmentText }}</span>
        <span v-if="refundText">{{ refundText }}</span>
```

After the continue payment button, add:

```vue
      <button
        v-if="canRequestRefund"
        class="refund-button"
        data-test="request-refund"
        type="button"
        @click="emit('request-refund', order)"
      >
        申请退�?      </button>
```

After `</div>` for `.order-card__body`, add:

```vue
    <p v-if="order.refundStatus === 'REJECTED' && order.refundRejectReason" class="refund-reason">
      驳回原因：{{ order.refundRejectReason }}
    </p>
```

In the style block, replace `.continue-button {` with:

```scss
.continue-button,
.refund-button {
```

Then add after `.continue-button` styles:

```scss
.refund-button {
  color: #ff4d4f;
  background: #fff1f0;
}

.refund-reason {
  margin: 10px 0 0;
  font-size: 12px;
  line-height: 1.5;
  color: #ff4d4f;
}
```

- [ ] **Step 7: Create refund request composable**

Create `apps/web-user/src/views/order/composables/useRequestRefund.js`:

```js
import { showDialog, showToast } from 'vant'
import { requestOrderRefund } from '@/services/api/api-payment'

export function useRequestRefund({ fetchOrders }) {
  async function requestRefund(order) {
    const reason = window.prompt('请输入退款原�?)
    const normalizedReason = String(reason || '').trim()

    if (!normalizedReason)
      return

    if (normalizedReason.length < 2) {
      showToast('退款原因不少于 2 个字')
      return
    }

    try {
      await requestOrderRefund({
        orderNo: order.orderNo,
        reason: normalizedReason,
      })
      showToast('退款申请已提交')
      await fetchOrders()
    }
    catch (error) {
      await showDialog({
        title: '申请退款失�?,
        message: error?.message || '当前订单状态已变化，请刷新后重�?,
      })
    }
  }

  return {
    requestRefund,
  }
}
```

- [ ] **Step 8: Wire refund action in order page**

In `apps/web-user/src/views/order/order.vue`, add:

```js
import { useRequestRefund } from './composables/useRequestRefund'
```

After the `useContinuePayment` call, add:

```js
const { requestRefund } = useRequestRefund({
  fetchOrders,
})
```

In the `OrderCard` template usage, add:

```vue
            @request-refund="requestRefund"
```

- [ ] **Step 9: Run user tests and type-check**

Run:

```bash
pnpm --filter @elm-platform/web-user exec vitest run src/services/api/api-payment.test.js src/views/order/components/OrderCard.test.js
pnpm --filter @elm-platform/web-user run type-check
```

Expected: PASS.

- [ ] **Step 10: Commit user refund UI**

```bash
git add apps/web-user/src/services/api/endpoints/payment.endpoints.js apps/web-user/src/services/api/api-payment.js apps/web-user/src/services/api/api-payment.test.js apps/web-user/src/views/order/components/OrderCard.vue apps/web-user/src/views/order/components/OrderCard.test.js apps/web-user/src/views/order/composables/useRequestRefund.js apps/web-user/src/views/order/order.vue
git commit -m "feat(user): add order refund request flow"
```

---

## Task 10: End-to-end verification and final cleanup

**Files:**
- Verify all files changed in Tasks 1-9.
- No new source files should be added outside the paths listed in this plan.

- [ ] **Step 1: Run backend unit tests**

Run:

```bash
pnpm --filter @elm-platform/server run test
```

Expected: PASS.

- [ ] **Step 2: Run backend build**

Run:

```bash
pnpm --filter @elm-platform/server run build
```

Expected: PASS.

- [ ] **Step 3: Run admin web tests and type-check**

Run:

```bash
pnpm --filter @elm-platform/web-admin exec vitest run src/features/order-management/config/workflow.test.ts
pnpm --filter @elm-platform/web-admin run type-check
```

Expected: PASS.

- [ ] **Step 4: Run user web tests and type-check**

Run:

```bash
pnpm --filter @elm-platform/web-user exec vitest run src/services/api/api-payment.test.js src/views/order/components/OrderCard.test.js
pnpm --filter @elm-platform/web-user run type-check
```

Expected: PASS.

- [ ] **Step 5: Run workspace CI-equivalent commands**

Run:

```bash
pnpm --filter @elm-platform/server run test
pnpm --filter @elm-platform/server run build
pnpm --filter @elm-platform/web-admin run type-check
pnpm --filter @elm-platform/web-user run type-check
```

Expected: PASS.

- [ ] **Step 6: Manual backend smoke check**

Start backend:

```bash
pnpm --filter @elm-platform/server run start:dev
```

In another terminal, after the server is ready, request health:

```bash
curl http://localhost:3000/api/health
```

Expected response contains:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "status": "ok"
  }
}
```

If Redis is not running locally, expected `data.status` can be `degraded` and `data.dependencies.redis.status` can be `error`; database should be `ok` when PostgreSQL is configured.

- [ ] **Step 7: Manual admin UI smoke check**

Start backend and admin web:

```bash
pnpm dev:server
pnpm dev:admin
```

Open the admin app, log in as `admin / admin123`, navigate to `业务管理 -> 订单管理`, and verify:

- Paid demo order shows payment, fulfillment, and refund status columns.
- A paid awaiting order shows “接单�?
- Clicking “详情�?opens the drawer.
- Clicking an action updates the row after refresh.
- Refund requested orders show approve/reject actions when permissions allow.
- Reject refund dialog requires a reason.

- [ ] **Step 8: Manual user UI smoke check**

Start backend and user web:

```bash
pnpm dev:server
pnpm dev:user
```

Open the user app, log in as the seeded customer account, go to the order page, and verify:

- Refundable paid orders show “申请退款�?
- Submitting a refund reason changes the order card to “退款申请中�?
- Rejected refunds show the reject reason.
- Pending payment orders still show “继续支付�?

- [ ] **Step 9: Inspect git status and commit verification notes if needed**

Run:

```bash
git status --short
```

Expected: only intentional implementation files are modified. If all previous tasks were committed, the working tree should be clean.

Do not use `git add .`. If a final verification commit is needed, add only the specific files changed after the last task.

---

## Spec Coverage Check

- Order fulfillment state machine: Tasks 1, 3, 4, 5.
- Refund request and approval/reject workflow: Tasks 1, 3, 5, 9.
- Business action audit logs: Tasks 2, 3, 8.
- Backend button permission enforcement: Task 5.
- Frontend action visibility by backend actions and permissions: Tasks 7, 8.
- Payment/fulfillment/refund state boundary: Tasks 2, 3, 4.
- Conflict behavior for invalid state transitions: Tasks 1, 3, 8, 9.
- User ownership boundary for refund request: Tasks 3, 5.
- Management detail drawer, not separate detail route: Task 8.
- Health check and minimal CI: Task 6.
- Complete follow-up phases are not implemented in this plan: data permissions, merchant onboarding, Docker deployment remain outside Tasks 1-10.

