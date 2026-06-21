# Web Admin 通知铃铛真实空态设计

日期：2026-06-21  
状态：已确认

## 背景

`NotificationBell` 已不再调用 `loadMockData()`，但当前仍在组件挂载时自动调用 `loadNotifications()`。通知后端未接通时，这会产生无意义请求和错误，而页面的自然初始状态本应是空通知。

## 目标

- 通知铃铛挂载时不自动注入 mock，也不自动请求通知接口。
- Pinia store 以空数组、未加载、非加载中、无错误作为真实初始状态。
- 保留 `NotificationApi` 与显式 `loadNotifications()`，作为后续由应用启动流程或用户交互接入后端的清晰边界。
- 未接后端时，铃铛显示空态、未读数为零且不显示徽标。

## 方案

1. 删除 `NotificationBell` 中挂载时调用 `loadNotifications()` 的生命周期副作用。
2. 保留现有通知 API adapter、store 的异步 action 与远端成功后更新本地状态的语义。
3. 不增加自动重试、懒加载、环境判断或新的本地 fixture。
4. 不修改通知视觉结构、后端、Vite mock 路由及用户现有的 `apps/web-admin/vite.config.ts` 工作区修改。

## 组件边界

- `NotificationBell`：只负责展示 store 当前状态和转发用户操作；不负责决定何时初始化远端数据。
- `useNotificationStore`：持有真实空态与远端数据客户端状态；通过 `loadNotifications()` 暴露显式加载边界。
- `NotificationApi`：保留 HTTP 契约，未来接通后端时无需改动组件展示逻辑。

## 测试

- store 单元测试验证新实例的通知列表为空、未读数为零、加载状态为初始值，且不会主动调用 API。
- 组件测试以黑盒方式验证挂载铃铛后未调用通知列表 API，并呈现空态而非通知条目。
- 运行通知聚焦测试、web-admin 类型检查；在条件允许时运行完整构建。

## 验收标准

1. `NotificationBell` 不包含挂载加载通知的行为。
2. 新建 notification store 不包含任何通知，且没有 API 调用副作用。
3. 未提供后端数据时，页面展示 `notification.empty` 对应的空态。
4. `loadNotifications()` 与 `NotificationApi` 继续存在，未来可由明确的上层流程调用。
5. 不触碰本任务之外的工作区修改。
