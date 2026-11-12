# 第一波并行开发约定

> 2026-11-12：用户明确授权三个子代理并行开发第一波。此安排覆盖原“逐会话串行”的执行方式，但不授权下一波、提交、数据库迁移或真实支付。
> 本文件只冻结第一波的边界；最终进度由 HANDOFF 记录。各代理不读整段历史聊天，不再派生代理。

## 1. 文件归属与集成

| 子代理 | 独占写入范围 | 交付 |
|---|---|---|
| A 微信协议 | `apps/server/src/modules/payment/wechat/wechat-pay.service.ts` 与同目录对应协议测试；必要配置测试 | 修正现有协议草稿，提供最小关键测试 |
| B 可信订单 | 新增 `apps/server/src/modules/order/order-pricing.service.ts`、`checkout-selection.ts`、`order-money.ts` 及对应测试 | 服务端查价、整数分与建单幂等比较规则 |
| C 结算快照 | 新增 `apps/uni-user/src/utils/checkout-snapshot.ts` 与对应测试 | 纯函数快照登记、绑单、PAID 后精确数量消费与幂等 |
| 主会话 | 交接/报告/本文件、必要生成物及集成验证 | 串行测试与构建、检查契约边界、真实更新进度 |

独占范围之外先向主会话说明，不擅自修改。尤其不修改共享 schema、factory、摘要、模块注册、HTTP DTO、Controller、已有 store、支付页面和 H5 代码。这些在后续依赖满足后顺序接入。

第一波交付不等于 S1/S4 整批完成：DB 建单唯一冲突恢复、渠道隔离、退款阻断、页面/持久化实际接入仍是后续任务。

## 2. 共有输入与金额

- 商品选择：`{ itemId: string, skuId: string, qty: number }`；店铺 `shopId: string`，消费者 `userId: string`。
- 前端报价、标题、配送费不属于可信建单输入；已有商品字段的兼容归一化放后续 API 接入边界，不由三个模块各猜一套。
- itemId/shopId 对后端本地目录为正整数字符串且不超过 Prisma Int 范围 2,147,483,647；skuId 必须匹配数据库实际 specfoods。userId/requestId/skuId 不接受首尾空白且最长 128 字符。qty 必须正整数；每 SKU 归并后以及整单数量合计均最多 99。同一 itemId+skuId 重复项归并，归并后仍校验上限；按键稳定排序。
- 可信金额内部全部整数分：`unitPriceMinor`、`totalPriceMinor`、`goodsAmountMinor`、`deliveryFeeMinor`、`payableAmountMinor`。存储到 Decimal 和旧响应的元单位转换留集成边界，不能让金额函数静默把无效输入归零。
- 订单服务建议出口：`OrderPricingService.priceSelection({ shopId, cartItems })` 返回 `{ shopId, shopName, tenantId, cartItems, goodsAmountMinor, deliveryFeeMinor, payableAmountMinor }`；cartItems 包含选择、服务端标题和整数分单价/小计。
- B 提供规范化选择、用户隔离请求键和比较选择是否相同的纯函数。比较只使用商家/商品身份/数量，不包括变化的价格；hash 或稳定串不能被当作数据库幂等已完成。

## 3. 微信协议出口

保持现有 `WechatPayService` 的公开意图：配置可用性、code 换 openid、`createJsapiPayment({orderNo, subject, total}, openId)`、`queryTrade(orderNo)`、`decodeNotification(headers, rawBody)`。

- `total` 是整数分，需校验正整数/协议范围；生成参数为 timeStamp/nonceStr/package/signType/paySign。
- query 返回可信微信交易，合理的订单不存在可返回 null；错误响应无签名/验签失败不能当成可信“订单不存在”。
- 协议层不写订单、不判断消费者归属、不注册 API。所有实际 fetch 在测试中用本地替身，不连接真实收款。
- 核对官方文档再写安全注释，不能把草稿中的假设当既定协议。

## 4. 快照纯函数出口

- C 使用真实 store 结构：`stores: [{ id, products: [{ itemId, skuId, quantity, ... }] }]`；只读取实际类型定义，不能重新全仓调查。
- 快照至少 `{ userId, requestId, shopId, cartItems, orderNo? }`，身份以字符串统一；requestId 由调用方传入，随机 ID 生成/uni storage/Pinia 接入留后续。
- 可登记多张快照：按用户+请求区分；同键不同选择拒绝，绑定订单后不能改成另一单。
- 只有输入的已确认后端摘要 `status='PAID'`、userId/orderNo/shopId 匹配快照才消费。函数不会自己判断网络/签名真伪，调用方必须从后端可信状态调用。
- 消费只减同商品+SKU 的购买数量，保留数量累加后的新增量；删除空商品/空店，缺失商品不减其他项。登记已消费状态，重复 PAID 不再扣。跨用户/未知订单/未付款不能改车。仅 SKU+qty 无法区分“原商品被删除后重加同 SKU”的新商品：后续 S4 须以商品代次/编辑历史或保守策略处理，不能把本波函数宣称为所有编辑场景安全清车。
- 返回不可变的新 stores 与新快照状态，不修改传入对象；状态持久化、消费与标记的落盘原子性留后续集成，不据纯函数测试宣称已解决断电窗口。

## 5. 验证与停点

- 三个代理各补关键测试，可局部 ESLint；不并行跑两套 Jest/全包构建。代理提交精确测试命令，由主会话统一串行执行；C 的轻量测试也统一排队，方便一份真实结果台账。
- 不读真实密钥、不修改环境凭证、不迁移数据库、不装新依赖、不提交/push/merge。
- 只返回：实际文件、公开函数签名、关键规则、局部检查、待跑命令、未完成事项。避免完整日志/源码回传。
- 本波结束后主会话更新 HANDOFF，再决定下一波；不自动启动 D/E 或页面接入。
