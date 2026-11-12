# uni-user 微信支付接入实施书（按会话定点执行）

> 配套：[计划书](./01-plan.md) → 本实施书 → [短交接台账](./HANDOFF.md)。
> 本文件描述待执行步骤，不是完成报告。**新会话只读自己的 S 编号章节与第 0/8 节，不全读所有批次。**
> 本会话只落文档，不继续实现支付代码；下一开发会话从 S0 开始。

## 0. 每个会话共用的开场步骤

1. 阅读 `HANDOFF.md`，确认当前编号、依赖状态、未提交改动和阻塞项。
2. 阅读根 `CLAUDE.md` / `AGENTS.md`；修改源码前读 `docs/engineering/011-teaching-comments.md`；调整测试前读 `AI_TEST_POLICY.md`。本任务的金额、幂等、支付回调符合该政策第 1—4 类准入条件，只加关键测试。
3. 定点阅读计划书第 1、3、5 节与本文件当前 S 编号。没有协议问题不再查外网；没有工程配置变化不全读 uni-app 迁移约束。
4. 在仓库根记录 `git branch --show-current`、`git rev-parse HEAD`、`git status --short`、`git diff --stat`。应在 `feat/uni-user-wechat-pay`；不同则先确认，不自动切换/新建分支覆盖工作。
5. 对当前批相关未提交文件看 diff。**它们在新会话眼中是已有改动，不得擅自删除、重置或批量提交。** 分清计划内半成品和用户/其他任务修改。
6. 只读本批清单。清单中的“拟新增”是建议职责位置，不表示文件已存在；需改名时查清引用、更新交接，不复制另一份同职责实现。
7. 完成本批关键测试、类型/构建验证；更新 HANDOFF。达标后结束会话，不自动执行下一编号。

### 0.1 验证命令约定

以下是**待执行命令**，本计划落盘时没有执行代码检查：

```powershell
# 后端：明确文件/目录，默认不使用会自动修复全包的 lint 脚本
pnpm --filter @elm-platform/server exec eslint <本批相关文件>
pnpm --filter @elm-platform/server run build
pnpm --filter @elm-platform/server run test -- --runInBand <本批测试路径>

# Prisma：生成/静态检查不修改数据库；仍会更新生成文件，需检查差异
pnpm --filter @elm-platform/server run prisma:generate
pnpm --filter @elm-platform/server exec prisma validate

# 小程序：build 脚本不自带 type-check，必须分别运行
pnpm --filter @elm-platform/uni-user exec eslint <本批相关文件>
pnpm --filter @elm-platform/uni-user run type-check
pnpm --filter @elm-platform/uni-user run test:unit -- <本批测试路径>
pnpm --filter @elm-platform/uni-user run build:mp-weixin
pnpm validate:uniapp
```

- 把 `<...>` 替换成实际路径，不能原样执行占位符。
- 测试使用确定的路径，记录 suites/tests 数；0 tests/passWithNoTests 不算通过。
- 后端测试与前端测试串行，必要时按现有基线指引设置 Node 堆大小；不先跑全仓 turbo 测试。
- 自动修复仅针对已读取且属于本批的文件，修复后看 diff，避免卷入旧注释或其他工作。
- `pnpm api:generate` **当前需要运行中的本地后端**，证据：`packages/api-types/scripts/generate.ts:22-37`。启动/生成流程在 S2/S3 中按需要安排；不直接改长生成文件充当生成成功。
- 若需要启动服务完成本批验证，先按可用的 `run` skill 执行；明确进程归属，不杀用户的既有服务、不留下无说明的长驻进程。

## 1. S0：当前半成品收口

**目标**：让已有代码有真实验证基线，记录哪些只是预备字段，防止后来会话误把文件存在当成功接入。

### 1.1 只读清单

- `apps/server/src/modules/payment/wechat/wechat-pay.service.ts`（已新增，未注入）
- `apps/server/src/config/configuration.ts`、`.env.example`
- `apps/server/prisma/schema.prisma` 的 PaymentOrder 段
- `apps/server/prisma/migrations/20261112000000_add_wechat_payment_channel/migration.sql`
- `apps/server/src/main.ts` 的 rawBody 配置
- `apps/server/src/modules/order/order-draft.factory.ts` 的参数与写入段
- `apps/server/src/modules/order/order-summary.mapper.ts`
- 按需：后端 package/tsconfig、现有 payment tests 的 mock 格式、官方协议对应页面。

### 1.2 操作

1. 核对迁移表名、字段映射、nullable/unique 兼容性，禁止对旧行猜测后回填微信渠道。
2. 检查新协议 service 的签名串、时间戳、原文验签、序列号、解密、超时、错误响应验签规则与官方接口一致；尤其不要假定所有非成功响应都有可验签头。
3. 使用本地生成的测试 RSA 密钥与 AES-GCM 数据、mock fetch 验证，不加载真实商户私钥、不发真实网络收款。测试覆盖正确签名、正文被改、错误公钥 ID、无效密文、过期时间、超时/网络错误及未配置。
4. 修本批协议/配置/类型问题，不新增 Controller，不接前端。factory 的可选新字段尚未持久化属于 S1 明确待办，不在此宣称已支持幂等。
5. 运行局部 ESLint、协议测试、Prisma generate/validate、后端 build。未授权/未确认开发数据库前不执行迁移。

### 1.3 结束条件

- 已有源码通过可执行静态检查与协议关键测试，缺配置不会伪造成功。
- HANDOFF 明确新协议尚未装配、字段写入/DTO/契约待 S1/S2 完成。
- 若迁移未实跑，状态写“静态验证通过，数据库验证未执行”，不能写“迁移完成”。

## 2. S1：可信金额、建单幂等与渠道边界

**依赖**：S0。**目标**：完成可单独测试的可信微信订单业务能力，不接收银台。

### 2.1 只读/拟改清单

- `apps/server/src/modules/order/order-draft.factory.ts`
- `apps/server/src/modules/order/order-workflow.service.ts`
- `apps/server/src/modules/order/order-summary.mapper.ts`
- `apps/server/prisma/schema.prisma` 的 Restaurant/Food/PaymentOrder 段
- `apps/server/src/modules/payment/payment.service.ts`（支付宝隔离）
- `apps/server/src/api/customer/payment/dto/payment-response.dto.ts`
- 按需：真实 specfoods 装配/测试样例、订单 transition policy。
- 拟新增：`modules/order/order-pricing.service.ts`、金额/选择归一化纯函数、相关测试；微信订单建单能力可置于 `modules/payment/wechat/wechat-payment.service.ts`，避免 PaymentService 变成混合大文件。

### 2.2 操作

1. 查清数据库 specfoods 的 SKU/price 形态与前端实际 ID。校验真实商家存在、SKU 属于商品及本店、qty 为受限正整数；归并重复项或明确拒绝，不能重复收费。
2. 查服务端配送费和起送金额；客户端 title/shopName/unitPrice/deliveryFee 均不是收款真相。计算使用整数分，不用浮点 sum 后 toFixed 掩盖误差。
3. 用权威数据构建订单快照，复用 `buildOrderSubject`、订单号、租户解析和 `insertPendingOrder`，但**不要复用客户端价格算法作为可信金额**。扩展 factory 的可选字段实际落库；保持旧入口不无故变更行为。
4. 微信创建时写渠道与用户隔离的 checkoutRequestKey。重复请求先找原单，比较商家+规范化 SKU/数量，不重新查价改原单；唯一冲突后读取原单完成并发幂等，相同键不同内容 409。
5. 新微信订单与支付宝 create/resume/status/notify 隔离；已有 null 的旧语义保留。微信续付仅支持 WECHAT，历史占位/支付宝单提示重新结算，不未经确认做渠道迁移。
6. 摘要+Swagger DTO 加 paymentChannel，交易号/交易状态的说明不再限定支付宝；生成契约随接口更新一起完成，不能先让前端猜新增字段。
7. 在真实退款接入前，阻止微信订单审批设置 APPROVED/refundedAt。允许申请不等于可以自动退钱；必要文案/影响清楚交接，不暗中给所有渠道套同一阻断。
8. 关键测试：价格篡改、外店 SKU、无效数量/重复项/金额边界、同键重试/冲突、跨用户隔离、菜单价格变化后原单快照、渠道隔离、退款误标阻断。

### 2.3 结束条件与交付

- 可信订单能力及失败路径有测试；条件允许时在已确认开发/测试数据库验证唯一约束与并发创建。
- 保留 `POST /orders` / 旧支付宝 URL，不把全仓历史建单改造扩大成本批任务；新增微信能力独立。
- 后端 build 与相关测试通过；契约生成若环境阻塞明确登记，S2 接口冻结前必须完成。
- HANDOFF 记录已选字段、金额边界、幂等比较规则、实际类名和数据库执行状态。

## 3. S2：微信预支付业务与 API 契约

**依赖**：S1。**目标**：完成后端获取原生支付参数，给消费端稳定契约；到账更新在 S3 完成。

### 3.1 只读/拟改清单

- S1 的微信订单业务与价格能力（优先读导出接口，不再全读旧调研）
- `modules/payment/wechat/wechat-pay.service.ts`、拟新增/补全 `wechat-payment.service.ts`
- `modules/payment/payment.module.ts`
- `api/customer/customer-api.module.ts`、`api/customer/payment/customer-payment.controller.ts`
- 拟新增微信 Controller/DTO（仍位于 `api/customer/payment/`）
- `CustomerAuthGuard` / rawResponse / Swagger 响应装饰器按需
- `packages/api-types/scripts/generate.ts`，生成物只查看相关 operations/schemas。

### 3.2 推荐接口（本节是目标契约，不是已存在 API）

| 功能 | 实现位置 | 说明 |
|---|---|---|
| 微信可信建单 | `POST /api/payments/wechat/create` | `{ requestId, shopId, cartItems: [{ itemId, skuId, qty }] }`；返回订单摘要，用户来自 JWT |
| 微信原单预支付/续付 | `POST /api/payments/wechat/resume` | `{ orderNo, code }`；鉴权、归属、渠道、最新状态预检；返回 `{ orderNo, payableAmount, paymentParams }` |
| 真正渠道分派的查单 | `GET /api/payments/status/:orderNo?refresh=1` | 返回统一摘要；WECHAT 查微信，ALIPAY/历史 null 按旧策略，不能全调支付宝 |
| 微信支付通知 | `POST /api/payments/wechat/notify` | S3 装配；不要求消费者 JWT，靠微信验签/解密/业务核对 |

`paymentParams`：`timeStamp: string`、`nonceStr: string`、`package: string`、`signType: 'RSA'`、`paySign: string`。不返回 AppSecret、私钥、APIv3 密钥、session_key。API DTO 的数组项必须有完整 Swagger 描述和校验，不能生成空 schema。

### 3.3 操作

1. 未配置在创建新的微信单之前拒绝，按钮重试不能持续生成空支付单。
2. 验证消费者归属与 WECHAT 渠道；换取 openid 后对已落库的金额下单，不相信前端再传金额。不新增微信账号登录业务。
3. 预支付前主动核对最新微信状态：PAID/CLOSED 不再生成付款参数。签名预支付调用的消费端页面直到 S3 闭环验收后再接入；分阶段不能宣称可收款。
4. 新 Controller 注册在对应 API module；业务 module 只导出 Provider。保留旧 Controller operationId/URL/Guard/状态码/响应 schema。
5. 使用已有 `rawResponse` 与文档装饰器，明确 create 201、resume 200、业务冲突/权限/未配置错误；包装行为不能让前端误判。
6. 新通用查单接口初期如只支持本地状态必须显式记录限制，S3 完成真实 refresh 分派，不允许留下“refresh=true 其实不查渠道”的静默语义。
7. 测创建/续付入参、JWT 归属、跨渠道、未配置、code 无效、已支付不再调预支付、传输未知失败仍保留原订单。
8. 后端 build、相关测试；启动本地后端并执行 `pnpm api:generate`，核对新端点/schema 与 paymentChannel 已同步。

### 3.4 结束条件

- 预支付 API 与消费端字段冻结并由生成契约核实；HANDOFF 标注“预支付接通，通知到账未验收”。
- 记录类名/方法名/实际 URL、错误语义、生成命令结果，S4/S5 不再重复发明接口。

## 4. S3：查单、通知与原子到账

**依赖**：S2。**目标**：后端支付闭环真正完成。

### 4.1 只读/拟改清单

- `modules/payment/wechat/` 两个 service 的当前接口与相关测试
- `modules/order/order-workflow.service.ts`、必要 transition policy
- `api/callbacks/callbacks-api.module.ts`
- 拟新增 `api/callbacks/wechat/wechat-notify.controller.ts`
- `main.ts` rawBody、统一查单 Controller、支付宝分派边界
- 按需：TransformInterceptor、异常 filter、API module 装配与生成脚本。

### 4.2 操作

1. Nest 保留 rawBody；通知 Controller 使用原始 Buffer/headers，业务层不反向依赖 HTTP DTO。核对通知的官方成功应答/失败状态，不能被全局包装器改成不匹配的格式。
2. 先验签再解密、检查通知类型；核对 AppID、商户号、订单号、币种、总金额、交易号和成功时间的合法性。非法通知不更新 DB，不吞错后回成功。
3. 查询与通知共用同一份已验证交易应用入口。状态/履约更新置于事务和条件写入中，不能读取旧对象后无条件 update。
4. 覆盖查询回包落后于通知、重复通知、通知与接单并发、支付与关闭冲突；已 PAID 或已推进履约不得被旧结果降级。
5. 官方确认 NOTPAY/USERPAYING 等非终态保持 PENDING；仅有可信终态才更新 CLOSED。不因网络失败、签名失败、用户点取消就关单。ORDER_NOT_EXIST 只用于未预支付的合理场景，不泛化所有 404。
6. 通用 refresh 按持久化渠道分派，所有查询先校验归属；refresh=false 只读本地。旧支付宝查询/通知不准写微信单。
7. 自动化测试包含真实本地签名/解密数据、身份金额不匹配、重复/并发/迟到响应、失败应答与响应包装。mock 事务测试不能代替实际 DB 原子性证明；开发/测试数据库可用时追加最小并发验收，否则标为阻塞。
8. 后端 build、支付/订单相关测试、API 契约再生成。必要 API smoke 使用本地替身，不发真实付款、不暴露测试免验签入口。

### 4.3 结束条件

- 后端闭环通过关键检查；HANDOFF 记录状态映射、事务入口、并发验证证据和任何数据库阻塞。
- 缺凭证下仍保持关闭；不可把单元测试成功写成微信线上成功。

## 5. S4：结算、恢复快照与精确清车

**依赖**：S2 稳定契约、S3 状态语义。**目标**：先建安全的前端状态基础，再接付款页。

### 5.1 只读/拟改清单

- `apps/uni-user/src/utils/payment.js`、`utils/cart.js`
- `stores/modules/store-cart.js`
- `pkg-shop/shop.vue`、`pkg-shop/composables/useShopPageData.js`
- `pages/cart/cart.vue`、`pages/cart/composables/useCartDetail.js`
- 按需：`useShopCart.js`、平台 storage、用户退出账号处理、相关测试结构。
- 拟新增可独立测试的结算选择/快照消费纯函数；不把所有业务都塞进 store。

### 5.2 操作

1. 购物车只能从真实单一商家选择建单；跨商家选择给出可操作提示，不自动只收第一个商家的钱。去掉新微信流程对虚拟 cart-checkout 的依赖。
2. 商家页/购物车入口都生成稳定 requestId 与商品数量快照，包含用户归属；建单前持久化、未知响应沿原 ID 重试。
3. 快照能按 requestId/orderNo 恢复，多张未完成订单不互相覆盖；定义退出登录/切用户、CLOSED/PAID、主动放弃的替换和清理时机。不要用“有草稿就永远复用”守卫。
4. PAID 只扣该快照购买数量，保留后来新增量和未购买商品；重复成功查询或重启不会再次扣。设计存储更新顺序及消费标记，不仅防内存内重复。
5. 移除/停用回商家时“清全店”路径，改为同一个已确认订单消费能力；必要死代码按项目 extras 留档策略处理，不全仓清理。
6. 共用业务的 web-user 引用需要定点核对，不为小程序特有 requestId/channel 改 H5 收银台；如共享函数签名确实变更，明确同步调用方和验证范围。
7. 最小测试：多商家拦截、同 SKU 数量、付款期间增减商品、旧单迟到/新草稿覆盖、重复消费、跨用户、重启恢复。运行局部 ESLint、相关 Vitest 与 type-check。

### 5.3 结束条件

- 快照创建、绑定、消费/清理有稳定函数签名和测试。
- HANDOFF 给出 S5 应调用的方法，不让 S5 再设计另一套 pendingCheckout。

## 6. S5：小程序付款、续付与结果页

**依赖**：S3、S4。**目标**：接真实协议与前端状态基础。

### 6.1 只读/拟改清单

- `apps/uni-user/src/platform/payment.ts`
- `services/api/api-payment.js`、`services/api/endpoints/payment.endpoints.js`
- `pkg-order/payment.vue`、`pkg-order/PaymentResult.vue`
- `pkg-order/composables/useContinuePayment.js`
- S4 提供的快照/消费 API（读导出接口和测试）
- `services/http/request.js` silent 分支；按需 navigation/routes 与错误类型。

### 6.2 操作

1. 支付 API 全走现有 HTTP 客户端与端点常量；加入微信 create/resume、通用状态 wrapper，删除“支付宝状态与渠道无关”的错误说明。
2. platform 层只管本端调起支付；业务只调用统一入口。MP-WEIXIN 使用 getWxLoginCode → 后端参数 → uni.requestPayment；H5 保留既有跳转，App 未实现不能冒充已支持。
3. 创建后即时保存 orderNo 和服务端摘要，UI 金额以权威摘要为准。若与展示估价不同，先刷新展示并要求确认，不能未告知就直接扣不同金额。
4. 支付结果至少区分收银台完成、取消、失败/未知；所有已建单结果携带单号。用户取消后不重复建单、不关闭本地订单；再次付先查原单。
5. 首次付、订单列表续付都进入同一到账确认与快照消费路径；已 PAID 不再拉收银台，旧非微信单显示重新结算提示。
6. 结果页用真正通用查单；只有 PAID 清车和写成功上下文。PENDING/查询失败保留恢复信息。页面隐藏/卸载停轮询，迟到响应有失效保护，返回页面可恢复查询。
7. 页面微信文案不再写支付宝；按钮锁在处理时直接忽略重复点击，不误提示“订单不完整”。错误由明确一层提示；只修 silent 相关分支并补覆盖，不扩展重试/缓存策略。
8. 最小测试针对 API 请求体/错误、流程锁/结果分类/未知恢复/原单续付/轮询退出，不写大规模 UI 快照。局部 ESLint、type-check、相关测试、mp-weixin build、版本校验。

### 6.3 结束条件

- 两条结算入口、首次付与续付均接通原单确认；源码与编译验证真实记录。
- 微信开发者工具不可连接/无真实凭证时，把运行时检查列为待验收，不能只凭 build 宣称用户能实付。

## 7. S6：整体回归与接入说明

**依赖**：S0—S5。**目标**：验证整条因果链并交付，不追加新功能。

### 7.1 定点材料

先看 HANDOFF 的检查记录与实际 API 契约、各批新增关键测试；出现具体缺陷再读相关实现，不全读所有工程报告。

### 7.2 操作与验收矩阵

| 功能 | 实现位置 | 说明 |
|---|---|---|
| 权威金额 | 订单查价测试/开发 DB | 篡改价格、外店 SKU、异常数量拒绝；原单金额固定 |
| 建单幂等 | 请求键/数据库唯一约束 | 重复点、响应丢失、并发同键只一单；不同内容冲突 |
| 原单支付 | 微信业务与 platform | 已支付、关闭、旧渠道不得再次微信预支付 |
| 可信到账 | 通知/主动查单/原子状态 | 伪签名、金额错拒绝；并发与迟到不降级 |
| 前端结果 | payment/PaymentResult/续付 | 取消/网络未知不重复建单；查询失败可恢复；隐藏停轮询 |
| 购物车 | 两条入口/快照消费 | 旧单不清新商品、重复查询不重复扣、跨账号隔离 |
| 退款边界 | 申请/审批业务 | 申请不是资金退款；微信审批不能虚报已退款 |
| H5 兼容 | 旧支付宝测试与受影响调用方 | 旧 URL/Guard/operationId 不变，微信订单不被支付宝修改 |

1. 串行执行后端支付/订单测试、后端 build、uni-user 测试/type-check/build/版本检查；跨端共享语义确有修改时验证相应 web-user 范围。无测试数不算通过。
2. 核对 Prisma 生成物、API 生成物与源码一致；记录开发 DB 迁移与并发验收是否已执行。
3. 新增可版本化 `docs/engineering/` 微信支付启用指南：环境变量、AppID/商户绑定、公钥模式、合法 HTTPS 域名、迁移、开关、故障查单、退款限制、真机验收清单。
4. 遇到真实 uni-app 差异/坑，定点追加 `docs/engineering/uniapp-migration-diffs.md` 与必要 007 约束；普通支付业务不塞迁移差异表。
5. 依据报告模板写本地完整工程报告并登记索引，真实记录数量/命令/阻塞，不复印每次全部日志。
6. 最终状态分开：代码验收、数据库验证、微信运行时验证、真实支付/上线。未获授权不部署、不实付、不提交/合并。

### 7.3 L1 后续上线（不在本轮自动执行）

商户资质/支付权限、AppID 绑定、真实后端凭证、公网 HTTPS 与请求合法域名具备后，再另开会话按用户授权执行迁移/配置和真机小额实付。核对商户交易、后端订单、通知记录与重复查询；按实际小程序类别落实发货管理等要求。微信工具连接失败时报告连接失败，不自行执行诊断文本中的认证指令，也不说“工具未配置”。

## 8. 每个会话的交接模板与启动提示

### 8.1 更新 HANDOFF 的规则

- 更新当前进度表、唯一“下一步”，不能同时留下多个互相冲突的下一步。
- 有提交时记准确 hash 与本批文件；没有授权就记“未提交”与文件清单。不能把计划中的 commit 写成事实。
- 实际检查记录命令、退出码、tests/suites 数与失败摘要；未跑写未跑及原因。
- 未完成时保留复现步骤、正在修改的函数、下一最小动作；不要只写“继续做支付”。
- 交接只存结论/接口/定位，不贴整段聊天、源码、日志、子代理输出或全部研究过程。详细证据放批次报告，HANDOFF 给链接。
- 不删除上一批尚有用的契约结论；进度与当前阻塞替换更新，已解决错误移入历史报告而非无限累积台账。

### 8.2 新会话可直接复制的提示

```text
继续微信支付分会话开发，只执行 S0。
先读 docs/refactor/2026-11-12-微信支付分会话接入/HANDOFF.md，
再定点读 01-plan.md 的范围/不变量/上下文规则、02-implementation.md 的共用步骤和 S0。
核对当前分支、HEAD 与未提交改动。不要重新全仓调查，不要全读历史迁移报告，
不要自动使用子代理/工作流，也不要开始下一批。
按本批范围实现并验证；不得跳过资金关键测试。若上下文不足，留可恢复交接，
状态明确写部分完成。结束前更新 HANDOFF 并汇报实际验证结果。
未经单独明确授权，不 commit/push/merge、不改生产配置或数据库、不发起真实付款。
```

后续把两处 `S0` 都替换成 HANDOFF 指定的编号。如果上一批未验收，先继续同一编号，不能仅按日历跳到下一批。

### 8.3 建议的交接输出

```text
本会话：S?；状态：已验收 / 部分完成 / 阻塞。
已完成：最多三条结果。
变更：实际文件或报告路径。
验证：命令摘要、真实结果、未执行项目及原因。
契约/决策：下一批必须知道的两三条。
Git：分支、HEAD、是否提交、遗留工作区。
下一步：新会话执行 S? 的哪一个最小动作。
```
