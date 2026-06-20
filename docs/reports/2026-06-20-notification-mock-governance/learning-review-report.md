---
date: 2026-06-20
type: 学习复盘
tech: [NestJS, Prisma, Vue3, Pinia, Vite, vite-plugin-mock]
change: 2026-06-20-notification-mock-governance
---

# 学习复盘报告：通知中心从侵入式 Mock 迁移到真实 HTTP 回源

---

## 问题现象

### 最初的代码状态

```ts
// apps/web-admin/src/entities/notification/model/store.ts
export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref<NotificationItem[]>([])

  function loadMockData() {
    const mockData = [
      { type: 'notification', title: '系统升级通知', time: '10 分钟前', ... },
      { type: 'notification', title: '安全提醒', time: '1 小时前', ... },
      ...
    ]
  }

  return { notifications, loadMockData }
})
```

### 问题

1. **侵入式**：NotificationBell 直接调用 `loadMockData()`，`time` 字段存的是"10 分钟前"这种中文相对时间字面量。
2. **无真实数据源**：一旦关闭 mock，通知列表直接是空的——因为没有真实的 HTTP 回源能力。
3. **状态不持久**：刷新页面后，所有已读/删除操作丢失。
4. **无法扩展**：通知源（如安全登录提醒）无法通过正常业务流程产生。

### 触发条件

- 开启 `pnpm dev:mock` 时能看到 6 条演示数据，但切换到 `pnpm dev` 后端真实开发模式时就一片空白。
- 安全登录提醒需要通过后端真实事件触发，当前模式完全无法演示。

---

## 问题产生原因

### 直接原因

- `NotificationItem.time` 存的是展示文本而非时间戳，导致前端无法根据当前时间动态计算相对时间。
- `loadMockData()` 把 seed 数据硬编码在 store 内部，mock 和生产代码混在一起。
- 没有 Notification API 适配层，直接越过 HTTP 层操作内存数据。

### 深层原因

- 项目早期为了快速迭代，把 mock 逻辑混入生产代码。随着项目成熟，mock 和生产代码的边界需要被重新划定。
- 通知中心是"内容展示型"功能，前端需要显示相对时间（"10 分钟前"），所以最初的决策者直接把格式化后的字符串作为数据源。但这个决策在当时是正确的——快速验证功能——只是到了项目后期成为了一个技术债。

---

## 为什么要这样修改

### 方案选择

| 方案 | 是否采用 | 原因 |
|---|---|---|
| 直接服务调用（NotificationService.createSecurityLoginNotification） | 是 | 单个试点事件，见效快且无额外基础设施。AuthService 直接注入 NotificationService 即可。 |
| Nest EventEmitter | 否 | 引入事件概念会增加理解成本，且当前只有一个听众（创建通知）。EventEmitter 更适合"订阅-发布"场景，而非"登录成功 -> 顺手写一条通知"。 |
| Transactional Outbox | 否 | 通知不是登录成功的强一致条件。如果通知写入失败，用户不应感知——Outbox 反而会把问题复杂化。 |
| CQRS / 独立事件流 | 否 | 对于"登录成功写一条通知"这种简单场景，CQRS 是杀鸡用牛刀。 |

### 核心设计决策

1. **API 边界**：NotificationApi 接口 + real-notification-api adapter。生产环境注入 `createRealNotificationApi(request)`，dev:mock 模式由 vite-plugin-mock 替代。store 只依赖 NotificationApi 接口，不关心实例来源。
2. **格式化解耦**：`formatRelativeTime(iso)` 从 store / 组件中拆出，作为独立纯函数。不负责国际化、不负责格式化——只管把 ISO 转成"相对时间"字符串。
3. **安全登录通知的插入策略**：best-effort。`AuthService.login()` 尝试调用 `NotificationService.createSecurityLoginNotification`，失败时不阻断登录流程。这符合「通知是附加信息而非主业务」的原则。

---

## 这样修改解决了什么问题

1. **mock 不再侵入生产源码**：`src/` 不提 `loadMockData`、`DEV_MOCK_NOTIFICATIONS` 等 mock 术语。
2. **同一套 HTTP API 覆盖两种模式**：`notificationApi.list()` 在 dev 模式下调用 NestJS `/admin/notifications`，在 dev:mock 模式下由 vite-plugin-mock 拦截并走共享内存 state。
3. **时间动态计算**：`formatRelativeTime` 根据当前时间实时计算"几分钟前"，不再依赖死字符串。
4. **状态持久化**：所有增删查改操作都通过服务端确认后更新本地 state，刷新后能正确回显。
5. **业务事件驱动通知**：登录成功后自动产生安全提醒通知，为后续扩展（订单状态变更、审批消息等）提供了完整参考。

---

## 修改前后对比

### 修改前

```ts
// store.ts
function loadMockData() {
  if (notifications.value.length > 0) return
  const mockData = [
    { type: 'notification', title: '系统升级通知', time: '10 分钟前' },
    // ... 5 more
  ]
  mockData.forEach(item => addNotification(item))
}

// NotificationBell.vue
onMounted(() => notificationStore.loadMockData())
<span>{{ item.time }}</span>
```

### 修改后

```ts
// store.ts
async function loadNotifications(force = false) {
  if (loaded.value && !force) return
  loading.value = true
  error.value = null
  try {
    notifications.value = await notificationApi.list()
    loaded.value = true
  } catch (caught) {
    error.value = caught instanceof Error ? caught : new Error(String(caught))
  } finally {
    loading.value = false
  }
}

// NotificationBell.vue
onMounted(() => notificationStore.loadNotifications())
<span>{{ formatRelativeTime(item.createdAt) }}</span>
```

---

## 关键踩坑记录

### 1. Prisma generate Windows 文件锁

问题：运行 `prisma generate` 时 `EPERM: operation not permitted, rename ...tmp2076`。

原因：Windows 下另一个进程（可能是之前的 Prisma query engine）锁住 DLL。

解决：

```bash
npx kill-port 3000  # 确保没有服务占用端口并锁文件
rm -f ".../.prisma/client/query_engine-windows...tmp*"
pnpm --filter @elm-platform/server run prisma:generate
```

### 2. JavaScript setHours(24) 跨日

问题：声称"截止今天 24:00"的通知排序时跑到了最前面。

原因：`setHours(24, 0, 0, 0)` 等价于次日 0 点。当 `Date.now()` 是当天 14:00 时，`todayAt(24)` 等于明天 0:00，也就是"未来 10 小时"，排序时反而成了"最新的"。

解决：

```ts
const todayAt = (h: number) => {
  const d = new Date(seedNow)
  d.setHours(h, 0, 0, 0)
  if (d.getTime() > seedNow.getTime()) {
    d.setDate(d.getDate() - 1)
  }
  return d
}
```

把 hour > 当前小时的时间倒退一天，确保所有 fixture 都来自"过去"。

### 3. TypeScript strict-eraue `ReturnType` 套层问题

问题：第一次写 `real-notification-api.ts` 时用了 `ReturnType<NotificationApi['list']>`，结果 type 等于 `Promise<NotificationItem[]>`，再套上 `Promise<>` 变成 `Promise<Promise<NotificationItem[]>>`。

解决：显式写出 `Promise<NotificationItem[]>`，不用 `ReturnType` 套娃。TypeScript 泛型的返回值推断在法律文件齐备的情况下很直观，但在 adapter 层容易因双重 Promise 让人困惑。

### 4. vitest `resetModules` + `vi.doMock` 后的缓存陷阱

问题：多次 `vi.doMock('../api', ...)` 在异步 beforeEach 中切换 mock 实现时，某些 test case 仍然看到旧的 mock。

原因：`doMock` 的改造只影响第一次 `import`，如果某个测试中先 `import` 了 store（触发全局的 `notificationApi` 实例），后续 `doMock` 不会重新加载该实例。

解决：对于需要动态替换 API 的测试，采用 `vi.doMock` + `await vi.importActual` + 手动注入的工厂模式，或在 store 中直接分别构造不同 API adapter 的 wrapper。

### 5. vite-plugin-mock 动态路由 `:id` 处理

问题：测试里 `routes.find(item => item.method === 'get' && item.url === '/api/admin/notifications/n1/read')` 找不到动态路由 `"/:id/read"`。

解决：手动实现路由 match 函数，把 route url 转成 RegExp：

```ts
function routeMatches(route: MockMethod, method: string, url: string) {
  if (route.method !== method) return false
  const pattern = route.url.replace(/:[^/]+/g, '([^/]+)')
  const regex = new RegExp(`^${pattern}$`)
  return regex.test(url)
}
```

---

## 学习要点

### 1. 前端时间不要用中文相对时间做数据源

**原因**：相对时间是 view 层的概念，数据源应存 ISO 时间戳。
**做法**：`createdAt: string` → `formatRelativeTime(createdAt, locale, now)`。
**本项目应用**：NotificationItem 字段由 `time: string` 改为 `createdAt: string`。

### 2. API 边界层（Adapter Pattern）是 mock 和真实环境切换的关键

**原理**：通过契约接口（`NotificationApi`）隔离真实 adapter（`real-notification-api.ts`）和 mock adapter（`vite-plugin-mock` 路由）。
**本项目应用**：生产代码不区分 `isDev` / `isMock`，运行时由 vite-plugin-mock 自动拦截。

### 3. Mock state 应该是内存级共享，不是文件级

**原因**：auth 登录后通知状态需要跨路由共享。如果每个路由文件各自维护独立 memory，登录产生的通知不会出现在通知列表。
**做法**：通过模块级 `let state = ...` 对外暴露操作函数，测试时通过 `resetNotificationMockState()` 重置。
**本项目应用**：`apps/web-admin/mock/state/notification-state.ts`。

### 4. 「不影响主流程」的 best-effort 设计模式

**适用场景**：日志、统计、通知等附加信息。
**实现方式**：`try { await secondaryService.doSomething() } catch { /* swallow, log */ }`。
**本项目应用**：AuthService 在成功登录后尝试创建安全通知，失败时不阻止 token 返回。

---

## 以后的注意事项

### 编码规范

1. **不要存中文相对时间**：数据源永远是 ISO 时间戳。展示层用纯函数计算。
2. **mock 和生产代码分层**：store/component 中不出现 `loadMockData()`、`isMock`、`__DEV__` 等与环境相关的代码。mock 逻辑统一到 `api/index.ts` 的注入点。
3. **async action 的错误处理**：store action（如 `markAsRead`）捕获错误后写 `error.value`，但不 rethrow。组件层通过 `error` 状态或者共享 HTTP 拦截器统一处理。

### 回归策略

1. 每次重构后确认 `pnpm --filter xxx run test` 通过。
2. mock 改动后确认 `pnpm dev:mock` 和 `pnpm dev` 两种模式都正常。
3. 生产构建确认产物不含 fixture 字面量：`grep -r "seed-notify-" apps/web-admin/dist/` 应为空。

### 排查方法

1. **通知列表为空**：看 Network panel 的 `/admin/notifications` 是否返回 5 条（3 seed + 2 security）。如果是 0 条，检查 seed 是否执行过。
2. **时间顺序不对**：检查 `setHours(hour)` 是否大于 23，或者当天还未到达 hour 时刻。
3. **mock 模式下无法触发通知**：检查 `apps/web-admin/mock/routes/auth.ts` 登录后是否调用了 `sharedNotificationMockState.addSecurityLoginNotification(...)`

---

## 关联报告

- 工程变更报告：`./engineering-change-report.md`
- 设计文档：`../../docs/superpowers/specs/2026-06-20-notification-mock-governance-design.md`
- 实施计划：`../../docs/superpowers/plans/2026-06-20-notification-mock-governance.md`

---

**复盘日期**：2026/06/20
**分支**：`main` (codex/web-admin-vite-plugin-mock)
