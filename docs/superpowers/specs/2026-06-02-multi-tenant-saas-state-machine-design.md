# 第二阶段设计：多租户 SaaS 基座、租户生命周期状态机与商家数据隔�?
## 1. 背景

第一阶段已经完成订单履约、退款审批、审计日志和最小工程化验证。第二阶段继续把项目从“外卖管理系统”升级为“面向多商户场景的外�?SaaS 运营平台”�?
本阶段升级后的核心方向是�?
- 建立租户模型，让平台可以承载多个商家组织�?- 建立租户生命周期完整状态机，让租户启用、冻结、停用、过期、归档等动作可控、可审计、可测试�?- 建立统一租户上下文和数据访问策略，避免依赖前端隐藏按钮实现权限�?- 将订单、退款、餐厅、商品、操作日志纳入租户数据隔离�?- 在管理端展示租户管理、当前身份、当前数据范围和租户状态�?
## 2. 目标

### 2.1 业务目标

1. 平台管理员可以管理多个租户�?2. 租户管理员只能管理自己租户下的数据�?3. 店铺运营人员只能管理绑定店铺的数据�?4. 租户状态变化必须通过状态机事件触发，不能直接随意写 `status`�?5. 停用、冻结、过期、归档租户后，相关业务接口必须受到限制�?6. 关键状态变化和业务动作必须写入审计日志�?
### 2.2 工程目标

1. 后端统一封装租户上下文和数据范围策略�?2. 后端服务层执行数据隔离，前端不作为安全边界�?3. 状态流转规则集中在领域策略中，避免散落�?controller 或页面中�?4. 状态机、数据隔离、越权拒绝必须有自动化测试�?5. 第二阶段完成后，项目可以清晰表达为多租户 SaaS 运营平台�?
## 3. 非目�?
第二阶段不做以下内容�?
- 租户套餐计费和支付扣费�?- 独立域名或子域名识别�?- 分库分表或租户独立数据库�?- 租户自定义主题�?- 租户级复杂菜单模板�?- 资源配额、用量统计和账单中心�?- 引入 XState 或其它通用状态机框架�?
本阶段使用领域状态机：用枚举、事件、流转表、守卫和副作用函数表达业务规则，而不是引入通用状态机框架�?
## 4. 核心概念

### 4.1 Tenant

`Tenant` 表示一个入驻商家组织。一个租户可以拥有多个店铺，一个后台用户可以是平台用户，也可以属于某个租户�?
### 4.2 DataScope

后台用户的数据范围：

```ts
type DataScope = 'ALL' | 'TENANT' | 'SHOP' | 'SELF'
```

含义�?
- `ALL`：平台管理员，可访问全部租户数据�?- `TENANT`：租户管理员，可访问本租户全部店铺数据�?- `SHOP`：店铺运营人员，只能访问绑定店铺数据�?- `SELF`：预留，只访问自己创建或负责的数据�?
`SELF` 仅作为未来扩展预留。第二阶段不在后台用户表单开�?`SELF`，seed 不创�?`SELF` 用户，业务接口验收也不依�?`SELF` 分支�?
### 4.3 TenantContext

后端从当前登录用户构造请求级租户上下文：

```ts
interface TenantContext {
  userId: number
  username: string
  tenantId: number | null
  tenantCode: string | null
  tenantName: string | null
  tenantStatus: TenantStatus | null
  dataScope: DataScope
  boundShopIds: string[]
  isPlatformAdmin: boolean
}
```

`TenantContext` 来自 JWT 当前用户和数据库用户信息，不来自前端传入�?`tenantId`�?
## 5. 数据模型设计

### 5.1 新增 Tenant

```prisma
model Tenant {
  id           Int      @id @default(autoincrement())
  code         String   @unique
  name         String
  status       String   @default("PENDING")
  contactName  String?
  contactPhone String?
  contactEmail String?
  planCode     String   @default("standard")
  settings     Json?
  remark       String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  users         User[]
  orders        PaymentOrder[]
  orderLogs     OrderActionLog[]
  actionLogs    TenantActionLog[]

  @@map("tenants")
}
```

### 5.2 User 增强

```prisma
model User {
  // existing fields...
  tenantId     Int?
  dataScope    String   @default("ALL")
  boundShopIds String[] @default([])

  tenant       Tenant?  @relation(fields: [tenantId], references: [id])
}
```

约束�?
- `ALL` 用户不能绑定 `tenantId`�?- `TENANT` 用户必须绑定 `tenantId`�?- `SHOP` 用户必须绑定 `tenantId`，且 `boundShopIds` 不能为空�?- 租户管理员不能创建或修改平台管理员�?- 租户管理员不能给用户绑定其它租户�?
### 5.3 订单与日志增�?
```prisma
model PaymentOrder {
  // existing fields...
  tenantId Int?
  tenant   Tenant? @relation(fields: [tenantId], references: [id])
}

model OrderActionLog {
  // existing fields...
  tenantId Int?
  tenant   Tenant? @relation(fields: [tenantId], references: [id])
}

model OperationLog {
  // existing fields...
  tenantId   Int?
  tenantCode String?
}
```

`tenantId` 在第二阶段允许为空是为了兼容历史数据和迁移过程。新创建的订单、订单动作日志和操作日志必须尽量写入明确 `tenantId`；历�?`tenantId = null` 的订单和日志仅平台管理员可见，租户管理员和店铺运营人员不能访问这些无归属数据。后续完成历史数据回填后，再评估是否将核心业务表�?`tenantId` 改为必填�?
### 5.4 餐厅与商品租户归�?
如果当前餐厅和商品已经落�?Prisma 表，则直接增�?`tenantId`。如果仍�?`elm` 兼容数据�?seed 数据提供，则第二阶段先在后台管理服务层统一补充并过�?`tenantId`，不一次性重构整个用户端兼容数据结构�?
后台管理接口必须具备租户隔离；用户端公共浏览接口可以继续按现有兼容逻辑工作，但创建订单时必须把订单归属到对应店铺的 `tenantId`�?
## 6. 租户生命周期完整状态机

### 6.1 状态定�?
```ts
type TenantStatus =
  | 'PENDING'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'DISABLED'
  | 'EXPIRED'
  | 'ARCHIVED'
```

含义�?
- `PENDING`：租户已创建，等待审核或初始化�?- `ACTIVE`：租户正常使用�?- `SUSPENDED`：临时冻结，通常由风控、违规、欠费预警触发�?- `DISABLED`：平台主动停用�?- `EXPIRED`：合同或套餐过期�?- `ARCHIVED`：已归档，不再允许恢复业务操作�?
### 6.2 事件定义

```ts
type TenantEvent =
  | 'APPROVE'
  | 'REJECT'
  | 'SUSPEND'
  | 'RESUME'
  | 'DISABLE'
  | 'ACTIVATE'
  | 'EXPIRE'
  | 'RENEW'
  | 'ARCHIVE'
```

含义�?
- `APPROVE`：审核通过，租户从待审核变为可用�?- `REJECT`：审核拒绝，租户归档�?- `SUSPEND`：临时冻结�?- `RESUME`：从冻结恢复�?- `DISABLE`：平台停用�?- `ACTIVATE`：从停用恢复�?- `EXPIRE`：标记过期�?- `RENEW`：续约恢复�?- `ARCHIVE`：归档�?
### 6.3 流转�?
```ts
const tenantTransitions = {
  PENDING: {
    APPROVE: 'ACTIVE',
    REJECT: 'ARCHIVED',
  },
  ACTIVE: {
    SUSPEND: 'SUSPENDED',
    DISABLE: 'DISABLED',
    EXPIRE: 'EXPIRED',
  },
  SUSPENDED: {
    RESUME: 'ACTIVE',
    DISABLE: 'DISABLED',
    ARCHIVE: 'ARCHIVED',
  },
  DISABLED: {
    ACTIVATE: 'ACTIVE',
    ARCHIVE: 'ARCHIVED',
  },
  EXPIRED: {
    RENEW: 'ACTIVE',
    ARCHIVE: 'ARCHIVED',
  },
  ARCHIVED: {},
} as const
```

关键规则�?
- `ARCHIVED` 是终态，不允许恢复�?- `PENDING` 不能直接进入 `EXPIRED`、`SUSPENDED` �?`DISABLED`�?- `ACTIVE` 不能直接进入 `ARCHIVED`，必须先停用、冻结或过期，再归档�?- 所有状态变化必须通过事件触发�?
### 6.4 触发者权�?
```ts
type TenantActorType = 'PLATFORM_ADMIN' | 'TENANT_ADMIN' | 'SHOP_OPERATOR' | 'SYSTEM'
```

权限规则�?
| 事件 | 允许触发�?|
| --- | --- |
| `APPROVE` | `PLATFORM_ADMIN` |
| `REJECT` | `PLATFORM_ADMIN` |
| `SUSPEND` | `PLATFORM_ADMIN` |
| `RESUME` | `PLATFORM_ADMIN` |
| `DISABLE` | `PLATFORM_ADMIN` |
| `ACTIVATE` | `PLATFORM_ADMIN` |
| `EXPIRE` | `PLATFORM_ADMIN`, `SYSTEM` |
| `RENEW` | `PLATFORM_ADMIN`, `SYSTEM` |
| `ARCHIVE` | `PLATFORM_ADMIN` |

租户管理员和店铺运营不能改变租户生命周期状态�?
### 6.5 状态机服务

新增 `TenantStateMachineService`�?
```ts
interface TransitionTenantPayload {
  tenantId: number
  event: TenantEvent
  actor: TenantStateActor
  reason?: string
  remark?: string
}

interface TenantStateActor {
  id: number | 'system'
  name: string
  type: TenantActorType
}
```

主要职责�?
1. 读取当前租户�?2. 校验事件是否合法�?3. 校验触发者是否有权限�?4. 计算下一状态�?5. 在事务内按当前状态条件更新租户状态，避免并发状态流转覆盖�?6. 写入租户状态动作日志�?7. 写入操作日志�?8. 返回更新后的租户和可执行动作�?
状态更新必须校验当前状态。例如基�?`currentStatus` 计算�?`nextStatus` 后，更新条件必须包含 `id` �?`currentStatus`；如果更新行数不�?1，说明租户状态已被其它请求改变，应返回冲突错误。非法流转、无权限流转和并发冲突都不能写入 `TenantActionLog` �?`OperationLog`�?
### 6.6 租户状态动作日�?
建议新增 `TenantActionLog`�?
```prisma
model TenantActionLog {
  id         Int      @id @default(autoincrement())
  tenantId   Int
  event      String
  fromStatus String
  toStatus   String
  actorId    String
  actorName  String
  actorType  String
  reason     String?
  remark     String?
  requestId  String?
  createdAt  DateTime @default(now())

  tenant     Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([tenantId])
  @@map("tenant_action_logs")
}
```

### 6.7 可执行动�?
后端租户详情和列表返回：

```ts
interface TenantRecord {
  id: number
  code: string
  name: string
  status: TenantStatus
  availableActions: TenantEvent[]
}
```

前端根据 `availableActions` 渲染按钮，不自己硬编码流转规则�?
## 7. 租户状态对业务接口的影�?
租户用户访问后台业务接口时：

| 租户状�?| 业务访问 |
| --- | --- |
| `PENDING` | 禁止 |
| `ACTIVE` | 允许 |
| `SUSPENDED` | 禁止写操作，读操作可按接口策略决�?|
| `DISABLED` | 禁止 |
| `EXPIRED` | 禁止写操作，读操作可按接口策略决�?|
| `ARCHIVED` | 禁止 |

第二阶段采用明确规则�?
- `ACTIVE`：允许读写�?- `SUSPENDED`、`EXPIRED`：允许只读列表和详情，禁止创建、修改、订单履约、退款审批等写操作�?- `PENDING`、`DISABLED`、`ARCHIVED`：禁止业务读写�?- 平台管理员不受单个租户状态限制，但操作租户数据时仍要写审计日志�?
## 8. 租户访问策略

新增 `TenantAccessService`�?
```ts
interface TenantResourceFilter {
  tenantId?: number | { in: number[] }
  shopId?: string | { in: string[] }
  createdBy?: number
}
```

策略�?
```ts
function buildResourceWhere(context: TenantContext): TenantResourceFilter {
  if (context.dataScope === 'ALL') {
    return {}
  }

  if (context.dataScope === 'TENANT') {
    return { tenantId: context.tenantId! }
  }

  if (context.dataScope === 'SHOP') {
    return {
      tenantId: context.tenantId!,
      shopId: { in: context.boundShopIds },
    }
  }

  return {
    tenantId: context.tenantId!,
    createdBy: context.userId,
  }
}
```

请求筛选条件只能缩小当前范围，不能扩大当前范围�?
```text
最终过滤条�?= 当前用户数据范围 �?请求筛选条�?```

具体规则�?
- `ALL` 用户可以�?`tenantId` �?`shopId` 缩小范围�?- `TENANT` 用户不传 `tenantId` 时默认限定为当前租户；传入其�?`tenantId` 时返�?403�?- `SHOP` 用户不传 `shopId` 时默认限定为全部绑定店铺；传入未绑定 `shopId` 时返�?403�?- 非平台用户不能通过请求参数访问 `tenantId = null` 的历史无归属数据�?
## 9. 后端接口设计

### 9.1 租户管理

```http
GET    /api/admin/tenants
POST   /api/admin/tenants
GET    /api/admin/tenants/:id
PATCH  /api/admin/tenants/:id
POST   /api/admin/tenants/:id/events/:event
GET    /api/admin/tenants/:id/action-logs
```

租户创建和编辑使用基础信息 DTO�?
```ts
interface TenantUpsertRequest {
  code: string
  name: string
  contactName?: string
  contactPhone?: string
  contactEmail?: string
  planCode?: string
  remark?: string
}
```

`code` 是租户稳定业务标识，创建后不建议由普通编辑接口修改；如果后续确实要支持改编码，应单独设计校验、审计和关联影响。本阶段编辑租户基础资料时前端禁�?`code` 字段，后端也不应通过普通更新接口修�?`code`�?
`POST /events/:event` 统一处理状态变化，例如�?
```http
POST /api/admin/tenants/1/events/DISABLE
```

请求体：

```ts
interface TenantTransitionRequest {
  reason?: string
  remark?: string
}
```

### 9.2 当前用户 Profile

扩展后台 profile�?
```ts
interface AdminProfile {
  id: number
  username: string
  role: string
  permissions: string[]
  tenant: {
    id: number
    code: string
    name: string
    status: TenantStatus
  } | null
  dataScope: DataScope
  boundShopIds: string[]
  dataScopeLabel: string
}
```

### 9.3 用户管理

用户创建和编辑增加：

```ts
interface AdminUserTenantPayload {
  tenantId?: number | null
  dataScope: DataScope
  boundShopIds: string[]
}
```

后端必须校验 `dataScope`、`tenantId`、`boundShopIds` 的组合是否合法，也必须结合当前操作者的 `TenantContext` 校验“谁能创建或修改谁”：平台管理员可以管理所有合法用户；租户管理员只能管理本租户用户，不能创建或修改 `ALL` 用户，也不能把用户绑定到其它租户�?
### 9.4 订单与退�?
后台订单接口继续使用第一阶段动作接口，但增加租户访问校验�?
```http
GET   /api/admin/orders
GET   /api/admin/orders/:orderNo
POST  /api/admin/orders/:orderNo/accept
POST  /api/admin/orders/:orderNo/start-preparing
POST  /api/admin/orders/:orderNo/start-delivery
POST  /api/admin/orders/:orderNo/complete
POST  /api/admin/orders/:orderNo/refund/approve
POST  /api/admin/orders/:orderNo/refund/reject
```

所有详情和动作接口都必须先校验订单是否属于当前 `TenantContext` 可访问范围�?
### 9.5 餐厅、商品和日志

后台餐厅、商品、操作日志接口接入统一租户过滤�?
```http
GET /api/admin/restaurants
GET /api/admin/foods
GET /api/admin/logs/operations
```

平台管理员可以传 `tenantId` 缩小范围；租户管理员和店铺运营传入越权筛选条件时，后端应返回 403 或忽略扩大范围的参数。为避免歧义，第二阶段采用返�?403�?
操作日志列表也必须接入同一套租户过滤：平台管理员可见全部日志，包括历史 `tenantId = null` 日志；租户管理员只能看本租户日志；店铺运营至少只能看本租户日志，如果日志记录包含店铺字段，则继续按绑定店铺过滤。非平台用户不可�?`tenantId = null` 的历史日志�?
## 10. 管理端设�?
### 10.1 租户管理页面

路径建议�?
```text
平台管理 / 租户管理
```

页面能力�?
- 租户列表�?- 新增租户�?- 编辑租户基础信息�?- 触发状态机事件�?- 查看租户状态动作日志�?- 查看店铺数、订单数等摘要�?
列表字段�?
```text
租户名称
租户编码
状�?套餐
联系�?联系电话
店铺�?订单�?创建时间
可执行操�?```

按钮由后�?`availableActions` 驱动�?
### 10.2 用户管理增强

用户表单增加�?
- 所属租户�?- 数据范围�?- 绑定店铺�?
联动规则�?
- `ALL`：隐藏租户和店铺选择�?- `TENANT`：必须选择租户�?- `SHOP`：必须选择租户和至少一个店铺�?- `SELF`：本阶段不开放为可选项�?- 租户管理员创建用户时，租户固定为当前租户�?
### 10.3 顶部租户上下文展�?
顶部导航展示当前身份�?
```text
平台管理�?· 全部租户
租户管理�?· 蜂鸟外卖商户
店铺运营 · 蜂鸟外卖商户 / 人民路店
```

### 10.4 业务页面数据范围提示

订单、餐厅、商品页面顶部显示当前范围：

```text
当前数据范围：全部租�?当前数据范围：蜂鸟外卖商�?当前数据范围：蜂鸟外卖商�?/ 人民路店、大学城�?```

### 10.5 租户状态错误提�?
前端统一处理后端错误码：

- `TENANT_PENDING`
- `TENANT_SUSPENDED_READONLY`
- `TENANT_DISABLED`
- `TENANT_EXPIRED_READONLY`
- `TENANT_ARCHIVED`

对于只读状态下的写操作，提示：

```text
当前租户状态不允许执行该操作，请联系平台管理员�?```

## 11. 实施切片

### 切片 1：租户模型、状态枚举和 seed

- 新增 `Tenant`�?- 新增 `TenantActionLog`�?- `User` 增加 `tenantId`、`dataScope`、`boundShopIds`�?- 订单和日志增加租户字段�?- seed 增加平台管理员、租户管理员、店铺运营、两个租户和示例店铺�?
### 切片 2：租户生命周期状态机

- 新增状态枚举、事件枚举、流转表�?- 新增 `TenantStateMachineService`�?- 新增状态机单测�?- 租户状态动作写�?`TenantActionLog` �?`OperationLog`�?
### 切片 3：租户上下文和访问策�?
- JWT/profile 增加租户字段�?- 新增 `TenantContext` 构造逻辑�?- 新增 `TenantAccessService`�?- 新增租户状态访问守卫或服务层校验�?
### 切片 4：订单、退款、餐厅、商品和日志接入隔离

- 订单列表、详情、履约动作接入租户过滤�?- 退款审批接入租户过滤�?- 餐厅、商品后台接口接入租户过滤�?- 操作日志和订单动作日志接入租户过滤�?
### 切片 5：管理端可视�?
- 新增租户管理页面�?- 用户管理增加租户字段�?- 顶部展示租户上下文�?- 业务页面展示数据范围提示�?- 状态机按钮�?`availableActions` 渲染�?
## 12. 测试验收

### 12.1 后端测试

必须覆盖�?
1. 租户状态机合法流转成功�?2. 租户状态机非法流转失败�?3. `ARCHIVED` 不可恢复�?4. 非平台管理员不能触发租户状态事件�?5. 状态变化写�?`TenantActionLog` �?`OperationLog`�?6. 非法流转、越权流转和并发冲突不写动作日志�?7. `ALL` 数据范围可访问全部租户资源�?8. `TENANT` 数据范围只能访问本租户资源�?9. `SHOP` 数据范围只能访问绑定店铺资源�?10. 请求筛选条件不能扩大当前数据范围�?11. 租户管理员不能操作其它租户订单�?12. 店铺运营不能操作未绑定店铺订单�?13. 退款审批不能越权�?14. `SUSPENDED` �?`EXPIRED` 租户不能执行写操作�?15. `DISABLED`、`PENDING`、`ARCHIVED` 租户不能访问业务接口�?16. 操作日志列表按租户上下文过滤，非平台用户不可�?`tenantId = null` 日志�?17. 租户管理员不能创建或修改平台管理员，不能跨租户管理用户�?
### 12.2 管理端测�?
必须覆盖�?
1. 租户列表渲染状态和可执行动作�?2. 状态机按钮调用统一事件接口�?3. 用户表单�?`dataScope` 联动�?4. 顶部展示当前身份和数据范围�?5. 平台管理员显示租户筛选�?6. 租户管理员不显示跨租户筛选�?7. 租户状态错误码能转成明确提示�?
### 12.3 验证命令

```bash
pnpm --filter @elm-platform/server run prisma:generate
pnpm --filter @elm-platform/server run build
pnpm --filter @elm-platform/server run test
pnpm --filter @elm-platform/web-admin run type-check
pnpm --filter @elm-platform/web-admin run test:unit
pnpm --filter @elm-platform/web-admin run build
pnpm lint
```

如果用户端订单相关逻辑被改动，再补�?
```bash
pnpm --filter @elm-platform/web-user run test
pnpm --filter @elm-platform/web-user run build
```

## 13. 风险与约�?
### 13.1 Prisma 迁移风险

本阶段会修改 Prisma schema，可能影响现�?seed、测试和支付订单逻辑。实施时必须先做 schema �?seed，再逐步接入业务接口�?
### 13.2 兼容数据风险

当前 `elm` 模块部分餐厅、商品数据可能来自兼�?seed 或服务层映射。第二阶段不应一次性重构用户端公共数据链路，应优先保证后台管理接口具备租户隔离�?
### 13.3 状态机范围风险

状态机只用于租户生命周期和既有订单履约，不扩展成通用流程引擎。审批流、套餐计费、资源配额不在第二阶段实现�?
### 13.4 前端安全边界风险

前端隐藏按钮只用于体验，不能作为安全边界。所有越权判断必须在后端完成，并用测试覆盖�?
## 14. 第二阶段完成后的项目表达

完成后，项目可以表述为：

> 面向多商户场景的外卖 SaaS 运营平台。系统基于租户模型实现平台管理员、租户管理员、店铺运营人员之间的数据隔离与权限边界；租户生命周期通过领域状态机管理，支持待审核、启用、冻结、停用、过期、归档等状态流转，并对非法流转、越权操作和关键状态变化进行审计；订单履约、退款审批、餐厅商品管理和操作日志均接入租户上下文与数据范围策略，避免前端权限绕过�?
