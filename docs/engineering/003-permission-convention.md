# 权限约定

> 本文档定义 Elm Platform 管理后台的权限控制规范，所有前后端开发者必须遵守。
> 最新版本基于项目当前实现（RBAC + 权限点双层模型）。

## 1. 核心原则

1. **后端永远校验，前端只负责体验**——前端权限控制（路由守卫、菜单过滤、按钮隐藏）是**体验优化**，后端接口权限是**安全防线**。
2. **新增权限必须前后端同步**——单独修改一端会导致不一致。
3. **权限点一经定义，不可随意修改**——修改会破坏已有角色的权限配置。

---

## 2. 权限模型

本项目采用 **RBAC（基于角色的访问控制）+ 权限点（Permission）双层模型**：

```
┌─────────────────────────────────────────┐
│  用户（User）                             │
│    ├── 角色（Role）：admin / user         │
│    │     └── 角色自带权限（role.permissions）│
│    └── 独立权限（user.permissions）        │
│          └── 可覆盖角色权限               │
└─────────────────────────────────────────┘
                    │
                    ▼
              有效权限（effectivePermissions）
                    │
                    ▼
            ┌──────────────────┐
            entrepreneur──────-▽──────△
            │  ┌──────────────────┐   │
            │  │  接口守卫校验     │   │
            │  │  RolesGuard      │   │
            │  │  Permissions     │   │
            │  └──────────────────┘   │
            └───────────────────────┘
```

### 2.1 角色（Role）

角色是**粗粒度**的分组，用于快速批量赋权。

| 角色编码 | 说明 | 典型权限 |
|---------|------|---------|
| `admin` | 超级管理员 | `*:*:*`（通配所有权限） |
| `user` | 普通用户 | 查看类权限 |

> 角色存储于 `roles` 表，`permissions` 字段为字符串数组。

### 2.2 权限点（Permission）

权限点是**细粒度**的操作标识，用于精确控制接口访问。

---

## 3. 权限点命名规范

### 3.1 格式

```
{domain}:{resource}:{action}
```

| 段 | 说明 | 示例 |
|----|------|------|
| `domain` | 业务域 | `system` / `commerce` / `monitor` / `platform` |
| `resource` | 资源名 | `user` / `order` / `restaurant` |
| `action` | 操作 | `view` / `add` / `edit` / `delete` |

### 3.2 标准 Action 定义

| Action | 含义 | HTTP 对应 |
|--------|------|----------|
| `view` | 查看/列表/详情 | GET |
| `add` | 新增 | POST |
| `edit` | 编辑/修改 | PATCH / PUT |
| `delete` | 删除 | DELETE |
| `approve` | 审批通过 | POST / PATCH |
| `reject` | 审批驳回 | POST / PATCH |

### 3.3 特殊权限点

| 权限点 | 说明 |
|--------|------|
| `*:*:*` | **超级管理员通配符**，拥有所有权限。不可用于普通角色。 |

---

## 4. 完整权限清单

> 权威来源：`apps/server/src/modules/admin/constants/admin-permissions.ts`

### 4.1 系统管理（system）

```
system:user:view    → 用户查看
system:user:add     → 用户新增
system:user:edit    → 用户编辑
system:user:delete  → 用户删除

system:role:view    → 角色查看
system:role:add     → 角色新增
system:role:edit    → 角色编辑
system:role:delete  → 角色删除

system:menu:view    → 菜单查看
system:menu:add     → 菜单新增
system:menu:edit    → 菜单编辑
system:menu:delete  → 菜单删除

system:dept:view    → 部门查看
system:dept:add     → 部门新增
system:dept:edit    → 部门编辑
system:dept:delete  → 部门删除
```

### 4.2 业务管理（commerce）

```
commerce:restaurant:view    → 商家查看
commerce:restaurant:add     → 商家新增
commerce:restaurant:edit    → 商家编辑
commerce:restaurant:delete  → 商家删除

commerce:food:view    → 商品查看
commerce:food:add     → 商品新增
commerce:food:edit    → 商品编辑
commerce:food:delete  → 商品删除

commerce:order:view           → 订单查看
commerce:order:accept         → 订单接单
commerce:order:prepare        → 订单制作
commerce:order:deliver        → 订单配送
commerce:order:complete       → 订单完成
commerce:order:refund:approve → 同意退款
commerce:order:refund:reject  → 驳回退款
commerce:order:edit           → 订单编辑

merchant:onboarding:view    → 商家入驻审批查看
merchant:onboarding:review  → 商家入驻审批处理
merchant:onboarding:approve → 商家入驻审批通过
merchant:onboarding:reject  → 商家入驻审批驳回
```

### 4.3 系统监控（monitor）

```
monitor:online:view          → 在线用户查看
monitor:online:force-logout  → 强制下线
log:login:view             → 登录日志查看
log:operation:view         → 操作日志查看
log:system:view            → 系统日志查看
```

### 4.4 平台管理（platform）

```
platform:tenant:view       → 租户查看
platform:tenant:create     → 租户新增
platform:tenant:update     → 租户编辑
platform:tenant:transition → 租户状态变更
```

### 4.5 权限管理（permission）

```
permission:page:view   → 页面权限查看
permission:button:view → 按钮权限查看
```

---

## 5. 前后端权限映射

| 功能页面 | 前端路由 | 前端权限（meta.auths） | 后端接口 | 后端权限装饰 |
|---------|---------|----------------------|---------|------------|
| 仪表盘 | `/dashboard/index` | — | GET /api/dashboard | 公开 |
| 用户管理 | `/system/user` | `user:view` | GET /api/users | `@RequirePermissions('user:view')` |
| 新增用户 | `/system/user` | `user:add` | POST /api/users | `@RequirePermissions('user:add')` |
| 角色管理 | `/system/role` | `role:view` | GET /api/roles | `@RequirePermissions('role:view')` |
| 商家管理 | `/commerce/restaurant` | `commerce:restaurant:view` | GET /api/restaurants | `@RequirePermissions('commerce:restaurant:view')` |
| 订单管理 | `/commerce/order` | `commerce:order:view` | GET /api/orders | `@RequirePermissions('commerce:order:view')` |
| 租户管理 | `/platform/tenant` | `platform:tenant:view` | GET /api/tenants | `@RequirePermissions('platform:tenant:view')` |
| 在线用户 | `/monitor/online-user` | `monitor:online:view` | GET /api/monitor/online | `@RequirePermissions('monitor:online:view')` |
| 登录日志 | `/monitor/login-logs` | `log:login:view` | GET /api/logs/login | `@RequirePermissions('log:login:view')` |

---

## 6. 三层防护架构

```
┌─────────────────────────────────────────────────────────────┐
│                     用户请求                                 │
│                         │                                    │
│    ┌────────────────────┼────────────────────┐              │
│    │  前端（体验层）      │                    │              │
│    │  ├─ 路由守卫        │  → 无权限重定向 403 │              │
│    │  ├─ 菜单过滤        │  → 无权限不显示     │              │
│    │  └─ 按钮隐藏        │  → 无权限不渲染     │              │
│    └────────────────────┼────────────────────┘              │
│                         │                                    │
│                         ▼                                    │
│    ┌────────────────────────────────────────────┐          │
│    │  HTTP 请求                                  │          │
│    └────────────────────────────────────────────┘          │
│                         │                                    │
│    ┌────────────────────┼────────────────────┐              │
│    │  后端（安全层）      │                    │              │
│    │  ├─ JWT 认证       │  → 无效 Token 拒绝 │              │
│    │  ├─ 角色校验       │  → 角色不匹配 403  │              │
│    │  ├─ 权限点校验     │  → 权限不足 403    │              │
│    │  └─ 数据范围校验   │  → 数据越界 403    │              │
│    └────────────────────┼────────────────────┘              │
│                         │                                    │
│                         ▼                                    │
│                    执行业务逻辑                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. 新增权限的标准流程

### 7.1 步骤清单

```
□ 1. 后端：在 admin-permissions.ts 的 buttonPermissions 数组中添加新权限点
□ 2. 后端：在 Controller 对应方法上添加 @RequirePermissions('xxx:xxx')
□ 3. 后端：运行 pnpm api:generate 生成新的 OpenAPI 类型
□ 4. 前端：在路由配置（或菜单适配器）中添加 meta.auths
□ 5. 前端：如有必要，在按钮上使用权限控制（如 v-permission 指令）
□ 6. 数据库：在角色管理中为新角色分配权限（或更新现有角色）
□ 7. 测试：验证有权限用户正常访问，无权限用户被拦截
```

### 7.2 具体代码示例

**步骤 1：后端定义权限点**

```ts
// apps/server/src/modules/admin/constants/admin-permissions.ts
export const buttonPermissions: ButtonPermissionRecord[] = [
  // ... 已有权限
  {
    code: 'system:audit:view',    // ← 新增
    name: '审计日志查看',
    group: '系统管理',
  },
]
```

**步骤 2：后端接口加装饰器**

```ts
// apps/server/src/modules/admin/controllers/audit.controller.ts
@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {

  @Get()
  @RequirePermissions('system:audit:view')  // ← 添加这行
  findAll() {
    // ...
  }
}
```

**步骤 3：生成 OpenAPI 类型**

```bash
pnpm api:generate
```

**步骤 4：前端路由配置**

```ts
// apps/web-admin/src/app/router/routes/system.ts
{
  path: '/system/audit',
  name: 'AuditLog',
  component: () => import('@/pages/system/audit/index.vue'),
  meta: {
    title: '审计日志',
    auths: ['system:audit:view'],  // ← 添加这行
  },
}
```

**步骤 5：前端按钮权限（可选）**

```vue
<!-- 如果实现了 v-permission 指令 -->
<el-button v-permission="'system:audit:view'">查看详情</el-button>
```

**步骤 6：数据库角色配置**

通过管理后台的「角色管理」页面，为角色分配新权限点 `system:audit:view`。

**步骤 7：测试验证**

```bash
# 测试有权限用户能正常访问
curl -H "Authorization: Bearer <admin-token>" \
  http://localhost:3000/api/audit

# 测试无权限用户被拦截（返回 403）
curl -H "Authorization: Bearer <user-token>" \
  http://localhost:3000/api/audit
```

---

## 8. 常见问题

### Q1: 超级管理员为什么能访问所有接口？

后端 `RolesGuard` 中判断了 `permissions.includes('*:*:*')`，超级管理员角色的 `permissions` 字段包含这个通配符，即可跳过所有权限校验。

### Q2: 角色的 `permissions` 和用户的 `permissions` 是什么关系？

用户的**有效权限** = 角色自带权限 + 用户独立权限，取并集。

```ts
// roles.guard.ts
const effectivePermissions = await this.resolveEffectivePermissions(currentUser)
// = new Set([...rolePermissions, ...userPermissions])
```

### Q3: 前端改了权限但后端没改，会怎样？

用户能看到页面/按钮，但调用接口时返回 **403 Forbidden**。这违反了"后端永远校验"原则。

### Q4: 后端改了权限但前端没改，会怎样？

用户看不到页面/按钮（或点了没反应），但直接 `curl` 接口可以正常调用。这违反了"前端体验"原则。

---

## 9. 附录

### 9.1 关键文件索引

| 文件 | 作用 |
|------|------|
| `apps/server/src/modules/admin/constants/admin-permissions.ts` | 权威权限点定义 |
| `apps/server/src/modules/auth/guards/roles.guard.ts` | 后端权限校验守卫 |
| `apps/server/src/modules/auth/decorators/permissions.decorator.ts` | 权限装饰器定义 |
| `apps/web-admin/src/app/router/guards/permissionGuard.ts` | 前端路由权限守卫 |
| `apps/web-admin/src/widgets/admin-layout/ui/Sidebar/components/menu/SidebarItem.vue` | 前端菜单权限过滤 |

### 9.2 相关命令

```bash
# 生成 OpenAPI 类型（后端修改后必须执行）
pnpm api:generate

# 重启后端服务
pnpm dev:server

# 前端重新加载权限（刷新页面即可，权限存储于 Pinia + localStorage）
```

---

## 修订记录

| 日期 | 修订人 | 说明 |
|------|--------|------|
| 2025-XX-XX | — | 初始版本，基于项目当前实现整理 |

---

> 如有疑问，请在 issue 或 PR 中 @ 项目维护者。
