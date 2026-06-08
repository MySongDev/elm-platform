# 支付宝后端支付接入设�?
## 目标

�?`apps/web-user` 当前依赖 `apps/web-user/server` Express demo 服务的支付宝支付流程迁入现有 NestJS 后端 `apps/server`，由后端负责支付单创建、支付宝 WAP 支付 URL 生成、交易状态查询、异步通知验签和支付订单持久化�?
## 范围

本次实现包含�?
- �?`apps/server` 新增 `PaymentModule`�?- 新增 Prisma `PaymentOrder` 模型并生成迁移�?- �?`apps/server` 新增 `alipay-sdk` 依赖�?- 后端提供与现有前端兼容的支付接口�?- 前端 `/pay-api` 代理改为指向 `apps/server` �?`/api`�?- 支付配置迁移�?`apps/server` 环境变量�?
本次不包含：

- 商品价格防篡改的完整后端商品库校验�?- 管理后台支付订单页面�?- 生产级公�?notify 部署�?- 关闭或删�?`apps/web-user/server` demo 服务�?
## 后端架构

新增目录�?
```text
apps/server/src/modules/payment/
  payment.module.ts
  payment.controller.ts
  payment.service.ts
  dto/
    create-alipay-wap-payment.dto.ts
  alipay/
    alipay.service.ts
```

职责�?
- `PaymentController`：暴露前�?REST API�?- `PaymentService`：创建支付订单、保存订单、查询订单状态、处理回调状态更新�?- `AlipayService`：封�?`alipay-sdk`，负责创�?WAP 支付 URL、交易查询、notify 验签�?- `PrismaService`：持久化 `payment_orders`�?
`AppModule` 引入 `PaymentModule`�?
## 数据库设�?
新增 Prisma model�?
```prisma
model PaymentOrder {
  id             Int      @id @default(autoincrement())
  orderNo        String   @unique
  userId         String
  shopId         String?
  shopName       String
  status         String   @default("PENDING")
  tradeStatus    String   @default("WAIT_BUYER_PAY")
  tradeNo        String?
  subject        String
  goodsAmount    Decimal  @db.Decimal(10, 2)
  deliveryFee    Decimal  @db.Decimal(10, 2)
  payableAmount  Decimal  @db.Decimal(10, 2)
  cartItems      Json
  notifyPayload  Json?
  queryPayload   Json?
  buyerPayAmount Decimal? @db.Decimal(10, 2)
  paidAt         DateTime?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@map("payment_orders")
}
```

业务状态：

- `PENDING`
- `PAID`
- `CLOSED`

支付宝交易状态保存原始值，例如�?
- `WAIT_BUYER_PAY`
- `TRADE_SUCCESS`
- `TRADE_FINISHED`
- `TRADE_CLOSED`

## API 设计

后端接口保持现有前端调用语义�?
```text
POST /api/payments/alipay/wap/create
GET  /api/payments/alipay/status/:orderNo
POST /api/payments/alipay/notify
GET  /api/orders
```

### 创建 WAP 支付

请求�?
```text
POST /api/payments/alipay/wap/create
```

请求体继续兼容当前前端：

```json
{
  "userId": "1",
  "shopId": "101",
  "shopName": "示例商家",
  "deliveryFee": 5,
  "cartItems": [
    {
      "itemId": "1001",
      "skuId": "1001",
      "title": "商品",
      "qty": 2,
      "unitPrice": 12
    }
  ]
}
```

响应�?
```json
{
  "orderNo": "ELMALI202605231234560001",
  "payUrl": "https://openapi-sandbox.dl.alipaydev.com/gateway.do?charset=utf-8&method=alipay.trade.wap.pay",
  "payableAmount": 29
}
```

### 查询支付状�?
请求�?
```text
GET /api/payments/alipay/status/:orderNo?refresh=1
```

�?`refresh=1` 且支付宝配置完整时，后端调用 `alipay.trade.query` 并更新数据库�?
响应返回订单摘要�?
```json
{
  "orderNo": "ELMALI202605231234560001",
  "userId": "1",
  "shopId": "101",
  "status": "PAID",
  "tradeStatus": "TRADE_SUCCESS",
  "payableAmount": 29,
  "shopName": "示例商家",
  "goodsAmount": 24,
  "deliveryFee": 5,
  "cartItems": [],
  "paidAt": "2026-05-23T00:00:00.000Z",
  "createdAt": "2026-05-23T00:00:00.000Z",
  "updatedAt": "2026-05-23T00:00:00.000Z",
  "tradeNo": "2026052322001400000500000001"
}
```

### 支付宝异步通知

请求�?
```text
POST /api/payments/alipay/notify
```

处理步骤�?
1. 使用 `alipay-sdk` 验签�?2. 根据 `out_trade_no` 查询 `PaymentOrder`�?3. 校验 `app_id`、可�?`seller_id`、`total_amount`�?4. 更新 `tradeNo`、`tradeStatus`、`status`、`notifyPayload`、`paidAt`�?5. 成功返回 `success`，失败返�?`failure`�?
## 配置设计

`apps/server/src/config/configuration.ts` 新增�?
```ts
alipay: {
  gateway: string
  appId: string
  privateKey: string
  alipayPublicKey: string
  notifyUrl: string
  returnUrl: string
  sellerId: string
}
```

环境变量�?
```env
ALIPAY_GATEWAY=https://openapi-sandbox.dl.alipaydev.com/gateway.do
ALIPAY_APP_ID=your-sandbox-app-id
ALIPAY_PRIVATE_KEY=your-application-private-key
ALIPAY_PUBLIC_KEY=your-alipay-public-key
ALIPAY_NOTIFY_URL=http://127.0.0.1:3000/api/payments/alipay/notify
ALIPAY_RETURN_URL=http://127.0.0.1:5173/#/payment/result
ALIPAY_SELLER_ID=your-sandbox-seller-id
```

私钥和支付宝公钥允许使用 `\n` 表示换行，后端读取时转换为真实换行�?
## 前端改动

`apps/web-user/vite.config.js` �?`/pay-api` 代理从：

```text
http://127.0.0.1:3001/api
```

改为�?
```text
http://localhost:3000/api
```

`apps/web-user/src/services/api/api-payment.js` 保持调用路径不变，但错误文案从“本地支付服务未启动”调整为“后端支付服务未启动或不可用”�?
## 数据�?
### 创建支付�?
```text
/payment 页面
  -> POST /pay-api/payments/alipay/wap/create
  -> Vite proxy �?apps/server /api/payments/alipay/wap/create
  -> PaymentService 校验并计算金�?  -> 写入 payment_orders
  -> AlipayService 生成 WAP 支付 URL
  -> 前端跳转支付�?```

### 查询支付结果

```text
/payment/result?orderNo=xxx
  -> GET /pay-api/payments/alipay/status/:orderNo?refresh=1
  -> 后端读取 payment_orders
  -> 可选调用支付宝交易查询
  -> 更新并返回支付状�?```

### notify 回调

```text
支付宝服务器
  -> POST /api/payments/alipay/notify
  -> 后端验签和校验金�?  -> 更新 payment_orders
  -> 返回 success
```

## 错误处理

- 缺少 `userId`：返�?401，消息为“请登录后再支付”�?- 购物车为空：返回 400，消息为“购物车为空，无法创建支付单”�?- 金额异常：返�?400，消息为“订单金额异常，无法创建支付单”�?- 支付宝配置缺失：返回 500，消息提示缺少支付宝配置�?- 订单不存在：返回 404，消息为“订单不存在”�?- notify 验签或金额校验失败：返回 `failure`�?
## 测试与验�?
实现后执行：

```text
pnpm --filter @elm-platform/server prisma:generate
pnpm --filter @elm-platform/server prisma:migrate
pnpm --filter @elm-platform/server build
pnpm --filter @elm-platform/web-user run type-check
```

手动验证�?
1. 配置 `apps/server` 的支付宝环境变量�?2. 启动 `apps/server`�?3. 启动 `apps/web-user`�?4. 登录用户�?5. 商家页添加商品并结算�?6. �?`/payment` 点击确认支付�?7. 跳转支付宝沙箱收银台�?8. 支付完成后回�?`/payment/result`�?9. 结果页通过主动查询展示支付成功�?
## 本地开发限�?
默认 `ALIPAY_NOTIFY_URL` 指向本机时，支付宝服务器无法访问本机回调。开发环境主要依赖结果页主动查询状态跑通支付成功。若要验�?notify，需要将后端 3000 端口暴露为公�?HTTPS 地址，并配置 `ALIPAY_NOTIFY_URL`�?
