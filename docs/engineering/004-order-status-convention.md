# 订单状态约定

> 本文档定义 Elm Platform 订单的状态模型、流转规则、前后端映射以及扩展规范。
> 最新版本基于项目当前实现（三状态解耦 + 履约状态机 + 退款审批）。

## 1. 核心原则

1. **支付/履约/退款三状态解耦，永不互相覆盖。** `PaymentOrder.status` 只表达支付结果，`fulfillmentStatus` 只表达履约进度，`refundStatus` 只表达售后状态。
2. **前端展示的状态标签与可用动作必须与后端 `policy` 一致。** 后端 `getAdminAvailableActions()` 是可用动作的唯一真相来源。
3. **退款申请与履约操作互斥。** 退款申请后，原有履约动作被冻结，必须先处理退款审批，才能继续履约。

---

## 2. 状态模型

### 2.1 三层状态

| 维度 | 字段 | 枚举值 | 含义 |
|------|------|--------|------|
| **支付状态** | `status` | PENDING, PAID, CLOSED | 支付单层面的结果 |
| **履约状态** | `fulfillmentStatus` | PENDING_PAYMENT, AWAITING_ACCEPTANCE, ACCEPTED, PREPARING, DELIVERING, COMPLETED, CANCELED | 商家履约流程进度 |
| **退款状态** | `refundStatus` | NONE, REQUESTED, APPROVED, REJECTED | 售后退款流程进度 |

> 权威来源：`packages/contracts/src/order/index.ts`

### 2.2 归一化规则

`normalizeFulfillmentStatus(order)` 的归一化逻辑（当数据库字段为空时的兜底）：

```
order.status === 'PAID'  → AWAITING_ACCEPTANCE
order.status === 'CLOSED' → CANCELED
否则                    → PENDING_PAYMENT
```

`normalizeRefundStatus(order)` 的归一化逻辑：

```
order.refundStatus || 'NONE'
```

> **注意：** 归一化仅用于读取时的兼容兜底。新写入的订单记录必须显式填充 `fulfillmentStatus` 和 `refundStatus`。

### 2.3 状态互斥规则

| 场景 | 规则 |
|------|------|
| 退款申请冻结履约 | `refundStatus === 'REQUESTED'` 时，管理员可见的履约动作（ACCEPT/START_PREPARING/...）被隐藏，仅显示退款审批动作 |
| 退款通过后终止履约 | `refundStatus === 'APPROVED'` 时，`fulfillmentStatus` 被强制设为 `CANCELED`，订单结束 |
| 退款驳回后恢复履约 | `refundStatus === 'REJECTED'` 时，`fulfillmentStatus` 恢复为申请退款时的原始状态（`refundBaseFulfillmentStatus`） |
| 未支付订单不可操作 | `status !== 'PAID'` 的订单，`getAdminAvailableActions()` 返回空数组 |

---

## 3. 状态流转图

### 3.1 履约状态机（正常流程）

```
PENDING_PAYMENT
      │  ← status === 'PAID' 时自动归一化为 AWAITING_ACCEPTANCE
      ▼
AWAITING_ACCEPTANCE ──ACCEPT──▶ ACCEPTED ──START_PREPARING──▶ PREPARING
                                      │                         │
                                      │                         ▼
                                      │                     DELIVERING
                                      │                         │
                                      │                         ▼
                                      │                     COMPLETED
                                      │
                                      └── (退款申请冻结此分支)
```

### 3.2 退款状态机（异常/售后流程）

```
NONE ──用户申请退款──▶ REQUESTED ──管理员同意──▶ APPROVED (fulfillmentStatus → CANCELED)
                           │
                           └──管理员驳回──▶ REJECTED (fulfillmentStatus → refundBaseFulfillmentStatus)
```

### 3.3 关闭状态机

```
PENDING_PAYMENT ──支付超时/取消──▶ CLOSED (fulfillmentStatus → CANCELED)
```

### 3.4 完整状态流转矩阵

| 当前履约状态 | 动作 | 下一履约状态 | 退款状态约束 |
|-------------|------|-------------|-------------|
| AWAITING_ACCEPTANCE | ACCEPT | ACCEPTED | NONE |
| ACCEPTED | START_PREPARING | PREPARING | NONE |
| PREPARING | START_DELIVERY | DELIVERING | NONE |
| DELIVERING | COMPLETE | COMPLETED | NONE |
| *(任意已支付)* | REQUEST_REFUND | *(不变)* | NONE → REQUESTED |
| *(任意)* | APPROVE_REFUND | CANCELED | REQUESTED → APPROVED |
| *(任意)* | REJECT_REFUND | refundBaseFulfillmentStatus | REQUESTED → REJECTED |

> 权威来源：`apps/server/src/modules/order/order-transition.policy.ts`

---

## 4. 动作清单与权限映射

### 4.1 管理员动作

| 动作编码 | 中文名 | 触发条件 | 权限点 | HTTP 方法 |
|---------|--------|----------|--------|----------|
| ACCEPT | 接单 | fulfillmentStatus = AWAITING_ACCEPTANCE | `commerce:order:accept` | POST |
| START_PREPARING | 开始制作 | fulfillmentStatus = ACCEPTED | `commerce:order:prepare` | POST |
| START_DELIVERY | 开始配送 | fulfillmentStatus = PREPARING | `commerce:order:deliver` | POST |
| COMPLETE | 完成订单 | fulfillmentStatus = DELIVERING | `commerce:order:complete` | POST |
| APPROVE_REFUND | 同意退款 | refundStatus = REQUESTED | `commerce:order:refund:approve` | POST |
| REJECT_REFUND | 驳回退款 | refundStatus = REQUESTED | `commerce:order:refund:reject` | POST |

> 权威来源：`packages/contracts/src/order/index.ts` 的 `orderActionPermissionMap`

### 4.2 用户动作

| 动作编码 | 中文名 | 触发条件 | 端 |
|---------|--------|----------|-----|
| REQUEST_REFUND | 申请退款 | status=PAID ∧ refundStatus=NONE ∧ fulfillmentStatus ∈ [AWAITING_ACCEPTANCE, ACCEPTED, PREPARING] | 用户端 |

### 4.3 系统动作

| 动作编码 | 触发场景 |
|---------|----------|
| SYNC_PAYMENT_PAID | 支付宝支付成功回调 |
| SYNC_PAYMENT_CLOSED | 支付宝交易关闭回调 |

---

## 5. 前后端映射

### 5.1 状态标签映射

**后端枚举 → 前端 i18n Key → 中文**

| 维度 | 枚举值 | i18n Key | 中文 |
|------|--------|----------|------|
| 支付 | PENDING | commerce.order.paymentPending | 待支付 |
| 支付 | PAID | commerce.order.paymentPaid | 已支付 |
| 支付 | CLOSED | commerce.order.paymentClosed | 已关闭 |
| 履约 | PENDING_PAYMENT | commerce.order.fulfillmentPendingPayment | 待支付 |
| 履约 | AWAITING_ACCEPTANCE | commerce.order.fulfillmentAwaitingAcceptance | 待接单 |
| 履约 | ACCEPTED | commerce.order.fulfillmentAccepted | 已接单 |
| 履约 | PREPARING | commerce.order.fulfillmentPreparing | 备餐中 |
| 履约 | DELIVERING | commerce.order.fulfillmentDelivering | 配送中 |
| 履约 | COMPLETED | commerce.order.fulfillmentCompleted | 已完成 |
| 履约 | CANCELED | commerce.order.fulfillmentCanceled | 已取消 |
| 退款 | NONE | commerce.order.refundNone | 无退款 |
| 退款 | REQUESTED | commerce.order.refundRequested | 退款申请中 |
| 退款 | APPROVED | commerce.order.refundApproved | 退款已同意 |
| 退款 | REJECTED | commerce.order.refundRejected | 退款已驳回 |

> 权威来源：`apps/web-admin/src/features/order-management/config/workflow.ts`

### 5.2 状态颜色映射

**前端 Element Plus Tag 类型**

| 状态 | Tag 类型 | 使用场景 |
|------|----------|----------|
| PAID / COMPLETED / APPROVED | success（绿色） | 支付成功、履约完成、退款同意 |
| PENDING | warning（黄色） | 待支付 |
| PREPARING / DELIVERING | primary（蓝色） | 履约进行中 |
| CANCELED | info（灰色） | 已取消 |
| REQUESTED | danger（红色） | 退款申请中（需处理） |
| REJECTED | warning（黄色） | 退款已驳回 |

> 权威来源：`apps/web-admin/src/features/order-management/config/workflow.ts` 的 `getPaymentStatusType` / `getFulfillmentStatusType` / `getRefundStatusType`

### 5.3 后端接口与前端权限映射

| 功能 | 前端页面 | 前端权限 | 后端接口 | 后端权限装饰 |
|------|---------|---------|---------|------------|
| 订单列表 | /commerce/order | `commerce:order:view` | GET /api/admin/commerce/orders | `@RequirePermissions('commerce:order:view')` |
| 订单详情 | /commerce/order | `commerce:order:view` | GET /api/admin/commerce/orders/:orderNo | `@RequirePermissions('commerce:order:view')` |
| 接单 | /commerce/order | `commerce:order:accept` | POST /api/admin/commerce/orders/:orderNo/accept | `@RequirePermissions('commerce:order:accept')` |
| 开始制作 | /commerce/order | `commerce:order:prepare` | POST /api/admin/commerce/orders/:orderNo/start-preparing | `@RequirePermissions('commerce:order:prepare')` |
| 开始配送 | /commerce/order | `commerce:order:deliver` | POST /api/admin/commerce/orders/:orderNo/start-delivery | `@RequirePermissions('commerce:order:deliver')` |
| 完成订单 | /commerce/order | `commerce:order:complete` | POST /api/admin/commerce/orders/:orderNo/complete | `@RequirePermissions('commerce:order:complete')` |
| 同意退款 | /commerce/order | `commerce:order:refund:approve` | POST /api/admin/commerce/orders/:orderNo/refund/approve | `@RequirePermissions('commerce:order:refund:approve')` |
| 驳回退款 | /commerce/order | `commerce:order:refund:reject` | POST /api/admin/commerce/orders/:orderNo/refund/reject | `@RequirePermissions('commerce:order:refund:reject')` |

---

## 6. 可用动作计算（前端渲染规则）

后端 `getAdminAvailableActions(order)` 的计算逻辑：

1. 若 `status !== 'PAID'`，返回空数组（未支付或已关闭订单无操作）。
2. 根据当前 `fulfillmentStatus`，从 `fulfillmentTransitionMap` 获取可执行的履约动作。
3. 若 `refundStatus === 'REQUESTED'`，仅保留退款审批动作（`APPROVE_REFUND`、`REJECT_REFUND`）。

前端渲染规则：

1. 从后端获取 `availableActions` 列表。
2. 对每个动作，从 `orderActionConfig` 读取标签、权限、确认文案。
3. 过滤掉当前用户没有权限的动作（通过 `v-permission` 或 `hasPermission`）。
4. 渲染按钮；退款审批动作标记为 `danger` 样式。

> 权威来源：
> - 后端：`apps/server/src/modules/order/order-transition.policy.ts` 的 `getAdminAvailableActions()`
> - 前端：`apps/web-admin/src/features/order-management/config/workflow.ts` 的 `orderActionConfig`

---

## 7. 数据流与审计

### 7.1 订单操作的数据流

```
用户/管理员触发动作
        │
        ▼
OrderWorkflowService 校验（findOrder + assertAdminActionAllowed）
        │
        ▼
Prisma Transaction
  ├── paymentOrder.update({ fulfillmentStatus/refundStatus })
  └── orderActionLog.create({ action, fromStatus, toStatus, operator })
        │
        ▼
返回 toOrderSummary()（包含最新 availableActions）
```

### 7.2 操作日志字段

| 字段 | 说明 |
|------|------|
| orderNo | 订单号 |
| action | 动作编码（如 ACCEPT）|
| fromFulfillmentStatus / toFulfillmentStatus | 履约状态变更前后 |
| fromRefundStatus / toRefundStatus | 退款状态变更前后 |
| operatorId / operatorName / operatorType | 操作者信息 |
| reason / remark | 原因/备注 |
| tenantId | 租户隔离字段 |

> 权威来源：`apps/server/src/modules/order/order-workflow.service.ts` 的 `createLogData()`

### 7.3 退款数据的特殊字段

| 字段 | 说明 |
|------|------|
| refundBaseFulfillmentStatus | 申请退款时的**原始**履约状态，用于驳回后恢复 |
| refundReason | 用户填写的退款原因 |
| refundRejectReason | 管理员填写的驳回原因 |
| refundRequestedAt / refundedAt / refundRejectedAt | 各节点时间戳 |

---

## 8. 新增订单动作的标准流程

### 8.1 步骤清单

```
□ 1. 在 packages/contracts/src/order/index.ts 的 adminOrderActions 数组中新增动作编码
□ 2. 在 orderActionPermissionMap 中注册该动作对应的权限点
□ 3. 在 order-transition.policy.ts 的 fulfillmentTransitionMap 中定义状态流转
□ 4. 在 OrderWorkflowService 中实现业务方法（applyFulfillmentAction 或自定义）
□ 5. 在 ElmAdminController 中新增接口路由 + @RequirePermissions
□ 6. 在前端 workflow.ts 的 orderActionConfig 中注册标签、权限、确认文案
□ 7. 在前端 i18n 中添加翻译键（zh-CN.ts / en.ts）
□ 8. 在 admin-permissions.ts 的 buttonPermissions 数组中注册权限点（如尚未注册）
□ 9. 生成 OpenAPI 类型：pnpm api:generate（如修改了 Swagger 文档）
□ 10. 测试：验证有权限用户可以执行、无权限用户被拦截、状态冲突返回 409
```

### 8.2 示例：新增 "延迟配送" 动作

**步骤 1：新增枚举值**

```ts
// packages/contracts/src/order/index.ts
export const adminOrderActions = [
  // ... 已有动作
  'DELAY_DELIVERY',  // ← 新增
] as const
```

**步骤 2：注册权限映射**

```ts
export const orderActionPermissionMap: Record<AdminOrderAction, string> = {
  // ... 已有映射
  DELAY_DELIVERY: 'commerce:order:delay',
}
```

**步骤 3：定义状态流转**

```ts
// apps/server/src/modules/order/order-transition.policy.ts
const fulfillmentTransitionMap = {
  // ... 已有流转
  DELAY_DELIVERY: {
    DELIVERING: 'DELIVERING',  // 状态不变，仅记录动作
  },
}
```

**步骤 4-5：后端实现省略...

**步骤 6-7：前端配置省略...

**步骤 8：注册权限点**

```ts
// apps/server/src/modules/admin/constants/admin-permissions.ts
{
  code: 'commerce:order:delay',
  name: '订单延迟配送',
  group: '业务管理',
}
```

---

## 9. 常见问题

### Q1: 为什么订单状态要拆成三层？

单一状态字段无法同时表达"已支付但退款申请中"和"已支付但商家未接单"这两个场景。拆分后：
- `status='PAID'` + `fulfillmentStatus='AWAITING_ACCEPTANCE'` + `refundStatus='NONE'` = 正常待接单
- `status='PAID'` + `fulfillmentStatus='ACCEPTED'` + `refundStatus='REQUESTED'` = 已接单但用户申请退款

### Q2: 前端直接按枚举值渲染状态标签有什么问题？

后台可能新增状态值（如 `PARTIAL_REFUND`），前端硬编码会遗漏。正确做法：
1. 所有状态标签通过 `labelMap` 映射，缺失时降级显示原始值。
2. 可供选择的筛选项从 `fulfillmentStatuses` / `refundStatuses` / `paymentStatuses` 动态生成。

### Q3: `normalizeFulfillmentStatus` 为什么要从支付状态反推履约状态？

历史订单数据可能缺少 `fulfillmentStatus` 字段（第一期之前的订单），归一化保证旧数据也能正确参与状态流转计算。

### Q4: 退款同意后为什么要把 `fulfillmentStatus` 设为 `CANCELED`？

退款同意意味着订单售后流程结束，履约流程终止。设为 `CANCELED` 可确保后续不会再出现"完成"等履约动作。

### Q5: 驳回退款后 `fulfillmentStatus` 恢复的值从哪里取？

用户申请退款时，系统会把当前 `fulfillmentStatus` 快照保存到 `refundBaseFulfillmentStatus` 字段。驳回后从该字段恢复，确保回到申请退款前的精确状态。

---

## 10. 附录

### 10.1 关键文件索引

| 文件 | 作用 |
|------|------|
| `packages/contracts/src/order/index.ts` | 状态枚举和权限映射的权威来源 |
| `apps/server/src/modules/order/order-transition.policy.ts` | 状态流转规则核心 |
| `apps/server/src/modules/order/order-workflow.service.ts` | 订单工作流业务实现 |
| `apps/server/src/modules/elm/controllers/elm-admin.controller.ts` | 管理端订单接口 |
| `apps/web-admin/src/features/order-management/config/workflow.ts` | 前端状态标签与动作配置 |
| `apps/web-admin/src/entities/order/model/types.ts` | 前端订单类型定义 |

### 10.2 相关命令

```bash
# 运行订单相关测试
pnpm --filter @elm-platform/server run test -- modules/order

# 生成 OpenAPI 类型（后端修改后执行）
pnpm api:generate

# 启动后端
pnpm dev:server
```

---

## 修订记录

| 日期 | 修订人 | 说明 |
|------|--------|------|
| 2026-07-01 | — | 初始版本，基于项目当前三状态实现整理 |

---

> 如有疑问，请在 issue 或 PR 中 @ 项目维护者。
