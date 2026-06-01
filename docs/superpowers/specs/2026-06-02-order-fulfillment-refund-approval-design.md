# 订单履约与退款审批中台化设计

## 背景

当前项目已经具备三端 workspace、NestJS 后端、Prisma 数据层、管理端动态路由、权限菜单、操作日志、用户端请求策略和支付流程。下一步要把项目从“外卖仿站”升级成更像企业项目的“外卖运营中台”，重点不是堆新技术，而是补齐真实业务系统常见的状态流转、审批、权限、审计和质量门禁。

第一期采用“两者兼顾”的策略：业务上做订单履约和退款审批闭环，工程上补最小 CI、核心测试和健康检查。

## 目标

1. 建立订单履约状态机，避免订单状态被前端或接口随意改写。
2. 建立退款申请和后台审批流程，让订单从支付到售后形成完整闭环。
3. 增强关键业务动作审计，能追踪谁在什么时候对哪个订单做了什么。
4. 接入现有后台权限体系，让不同角色只能看到和执行允许的操作。
5. 补充最小工程化保障，包括核心单测、健康检查和 CI 质量门禁。

## 非目标

1. 本期不做复杂工作流引擎，不引入 BPMN 或低代码流程设计器。
2. 本期不拆微服务，不引入消息队列作为主流程依赖。
3. 本期不做完整商家入驻审批、骑手调度、优惠券营销和财务结算。
4. 本期不做 Kubernetes、灰度发布、链路追踪平台等重运维能力。

## 推荐方案

本期采用“订单状态机 + 退款审批 + 审计日志 + 最小工程化”的中等方案。

相比只做订单状态机，这个方案更接近企业系统的真实复杂度：订单有正常履约流，也有异常售后流；后台操作受权限约束；关键动作能审计；代码有测试和 CI 兜底。相比一次性加入商家入驻审批、Docker 部署、数据权限全量改造，它的范围更可控，更适合第一期完成并沉淀成简历亮点。

## 业务状态设计

订单状态拆成两个稳定维度，避免“订单正在制作中”和“订单退款申请中”互相覆盖。

履约状态 `fulfillmentStatus`：

- `PENDING_PAYMENT`：待支付
- `PAID`：已支付，待商家接单
- `ACCEPTED`：商家已接单
- `PREPARING`：制作中
- `DELIVERING`：配送中
- `COMPLETED`：已完成
- `CANCELED`：已取消

退款状态 `refundStatus`：

- `NONE`：无退款
- `REQUESTED`：退款申请中
- `APPROVED`：退款已同意
- `REJECTED`：退款已驳回

履约合法流转由后端统一维护：

- `PENDING_PAYMENT -> PAID`
- `PAID -> ACCEPTED`
- `ACCEPTED -> PREPARING`
- `PREPARING -> DELIVERING`
- `DELIVERING -> COMPLETED`
- `PAID | ACCEPTED | PREPARING -> CANCELED`，仅限用户取消或退款同意等终止场景。

退款合法流转由后端统一维护：

- `NONE -> REQUESTED`，仅允许在 `PAID | ACCEPTED | PREPARING` 下申请。
- `REQUESTED -> APPROVED`，同意后履约状态进入 `CANCELED`，支付状态进入退款完成语义。
- `REQUESTED -> REJECTED`，驳回后履约状态保持原状态，订单继续正常流转。

前端展示可派生组合状态，例如“制作中 / 退款申请中”“已取消 / 已退款”“制作中 / 退款已驳回”。

前端不直接提交目标状态，而是调用动作接口。后端根据当前状态、操作者权限和动作类型计算下一个状态。

## 后端设计

### 数据模型

优先复用现有 `PaymentOrder`，补充履约和退款相关字段，避免第一期引入过多迁移成本。

建议字段：

- `fulfillmentStatus`：履约状态。
- `refundStatus`：退款状态，使用 `NONE / REQUESTED / APPROVED / REJECTED`。
- `refundBaseFulfillmentStatus`：申请退款时的履约状态，用于退款驳回后继续展示和流转。
- `refundReason`：用户申请退款原因。
- `refundRejectReason`：后台驳回原因。
- `acceptedAt`、`preparingAt`、`deliveringAt`、`completedAt`：关键履约时间。
- `refundRequestedAt`、`refundedAt`、`refundRejectedAt`：关键售后时间。

新增业务动作日志模型 `OrderActionLog`，记录订单级审计信息：

- `orderNo`
- `operatorId`
- `operatorName`
- `action`
- `fromStatus`
- `toStatus`
- `remark`
- `createdAt`

现有 `OperationLog` 继续记录 HTTP 操作层日志，`OrderActionLog` 记录业务语义层日志，两者职责不同。

### 服务边界

新增或扩展订单服务时，核心逻辑分三层：

1. `OrderTransitionPolicy`：纯函数或轻服务，维护合法状态流转表和动作到状态的映射。
2. `OrderWorkflowService`：处理订单动作、权限检查、事务更新和审计日志。
3. `OrderAdminController` / 现有 admin 订单控制器：暴露后台操作接口，只负责接收 DTO 和返回结果。

状态机判断必须放在后端服务层，不能依赖前端按钮隐藏来保证安全。

### 接口设计

后台动作接口建议使用明确动作名：

- `POST /api/admin/commerce/orders/:orderNo/accept`
- `POST /api/admin/commerce/orders/:orderNo/start-preparing`
- `POST /api/admin/commerce/orders/:orderNo/start-delivery`
- `POST /api/admin/commerce/orders/:orderNo/complete`
- `POST /api/admin/commerce/orders/:orderNo/refund/approve`
- `POST /api/admin/commerce/orders/:orderNo/refund/reject`

用户端退款申请接口：

- `POST /api/orders/:orderNo/refund/request`

订单详情接口需要返回：

- 当前履约状态
- 当前退款状态
- 可执行动作列表
- 操作日志列表

可执行动作列表由后端计算，前端只负责展示，避免前后端权限和状态规则分叉。

## 管理端设计

管理端复用现有后台结构，不新建一套风格不同的页面体系。

### 页面能力

订单管理页增强为：

- 查询条件：订单号、用户、商家、履约状态、退款状态、时间范围。
- 列表字段：订单号、商家、金额、履约状态、退款状态、支付时间、更新时间。
- 行操作：根据后端返回的可执行动作展示接单、制作、配送、完成、同意退款、驳回退款。
- 详情抽屉或详情页：展示订单明细、状态时间线、退款信息、业务动作日志。

### 状态展示

状态展示使用统一配置映射：

- 状态文案
- 标签颜色
- 可操作按钮文案
- 二次确认文案

这些配置应放在订单领域模块内，避免散落在多个组件中。

### 权限接入

新增按钮权限建议：

- `commerce:order:accept`
- `commerce:order:prepare`
- `commerce:order:deliver`
- `commerce:order:complete`
- `commerce:order:refund:approve`
- `commerce:order:refund:reject`

前端按钮展示同时受两个条件控制：

1. 后端返回该订单当前可执行动作。
2. 当前用户拥有对应按钮权限。

后端仍必须做最终权限校验。

## 用户端设计

用户端第一期只补售后入口，不扩张成完整客服系统。

订单详情或订单卡片中，当订单处于允许退款的状态时展示“申请退款”。用户提交退款原因后，订单的 `refundStatus` 进入 `REQUESTED`。退款申请中展示审核状态；同意后展示已退款；驳回后展示驳回原因。

用户端请求继续走现有 HTTP 策略层，保留 loading、错误提示、登录态处理和日志记录。

## 错误处理

后端需要明确区分几类错误：

- 订单不存在：返回 404。
- 当前状态不允许该动作：返回 409。
- 权限不足：返回 403。
- DTO 校验失败：返回 400。
- 支付或退款外部服务失败：本期可用模拟结果，保留错误码和错误信息。

前端对 409 需要展示业务提示，例如“当前订单状态已变化，请刷新后重试”。这类错误常见于后台多人协作，是企业项目里很重要的体验细节。

## 测试设计

后端重点测试：

- 每个合法状态流转能成功。
- 非法流转返回 409。
- 无权限动作返回 403。
- 退款申请、同意、驳回能写入状态和动作日志。
- 操作日志失败不影响主流程。

管理端重点测试：

- 不同订单状态展示不同动作按钮。
- 无权限用户不展示对应按钮。
- 后端返回可执行动作变化时，前端展示同步变化。

用户端重点测试：

- 可退款订单展示申请入口。
- 退款申请中、已退款、已驳回展示正确状态。

## 工程化设计

本期补最小工程化闭环：

1. 后端新增 `/health` 或 `/api/health`，返回服务状态、时间戳和基础依赖状态。
2. GitHub Actions 增加质量门禁，执行 lint、type-check、test、build。
3. 保留现有 pnpm workspace 运行方式，不改变仓库结构。
4. 后端 Swagger 文档跟随新增接口更新。

CI 不追求覆盖所有部署场景，第一期目标是让项目具备“提交前自动验证”的公司项目感。

## 实施顺序

1. 后端状态枚举、流转策略和单元测试。
2. Prisma 模型扩展和 seed 数据补充。
3. 后端订单动作接口、权限校验和动作日志。
4. 管理端订单列表动作、详情时间线和权限按钮。
5. 用户端退款申请入口和退款状态展示。
6. 健康检查、CI 和文档更新。

## 简历表达

可沉淀为：

> 将外卖项目订单模块升级为运营中台履约闭环，设计订单状态机与退款审批流程，后端统一维护合法状态流转并输出可执行动作，管理端基于按钮权限和订单状态动态渲染操作入口；同时新增订单业务动作审计、核心状态机单测、健康检查与 CI 质量门禁，提升复杂业务场景下的可维护性和可追踪性。

## 风险与控制

1. 订单模型过度扩张：第一期优先复用 `PaymentOrder`，只补履约和退款字段。
2. 前后端状态规则重复：以后端返回可执行动作作为前端展示依据，前端只做权限和 UI 映射。
3. 审批流过度设计：第一期只做退款审批，不抽象通用工作流引擎。
4. 工程化范围失控：第一期只做健康检查、CI 和核心测试，不扩张到完整部署平台。
