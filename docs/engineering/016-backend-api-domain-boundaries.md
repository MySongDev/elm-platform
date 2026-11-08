# 后端接口分类与业务职责边界

## 功能清单

下表路径均相对于 `apps/server/src/`。

| 功能 | 实现位置 | 说明 |
|---|---|---|
| HTTP 接口装配 | `api/api.module.ts` | 所有接口从此进入，不再由业务模块隐式注册 |
| 自动依赖边界 | 仓库根 `eslint.config.mjs` | 对后端生产静态 import/export 启用三类错误级约束，覆盖常规相对路径与别名，检查方式见第9.1节 |
| 管理端认证 | `api/admin/auth/` | 登录、个人信息、菜单、退出和安全日志 |
| 管理端系统管理 | `api/admin/system/` | 后台账号、角色、菜单、部门、静态权限目录分别管理 |
| 管理端监控 | `api/admin/monitor/` | 在线用户和日志查询分别管理 |
| 管理端商业管理 | `api/admin/commerce/` | 餐馆、食品、订单、商家入驻分别管理 |
| 管理端租户及通知 | `api/admin/tenant/`、`api/admin/notification/` | 保留原有权限和响应契约 |
| 消费者认证、资料和地址 | `api/customer/auth/`、`profile/`、`address/` | web-user 与 uni-user 共用，不按前端技术再复制接口 |
| 消费者浏览 | `api/customer/location/`、`restaurant/`、`food/`、`rating/` | 定位、餐馆浏览、食品菜单和评价按用途分类 |
| 消费者订单 | `api/customer/order/customer-order.controller.ts` | 建单、订单列表和退款申请；不负责支付渠道调用 |
| 消费者支付 | `api/customer/payment/customer-payment.controller.ts` | 支付创建、继续支付、支付状态查询 |
| 商家兼容订单 | `api/merchant/order/` | 原 `/bos/orders*` 契约，不代表已建成完整商家后台 |
| 共享基础接口 | `api/shared/image/`、`api/shared/health/` | 图片字节读取和健康检查 |
| 支付平台回调 | `api/callbacks/alipay/` | 第三方调用，验证逻辑由支付业务处理，不使用消费者 JWT |
| 旧 Elm 写入兼容 | `api/compatibility/commerce/` | 食品/餐馆写入保留旧行为，原接口没有 JWT Guard，不能误当成受保护的管理端接口 |
| 角色业务 | `modules/role/` | Service、DTO、记录类型与内存回退数据均归角色领域 |
| 菜单业务 | `modules/menu/` | 菜单读写、归一化、菜单树与菜单回退数据 |
| 部门业务 | `modules/dept/` | 部门读写、归一化、部门树与部门回退数据 |
| 监控业务 | `modules/monitor/` | `OnlineUserService` 操作 Redis；`LogQueryService` 负责日志查询与运行态快照 |
| 权限目录 | `modules/permission/permission-catalog.ts` | 目前是静态数据，不额外建立只转发常量的 Service |
| 订单读取 | `modules/order/order-query.service.ts` | 消费者列表、管理端列表及详情，包含相应查询范围约束 |
| 订单状态流转 | `modules/order/order-workflow.service.ts` | 建单、接单、制作、配送、完成、退款状态流转和支付状态同步 |
| 订单可见性判定 | `modules/order/order-access.policy.ts` | 查询详情和执行操作共用租户/门店判定 |
| 订单摘要映射 | `modules/order/order-summary.mapper.ts` | 列表、详情、支付结果和状态变更共用金额转换、状态补全与可用操作计算 |
| 支付业务 | `modules/payment/` | 支付创建、查询、继续支付和通知处理，`alipay/` 负责渠道交互 |
| Elm 图片资产 | `modules/elm-media/` | 本地读取契约、稳定资产存储、显式下载与导入编排；与 `modules/storage/local-disk.storage.ts` 不是同一契约 |
| Elm 上游导入 | `modules/elm-upstream/` | 上游访问与一次性导入；导入器同时服务 CLI 预导与菜单懒加载兜底 |
| Elm 商业目录与首页元数据 | `modules/elm-catalog/` | 餐馆与食品以本地库为主；首页分类入口/商家分类/配送方式/活动属性归 `ElmHomeMetaService`；菜单未同步时按需调用上游导入器 |
| Elm 城市与定位 | `modules/elm-location/` | 城市读取内存数据、逆地理编码访问外部服务并保留模拟回退 |
| Elm 旧演示订单 | `modules/elm-legacy/` | 旧兼容入口的内存演示数据，不是 `modules/order` 的真实支付订单 |
| Elm 组合根 | `modules/elm/elm.module.ts` | 只做 imports/exports，不注册 Service；各 `*-api.module.ts` 仍只导入 `ElmModule` |
| 用户上传存储 | `modules/storage/local-disk.storage.ts` | UUID 文件名的上传存储，当前用于头像；不是 Elm 图片资产存储的同一契约 |
| 树形公共工具 | `common/utils/build-tree.ts` | 菜单与部门复用树构建，叶节点不输出空 children |

## 1. 为什么分两层，而不是整套业务按端复制

原来的问题有两种：

1. 接口归属难找：后台账号在 `modules/user`，商业管理在 `modules/elm`，日志与角色同在一个 Controller。
2. 业务职责混杂：原 `AdminService` 同时操作角色、菜单、部门、在线会话与日志；订单列表又位于支付服务中。

只搬 Controller，只能改善第一个问题。反过来，为每个端复制一套 Service，会让订单状态和退款规则各自漂移。

最终关系是：

```text
AppModule
  → ApiModule
    → AdminApiModule / CustomerApiModule / 其他接口模块
      → 业务模块导出的 Service
        → Prisma / Redis / 支付渠道
```

业务模块不反向导入 API 模块，也不注册 Controller。这里的约束针对生产代码；接口测试当然可以导入 Controller。

### 1.1 当前分层的定位

更准确的描述是“模块化单体＋按消费端组织接口＋共享业务/应用服务”。`modules` 并不是严格 DDD/Clean 中不依赖框架的纯 domain：当前 Service 仍使用 Nest 注入、异常类型和 Prisma，HTTP DTO 也大多保留在业务模块。

按消费端分目录不自动等于完整 BFF。只有存在针对各端的独立聚合、编排和响应适配，才具备相应 BFF 职责；不能仅凭 `admin/customer` 文件夹宣称已实现这些能力。

这种实用分层在当前项目中可以成立。后续演进应围绕真实耦合和维护成本，不为套用架构标签增加 Repository、CQRS、完整 use-case 层或微服务。

### 1.2 文档约定与工具执行不是一回事

后端静态依赖边界已于2026-11-08在根 `eslint.config.mjs` 使用 `no-restricted-imports` 以 `error` 启用，规则覆盖生产 `modules → api`、`api → Prisma` 和 `common → modules/api`。它复用既有 ESLint，无新增插件；前端原有的 warn 级规则保持不变。

本轮使用真实 ESLint 配置验证了普通导入、`import type`、具名转导出和 `export *` 的禁止/允许场景，并对配置及后端源码进行了不带 `--fix` 的检查，未发现边界违规。具体范围和例外见第9.1节。

这不是完整依赖图或安全审计。规则不替代 Guard、角色/权限声明、租户过滤、类型检查或 Nest 模块装配验证，也不会将第2/5/6条待定事项变成已解决的问题。

## 2. 目录决定归属，不决定 URL 和权限

例如：

```ts
// 文件：api/admin/system/admin-role.controller.ts
@Controller('admin/system/roles')
@UseGuards(AdminAuthGuard, RolesGuard)
export class AdminRoleController {
  constructor(private readonly roleService: RoleService) {}
}
```

这一片段说明两件不同的事：

- `api/admin/system` 是开发者查找接口的目录。
- `@Controller()` 和 Guard 才决定请求路径与身份检查。

TypeScript 能检查类和注入类型是否存在，但不能靠目录推断权限，也不会发现装饰器遗漏。拆分时必须单独核对 Guard、角色/权限声明和租户上下文。

现有 URL 保留，包括 `/api/auth/*`、`/api/users`、`/api/customer-auth/*` 和旧 `/shopping/*`。不能因为整理目录，就顺手全部改成 `/api/admin/*` 或 `/api/customer/*`。

## 3. Service 拆分要真的转移实现

角色 Controller 直接调用 `RoleService`；角色 Service 自己持有原来的角色 CRUD 和回退状态。

不能新建六个 Service，却让它们继续调用一个保留全部实现的 `AdminService`。本次旧聚合服务和 Controller 已被实际替代，没有留下转发壳。

独立职责的判断依据：

- 操作的数据和业务规则是否独立。
- 变化原因是否不同。
- 依赖是否不同，例如在线会话只使用 Redis。
- 拆开后是否减少耦合，而非增加一次无意义转发。

文件行数只是信号，不是强制阈值。接单、制作、配送和完成仍属于一个订单生命周期，不按每个操作机械建立 Service。

### 3.1 Elm 已完成职责拆分（2026-11-08）

`ElmModule` 已拆成五个职责单一的模块，`modules/elm/elm.module.ts` 退化为只做 imports/exports 的组合根：

- `elm-media`：图片资产（本地读取契约、稳定资产存储、显式下载与导入编排）
- `elm-upstream`：上游访问与一次性导入
- `elm-catalog`：餐馆、食品与首页元数据（`ElmHomeMetaService`）
- `elm-location`：城市与定位
- `elm-legacy`：旧 `/bos/orders*` 的内存演示订单

现有关键调用关系如下，均为源码中的当前实现（箭头为跨模块依赖，均单向）：

```text
elm-catalog → elm-upstream（菜单懒加载兜底）
ElmFoodService
  ├→ ElmRestaurantService
  ├→ Prisma / TenantAccessService
  └→ ElmUpstreamImportService → ElmUpstreamService / Prisma
ElmHomeMetaService → Prisma.categoryEntry（首页分类入口）

elm-location
ElmCityService
  ├→ 内存城市数据（data/city.seed，尚未建表）
  └→ 外部逆地理编码；失败时保留模拟回退

elm-legacy
ElmOrderService → 内存演示订单（data/demo-order.seed）
OrderQueryService / OrderWorkflowService → Prisma.paymentOrder（真实订单）

elm-media
ElmImageProxyService → ElmImageStorageService
ElmImageImportService → Prisma / ElmImageProxyService / ElmImageStorageService
```

拆分时落实的约束（后续改动仍须遵守）：

- **菜单导入属于读链路的依赖。**`elm-catalog/services/elm-food.service.ts` 的 `ensureMenuSynced()` 使用 `menuSyncedAt` 判断是否调用 `importMenu()`；空菜单也可以是已同步结果，不能改成“分类数为0就重导入”。导入器因此是 `elm-upstream` 的业务依赖而非仅 CLI 工具，且保持 `elm-catalog → elm-upstream` 单向，不让导入器反过来依赖食品 Service 形成循环。
- **两类订单不能按名字相似就合并。**Elm 内存订单（`elm-legacy`）供旧 `/bos/orders*` 展示；真实消费者及管理端订单查询（`modules/order`）使用 `paymentOrder`。明确历史来源比强行留下一个名为 OrderService 的类更重要。
- **两种存储不是同一契约的重复实现。**`LocalDiskStorage`（`modules/storage`）面向用户上传，生成随机 UUID 并返回相对路径；`ElmImageStorageService`（`elm-media`）面向既有图片资产，按契约路径 hash 建稳定键，包含读取、图片完整性检查和原子发布。不能直接用只提供 `save()` 的上传接口替换后者。
- **图片读写时机不同。**`getImage()` 正常请求只读取本地，缺图返回404，不回源；`downloadImage()` 是显式导入行为。`ElmImageImportService` 又承担读取数据库和批量导入的编排，不能仅按“图片”一词就把全部编排当作纯存储。
- **定位不等于商业目录。**原 `ElmCityService` 同时包含内存城市、数据库分类和外部定位三种职责，拆分后城市/定位归 `elm-location`，首页分类入口归 `elm-catalog` 的 `ElmHomeMetaService`，两者不再共用一个类。

## 4. 查询、状态流转、响应映射分别负责什么

```ts
// 列表查询负责范围和读取，不调用支付渠道。
const orders = await this.orderQuery.listAdminOrders(query.limit, context, query)
```

`OrderQueryService` 保留原消费者 userId 过滤、管理端租户/门店过滤、排序及默认数量。详情越权继续按原行为隐藏为 404。

```ts
// 订单操作仍通过流程服务执行规则判断及事务。
return this.orderWorkflow.acceptOrder(orderNo, operator, context)
```

查询拆走后，不把事务中的状态更新和操作日志拆散。`OrderWorkflowService` 不依赖接口层，也不需要注入查询服务来拼响应。

```ts
// 查询、支付和流程都调用同一个纯映射。
return toOrderSummary(order)
```

映射器不查询数据库、不鉴权、不改变订单状态。它只负责金额转换、状态缺省值和响应字段，以及使用既有 policy 计算可用操作。静态类型不能替代用户归属和租户判定，调用方仍必须先完成访问检查。

## 5. 为什么 operationId 还出现旧 Controller 名称

Swagger 默认根据类名和方法名生成 operationId。拆分类时，即使 URL 不变，自动生成的 operationId 也会变化，影响基于 OpenAPI 的生成客户端。

```ts
@ApiOperation({
  operationId: 'ElmAdminController_getOrders',
  summary: '管理端真实支付订单列表',
})
```

旧名称在这里是对外契约标识，不是未完成的旧类引用。不能仅为了命名一致把它删除或重命名。未来如需升级 operationId，应作为独立契约变更处理。

移动但未改名的 Controller 沿用原类名；拆分后换名的 Controller 显式保留旧 operationId。请求与响应 DTO 的类名也保留，防止 schema 名称随目录变化。

### 5.1 DTO 归属现状与已实施的统一规则

HTTP DTO 已按「端 → 资源」迁入接口层：`api/<端>/<资源>/dto/`（管理端 `api/admin/{system,auth,tenant,monitor,notification,commerce}/dto/`、消费者端 `api/customer/{auth,address,profile,order,payment}/dto/`、共享 `api/shared/health/dto/`）。`modules/` 与 `health/` 下不再保留 `*.dto.ts`；业务 Service 改用框架无关的输入类型（`modules/<domain>/*.inputs.ts` 的 `*Input`/`*Payload`），支付业务不再 `extends` HTTP DTO，接口层反向依赖已解除。

实施顺序为「先解耦业务输入，再迁 HTTP DTO」（016 §3 评审第 3 条），全程未改 DTO 类名、字段、验证/转换装饰器与 operationId，schema 名称保持不变。

职责划分落点如下，已实施：

| 模型职责 | 归属 | 说明 |
|---|---|---|
| HTTP 请求/响应 DTO | 接口适配层 `api/<端>/<资源>/dto/` | class-validator、class-transformer、Swagger 和对外响应契约 |
| 业务 Input / Payload / Query | 对应 `modules/<domain>/`（`*.inputs.ts`） | Service 所需输入，不从接口层反向导入类型 |
| 跨端共享常量与类型 | `packages/contracts` | 框架无关的共享语义，不加入 Nest/Swagger 装饰器 |

先解除业务输入依赖，再迁移 HTTP DTO：

```text
接口 DTO → 业务 Input/Payload
业务 Service → 业务 Input/Payload
```

不能只把 DTO 剪切进 api，然后让 Service 继续反向 import 它；也不能用 `type BusinessInput = ApiDto` 把反向依赖藏到另一个文件中。接口 DTO 可以实现或映射业务输入，但验证装饰器仍留在接口侧。

优先复用已存在的输入类型：

- `modules/order/order-draft.factory.ts`：`OrderDraftInput`、`OrderCartItemInput`。
- `modules/order/order-workflow.service.ts`：`CreateOrderPayload`。
- `modules/order/order-query.service.ts`：`AdminOrderQuery`。
- `modules/merchant-onboarding/merchant-onboarding.types.ts`：`MerchantApplicationQuery`、`MerchantApplicationReviewPayload`。

**schema 名称不是文件不能移动的理由。**2026-11-08 的迁移即按此执行：保留 DTO 类名、字段、默认值、验证/转换/Swagger 装饰器和被装饰器使用的值引用，只更新 import，schema 名称保持不变。后续任何移动仍须核对全局 ValidationPipe 的白名单和转换行为，不能把 `@Type()` 或 Swagger 使用的类误改成 type-only import。

DTO 文件路径不决定 operationId；拆分类时的显式旧 operationId 仍需保留。每轮迁移应执行请求/响应及 schema 契约对比，而不是重生成历史基线来掩盖差异。

## 6. 新增接口的最短步骤

1. 确定调用身份和用途，选 `api/admin`、`customer` 等目录；登录接口虽未鉴权，仍按面向的身份归属。
2. 确定资源类别，优先放入已有 Controller，不按每个 CRUD 操作创建文件。
3. 在业务模块实现或复用明确职责的 Service；需要拆分时连同实现、状态和依赖一起转移。
4. 业务模块导出 Service，相应 `*-api.module.ts` 导入业务模块并注册 Controller。
5. 声明 URL、Guard、角色/权限、DTO、响应包装和 Swagger 分类。
6. 更新受影响的既有测试，运行构建及最小相关验证；涉及核心认证、支付、订单和租户隔离时按 `AI_TEST_POLICY.md` 处理。

禁止把业务 Service 再注册进 API 模块的 `providers` 来解决注入错误；这样会创建额外实例，并可能让内存回退状态分裂。应修正业务模块的 `exports` 和 API 模块的 `imports`。

## 7. 本次保留的边界

- 没有修改数据库 schema，也没有执行迁移、种子或导入任务。
- 没有将 JWT 默认开发密钥改为其他策略；实际鉴权安全性仍以妥善配置密钥为前提。
- 没有为旧 Elm 写入接口新增鉴权，也没有删除这些接口。目录上的“compatibility”不是安全防护。
- 保留角色、菜单、部门原有数据库异常→内存回退行为。它不提供可靠的生产持久化保证。
- 保留 `forceLogout` 原来的 Redis 键删除实现；本次不承诺新增 JWT 撤销机制。
- H5 建单并生成支付链接与消费者独立建单仍并存，共用 `order-draft.factory.ts`。
- 订单响应 DTO 在 2026-11-08 DTO 归属统一前暂留在 payment 下（既有 schema 复用，不另建重复定义）；迁移后落点为 `api/customer/payment/dto/`，`customer-order` 跨目录复用它们（同属 api 层，允许）。
- 没有为餐馆、食品、支付等所有 Service 机械拆分，也没有增加 Repository、通用基类或抽象工厂。

## 8. 首次接口重构的历史验收

以下是2026-11-08首次接口/业务拆分的验收快照，不是永久实时统计，也不表示随后这轮分层评审和文档完善重新运行了这些检查：

- 重构前：18 个 Controller，109 条路由，76 个 OpenAPI schema；41 个套件、582 个测试通过。
- 重构后：29 个 Controller，109 条路由，76 个 OpenAPI schema；42 个套件、582 个测试通过。
- 新订单查询测试文件承接原支付/订单流程测试，不增加或减少测试用例。
- 模块装配编译通过；逐项比较路由、Guard、角色/权限、状态码、参数管道和 OpenAPI paths/schema/operationId，只有分类 tags 被有意忽略。
- 这不是连数据库的端到端验收：没有真实支付、回调或前端点击验证。

修改报告及本地契约比较脚本：`docs/reports/server/2026-11-08-后端接口分类与业务拆分/`。该报告目录受现有 gitignore 规则影响，是本地材料；本工程指南随代码纳入版本管理。

## 9. 后续演进与依赖边界实施状态

本节对应2026-11-08分层评审中的第1、3、4条。三条均已实施：第1条（Elm 拆分为 media/upstream/catalog/location/legacy 五个模块，`ElmModule` 退化为纯聚合根）与第3条（HTTP DTO 按「端 → 资源」迁入 `api/`，业务 Service 改用 `*.inputs.ts` 输入类型）按 `docs/superpowers/plans/2026-11-08-后端剩余两项演进实施计划.md` 完成；第4条（自动依赖边界）由用户确认后加入 ESLint 错误级约束。不能把这三条的完成延伸为安全治理或数据库隔离等其他未实施事项也已完成。

| 评审项 | 必要性与建议 | 实施前必须守住的边界 |
|---|---|---|
| 第1：Elm 职责拆分 | **已实施（2026-11-08）**：先拆边界最清晰的图片资产（`elm-media`），再整理上游导入（`elm-upstream`）、商业目录与首页元数据（`elm-catalog`）、城市定位（`elm-location`）与历史演示订单（`elm-legacy`），`modules/elm/elm.module.ts` 退化为只做 imports/exports 的组合根 | 已守住：菜单读链路的按需导入保留（`elm-catalog → elm-upstream` 单向）；定位与首页元数据分归 `elm-location` 与 `elm-catalog`；mock 订单未与真实订单合并；两种存储契约未强行合并；无 media/legacy 双向依赖 |
| 第3：HTTP DTO 统一归属 | **已实施（2026-11-08）**：按第5.1节先为 9 个 Service 建立框架无关的 `*.inputs.ts` 业务输入类型解除反向依赖，再把 33 个 HTTP DTO 文件按「端 → 资源」迁入 `api/<端>/<资源>/dto/`；`modules/` 与 `health/` 下不再保留 `*.dto.ts` | 已守住：未反向导入 api；未将 Nest/Swagger 装饰器塞进共享包；保留类名、字段、验证/转换、schema 与 operationId，契约脚本对比通过 |
| 第4：自动依赖边界 | **已实施**：复用 ESLint `no-restricted-imports`，对后端生产静态依赖启用 `error`；没有新增插件或工具链 | 覆盖常规相对路径、别名、Prisma Service/生成客户端；测试和两个已知 CLI 豁免；不保证鉴权或数据库租户安全 |

第1、3、4条均已实施。后续协作者不应把这三条完成延伸为类型、密钥、内存回退或数据库隔离等未实施事项。

当前最小约束：生产 `modules → api` 禁止、`api → Prisma` 禁止、`common → modules/api` 禁止。规则匹配静态 import/export 的字符串路径，不等同完整依赖图解析，也不能代替权限、状态流转或租户隔离验证。

### 9.1 已实施的 ESLint 边界：范围、例外与检查

| 来源文件 | 禁止的静态依赖 | 保持允许的依赖 |
|---|---|---|
| `apps/server/src/modules/**/*.ts` | `@/api`、`@/api/...` 及常规相对路径指向的 api | Prisma、其他业务模块、公共基础设施、contracts |
| `apps/server/src/api/**/*.ts` | Prisma Service/模块、`generated/prisma` 客户端、`@prisma/*`、`prisma` 包；包含类型导入与转导出 | 业务模块导出的 Service/类型、common、contracts |
| `apps/server/src/common/**/*.ts` | 业务 modules 和 api，覆盖别名与常规相对路径 | 其他 common、config、Prisma 等基础设施；日志拦截器的现有 Prisma 依赖不被误禁 |

测试例外：`*.spec.ts`、`*.test.ts`、`tests/**`、`__tests__/**` 中的 fixture 可直接导入 Controller/Prisma mock；这些文件仍执行其他适用的 ESLint 规则，并不是被整个 lint 忽略。

CLI 例外仅为两个现有组合根：

- `apps/server/src/modules/elm-media/scripts/import-images.ts`
- `apps/server/src/modules/elm-upstream/scripts/import-upstream.ts`

没有笼统排除 `modules/**/scripts/**`。新脚本默认仍受边界限制，需要组合根例外时应说明理由并显式调整配置，不能靠文件夹名称绕过。

下面仅演示规则的拒绝点，不是建议加入的业务代码：

```ts
// 文件：apps/server/src/api/admin/system/example.controller.ts
import { PrismaService } from '../../../prisma/prisma.service'
// no-restricted-imports：接口层不得直接依赖 Prisma，需经业务 Service。
```

把这个导入改成 `import type` 或换成 `export ... from` 也会报边界错误，不能用类型导入或中间转导出文件绕过同一条静态路径约束。

只读检查（不自动改文件、不写 lint cache）：

```bash
# 仓库根目录：只检查配置文件
pnpm exec eslint eslint.config.mjs

# 后端全源码检查，包含边界规则与其他错误；quiet 隐藏已有 warning
pnpm --filter @elm-platform/server exec eslint src --quiet
```

原有后端 lint、根 `pnpm lint` 和相应 CI lint 会读取同一配置，不需要另装插件或另接工具链。`turbo.json` 的 lint 任务 inputs 已包含 `$TURBO_DEFAULT$` 与 `$TURBO_ROOT$/eslint.config.mjs`，根规则变化会使 lint 缓存失效，不会直接沿用旧规则的成功结果；没有把这个配置依赖扩散到其他任务。注意既有 `run lint` 脚本带 `--fix --cache`；只想检查时用上面的 `exec eslint`，不要为了检查而改写全仓。

2026-11-08本次规则验证：60个禁止场景均被拒绝、76个允许/豁免场景通过，覆盖普通导入、类型导入、具名转导出和星号转导出；额外确认新建其他 CLI 仍受约束、前端原 warn 级规则未改变。真实配置和后端源码检查218个文件，0错误、0边界违规，另有182条其他规则 warning。此处是本轮配置验证，不复用第8节的业务测试结果；未新增测试文件。

限制：本规则检查常规 `@/`、相对路径及 Prisma 包导入的静态字符串，**不解析传递依赖或非规范路径归一化，也不覆盖动态 `require()`/`import()`、`import()` 类型表达式**。它是低成本的日常结构约束，不是不可绕过的安全隔离机制；将来需要完整解析依赖图时再评估专用工具。

## 10. 待定项：待用户确认、未实施

以下第2、5、6条由用户明确挂起。状态为**待用户确认、未实施**，后续协作者不得把它们描述为已修复或借其他任务提前落地。

| 评审项与当前事实 | 影响及待决策问题 | 状态/重启条件 |
|---|---|---|
| 第2：业务 Prisma 调用及部分 Request 仍使用 `any`；JWT 策略已有身份判别联合类型，当前没有 `CurrentUser` 装饰器 | 明确类型治理范围，恢复数据库字段/查询检查；先评估复用现有身份类型，再设计 AuthenticatedRequest/CurrentUser。类型不能替代 Guard 或租户过滤 | 待定；用户确认范围、兼容要求与验收方式后再实施 |
| 第5a：管理端/消费者签发及 JWT 验证保留开发默认密钥，配置异步注册和强制校验尚未调整 | 讨论 registerAsync/ConfigService、环境变量校验与 `.env.example`；强制必填会改变本地启动行为，不能未经确认去掉开发默认值 | 待定；用户确认开发/生产配置策略后再实施，当前不修改默认密钥 |
| 第5b：角色/菜单/部门保留数据库异常→内存回退 | 讨论生产 fail fast、开发降级或有标记的只读缓存，以及错误/可用性契约。不能把内存回退当作可靠生产持久化 | 待定；用户确认各环境允许的降级与失败行为后再实施 |
| 第6：当前 Service 可见租户上下文与显式查询范围约束；Extension/RLS 是待评估方案，不作为已实现能力描述 | 评估漏写过滤条件的防线；确认平台自营、ALL/TENANT/SHOP、关联/嵌套查询、原始 SQL、连接池和事务语义，再选择数据库级方案 | 待定；用户确认隔离目标和适用范围后单独设计、验证 |

代码入口（路径相对于 `apps/server/src/`）：

- 第2：`modules/auth/strategies/jwt.strategy.ts` 的身份类型，以及 `api/admin/commerce/admin-order.controller.ts` 等 Request 使用处。
- 第5a：`modules/auth/auth.module.ts`、`modules/customer-auth/customer-auth.module.ts`、`modules/auth/strategies/jwt.strategy.ts`；配置入口还包括 `config/env.schema.ts`、`apps/server/.env.example`（该路径相对于仓库根目录）。
- 第5b：`modules/role/role.service.ts`、`modules/menu/menu.service.ts`、`modules/dept/dept.service.ts`。
- 第6：`modules/tenant/tenant-context.service.ts`、`modules/tenant/tenant-access.service.ts`、`modules/order/order-query.service.ts`；平台自营数据选择另见 [商家数据本地化说明](008-merchant-data-localization.md)。

第1、3、4条实施完成后，仍没有实施上述第2、5a、5b、6条的类型、密钥、降级或数据库隔离改动。新增的是 Elm 模块拆分、HTTP DTO 归属统一与 lint 结构约束；原接口的 URL、Guard、权限、状态流转、密钥与数据库行为保持原状。
