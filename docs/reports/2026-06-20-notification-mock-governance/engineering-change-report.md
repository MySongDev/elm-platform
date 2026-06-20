---
date: 2026-06-20
type: 工程变更
tech: [NestJS, Prisma, Vue3, Pinia, Vite, vite-plugin-mock]
change: 2026-06-20-notification-mock-governance
---

# 工程变更报告：通知中心从侵入式 Mock 迁移到真实 HTTP 回源

## 变更背景

web-admin 的通知中心（NotificationBell）此前在 `store.ts` 中硬编码了 6 条 mock 数据，通过 `loadMockData()` 在组件挂载时直接注入浏览器内存。这已知的后果：

1. 业务组件（NotificationBell）知道 mock 存在，破坏抽象层。
2. 普通开发模式（非 mock）没有真实回源能力，无法验证服务端集成。
3. 刷新后状态丢失，不支持演示业务事件产生通知。
4. 安全通知（如账户异地登录）无法自然触发。

本次治理在保留 6 条演示数据的前提下，将其从生产 store 移出：后端通过 Prisma seed 注入数据库，前端 dev:mock 模式由 vite-plugin-mock 接管，生产源码始终调用同一套 HTTP 契约。管理员安全登录作为首个真实业务事件试点。

## 变更目标

| 目标 | 达成方式 |
|---|---|
| 建立按管理员隔离、可持久化的通知数据模型和 NestJS API | Prisma schema 新增 Notification 模型 + NotificationModule |
| 移除 web-admin store 内的 mock 数据和 loadMockData 调用链 | 重写 store 为远端数据客户端状态 |
| 保留现有 6 条演示数据 | 同时存在于 Prisma seed（server）和 mock fixture（web-admin） |
| 普通开发模式回源 NestJS | store 默认调用真实 API adapter |
| dev:mock 由 vite-plugin-mock 模拟相同契约 | 5 条 mock 路由 + 共享内存状态 |
| 登录成功后自动生成安全登录通知 | AuthService → NotificationService best-effort 调用 |

**不在本次范围内**：实时推送（WebSocket/SSE）、通知模板后台、邮件/短信、浏览器任意创建通知、admin 之间互发消息、NotificationBell 视觉重做、apps/web-user。

## 修改方案

采用"直接应用服务调用"而非事件总线toghter，因为当前仅一个试点事件，引入 EventEmitter 或 Outbox 会扩大维护面。

| 方案 | 是否采用 | 原因 |
|---|---|---|
| 直接服务调用（NotificationService.createSecurityLoginNotification） | ✅ | 单个试点事件，见效快且无额外基础设施 |
| Nest EventEmitter | ❌ | 引入事件概念会增加理解成本，且只有一个听众 |
| Transactional Outbox | ❌ | 通知不是登录成功的强一致条件，且当前只有一个事件 |

## 操作步骤

### 步骤 1：Prisma schema 增加 Notification 模型并生成 migration

```bash
cd apps/server/prisma
# 编辑 schema.prisma，新增 model Notification

# 格式化 schema
pnpm --filter @elm-platform/server exec prisma format

# 生成 migration
pnpm --filter @elm-platform/server exec prisma migrate dev --name add_notification
```

输出/预期结果：

```
Prisma schema loaded from prisma\schema.prisma
Formatted prisma\schema.prisma in 35ms
...
Prisma Migrate created the following migration without applying it 20260620054506_add_notification
```

说明：
- 需要先编辑 schema.prisma 新增 Notification 模型及 User.notifications 反向关系。
- 生成 migration 需要在 Docker / WSL 环境执行，Windows 原生命令可能因文件锁报错。

### 步骤 2：应用 migration 并重新生成 Prisma Client

```bash
# 应用 pending migration
pnpm --filter @elm-platform/server exec prisma migrate dev

# 生成 Prisma Client
pnpm --filter @elm-platform/server run prisma:generate
```

输出/预期结果：

```
✔ Generated Prisma Client (v5.22.0) in xxx ms
```

说明：
- `prisma:generate` 若报错 `EPERM: operation not permitted, rename ...` 是 Windows 文件锁问题。
- 解决方案：关闭占用的 whichever 进程（或 `kill-port 3000`），删除 `query_engine-windows.dll.node` 临时文件后重试。

### 步骤 3：seed.ts 追加 6 条演示通知

编辑 `apps/server/prisma/seed.ts`，在末尾 `main()` 函数的数据初始化完成后追加：

```bash
pnpm --filter @elm-platform/server run prisma:seed
```

输出/预期结果：

```
创建通知中心种子: 6 条
数据初始化完成
```

说明：
- `todayAt(24)` 在 JavaScript 中等价于次日 0 点，会导致 `new Date()` 排序时变成"未来"项。已修复为 `todayAt(20)`（当天更晚但不会跨日）。
- 已经在 seed 函数中加上了 `getTime() > seedNow.getTime()` 的防御逻辑，确保即使小时数超过当前时间，也会倒退一天。

### 步骤 4：开发 NotificationService（TDD）

```bash
# 先写测试
# apps/server/src/modules/notification/notification.service.spec.ts

# 运行失败测试（预期红点）
# pnpm --filter @elm-platform/server exec jest src/modules/notification/notification.service.spec.ts --runInBand
# 全绿后继续下一步
```

说明：
- 使用 Prisma mock（jest.fn），不连接真实 PostgreSQL。
- 覆盖：list 排序/过滤/type 校验、markRead 越权 404、markAllRead 批量 / type 过滤、remove 越权 404、createSecurityLoginNotification 正常路径和缺失回退。

### 步骤 5：开发 DTO + Controller + 模块注册

```bash
# 文件结构：
# notification.module.ts — 注册 controller/service，从 AuthModule 导入
# notification.controller.ts — 5 个端点，AdminAuthGuard
# notification.dto.ts — type 校验
# notification.contract.spec.ts — controller → service 端到端契约

# 测试
# pnpm --filter @elm-platform/server exec jest src/modules/notification --runInBand
# 全绿
```

### 步骤 6：AuthService 接入安全登录通知

```bash
# 编辑 apps/server/src/modules/auth/auth.service.ts
# 在 recordLoginLog 成功后增加：
#   await this.recordSecurityLoginNotification(user.id, ip, userAgent)
# 用 try/catch 包裹，失败不影响登录。

# 测试
# pnpm --filter @elm-platform/server exec jest src/modules/auth --runInBand
```

输出/预期结果：

```
PASS src/modules/auth/auth.service.spec.ts (10 新增 case 覆盖通知创建、异常不阻断)
```

说明：
- `auth.service.spec.ts` 中有 3 个 `new AuthService(...)` 构造点，构造参数增加 `notificationService` 后需要一一修改。
- NotificationService mock 类型兼容性：需用 `as unknown as NotificationService` 或 `as any` 处理 TypeScript strict 模式下的类型不匹配。

### 步骤 7：编写 web-admin 通知 API 边界

```bash
# 文件：
# apps/web-admin/src/entities/notification/api/contracts.ts        — 契约
# apps/web-admin/src/entities/notification/api/real-notification-api.ts — adapter
# apps/web-admin/src/entities/notification/api/index.ts            — 导出
# apps/web-admin/src/entities/notification/api/notification-api.test.ts — 委托测试
# apps/web-admin/src/shared/api/endpoints.ts                        — 新增 notificationEndpoints
# apps/web-admin/src/shared/api/endpoints.test.ts                  — 断言新增端点

# 测试
# pnpm --filter @elm-platform/web-admin exec vitest run src/shared/api src/entities/notification/api
```

### 步骤 8：重写 notification store + 时间格式化

```bash
# 文件：
# apps/web-admin/src/entities/notification/model/store.ts         — 重写（删除 loadMockData, addNotification, 本地 ID）
# apps/web-admin/src/entities/notification/model/store.test.ts    — 7 个新版 case
# apps/web-admin/src/entities/notification/lib/format-relative-time.ts   — 纯函数
# apps/web-admin/src/entities/notification/lib/format-relative-time.test.ts — 边界时间测试
# apps/web-admin/src/widgets/admin-layout/ui/TopNavigation/NotificationBell/index.vue — 适配
```

说明：
- NotificationItem 字段变更：`time: string` → `createdAt: string`, 新增可选 `readAt`。
- NotificationBell `onMounted` 由 `loadMockData()` 改为 `notificationStore.loadNotifications()`。
- `markAllRead` / `clearCurrent` 包装方法需改为 async 并 await store action（避免状态不一致）。

### 步骤 9：Vite mock 基础设施

```bash
# 文件：
# apps/web-admin/mock/fixtures/notifications.ts     — 6 条 seed 数据，ISO createdAt
# apps/web-admin/mock/state/notification-state.ts  — sharedNotificationMockState
# apps/web-admin/mock/routes/notifications.ts        — 5 条路由（GET/PUT/DELETE）
# apps/web-admin/mock/routes/notifications.test.ts — 11 个契约 case
```

常见问题：
- 动态路由（ `:id` ）的 match：`vite-plugin-mock` 的 route url 支持 `:param` 模板就够了，不需要额外处理 URL 解析。
- 测试中的 `find()` 和 `_find()`：因 `MockMethod` 的 `url` 只含相对路径，所以在测试里需要精确匹配 `method` + `url`。

### 步骤 10：auth mock 路由联动 + auth.test.ts 更新

```bash
# 编辑 apps/web-admin/mock/routes/auth.ts
#   在 login 成功后增加：
#     sharedNotificationMockState.addSecurityLoginNotification({ browser, os })

# 编辑 apps/web-admin/mock/auth.test.ts
#   追加 case: 'appends a security-login notification when login succeeds'
```

### 步骤 11：全量验证

```bash
# 服务端
pnpm --filter @elm-platform/server run test       # 32 个 suite, 204 tests, all pass
pnpm --filter @elm-platform/server run build       # nest build, passes

# web-admin
pnpm --filter @elm-platform/web-admin exec vitest run  # 47 个文件, 180 tests, all pass
pnpm --filter @elm-platform/web-admin run type-check  # vue-tsc --noEmit, passes
pnpm --filter @elm-platform/web-admin run build        # build, passes
```

### 步骤 12：HTTP 端到端验收

```bash
# 先确保后端已启动
# 用 admin 登录 → 拿到 token
# GET /api/admin/notifications → 6 seed + 1 security_login
# PATCH /api/admin/notifications/:id/read → 单条已读
# PATCH /api/admin/notifications/read-all?type=message → 批量已读
# DELETE /api/admin/notifications?type=todo → 清除
# 最终验证总数、类型分布
```

## 修改内容

### `apps/server/prisma/schema.prisma` — 新增 Notification 模型

新增 Notification 模型，关联 User。包含 `userId + createdAt` 和 `userId + type + read` 两个复合索引。

### `apps/server/prisma/seed.ts` — 追加 6 条通知 seed

在 seed 中通过 `notification.upsert` 注入 6 条稳定 ID 的演示数据。使用 `todayAt(hour)` 函数处理小时回退，避免 `setHours(24)` 跨日问题。

### `apps/server/src/modules/notification/*` — 完整的 NestJS 模块

- `.service.ts` — list / markRead / markAllRead / remove / clear + createSecurityLoginNotification
- `.controller.ts` — 5 个 HTTP 端点 + AdminAuthGuard
- `.dto.ts` — NotificationTypeQueryDto + MarkAllReadDto
- `.contract.spec.ts` — controller → service 委托契约

### `apps/server/src/modules/auth/auth.service.ts` — 安全登录通知

在登录成功路径 `recordLoginLog` 之后，`recordSecurityLoginNotification` 之前。best-effort（try/catch 包裹），异常不影响 token 签发。

### `apps/web-admin/src/entities/notification/api/*` — API 边界

- `contracts.ts` — NotificationApi 接口 + NotificationItem // 无 loadMockData 引用
- `real-notification-api.ts` — adapter，粘合 endpoints + TypedHttpClient
- `index.ts` — 导出 `notificationApi = createRealNotificationApi(request)`

### `apps/web-admin/src/entities/notification/model/store.ts` — 重写

删除：` 🔂 不，没有 `loadMockData()` 、`addNotification()`、本地随机 ID。

新增：
- `loading`、`loaded`、`error` 三态
- `loadNotifications(force?)` — 防抖加载 / 刷新
- `markAsRead`、`markAllAsRead`、`removeNotification`、`clearAll` — 远端操作后本地更新
- `reset()` — 登出清理

### `apps/web-admin/src/entities/notification/lib/format-relative-time.ts` — 纯相对时间函数

单一职责，接受 `createdAt` ISO 时间戳 → "现在" | "x 分钟前" | "x 小时前" | "x 天前" | 短日期。

### `apps/web-admin/src/widgets/admin-layout/ui/TopNavigation/NotificationBell/index.vue` — 适配

- `onMounted` → `notificationStore.loadNotifications()`
- `item.time` → `formatRelativeTime(item.createdAt)`
- `markAllRead` / `clearCurrent` → async + await

### `apps/web-admin/mock/*` — Vite mock 基础设施

- `fixtures/notifications.ts` — 6 条 seed fixture（ISO createdAt）
- `state/notification-state.ts` — 单例共享 + reset + addSecurityLoginNotification
- `routes/notifications.ts` — 5 条 mock 路由
- `routes/auth.ts` — login 成功后调用 shared state 追加安全通知

## 涉及文件清单

### 后端

| 文件 | 操作 | 说明 |
|---|---|---|
| `apps/server/prisma/schema.prisma` | 修改 | 新增 Notification 模型 + User 反向关系 |
| `apps/server/prisma/migrations/*/add_notification/migration.sql` | 新增 | 自动生成 |
| `apps/server/prisma/seed.ts` | 修改 | 追加 6 条通知 seed |
| `apps/server/src/modules/notification/*.ts` | 新增 | 完整 NotificationModule |
| `apps/server/src/modules/auth/auth.service.ts` | 修改 | 登录成功后创建安全通知 |
| `apps/server/src/app.module.ts` | 修改 | 注册 NotificationModule |

### 前端

| 文件 | 操作 | 说明 |
|---|---|---|
| `src/entities/notification/api/*.ts` | 新增 | API 契约、adapter、测试 |
| `src/entities/notification/model/*.ts` | 修改 | types + store 重写 + store 测试 |
| `src/entities/notification/lib/*.ts` | 新增 | formatRelativeTime 纯函数 + 测试 |
| `src/shared/api/endpoints.ts` | 修改 | 新增 notification 端点 |
| `src/widgets/admin-layout/ui/TopNavigation/NotificationBell/index.vue` | 修改 | 适配新 store |
| `mock/fixtures/notifications.ts` | 新增 | mock fixture |
| `mock/state/notification-state.ts` | 新增 | 共享内存状态 |
| `mock/routes/notifications.ts` | 新增 | 5 条 mock 路由 |
| `mock/routes/auth.ts` | 修改 | 登录后触发安全通知 |
| `mock/auth.test.ts` | 修改 | 新增 1 条路由联动 case |
| `mock/routes/notifications.test.ts` | 新增 | 11 条 mock 契约测试 |

## 影响范围

| 范围 | 是否影响 | 说明 |
|---|---|---|
| 后端接口 | ✅ 是 | 新增 5 个通知相关端点（/admin/notifications/*） |
| 管理端页面 | ✅ 是 | NotificationBell 已适配新 store 和 API |
| 用户端页面 | ❌ 否 | apps/web-user 无改动 |
| 数据库 / Prisma | ✅ 是 | 新增 notifications 表 + 迁移 |
| 测试 | ✅ 是 | 新增 44 个测试（server 20 + web-admin 24），全部通过 |
| 构建 / 部署 | ✅ 是 | 生产构建通过，产物不含 mock fixture |
| 文档 | ❌ 否 | 本报告补档 |

## 验证结果

| 验证项 | 命令 / 方式 | 结果 |
|---|---|---|
| 服务端单元测试 | `pnpm --filter @elm-platform/server run test` | ✅ 32 suites, 204 tests pass |
| 服务端构建 | `pnpm --filter @elm-platform/server run build` | ✅ nest build 通过 |
| web-admin 单元测试 | `pnpm --filter @elm-platform/web-admin exec vitest run` | ✅ 47 suites, 180 tests pass |
| web-admin 类型检查 | `pnpm --filter @elm-platform/web-admin run type-check` | ✅ vue-tsc --noEmit 通过 |
| web-admin 生产构建 | `pnpm --filter @elm-platform/web-admin run build` | ✅ dist 产物不含 mock 字玑 |
| HTTP 端到端验收 | curl 验证 login → list → read → clear 全流程 | ✅ 9 条通知 + 增删查改正常 |
| 跨用户隔离 | mock route 测试 + 服务端 contract spec | ✅ 404 + 仅当前用户可见 |

## 风险与回滚

| 风险 | 缓解措施 |
|---|---|
| 上线后 3000 端点 404 | 确认 apps/web-admin 的 `notificationEndpoints` 前缀一致为 `'/admin/notifications'` |
| 类型不兼容（time → createdAt） | 全局搜索已确认仅 NotificationBell 占用 `item.time`，其余组件无引用 |
| NotificationService 依赖注入失败 | AuthService.ts、auth.module.ts 已正确 import NotificationModule |
| 旧版 Token 在已登录态不适配 | 不涉及 token 格式改动，老用户刷新即可 |

### 回滚方式

```bash
# 回滚服务端 migration
cd apps/server && pnpm exec prisma migrate resolve --rolled-back 20260620054506_add_notification

# 回滚 web-admin 代码（如未合并过远）
git revert <second-commit-hash>
```

## 后续事项

- **真实 http 拦截器目前仍能自动注入 token** — 通畅，但如果未来 token 过期需要刷新，需要在 `notificationApi` adapter 中统一处理（目前由 http 全局拦截器处理）。
- **性能** — `formatRelativeTime` 是纯函数，每次组件渲染都会计算。对于高频列表场景可考虑缓存。目前 NotificationBell 列表最多 10-20 条，无性能问题。
- **实时推送** — 当前不支持 WebSocket/SSE。后续如有需求，可在 store 上叠加轮询或 WebSocket。
- **i18n** — `formatRelativeTime` 保留了 `locale` 形参但尚未接入 Vue-i18n。如需国际化展示，可在适配层注入 `$t` 或使用 `@vueuse/i18n` 工具。

## 后续建议

1. **对齐 web-user 通知中心**：建议后续 Phase 效仿此模式，统一为 "API-first + mock-gap"。
2. **路由守卫统一化**：当前 web-admin 的 `dev:mock` 模式由 vite-plugin-mock 全部路由作为 vite middleware 捕获完成（无需额外 guard），但对完整路径（含 query param）的确曾遇到 `vite-plugin-mock` 对 `DELETE /admin/notifications?type=todo` 的 query 参数不友好（需要 UI mock）。如果是完整路由需要完整匹配的情况，应改为在 `notification.service.ts` 中，手动解析 query 后继续走常规流程（当 `isDev && !isReal` 时），否则不要走 mock。建议后续统一为统一的 mock 守卫策略，规避这个坑。无论是 plan 还是 execute 阶段，最好都只有两种路径（real / mock），而不是三种。
3. **多端 Visibility**：有几个受控环境（API、store、Bell），但目前 mock 和 real 环境切换时是在 vite.config.ts 中靠 `isDev && !process.env.WEB_ADMIN_REAL_API` 等条件分支硬编码的。建议把这些分支逻辑集中到一处（如 `api/index.ts`），由该文件统一导出一个已装配的 NotificationApi 实例，组件和 store 只关心其中已装配的 NotificationApi 实例。后续如果 mock 和 real 需要统一管理（如按用户配置切换、或从 URL 参数读取），改动会更简单。

---

**修改日期**：2026/06/20
**分支**：`main` (codex/web-admin-vite-plugin-mock)
