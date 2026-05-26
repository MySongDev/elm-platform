# 支付续付链路手工回归清单

## 范围

本清单用于回归支付宝 WAP 创建支付、用户端继续支付、支付结果同步和 admin 真实支付单列表。前台同步跳转结果只用于页面引导，支付成功仍以后端异步通知或交易查询结果为准。

## 环境

- 后端：`pnpm --filter vue3-elm-node run start:dev`
- 用户端：`pnpm --filter vue3-elm-js run dev`
- 管理端：`pnpm --filter elm-web-admin run dev`
- 支付宝配置：后端需配置 `ALIPAY_APP_ID`、`ALIPAY_PRIVATE_KEY`、`ALIPAY_PUBLIC_KEY`，沙箱环境使用 `https://openapi-sandbox.dl.alipaydev.com/gateway.do`

## 链路检查

1. 创建支付单
   - 用户端登录后从商家页选择商品并进入在线支付页。
   - 点击“确认支付”。
   - 期望：后端创建一条 `payment_orders` 记录，状态为 `PENDING`，前端跳转到支付宝 WAP 收银台。

2. 支付宝退出回订单页
   - 在支付宝收银台不完成支付，选择退出或返回。
   - 期望：回到用户端 `/#/order?orderNo=<orderNo>`，订单卡片高亮且显示“继续支付”。

3. 继续支付
   - 在订单页点击 `PENDING` 订单的“继续支付”。
   - 期望：用户端先调用 `GET /api/payments/alipay/status/:orderNo?refresh=1` 刷新状态；仍为 `PENDING` 时调用 `POST /api/payments/alipay/wap/resume`；随后跳转支付宝，且继续使用原 `orderNo`。

4. 支付结果轮询
   - 完成支付后回到 `/#/payment/result?orderNo=<orderNo>`。
   - 期望：结果页轮询状态，后端查询或异步通知确认成功后展示“支付成功”，再进入订单页时该订单为 `PAID`，不再显示“继续支付”。

5. admin 真实支付单列表
   - 登录管理端并进入“订单管理”。
   - 期望：列表读取 `GET /api/admin/commerce/orders`，展示真实支付单的订单号、商家、用户 ID、金额、支付状态、支付宝状态、支付宝交易号、支付时间和商品数量；页面不出现“修改订单状态”入口。

## 代理与回跳 URL

- 用户端支付 API 统一从 `/pay-api` 发起。
- Vite 代理应将 `/pay-api/*` 转发到 `http://127.0.0.1:3000/api/*`。
- 后端全局 API 前缀为 `/api`，支付端点路径为 `/api/payments/alipay/*` 和 `/api/orders`。
- 支付宝 `return_url` 应回到 `/#/payment/result?orderNo=<orderNo>`。
- 支付宝 `quit_url` 应回到 `/#/order?orderNo=<orderNo>`。

## 验证命令

```bash
pnpm --filter vue3-elm-node run test -- payment.controller.spec.ts payment.dto.spec.ts payment.service.spec.ts
pnpm --filter vue3-elm-js exec vitest run src/config/vite-proxy-target.test.js src/services/api/api-payment.test.js src/views/order/composables/useContinuePayment.test.js src/views/order/components/OrderCard.test.js
pnpm --filter elm-web-admin exec vitest run src/shared/api/endpoints.test.ts
pnpm --filter vue3-elm-node run build
pnpm --filter elm-web-admin run build
pnpm --filter vue3-elm-js run build
```
