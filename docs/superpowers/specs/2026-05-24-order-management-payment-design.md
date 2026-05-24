# 订单管理与继续支付设计

## 背景

当前管理端订单管理读取的是 `ElmOrderService` 中的模拟订单；用户端订单页读取真实支付订单，但待支付订单没有继续支付入口。需要让管理平台对接用户端真实订单状态，并让用户端可以对待支付订单继续支付。

## 目标

- 管理端订单管理展示真实 `payment_orders` 支付订单状态。
- 管理端支付状态只读，不允许人工把订单改为已支付或关闭。
- 用户端订单页对 `PENDING` 订单显示“继续支付”。
- 继续支付复用原 `orderNo`，不创建新订单。
- 继续支付前先刷新支付宝状态，避免对已支付或已关闭订单重复跳转。

## 非目标

- 不改造下单结算流程。
- 不新增管理端人工支付、退款、删除订单能力。
- 不把模拟订单数据迁移到真实支付订单表。

## 架构

后端以 `PaymentService` 和 `payment_orders` 为真实支付订单的唯一状态来源。管理端订单列表改为读取真实支付订单摘要，不再读取 `ElmStoreService` 的模拟订单。用户端订单列表继续读取现有用户订单接口。

新增后端能力：

- 管理端真实支付订单列表接口，例如 `GET /admin/commerce/payment-orders`。
- 原订单继续支付接口，例如 `POST /payments/alipay/wap/resume`。

继续支付接口接收 `orderNo` 和 `userId`，服务端校验订单存在、归属当前用户且状态为 `PENDING` 后，用原 `orderNo` 生成支付宝 WAP 支付 URL。`PAID` 与 `CLOSED` 订单拒绝继续支付。

管理端列表接口默认不主动查询支付宝，避免打开管理页时触发大量外部查询。支付状态由支付宝回调和用户端状态刷新接口更新。

## 管理端设计

订单管理页保留现有页面入口与表格页框架，数据源改为真实支付订单接口。

表格展示字段：

- 订单号 `orderNo`
- 用户 ID `userId`
- 商家名称 `shopName`
- 应付金额 `payableAmount`
- 商品金额 `goodsAmount`
- 配送费 `deliveryFee`
- 支付状态 `status`
- 支付宝交易状态 `tradeStatus`
- 支付时间 `paidAt`
- 创建时间 `createdAt`
- 更新时间 `updatedAt`

搜索筛选保留订单号和状态。状态枚举改为真实支付状态：`PENDING`、`PAID`、`CLOSED`。表格不显示“编辑状态”按钮；刷新按钮重新拉取订单列表。未知状态显示原始状态，并使用普通标签样式。

## 用户端设计

用户端订单页保留现有列表、空态、错误态和刷新行为。`OrderCard` 对 `PENDING` 订单显示“继续支付”按钮，非 `PENDING` 订单不显示该入口。

点击“继续支付”后的流程：

1. 按 `orderNo` 调用支付状态查询接口刷新状态。
2. 如果刷新后仍为 `PENDING`，调用 resume 接口获取 `payUrl`。
3. 将 `window.location.href` 设置为 `payUrl`，跳转支付宝收银台。
4. 如果刷新后为 `PAID`，刷新订单列表并提示“订单已支付”。
5. 如果刷新后为 `CLOSED`，刷新订单列表并提示“订单已关闭，请重新下单”。
6. 如果接口报错，展示后端错误信息或现有支付服务不可用文案。

继续支付按钮在请求期间进入 loading/disabled，避免重复点击。

## 数据流

创建支付单：

```text
用户结算页 -> createAlipayWapPayment -> payment_orders(PENDING, orderNo) -> 支付宝 URL
```

继续支付：

```text
用户订单页 PENDING 订单
  -> getAlipayPaymentStatus(orderNo)
  -> 仍 PENDING
  -> resumeAlipayWapPayment(orderNo, userId)
  -> 使用原 orderNo 生成 payUrl
  -> 跳转支付宝
```

管理端查看：

```text
管理端订单页 -> admin payment orders -> payment_orders 摘要 -> 只读展示
```

状态同步：

```text
支付宝回调 / 用户端状态刷新 -> PaymentService 更新 payment_orders.status -> 管理端与用户端下次刷新读取同一状态
```

## 错误处理

用户端：

- 支付服务不可用时复用 `PAY_API_UNAVAILABLE_MESSAGE`。
- 订单已支付时提示“订单已支付”，刷新列表，不跳转。
- 订单已关闭时提示“订单已关闭，请重新下单”，刷新列表，不跳转。
- 订单不存在、归属不匹配、不是待支付状态时展示后端消息，不跳转。

管理端：

- 列表拉取失败沿用现有 HTTP 与 Element Plus 错误提示机制。
- 金额统一格式化为两位小数。
- 时间字段统一使用管理端现有时间格式化工具。

后端：

- resume 接口必须校验 `orderNo` 和 `userId`。
- 非 `PENDING` 状态返回明确错误消息。
- 支付宝配置缺失或生成 URL 失败时返回明确错误消息。

## 测试与验证

自动化测试：

- 后端 `PaymentService`：
  - 待支付订单 resume 成功并复用原 `orderNo`。
  - 已支付订单 resume 被拒绝。
  - 已关闭订单 resume 被拒绝。
  - 用户不匹配时 resume 被拒绝。
  - 管理端列表返回真实支付订单摘要字段。
- 用户端：
  - `PENDING` 订单展示“继续支付”。
  - 点击继续支付先刷新状态，再调用 resume。
  - 状态变为 `PAID` 或 `CLOSED` 时刷新列表并提示，不跳转。
- 管理端：
  - 订单表格使用真实支付状态枚举。
  - 不再渲染状态编辑入口。

手动验证：

- 创建待支付订单后，用户端订单页显示同一 `orderNo` 和“继续支付”。
- 点击“继续支付”跳转支付宝 URL。
- 管理端订单页显示同一 `orderNo`、金额、用户、商家和 `PENDING` 状态。
- 支付成功或关闭后刷新状态，用户端与管理端展示一致。

## 实施顺序

1. 后端扩展 `PaymentService`：管理端列表摘要、resume 支付 URL。
2. 后端新增/调整控制器接口与单元测试。
3. 管理端订单实体类型、API、表格字段和页面行为改为只读真实支付订单。
4. 用户端支付 API 增加 resume 方法，订单卡片和订单页接入继续支付流程。
5. 运行后端测试、管理端类型检查/构建、用户端测试或构建，并进行手动验证。
