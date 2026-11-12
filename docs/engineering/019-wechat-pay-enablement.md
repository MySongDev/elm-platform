# 019 微信小程序支付启用指南

本仓库已实现微信小程序支付（直连商户 + **微信支付公钥模式**）的完整代码链路，但**尚未用真实商户凭证验证过**。
本文说明启用步骤、配置含义、上线前置条件和排查方式。

> 功能实现与各阶段验证记录见 `docs/refactor/2026-11-12-微信支付分会话接入/HANDOFF.md`。

## 1｜功能清单

| 功能 | 实现位置 | 说明 |
|---|---|---|
| 可信建单 | `apps/server/src/modules/payment/wechat/wechat-payment.service.ts` 的 `createOrder` | 只收「买什么买几份」，金额由服务端查库得出；客户端价格字段会被 400 拒绝 |
| 建单幂等 | 同上 + `payment_orders.checkout_request_key` 唯一约束 | 同键同选择回原单、同键不同选择 409、并发冲突回读原单 |
| 预支付参数 | 同上 `createPaymentParams` | 首次支付与续付共用；已 PAID 拒绝 |
| 到账通知 | `apps/server/src/api/callbacks/wechat/wechat-notify.controller.ts` | 验签→解密→金额核对→事务内条件更新写 PAID；成功回 200，失败回 HTTP 500 让微信重推 |
| 主动查单 | 同上 `refreshOrderStatus` + `GET /api/payments/wechat/status/:orderNo` | 与通知共用同一结算入口 |
| 协议层 | `apps/server/src/modules/payment/wechat/wechat-pay.service.ts` | 签名、验签、AES-GCM 解密、查单；不碰数据库 |
| 小程序付款 | `apps/uni-user/src/platform/wechat-payment.ts` | code → 后端参数 → `uni.requestPayment` |
| 结算快照 | `apps/uni-user/src/utils/checkout-entry.ts` + `checkout-snapshot.ts` | requestId 持久化、PAID 精确扣车 |

## 2｜环境变量

全部在 `apps/server/.env`，示例见 `apps/server/.env.example`：

| 变量 | 含义 | 从哪里拿 |
|---|---|---|
| `WECHAT_PAY_ENABLED` | 总开关，默认 `false` | 自己设。**关着时所有微信接口报「配置无效」** |
| `WECHAT_APP_ID` | 小程序 AppID | 微信公众平台 |
| `WECHAT_APP_SECRET` | 小程序 AppSecret | 公众平台，用于 code2session 换 openid |
| `WECHAT_PAY_MCH_ID` | 直连商户号 | 微信支付商户平台 |
| `WECHAT_PAY_SERIAL_NO` | 商户 API 证书序列号 | 商户平台「账户中心 → API 安全」 |
| `WECHAT_PAY_PRIVATE_KEY` | 商户 API 私钥（PEM） | 申请 API 证书时生成，**只出现一次**，务必保存 |
| `WECHAT_PAY_PUBLIC_KEY_ID` | 微信支付公钥 ID | 商户平台「API 安全 → 微信支付公钥」 |
| `WECHAT_PAY_PUBLIC_KEY` | 微信支付公钥（PEM） | 同上 |
| `WECHAT_PAY_API_V3_KEY` | APIv3 密钥（32 字节） | 商户平台自行设置 |
| `WECHAT_PAY_NOTIFY_URL` | 回调地址 | 必须是**公网 HTTPS**，见第 4 节 |

### 2.1 为什么是「微信支付公钥模式」而不是平台证书

微信正在从「平台证书」迁移到「微信支付公钥」。本项目按公钥模式实现：
验签只需要一份固定的公钥，**不需要**在启动时下载并在过期前轮换平台证书。
代价是公钥 ID 和公钥本身要手工配置正确，配错时所有通知验签都会失败。

### 2.2 私钥的换行处理

`.env` 里的 PEM 必须用 `\n` 转义，不能直接粘贴多行：

```dotenv
WECHAT_PAY_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEv...\n-----END PRIVATE KEY-----\n"
```

## 3｜数据库迁移

新增两列，迁移文件已写好但**未在任何数据库执行**：

```
apps/server/prisma/migrations/20261112000000_add_wechat_payment_channel/
```

- `payment_channel`：可空。`null` 表示历史支付宝订单，`'WECHAT'` 表示微信订单。
- `checkout_request_key`：可空 + 唯一约束，用于建单幂等。

执行前必须单独确认目标数据库（见 `CLAUDE.md` 与 AGENTS 约定：迁移需用户授权）。
历史订单保持 `null`，不需要回填——旧订单继续按支付宝语义处理。

## 4｜上线前置条件

以下每一项缺一项，用户就无法真正付款：

1. **小程序具备支付权限**：小程序类目与主体需通过微信支付的接入审核，个人主体通常无法开通。
2. **商户号与 AppID 完成绑定**：在商户平台「产品中心 → AppID 账号管理」关联，否则下单报 `APPID_MCHID_NOT_MATCH`。
3. **公网 HTTPS 回调地址**：`WECHAT_PAY_NOTIFY_URL` 必须能从公网访问、证书有效。
   本地开发收不到真实通知——只能靠主动查单推进状态。
4. **小程序请求合法域名**：微信公众平台「开发管理 → 服务器域名」把后端域名加进 `request` 合法域名，
   否则真机上所有接口都无法访问（开发者工具可临时勾选「不校验合法域名」绕过，但**这只在工具里有效**）。
5. **后端地址可被小程序访问**：小程序不能访问 `localhost`。

## 5｜故障排查

| 现象 | 排查方向 |
|---|---|
| 提示「微信支付配置无效」 | `WECHAT_PAY_ENABLED` 是否为 `true`；9 个必填项是否有空值 |
| 下单报 `APPID_MCHID_NOT_MATCH` | 商户号与 AppID 未绑定，见第 4 节第 2 条 |
| 下单报签名错误 | 私钥与 `WECHAT_PAY_SERIAL_NO` 不是同一份证书 |
| 通知一直收不到，订单停在待支付 | 回调地址不可公网访问；或验签失败（看后端日志 `微信支付通知处理未通过`）。**此时可用 `GET /api/payments/wechat/status/:orderNo?refresh=1` 主动查单补救** |
| 通知持续重推 | 处理失败时后端会回 HTTP 500 + `{code:"FAIL"}`，这是微信重推的依据。先看日志里的「处理未通过」原因；反复验签失败优先检查公钥与公钥 ID 是否配错 |
| 用户付了钱但订单没变 | 调主动查单接口。若返回金额不一致，说明订单金额被改过，需人工核对商户平台流水 |
| 订单显示「已关闭」但仍想付款 | 微信查单确认 `CLOSED` 后本地订单会同步关闭，旧结算不能续付；请重新下单生成新订单 |

### 5.1 主动查单是唯一的人工补救手段

通知是不可靠信道。当用户反馈「付了但没到账」时：

1. 调 `GET /api/payments/wechat/status/{orderNo}?refresh=1`（需该用户 JWT）；
2. 或直接在商户平台按商户订单号查流水，与 `payment_orders` 表核对；
3. 若微信侧成功、本地仍 PENDING，说明通知链路断了，先修回调地址/公钥。

## 6｜退款限制

**微信订单目前不能退款。**

- 用户可以发起退款申请（`POST /orders/{orderNo}/refund/request`），这一步只是记录。
- **商家审批会被拒绝**：`approveRefund` 对 `paymentChannel === 'WECHAT'` 直接报错。
  原因是它只把状态写成 `APPROVED/refundedAt`，并不会真的把钱退回微信——
  放行会让「已退款」落库而钱没动，属于资金误标。

接入真实退款（`/v3/refund/domestic/refunds`）之前，微信订单只能靠商户平台后台人工退款。

## 7｜真机验收清单

以下全部完成，才能说「用户可以付款」。当前**一项都没做过**。

- [ ] 迁移已在目标库执行，`payment_channel` / `checkout_request_key` 列存在
- [ ] `WECHAT_PAY_ENABLED=true`，9 个必填项全部有效
- [ ] 小程序 request 合法域名已配置后端域名
- [ ] 真机下单：金额与小程序页面展示一致
- [ ] 真机付款：微信弹窗正常拉起，付款后订单变为「已付款」
- [ ] 通知到达：后端日志无验签失败
- [ ] 付完回到小程序，购物车只扣掉买过的数量，新增的商品还在
- [ ] 用户取消支付：订单仍可续付，不产生第二张订单
- [ ] 断网重试：不会建出两张订单（查 `checkout_request_key` 唯一约束是否生效）
- [ ] 金额被改价的场景：提示用户确认，而不是按新价静默扣款
- [ ] 商户平台流水与 `payment_orders` 逐笔核对一致

## 8｜当前验证状态

| 层级 | 状态 |
|---|---|
| 代码验收 | ✅ 后端 50 suites / 799 tests；前端 114 tests + type-check + mp-weixin 构建 |
| 数据库验证 | ❌ 迁移未执行 |
| 微信运行时验证 | ❌ 无凭证，微信开发者工具连接失败 |
| 真实支付 / 上线 | ❌ 未授权、未执行 |

**只能声称「代码链路已实现」，不能声称「用户可以付款」。**
