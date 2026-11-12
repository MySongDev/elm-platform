# 微信支付分会话开发交接（唯一进度入口）

> 更新：2026-11-12。新会话先读本文件，不加载旧聊天。
> [计划书](./01-plan.md)｜[实施书](./02-implementation.md)｜[第一波约定](./03-wave1-contract.md)
> [第一波完整报告（本地）](../../reports/uni-user/2026-11-12-微信支付第一波并行基础开发/engineering-report.md)

## 1. 当前状态与唯一下一步

- 分支：`feat/uni-user-wechat-pay`；HEAD 仍为 `e5a5cb8c63e6f0d0e32e6faf5baffc7f66b0a7a8`。
- **S0–S6 全部完成，代码层验收结束。** 后端 49 suites / 794 tests；前端 108 tests + type-check + mp-weixin 构建；S6 修掉 1 处跨事务缺陷，并交付启用指南 `docs/engineering/019-wechat-pay-enablement.md`。
- **四层状态必须分开看**：代码验收 ✅ / 数据库验证 ❌ / 微信运行时验证 ❌ / 真实支付上线 ❌。**不能声称「用户可以付款」。**
- 用户授权了三个代理并行第一波。B 正常交付；A/C 在后续收尾遇到 API 限流，主会话接手修复并完成真实验证。不要重复启动第一波或重做调查。
- 未提交、未 push、未 merge。保留当前工作区，不重新从 main 开分支。
- **计划内批次已全部执行完毕。** 下一步只剩 L1（真实商户凭证 + 迁移 + 真机小额实付），**需要用户单独授权后才能开始**，不自动执行。

| 阶段 | 真实状态 | 尚需处理 |
|---|---|---|
| S0 协议收口 | 代码验收通过 | 未装配 Provider/Controller；DB 迁移未执行 |
| S1 金额/幂等/隔离 | 查价/金额/选择规则 + 渠道落库 + 微信退款阻断 + 支付宝渠道隔离 已落地 | 唯一约束建单去重/冲突恢复（移入 S2） |
| S2 预支付/API | **已完成**：可信建单 + 幂等 + 预支付参数 + Controller/DTO + 契约生成 | 尚无到账确认；DB 迁移未执行 |
| S3 到账闭环 | **已完成**：验签通知 + 主动查单共用一个结算入口，事务内条件更新防重复入账 | 未用真实商户验证；DB 迁移未执行 |
| S4 快照/清车 | **已完成**：快照进 store 并同 key 持久化、两个结算入口登记 requestId、PAID 精确扣减、跨商家拦截 | 编辑代次（删后重加同 SKU）仍未解 |
| S5 小程序付款 | **已完成（代码层）**：原生 requestPayment、续付、按渠道查单、轮询生命周期 | **无真实凭证，未真机验收** |
| S6 整体回归 | **已完成**：修掉到账/履约跨事务缺陷；交付 019 启用指南；验收矩阵逐项核对 | 见报告 |
| L1 真实实付/上线 | 未执行 | 需资质、凭证、HTTPS 与单独授权 |

## 2. 第一波已验证出口

| 功能 | 实现位置 | 说明 |
|---|---|---|
| 微信协议 | `apps/server/src/modules/payment/wechat/wechat-pay.service.ts` | 配置、code/openid、签名、预支付、查单、rawBody 验签/解密；不写 DB |
| 可信查价 | `apps/server/src/modules/order/order-pricing.service.ts` | `priceSelection({shopId,cartItems})` → 权威商家/SKU/整数分快照 |
| 选择与幂等比较 | `apps/server/src/modules/order/checkout-selection.ts` | normalizeCheckoutSelection、createCheckoutRequestKey、areCheckoutSelectionsEqual |
| 整数分工具 | `apps/server/src/modules/order/order-money.ts` | orderMajorToMinor、assertOrderAmountMinor、add/multiply、orderMinorToMajorString |
| 快照登记/绑单/消费 | `apps/uni-user/src/utils/checkout-snapshot.ts` | createCheckoutSnapshotState、registerCheckoutSnapshot、bindCheckoutOrder、consumePaidCheckout |
| 微信业务层（S2） | `apps/server/src/modules/payment/wechat/wechat-payment.service.ts` | createOrder 可信建单+幂等、createPaymentParams 预支付参数；不做到账确认 |
| 微信接口（S2） | `apps/server/src/api/customer/payment/wechat-payment.controller.ts` | `POST payments/wechat/create`(201)、`POST payments/wechat/resume`(200)，均需 CustomerAuthGuard |
| 微信 DTO（S2） | `apps/server/src/api/customer/payment/dto/create-wechat-payment.dto.ts` | 建单 DTO 只收 itemId/skuId/qty，**没有价格字段** |
| 微信通知（S3） | `apps/server/src/api/callbacks/wechat/wechat-notify.controller.ts` | `POST payments/wechat/notify`，无 JWT，永远回 200 + `{code}`，不进 OpenAPI |
| 微信查单（S3） | `apps/server/src/api/customer/payment/wechat-payment.controller.ts` 的 `getStatus` | `GET payments/wechat/status/:orderNo`，`refresh=0` 只回本地快照 |
| 到账结算（S3） | `wechat-payment.service.ts` 的 `handleNotification` / `refreshOrderStatus` / `settlePaidTransaction` | 通知与查单共用一个写入口 |
| 结算入口纯函数（S4） | `apps/uni-user/src/utils/checkout-entry.ts` | createCheckoutRequestId、buildSingleShopSelection（跨商家返回 null）、describeCrossShopCheckout、findPendingCheckoutSnapshot、discardSnapshotsOfOtherUsers |
| 结算登记 composable（S4） | `apps/uni-user/src/composables/features/useCheckoutEntry.js` | `beginCheckout`（同选择沿用旧 requestId）/ `bindOrder` |
| 快照接入 store（S4） | `store-cart.js` 的 `registerCheckout`/`bindCheckoutOrder`/`getPendingCheckout`/`consumePaidSnapshot`/`discardSnapshotsExcept` | 快照与 stores 同 key 持久化 |
| 支付流程判定（S5） | `apps/uni-user/src/utils/payment-flow.ts` | classifyPaymentLaunch / checkPayableAmount / shouldContinuePolling / decideSettlementAction |
| 微信拉起支付（S5） | `apps/uni-user/src/platform/wechat-payment.ts` | getWxLoginCode → resumeWechatPayment → uni.requestPayment |
| 渠道无关入口（S5） | `apps/uni-user/src/platform/payment.ts` | 小程序走微信建单+拉起；H5 保留支付宝 WAP |
| 支付 API（S5） | `services/api/api-payment.js` | createWechatOrder / resumeWechatPayment / getWechatPaymentStatus / getPaymentStatusByChannel |

- `WechatTransaction.amount` **可选**：未支付查询可缺省；SUCCESS 强制金额、交易号、成功时间齐全。业务层先检查状态/金额，不直接解引用 NOTPAY 的 amount。
- 微信 total 为正整数分，协议当前检查 int32 上限 2,147,483,647；这是字段范围，不代表商户实际可收额度。订单 Decimal 存储上限由 `MAX_ORDER_STORAGE_AMOUNT_MINOR=9,999,999,999` 表达。后续建单前兼顾渠道/业务上限，不能先创建超渠道额度订单再让协议拒绝。
- 商品每 SKU 归并后与整单数量合计均 ≤99；userId/requestId/skuId 最长128且无首尾空白，shopId/itemId 为 Prisma Int 范围内的正整数字符串。
- 幂等比较只比商品身份/数量，不含价格；下一波找旧单必须在重新查价前，避免菜单变化修改原金额。
- SKU 按数据库 sku_id → food_id → specfoods.item_id 固定回退，不能按客户端指定切换；同身份对应多规格则拒绝。
- 快照返回不可变 state/stores，必须以可信后端 PAID 摘要调用；纯函数不自己认证网络来源。

## 3. 当前工作区必须保留

基线 6 个跟踪文件仍未提交：`.env.example`、`schema.prisma`、`configuration.ts`、`main.ts`、`order-draft.factory.ts`、`order-summary.mapper.ts`（均在 apps/server 内）。基线新 migration 与协议 service 也仍未提交。

第一波新增 9 个源码/测试文件：协议 `.spec.ts`；order 下 pricing/selection/money 的 3 个模块及 3 个 `.spec.ts`；uni-user 下 snapshot 模块及 `.test.ts`。协议 service 在原草稿基础上修改。本波10个源码/测试文件总2371行，其中新文件2040行。

- factory `insertPendingOrder` 已消费 `paymentChannel`/`checkoutRequestKey`，未传时显式写 `null`，旧入口行为不变。
- `order-summary.mapper.ts` 已输出 `paymentChannel`；`payment-response.dto.ts` 已补该字段并把 `tradeStatus`/`tradeNo` 描述改为渠道中性。**OpenAPI 产物已在 S2 重新生成**（`packages/api-types/openapi.json` 与 `generated/index.d.ts`），前端可据契约消费 `paymentChannel` 与两个微信接口。
- 已加安全边界：微信订单的 `approveRefund` 拒绝（资金未退不能标已退款）；支付宝查询/续付/回调对 `WECHAT` 订单全部隔离，不跨渠道改写。
- Prisma Client 已 generate（7.9.1）、schema validate 通过；**未执行 DB 迁移**，不能据生成类型声称列已存在。

## 4. 主会话实际验证

| 检查 | 结果 |
|---|---|
| 第一波10个文件局部 ESLint | 最终通过，无错误/警告 |
| 后端最终相关 Jest（S1 集成后） | 订单+支付整棵 10 suites / **142 tests 通过**（含微信退款阻断、支付宝渠道隔离 4 项新增 + 既有回归） |
| 快照 Vitest | 1 file / **46 tests 通过**（最终补丁已复验） |
| 后端 nest build | exit 0 |
| uni-user vue-tsc --noEmit | 通过（最终补丁已复验） |
| 改动文件 ESLint | 0 error；剩 24 条既有 `(prisma as any)` 全仓惯例 warning，非本波引入 |
| Prisma generate / validate | 通过；无数据库写入 |
| git diff --check | 通过；新文件另经局部 ESLint 检查 |

### S6 会话实际验证（真实执行，非推测）

| 检查 | 结果 |
|---|---|
| 后端全量 Jest | **49 suites / 794 tests 通过** |
| 后端 nest build | exit 0 |
| 后端支付相关 lint | 0 error；21 条既有 `no-explicit-any` warning |
| 前端全量 Vitest | **6 files / 108 tests 通过** |
| 前端 type-check | 通过 |
| mp-weixin 构建 | 成功 |
| `pnpm validate:uniapp` | 通过 |
| Prisma validate / 生成物一致性 | schema 有效；生成物无差异 |
| API 契约核对 | 3 个微信路径 + 5 个 Wechat schema；alipay operationId 未变 |
| web-user 影响 | 零改动；其查单走支付宝接口，微信单被 S1 隔离只回本地快照，不存在假 PAID |

**回归中发现并修复的真实缺陷**：S3 的到账写入与履约状态推进分属两个事务，进程在两步之间崩溃会留下 `status=PAID` 但 `fulfillmentStatus=PENDING_PAYMENT` 的订单（用户看到已付款、商家看不到待接单）。已把履约推进并入同一事务，并移除因此不再使用的 `OrderWorkflowService` 注入。单元测试里 `syncPaymentStatus` 是 mock，两步永远都成功，所以这个窗口只在真实运行中存在——这是单测绿但链路有洞的典型例子。

### S5 会话实际验证（真实执行，非推测）

| 检查 | 结果 |
|---|---|
| 新增纯函数测试 | `vitest run src/utils/payment-flow.test.ts` → **17 项通过** |
| uni-user 全量测试 | **6 files / 108 tests 通过** |
| uni-user type-check | `vue-tsc --noEmit` 通过 |
| mp-weixin 构建 | 成功 |
| 产物条件编译核对 | 小程序包中 `createAlipayWapPayment` **0 处**、`window.location` **0 处**；支付页只出现「微信支付」；`uni.requestPayment` / `wxpay` / `signType` 均在产物中 |
| `pnpm validate:uniapp` | 通过，未升级依赖 |
| S5 文件 ESLint | 0 error |

过程中自己发现并修掉三处问题：
1. `--fix` 把两个测试标题改成了 `pAID` / `cLOSED`，已改回可读中文标题。
2. 金额刷新原本把「应付总额」拆成 `goodsAmount` 再清零配送费，语义错且易被后续误改；改成 `payableAmountOverride`。
3. 金额不一致时 `createdOrderNo` 仍保留，下次点击会直接「只续付」，用户没确认新价就被扣款；已在该分支清空单号，并要求用 `shownAmountBeforeRequest`（发起前的展示价）比对，避免拿覆盖后的值自称一致。

### S4 会话实际验证（真实执行，非推测）

| 检查 | 结果 |
|---|---|
| 新增纯函数测试 | `vitest run src/utils/checkout-entry.test.ts` → **17 项通过** |
| uni-user 全量测试 | **5 files / 91 tests 通过**（快照 46 + 结算入口 17 + 既有 28） |
| uni-user type-check | `vue-tsc --noEmit` 通过（首轮 2 个类型错误：`CartStore` 导入来源错、测试夹具形状不全，均已修） |
| mp-weixin 构建 | `build:mp-weixin` 成功（仅 Sass legacy API 弃用警告，非本次引入） |
| S4 文件 ESLint | 0 error（`--fix` 仅作用于本波 6 个文件；已核对 store-cart/store-user/shop.vue 头部注释未被改动） |

### S3 会话实际验证（真实执行，非推测）

| 检查 | 结果 |
|---|---|
| 后端 nest build | exit 0 |
| 后端全量 Jest | **49 suites / 794 tests 全通过**（微信子树 100 项，含新增到账 11 项） |
| 新增到账测试 | 覆盖：金额一致才入账、验签失败不碰库、金额不符拒绝、商户号不符拒绝、重复通知不重复入账、已关闭单收到成功通知回失败、查单未支付只记 tradeStatus、查单成功走同一入口、查单 null 不改状态、refresh=0 不访问微信、他人订单拒绝 |
| S3 文件 ESLint | 0 error；23 条既有 `no-explicit-any` warning |
| `pnpm api:generate` | 成功；新增 `/api/payments/wechat/status/{orderNo}`，notify 按设计不进契约 |
| 真实 HTTP 冒烟（起 `dist/main.js`） | 无签名/空体通知均回 **HTTP 200 + `{code:"FAIL"}`**，没被全局过滤器包成 500；未登录查单/建单均 401。测完已关闭该临时进程 |

测试暴露并修正了一处实现错误：金额校验原本放在状态判断之前，导致未支付查单（微信可能不返 amount）被误判为「金额不符」而报错。已改为只在准备入账（SUCCESS）时比对金额。

### S2 会话实际验证（真实执行，非推测）

| 检查 | 结果 |
|---|---|
| 后端 nest build | exit 0（首轮 8 个 TS2307 是 `wechat/` 子目录相对路径少一级，已修） |
| 后端全量 Jest | **49 suites / 783 tests 全通过** |
| 微信子树 Jest | 2 suites / 89 tests 通过（协议 78 + 业务 11） |
| S2 相关文件 ESLint | 0 error；17 条既有风格 `no-explicit-any` warning，非本波新规则 |
| `pnpm api:generate` | 成功；新增 `/api/payments/wechat/create`、`/api/payments/wechat/resume` 与 5 个 Wechat schema，仅 2 处描述文案改动、无接口删除 |

同时修复了一处**已存在的**回归：上一提交 `e5a5cb8` 新增的 `CustomerAuthController.updateNickname` 没有登记进 Swagger 契约矩阵，导致 `swagger-response-coverage.spec.ts` 失败。已补 `updateNickname` 条目（200；400/401/403/500），这是既有遗漏，不是 S2 引入。

协议首次测试失败是测试帮助函数把“省略 associated_data”写成了 JSON null；主会话修为真正省略字段，未放松服务端对 null 的拒绝。并补订单号尾部换行、快照 ID 尾部空白校验。

## 5. 后续风险与授权边界

1. **仍未解**：仅 SKU+qty 能保留累加新增数量，但无法区分“删掉旧商品后重加同 SKU”。S4 接的是精确扣减，这一场景仍会多扣；要彻底解决需要商品代次或编辑历史，属后续增强，当前行为已在 HANDOFF 与代码注释中标明。
2. 快照 state 与购物车必须一起持久化；断电/重启原子性、账号切换与过期清理尚未实现。消费标记不能付款后随意删除。
3. 无签名错误响应只报失败；只有验签成功的404 ORDER_NOT_EXIST 返回null。首次尚未预支付的建单流程不能依赖“所有404都会返回null”，需明确首次/续付状态设计。
4. S3 已接通到账：通知验签→商户身份→金额核对→事务内条件更新写 PAID。**但全链路仍未在真实商户下跑过**；DB 迁移未执行；`notifyUrl` 需公网 HTTPS 才能被微信访问。
5. `resume` 的签约/续付边界：当前只允许 PENDING 且渠道为 WECHAT 的订单，PAID 会 400 拒绝；未支付状态直接复用原单重下预支付，不做本地预支付单号缓存——微信侧同单号重复下单是允许的。
6. **S5 只做到了代码与构建层**：`uni.requestPayment` 的调用、参数、条件编译已在产物中核对，但**没有商户号/AppID/APIv3 Key/公钥，微信开发者工具也连不上，因此没有任何真实付款验证**。不能据此宣称用户已经能实付。
7. DB 连接目标未确认、迁移/并发 DB 验收未做。
7. 未获得 commit/push/merge、生产配置/迁移或真实付款授权；不 reset/clean/stash 已有成果。

## 6. 新会话提示

```text
微信支付 S0–S6 已完成（代码层），计划内批次执行完毕。不要再开新批次重复实现。

若要推进上线（L1），需用户明确授权，且先确认：
1. 商户号/AppID/API 证书/微信支付公钥/APIv3 Key 是否齐备；
2. 公网 HTTPS 回调地址与小程序 request 合法域名；
3. 是否授权在目标数据库执行 20261112000000_add_wechat_payment_channel 迁移。

启用步骤、故障排查、真机验收清单见 docs/engineering/019-wechat-pay-enablement.md。
未经单独授权：不提交、不迁移数据库、不部署、不真实付款。
```
