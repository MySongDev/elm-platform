# 真实支付宝退款 —— 设计讨论文档（先不落地，仅讨论）

> **项目**：elm-master / apps/server（modules/order + modules/payment）
> **日期**：2026-08-23
> **状态**：🗣️ 讨论稿，**未改动任何业务代码**
> **配套**：可视化对照页 `refund-visual-comparison.html`（同目录）
> **一手证据**：支付宝官方文档 [统一收单交易退款 alipay.trade.refund](https://opendocs.alipay.com/open/03w0ai)、[退款响应参数](https://opendocs.alipay.com/open/07dsf1)；本项目 `alipay.service.ts` / `order-workflow.service.ts` / `schema.prisma`

---

## 0. 一句话结论

当前的"退款"只改数据库状态、**不动一分钱**；真实退款是在"同意退款"这一步，**照着你项目已有的支付宝集成模式，多调一个 `alipay.trade.refund` 接口**，并把它带来的"异步、失败、幂等、对账"四件事处理好。技术上不难（SDK 现成），难在**它是资损场景，容错要求高**。

---

## 1. 现状核查：当前退款做了什么、缺了什么

### 1.1 当前 `approveRefund()` 的真实行为

> 证据：`apps/server/src/modules/order/order-workflow.service.ts:113`

```ts
async approveRefund(orderNo, operator, remark, context) {
  const order = await this.findOrder(orderNo, context)
  this.assertCanWrite(context)
  assertRefundReviewAllowed(order)

  return this.prisma.$transaction(async (tx) => {
    const updated = await tx.paymentOrder.update({
      where: { orderNo },
      data: {
        fulfillmentStatus: 'CANCELED',
        refundStatus: 'APPROVED',   // ← 只是把这个字段改成"已退款"
        refundedAt: new Date(),
        canceledAt: new Date(),
      },
    })
    await tx.orderActionLog.create({ /* 记一条日志 */ })
    return this.toOrderSummary(updated)
  })
}
```

### 1.2 关键缺口一览

| 维度 | 当前 | 真实退款要求 |
|------|------|------------|
| 是否调用支付宝 | ❌ 完全没有 | ✅ 必须调 `alipay.trade.refund` |
| 钱是否真退 | ❌ 用户没收到钱 | ✅ 原路退回用户支付宝 |
| 退款流水号 | ❌ 无 | ✅ 记录支付宝 `trade_no` + 商户 `out_request_no` |
| 幂等（防重复退）| ❌ 无 | ✅ 必须有，否则点两次退两次 |
| 失败处理 | ❌ 不会失败（因为没调外部）| ✅ 余额不足/超时/网络错误都要处理 |
| 部分退款 | ❌ 只能全额 | 🔶 可选（本项目场景全额即可）|

> **注意**：对比支付侧 `alipay.service.ts`，支付已经是**真集成**（`pageExec` 下单、`exec('alipay.trade.query')` 查单、`checkNotifySign` 验签）。所以"真实退款"不是从零开始，而是**补齐支付宝集成里缺的最后一块**。

---

## 2. 真实退款的目标形态（讨论用示意代码，非最终实现）

### 2.1 第一步：AlipayService 增加 `refund()` 方法

照抄现有 `queryTrade()` 的模式（`alipay.service.ts:50`），几乎是同构的：

```ts
// 【示意】apps/server/src/modules/payment/alipay/alipay.service.ts
async refund(params: {
  outTradeNo: string
  refundAmount: number
  outRequestNo: string     // 幂等关键：同一 outRequestNo 重复调 = 同一笔退款
  refundReason?: string
}) {
  const response = await this.getSdk().exec('alipay.trade.refund', {
    bizContent: {
      out_trade_no: params.outTradeNo,
      refund_amount: params.refundAmount.toFixed(2),
      out_request_no: params.outRequestNo,
      refund_reason: params.refundReason ?? '管理员同意退款',
    },
  })
  // 信封解包，与 queryTrade 完全一致的写法
  return response?.alipay_trade_refund_response || response
}
```

> **官方字段依据**（[opendocs 03w0ai](https://opendocs.alipay.com/open/03w0ai)）：
> - 请求：`out_trade_no`（商户订单号，你项目里就是 `orderNo`）、`refund_amount`（必填，元）、`out_request_no`（退款请求号，幂等用）、`refund_reason`（可选）
> - 响应：`code === '10000'` 成功、`trade_no`（支付宝交易号）、`fund_change`（Y/N 是否真的发生资金变化）、`refund_fee`（实退金额）

### 2.2 第二步:改造 `approveRefund()` —— 先退钱,后落库

```ts
// 【示意】order-workflow.service.ts —— 与现有结构对比看差异
async approveRefund(orderNo, operator, remark, context) {
  const order = await this.findOrder(orderNo, context)
  this.assertCanWrite(context)
  assertRefundReviewAllowed(order)

  // ── 新增 ①:幂等检查 ────────────────────────────
  if (order.refundStatus === 'APPROVED') {
    return this.toOrderSummary(order)   // 已退过,直接返回,不再退第二次
  }

  // ── 新增 ②:调用支付宝真实退款(网络 IO,放在事务外)──
  const outRequestNo = `${order.orderNo}_R1`   // 同一订单同一请求号 = 幂等
  const refundResult = await this.alipay.refund({
    outTradeNo: order.orderNo,
    refundAmount: toPrice(order.payableAmount),
    outRequestNo,
    refundReason: remark,
  })

  // ── 新增 ③:成败分流 ──────────────────────────
  const success = refundResult.code === '10000' && refundResult.fund_change === 'Y'
  if (!success) {
    // 失败:不改成 APPROVED,记失败日志,把错误抛回前端让管理员重试
    await this.logRefundFailure(order, operator, refundResult)
    throw new BadRequestException(`支付宝退款失败:${refundResult.sub_msg || refundResult.msg}`)
  }

  // ── 成功后才落库(和现在几乎一样,多存两个流水字段)──
  return this.prisma.$transaction(async (tx) => {
    const updated = await tx.paymentOrder.update({
      where: { orderNo },
      data: {
        fulfillmentStatus: 'CANCELED',
        refundStatus: 'APPROVED',
        refundedAt: new Date(),
        canceledAt: new Date(),
        refundTradeNo: refundResult.trade_no,      // 新增字段
        refundOutRequestNo: outRequestNo,          // 新增字段
      },
    })
    await tx.orderActionLog.create({ /* 日志额外记 trade_no */ })
    return this.toOrderSummary(updated)
  })
}
```

---

## 3. 真实退款的连锁改动（这是"看一看"的重点）

真实退款**不是加一个函数就完事**，它会牵动 6 个层面。按依赖顺序和难度排列：

| # | 层面 | 具体改动 | 难度 | 为什么绕不开 |
|---|------|---------|:---:|------------|
| 1 | `AlipayService` | 加 `refund()` / `queryRefund()` | 🟢 低 | 有现成 `queryTrade` 模板 |
| 2 | Prisma schema | 加 `refundTradeNo` / `refundOutRequestNo` / `refundAmount` 字段 + 迁移 | 🟢 低 | 对账、客服查询、幂等都要 |
| 3 | 幂等设计 | `out_request_no` + 状态前置判断 | 🟡 中 | 管理员手抖点两次不能退两次 |
| 4 | 失败处理 | 失败不改状态、记日志、可重试 | 🟠 中高 | 资损场景,必须严谨 |
| 5 | 契约 + 前端提示 | `packages/contracts` 加错误类型;管理端 loading/成功/失败提示 | 🟡 中 | 前后端一致 + 体验 |
| 6 | 对账兜底（可选进阶）| 定时用 `queryRefund` 核对"处理中"的退款 | 🔴 高 | 异步退款/网络抖动的最终一致性 |

> **给作品集的建议**：第 1–5 层做完，就是一个"能讲清、能演示、够严谨"的真实退款闭环。第 6 层（对账 job）是加分项，可以在文档里写"已设计、未实现"，面试时作为"我知道生产环境还需要什么"的谈资。

---

## 4. 三个必须讲清的技术难点（方案4：后端深挖）

### 4.1 幂等：为什么必须有 `out_request_no`

**场景**：管理员点"同意退款"，网络慢，他以为没点上，又点了一次。

- 若无幂等：调用两次 `alipay.trade.refund`，用户可能被退两次钱 → 资损。
- 支付宝的机制：**同一 `out_trade_no` + 同一 `out_request_no` 视为同一笔退款**，重复调用返回同一结果、不会重复扣商户的钱。
- 本项目落地：`out_request_no = ${orderNo}_R1`（全额退只有一笔，固定 `_R1` 即可）。再加一道前置判断 `if (refundStatus === 'APPROVED') return`，双保险。

### 4.2 事务边界：网络调用绝不能放进数据库事务里

```
❌ 错误写法:$transaction(async tx => { await alipay.refund(...); await tx.update(...) })
   → 支付宝接口耗时几百 ms,会把数据库连接/事务锁占住,高并发下拖垮连接池

✅ 正确写法:先 await alipay.refund()(事务外),拿到成功结果后,再开一个短事务落库
```

这是本项目现有代码已经隐含的原则（现在退款没有网络调用，所以整个塞事务里也没事；一旦引入真实退款，就必须把网络 IO 挪出事务）。

### 4.3 状态机要不要加 `REFUNDING`（处理中）态？

- 支付宝 `alipay.trade.refund` **多数情况同步返回结果**（`fund_change=Y` 即已退）。
- 但存在"退款受理中、稍后到账"的异步情况。**严格生产系统**会加一个 `REFUNDING` 中间态：
  - `REQUESTED`（用户申请）→ 管理员同意 → `REFUNDING`（已发起、等支付宝确认）→ `APPROVED`（确认到账）
- **本项目的取舍建议**：作为作品集，可以先按"同步成功"处理（`REQUESTED → APPROVED`），在文档/注释里标注"生产环境需补 `REFUNDING` 态 + 对账"。这与状态机"拒绝过度设计"的既有风格一致（见 `reports/order-state-machine-simplify-20260823/`）。

---

## 5. 前端"样式/结果"会怎么变（方案1的文字版，详见可视化页）

### 5.1 管理端（web-admin）"同意退款"交互

```
当前:  [同意退款] → 状态字变绿"退款已同意"  (0.1 秒,因为不调外部)

真实:  [同意退款]
        → 确认框:"将向用户退回 ¥38.00,确认?"
        → Loading:"正在向支付宝发起退款…"(1~3 秒)
        → 成功 ✅ 绿色 Toast:"退款成功"
                订单详情新增:【退款流水号 2013xxx】【实退 ¥38.00】【退款时间】
        → 失败 ❌ 红色 Toast:"退款失败:交易已退款/余额不足"
                按钮变为 [重试退款],状态仍停在待审批
```

### 5.2 用户端（web-user）订单卡片退款状态

```
当前:  退款已同意（一个静态标签）

真实:  退款申请中 → 退款处理中(支付宝图标) → ¥38.00 已原路退回至支付宝
```

---

## 6. 被否决 / 暂不做的方案（保持项目克制）

| 方案 | 是否采用 | 原因 |
|------|:---:|------|
| 调 `alipay.trade.refund`（同步）| ✅ 采用 | 官方标准、有现成 SDK、贴合现有 `queryTrade` 模式 |
| 全额退款 | ✅ 采用 | 外卖场景整单退即可 |
| 部分退款（按菜品退）| ❌ 暂不 | `refund_goods_detail` 复杂,当前无此业务需求 |
| `REFUNDING` 异步态 + 对账 job | 🔶 设计但暂不实现 | 作品集先做同步闭环,生产再补,避免过度设计 |
| 自建退款状态轮询前端 | ❌ 暂不 | 同步返回场景用不上 |

---

## 7. 如果要落地，最小改动清单（供你决定后使用）

> ⚠️ 以下为**未来落地**的清单，本讨论阶段**不执行**。

```
□ 1. schema.prisma:PaymentOrder 加 refundTradeNo / refundOutRequestNo / refundAmount + migration
□ 2. alipay.service.ts:加 refund() 方法(照抄 queryTrade 模式)
□ 3. alipay.service.spec.ts:加 refund 的单测(mock SDK)
□ 4. order-workflow.service.ts:approveRefund() 加"先退钱→成败分流→落库"
□ 5. order-workflow.service.spec.ts:补退款成功/失败/幂等三个用例
□ 6. packages/contracts:退款失败错误码(可选)
□ 7. web-admin:同意退款加确认框 + loading + 成功/失败提示
□ 8. web-user:订单卡片退款状态细化
□ 9. .env.example:确认 ALIPAY_* 配置齐全(退款复用支付的配置,无需新增)
```

---

## 8. 关联

- 状态机精简复盘：`reports/order-state-machine-simplify-20260823/`
- 订单状态规范：`docs/engineering/004-order-status-convention.md`
- 可视化对照页：`./refund-visual-comparison.html`

---

## Sources（一手来源）

- [支付宝开放平台 · 统一收单交易退款接口 alipay.trade.refund](https://opendocs.alipay.com/open/03w0ai)
- [支付宝开放平台 · 交易退款响应参数（fund_change / refund_fee / trade_no）](https://opendocs.alipay.com/open/07dsf1)
- 本项目：`apps/server/src/modules/payment/alipay/alipay.service.ts`、`apps/server/src/modules/order/order-workflow.service.ts`、`apps/server/prisma/schema.prisma`

*讨论稿生成时间：2026-08-23 · 未改动业务代码*
