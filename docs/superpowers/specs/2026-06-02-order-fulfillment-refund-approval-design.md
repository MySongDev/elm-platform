# 订单履约与退款审批中台化设计

## 背景

当前项目已经具备三端 workspace、NestJS 后端、Prisma 数据层、PostgreSQL、Redis、JWT/Passport、Swagger、管理端动态路由、按钮权限、操作日志、用户端请求策略和支付宝沙箱支付流程。下一步要把项目从“外卖仿站”升级成更像企业项目的“外卖运营中台”，重点不是继续堆技术名词，而是补齐真实业务系统常见的状态流转、审批、权限、审计、冲突处理和质量门禁�?

第一期采用“两者兼顾”的策略：业务上做订单履约和退款审批闭环，工程上补最�?CI、核心测试和健康检查。第一期不追求一次性做成完整运营平台，而是优先把订单从支付到履约再到售后的主链路做扎实�?

## 目标

1. 建立订单履约状态机，避免订单履约状态被前端或接口随意改写�?
2. 建立用户退款申请和后台退款审批流程，让订单从支付到售后形成完整闭环�?
3. 增强关键业务动作审计，能追踪谁在什么时候对哪个订单做了什么、状态如何变化�?
4. 接入现有后台按钮权限体系，让不同角色只能看到和执行允许的订单动作�?
5. 明确支付状态、履约状态、退款状态的职责边界，避免把支付流程和履约流程混在一起�?
6. 补充最小工程化保障，包括核心单测、健康检查和 CI 质量门禁�?

## 非目�?

1. 本期不做复杂工作流引擎，不引�?BPMN 或低代码流程设计器�?
2. 本期不拆微服务，不引入消息队列作为主流程依赖�?
3. 本期不做完整商家入驻审批、骑手调度、优惠券营销和财务结算�?
4. 本期不做总部管理员和商家管理员的数据权限隔离；数据权限放到二期�?
5. 本期不做 Docker Compose、Kubernetes、灰度发布、链路追踪平台等重运维能力�?
6. 本期不做独立订单详情路由，管理端先用详情抽屉承载订单详情和动作日志�?
7. 本期不接真实支付宝退款接口，退款同意只更新本系统内的退款状态，保留外部退款失败语义�?

## 推荐方案

本期采用“订单状态机 + 退款审�?+ 按钮权限 + 业务动作审计 + 最小工程化”的中等方案�?

相比只做订单状态机，这个方案更接近企业系统的真实复杂度：订单有正常履约流，也有异常售后流；后台操作受按钮权限约束；用户退款和后台审批都能进入业务审计；状态冲突会返回明确业务错误；代码有测试�?CI 兜底。相比一次性加入商家入驻审批、数据权限、Docker 部署和完整监控，它的范围更可控，更适合第一期完成并沉淀成简历亮点�?

## 状态边�?

当前 `PaymentOrder.status` 已经表示支付状态，值为 `PENDING / PAID / CLOSED`。第一期不要复用这个字段表达履约状态，否则会把“支付已完成”和“商家待接单”等概念混在一起�?

本期订单状态拆成三个维度：

1. `status`：现有支付状态，�?`PaymentService` 维护�?
2. `fulfillmentStatus`：新增履约状态，�?`OrderWorkflowService` 维护�?
3. `refundStatus`：新增退款状态，�?`OrderWorkflowService` 维护�?

`PaymentService` 继续只负责支付单创建、支付状态查询、继续支付和支付回调。订单履约、退款申请、退款审批、动作日志写入统一放到订单工作流服务中，避免支付域和履约域混在一起�?

## 业务状态设�?

订单状态拆成支付、履约、退款三个稳定维度，避免“订单已支付”“订单制作中”“订单退款申请中”互相覆盖�?

支付状�?`status` 沿用现有字段�?

- `PENDING`：待支付�?
- `PAID`：已支付�?
- `CLOSED`：支付单已关闭�?

履约状�?`fulfillmentStatus`�?

- `PENDING_PAYMENT`：待支付�?
- `AWAITING_ACCEPTANCE`：已支付，待商家接单�?
- `ACCEPTED`：商家已接单�?
- `PREPARING`：制作中�?
- `DELIVERING`：配送中�?
- `COMPLETED`：已完成�?
- `CANCELED`：已取消�?

退款状�?`refundStatus`�?

- `NONE`：无退款�?
- `REQUESTED`：退款申请中�?
- `APPROVED`：退款已同意�?
- `REJECTED`：退款已驳回�?

支付和履约的衔接规则�?

- 创建支付单时，`status = PENDING`，`fulfillmentStatus = PENDING_PAYMENT`，`refundStatus = NONE`�?
- 支付成功后，`status = PAID`，`fulfillmentStatus` �?`PENDING_PAYMENT` 进入 `AWAITING_ACCEPTANCE`�?
- 支付关闭后，`status = CLOSED`，若尚未履约�?`fulfillmentStatus = CANCELED`�?
- 后台履约动作必须要求 `status = PAID`，不能对未支付或已关闭支付单执行接单、制作、配送、完成�?

履约合法流转由后端统一维护�?

- `PENDING_PAYMENT -> AWAITING_ACCEPTANCE`，仅由支付成功触发�?
- `AWAITING_ACCEPTANCE -> ACCEPTED`，商家或运营接单�?
- `ACCEPTED -> PREPARING`，开始制作�?
- `PREPARING -> DELIVERING`，开始配送�?
- `DELIVERING -> COMPLETED`，完成订单�?
- `AWAITING_ACCEPTANCE | ACCEPTED | PREPARING -> CANCELED`，仅限用户取消、退款同意等终止场景�?

退款合法流转由后端统一维护�?

- `NONE -> REQUESTED`，仅允许�?`AWAITING_ACCEPTANCE | ACCEPTED | PREPARING` 下申请�?
- `REQUESTED -> APPROVED`，同意后 `fulfillmentStatus` 进入 `CANCELED`�?
- `REQUESTED -> REJECTED`，驳回后 `fulfillmentStatus` 保持申请退款时的履约状态，订单继续正常流转�?

前端展示可派生组合状态，例如“制作中 / 退款申请中”“已取消 / 退款已同意”“制作中 / 退款已驳回”。前端不直接提交目标状态，而是调用动作接口。后端根据当前数据库状态、操作者身份、按钮权限和动作类型计算下一个状态�?

## 冲突和幂等规�?

企业后台常见多人协作和重复点击场景，本期需要明确冲突处理规则：

1. 同一订单不能重复申请退款；`refundStatus !== NONE` 时再次申请返�?`409 Conflict`�?
2. 已完成、已取消、未支付、支付关闭的订单不能申请本期退款，返回 `409 Conflict`�?
3. 已审批的退款不能再次审批；`refundStatus !== REQUESTED` 时同意或驳回返回 `409 Conflict`�?
4. 后台动作执行时以数据库当前状态为准，不信任前端传来的状态�?
5. 如果页面展示时订单可操作，但提交时订单状态已变化，后端返�?`409 Conflict`，前端提示“当前订单状态已变化，请刷新后重试”�?
6. 订单状态更新和业务动作日志写入应放在同一个数据库事务中，避免状态变了但审计缺失�?
7. 重复点击同一个非幂等动作不静默成功，除非当前状态已经明确等价；第一期统一返回 `409 Conflict`，让前端刷新�?

## 后端设计

### 数据模型

优先复用现有 `PaymentOrder`，补充履约和退款相关字段，避免第一期引入过多迁移成本�?

建议�?`PaymentOrder` 增加字段�?

- `fulfillmentStatus`：履约状态，默认 `PENDING_PAYMENT`�?
- `refundStatus`：退款状态，默认 `NONE`�?
- `refundBaseFulfillmentStatus`：申请退款时的履约状态，用于退款驳回后继续展示和流转�?
- `refundReason`：用户申请退款原因�?
- `refundRejectReason`：后台驳回原因�?
- `acceptedAt`：接单时间�?
- `preparingAt`：开始制作时间�?
- `deliveringAt`：开始配送时间�?
- `completedAt`：完成时间�?
- `canceledAt`：取消时间�?
- `refundRequestedAt`：退款申请时间�?
- `refundedAt`：退款同意时间�?
- `refundRejectedAt`：退款驳回时间�?

新增业务动作日志模型 `OrderActionLog`，记录订单级审计信息�?

- `id`
- `orderNo`
- `operatorId`
- `operatorName`
- `operatorType`：`ADMIN | CUSTOMER | SYSTEM`�?
- `action`
- `fromFulfillmentStatus`
- `toFulfillmentStatus`
- `fromRefundStatus`
- `toRefundStatus`
- `reason`
- `remark`
- `requestId`
- `createdAt`

现有 `OperationLog` 继续记录 HTTP 操作层日志，`OrderActionLog` 记录业务语义层日志。两者职责不同：前者回答“哪个接口被谁调用了”，后者回答“哪个订单发生了什么业务动作”。`requestId` 用于把两类日志关联起来�?

### 服务边界

核心逻辑分三层：

1. `OrderTransitionPolicy`：纯函数或轻服务，维护合法状态流转表、动作到状态的映射、可执行动作计算�?
2. `OrderWorkflowService`：处理订单动作、权限前置判断、事务更新、动作日志写入和 409 冲突抛错�?
3. `ElmAdminController` / 用户订单控制器：暴露后台和用户端动作接口，只负责认证、DTO 接收和返回结果�?

`PaymentService` 不承载履约状态机，不处理退款审批，不直接写 `OrderActionLog`。支付成功或支付关闭时，可以调用订单工作流服务提供的系统动作方法同步履约状态，也可以在第一期由支付状态查询返回时派生 `AWAITING_ACCEPTANCE`，但最终写入逻辑应收敛到订单工作流边界�?

状态机判断必须放在后端服务层，不能依赖前端按钮隐藏来保证安全�?

### 接口设计

后台动作接口使用明确动作名：

- `POST /api/admin/commerce/orders/:orderNo/accept`
- `POST /api/admin/commerce/orders/:orderNo/start-preparing`
- `POST /api/admin/commerce/orders/:orderNo/start-delivery`
- `POST /api/admin/commerce/orders/:orderNo/complete`
- `POST /api/admin/commerce/orders/:orderNo/refund/approve`
- `POST /api/admin/commerce/orders/:orderNo/refund/reject`

用户端退款申请接口：

- `POST /api/orders/:orderNo/refund/request`

订单列表或详情接口需要返回：

- 当前支付状态�?
- 当前履约状态�?
- 当前退款状态�?
- 可执行动作列表�?
- 退款原因和驳回原因�?
- 关键时间字段�?
- 业务动作日志列表�?

可执行动作列表由后端计算，前端只负责展示，避免前后端状态规则分叉�?

### 错误处理

后端需要明确区分几类错误：

- 订单不存在：返回 `404 Not Found`�?
- 未登录：返回 `401 Unauthorized`�?
- 当前用户无权访问该订单：返回 `403 Forbidden`�?
- 后台按钮权限不足：返�?`403 Forbidden`�?
- 当前状态不允许该动作：返回 `409 Conflict`�?
- DTO 校验失败：返�?`400 Bad Request`�?
- 外部退款服务失败：本期不接真实退款，只保留错误码和错误信息结构�?

前端�?`409 Conflict` 展示业务提示：“当前订单状态已变化，请刷新后重试”。这类错误常见于后台多人协作，是企业项目里很重要的体验细节�?

## 权限设计

当前项目已经�?`RequirePermissions` 装饰器和 `RolesGuard` 对按钮权限的支持。订单动作接口不能只使用 `@Roles('admin')`，必须接入按钮权限�?

新增按钮权限�?

- `commerce:order:view`
- `commerce:order:accept`
- `commerce:order:prepare`
- `commerce:order:deliver`
- `commerce:order:complete`
- `commerce:order:refund:approve`
- `commerce:order:refund:reject`

权限判断分两层：

1. 后端接口使用 `RequirePermissions` 做强校验�?
2. 前端按钮展示同时受“后端返回可执行动作”和“当前用户拥有对应按钮权限”控制�?

后台操作不是“管理员都能做”，而是按钮级权限控制。这样可以体现真实企业后台常见的权限闭环�?

## 管理端设�?

管理端复用现有后台结构，不新建一套风格不同的页面体系�?

### 页面能力

订单管理页增强为�?

- 查询条件：订单号、用户、商家、支付状态、履约状态、退款状态、时间范围�?
- 列表字段：订单号、商家、金额、支付状态、履约状态、退款状态、支付时间、更新时间�?
- 行操作：根据后端返回的可执行动作和当前用户按钮权限展示接单、制作、配送、完成、同意退款、驳回退款�?
- 退款审批弹窗：同意退款需要二次确认；驳回退款必须填写驳回原因�?
- 详情抽屉：展示订单明细、状态时间线、退款信息、业务动作日志�?

第一期明确使用详情抽屉，不新增独立详情路由，避免把动态路由、页签缓存和详情页面生命周期一起拉进本期范围�?

### 状态展�?

状态展示使用统一配置映射�?

- 状态文案�?
- 标签颜色�?
- 可操作按钮文案�?
- 二次确认文案�?
- `409 Conflict` 业务提示文案�?

这些配置应放在订单领域模块内，避免散落在多个组件中�?

### 前端权限接入

前端按钮展示同时受两个条件控制：

1. 后端返回该订单当前可执行动作�?
2. 当前用户拥有该动作对应按钮权限�?

前端隐藏按钮只是体验优化，不是安全边界。后端仍必须做最终权限校验�?

## 用户端设�?

用户端第一期只补售后入口，不扩张成完整客服系统�?

订单详情或订单卡片中，当订单处于允许退款的状态时展示“申请退款”。用户提交退款原因后，订单的 `refundStatus` 进入 `REQUESTED`。退款申请中展示审核状态；同意后展示已退款；驳回后展示驳回原因�?

用户端退款申请的安全边界�?

- 必须登录后才能申请退款�?
- 只能订单所属用户申请退款�?
- 后端�?customer token 中读�?`userId`，不接受前端传入�?`userId`�?
- 非本人订单返�?`403 Forbidden`�?
- 重复申请或状态不允许申请返回 `409 Conflict`�?

用户端请求继续走现有 HTTP 策略层，保留 loading、错误提示、登录态处理和日志记录�?

## 测试设计

后端重点测试�?

- 支付成功后，订单履约状态能进入 `AWAITING_ACCEPTANCE`�?
- 每个合法履约流转能成功�?
- 非法履约流转返回 `409 Conflict`�?
- 无按钮权限的后台动作返回 `403 Forbidden`�?
- 用户只能给自己的订单申请退款�?
- 重复退款申请返�?`409 Conflict`�?
- 退款同意会�?`refundStatus` 改为 `APPROVED`，并�?`fulfillmentStatus` 改为 `CANCELED`�?
- 退款驳回会�?`refundStatus` 改为 `REJECTED`，并保留申请前履约状态�?
- 状态更新和动作日志写入在同一个事务中完成�?
- 订单详情能返回可执行动作列表和动作日志�?

管理端重点测试：

- 不同订单状态展示不同动作按钮�?
- 无权限用户不展示对应按钮�?
- 后端返回可执行动作变化时，前端展示同步变化�?
- 退款驳回弹窗要求填写驳回原因�?
- `409 Conflict` 能展示“当前订单状态已变化，请刷新后重试”�?

用户端重点测试：

- 可退款订单展示申请入口�?
- 不可退款订单不展示申请入口�?
- 退款申请中、已退款、已驳回展示正确状态�?
- 提交退款原因后能刷新订单列表或订单卡片状态�?

## 工程化设�?

本期补最小工程化闭环�?

1. 后端新增 `/health` �?`/api/health`，返回服务状态、时间戳和基础依赖状态�?
2. GitHub Actions 增加质量门禁�?
3. 保留现有 pnpm workspace 运行方式，不改变仓库结构�?
4. 后端 Swagger 文档跟随新增接口更新�?

CI 第一阶段不强行一次跑完全仓所有历史检查，优先选择和本期质量闭环直接相关的命令�?

```bash
pnpm --filter @elm-platform/server run test
pnpm --filter @elm-platform/server run build
pnpm --filter @elm-platform/web-admin run type-check
pnpm --filter @elm-platform/web-user run type-check
```

如果后续确认全仓 lint 和全�?build 已经稳定，再扩展到：

```bash
pnpm lint
pnpm build
```

第一期目标是让项目具备“提交前自动验证”的公司项目感，而不是一次性清完所有历史工程债�?

## 实施顺序

1. 后端状态枚举、动作类型、流转策略和单元测试�?
2. Prisma 模型扩展、迁移和 seed 数据补充�?
3. 后端订单工作流服务，覆盖履约动作、退款申请、退款审批和动作日志�?
4. 后台订单动作接口，接�?`RequirePermissions` �?Swagger�?
5. 管理端订单列表动作按钮、退款审批弹窗、详情抽屉和状态映射�?
6. 用户端退款申请入口和退款状态展示�?
7. 健康检查、最�?CI 和文档更新�?

## 完整版演进路�?

本期不是完整版，而是完整版的第一块稳定业务闭环。完整版不建议塞进同一个实施计划，应拆成后续三个独立阶段，每个阶段都有自己�?spec、implementation plan 和可验证交付物�?

### 二期：商家级数据权限

二期目标是从“按钮权限”升级到“按钮权�?+ 数据权限”。按钮权限回答“能不能点击某个动作”，数据权限回答“能看到和操作哪些商家、商品、订单”�?

推荐先做简单数据权限模型：

- 平台管理员可以查看和操作全部商家、商品、订单和退款�?
- 商家管理员只能查看和操作自己店铺下的商品、订单和退款�?
- 后端根据当前管理员身份追加查询过滤条件，前端不自行决定数据范围�?

可能修改的文件：

- `apps/server/prisma/schema.prisma`：给后台用户增加商家归属或新增用�?商家绑定表�?
- `apps/server/src/modules/auth/guards/roles.guard.ts`：保留按钮权限解析，必要时补充当前用户数据范围上下文�?
- `apps/server/src/modules/admin/dto/admin.dto.ts`：扩展用户或角色配置字段�?
- `apps/server/src/modules/admin/admin.service.ts`：维护用户商家归属或数据范围�?
- `apps/server/src/modules/elm/controllers/elm-admin.controller.ts`：商家、商品、订单接口接入数据范围�?
- `apps/server/src/modules/elm/services/elm-restaurant.service.ts`：商家列表和详情按数据范围过滤�?
- `apps/server/src/modules/elm/services/elm-food.service.ts`：商品列表和编辑按商家归属过滤�?
- `apps/server/src/modules/payment/payment.service.ts` 或订单查询服务：订单列表按商家归属过滤�?
- `apps/web-admin/src/entities/session/*`：保存和暴露当前用户数据范围信息�?
- `apps/web-admin/src/features/restaurant-management/*`、`apps/web-admin/src/features/food-management/*`、`apps/web-admin/src/features/order-management/*`：展示当前数据范围提示，不在前端做安全过滤�?

### 三期：商家入驻审�?

三期目标是让商家不是由管理员直接 CRUD 出来，而是通过平台审批进入系统。流程是：商家提交入驻申请，平台运营审核，通过后创建正式商家并绑定商家管理员，驳回时记录原因�?

推荐新增入驻申请模型和审核流程：

- `PENDING_REVIEW`：待审核�?
- `APPROVED`：已通过�?
- `REJECTED`：已驳回�?
- `CANCELED`：申请人取消�?

可能修改或新增的文件�?

- `apps/server/prisma/schema.prisma`：新�?`MerchantApplication`，并建立审核通过后的商家和后台用户关联�?
- `apps/server/src/modules/merchant/merchant.module.ts`：新增商家入驻模块�?
- `apps/server/src/modules/merchant/merchant-application.service.ts`：处理申请、审核、驳回和通过后创建商家�?
- `apps/server/src/modules/merchant/merchant-application.controller.ts`：暴露入驻申请和后台审核接口�?
- `apps/server/src/modules/merchant/dto/*`：定义申请、审核、驳�?DTO�?
- `apps/server/src/modules/admin/constants/admin-permissions.ts`：新增入驻审批菜单和按钮权限�?
- `apps/web-admin/src/entities/merchant/*`：封装入驻申�?API 和类型�?
- `apps/web-admin/src/features/merchant-approval/*`：实现入驻审批列表、详情抽屉、通过和驳回操作�?
- `apps/web-admin/src/pages/commerce/merchant-approval/index.vue`：新增后台入驻审批页面�?
- `apps/web-admin/src/app/router/component-map.ts`：注册入驻审批页面组件映射�?
- `apps/web-admin/src/shared/api/endpoints.ts`：新增入驻审批接口地址�?
- `apps/web-admin/src/shared/config/access.ts`：新增前端权限常量�?

### 四期：Docker 与部署闭�?

四期目标是让项目从“本地能开发”升级成“可以被 clone 后一键启动和验证”。这一步补工程化交付能力，不改变业务主流程�?

推荐交付物：

- PostgreSQL、Redis、NestJS server、admin web、user web、Nginx �?Docker Compose 编排�?
- 后端 `/health` 作为容器健康检查入口�?
- GitHub Actions 执行安装、测试、类型检查、构建和镜像构建�?
- `.env.example` 明确本地开发和容器运行所需环境变量�?

可能新增或修改的文件�?

- `docker-compose.yml`：编�?PostgreSQL、Redis、server、admin、user、Nginx�?
- `.dockerignore`：排�?`node_modules`、`dist`、日志和本地缓存�?
- `.env.example`：统一根目录环境变量示例�?
- `.github/workflows/ci.yml`：执行测试、类型检查和构建�?
- `.github/workflows/docker-build.yml`：验�?Docker 镜像构建�?
- `apps/server/Dockerfile`：构�?NestJS 服务镜像�?
- `apps/web-admin/Dockerfile`：构建管理端静态资源镜像�?
- `apps/web-admin/nginx.conf`：管理端 Nginx 配置�?
- `apps/web-user/Dockerfile`：构建用户端静态资源镜像�?
- `apps/web-user/nginx.conf`：用户端 Nginx 配置�?
- `apps/server/src/health/*`：健康检查模块或控制器�?

### 与本期的差距

- 本期解决订单域闭环；完整版解决平台运营闭环�?
- 本期做按钮权限；完整版增加商家级数据权限�?
- 本期商家由后台直接维护；完整版增加商家入驻审批和审核轨迹�?
- 本期只补最�?CI；完整版�?Docker Compose、Nginx、镜像构建和部署验证�?
- 本期适合尽快形成可展示成果；完整版适合在本期稳定后逐步扩展，避免一次做成半成品�?

## 简历表�?

可沉淀为：

> 将外卖项目订单模块升级为运营中台履约闭环，围绕支付订单扩展履约状态机与退款审批流程，后端统一维护合法状态流转并输出可执行动作，管理端基于按钮权限和订单状态动态渲染操作入口；同时新增订单业务动作审计、并发冲突处理、核心状态机单测、健康检查与 CI 质量门禁，提升复杂业务场景下的可维护性、可追踪性和工程可靠性�?

## 风险与控�?

1. 订单模型过度扩张：第一期优先复�?`PaymentOrder`，只补履约、退款和关键时间字段�?
2. 支付状态和履约状态混淆：保留 `status` 作为支付状态，新增 `fulfillmentStatus` 表示履约状态�?
3. 前后端状态规则重复：以后端返回可执行动作作为前端展示依据，前端只做权限和 UI 映射�?
4. 审批流过度设计：第一期只做退款审批，不抽象通用工作流引擎�?
5. 权限只停留在前端：后端动作接口必须接�?`RequirePermissions`，前端隐藏按钮只是体验优化�?
6. 多人后台协作冲突：后端以数据库当前状态为准，状态不满足动作条件时返�?`409 Conflict`�?
7. 工程化范围失控：第一期只做健康检查、最�?CI 和核心测试，不扩张到完整部署平台�?

