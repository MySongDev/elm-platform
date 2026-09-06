# SmartImage 职责边界重构设计

## 背景

`apps/web-user/src/components/common/SmartImage.vue` 当前同时承担展示、图片候选地址回退、加载任务调度、双层可见性观察、延迟取消、优先级升降、生命周期清理和事件派发。现有行为是完整且有测试保护的，但多种变化原因集中在一个 SFC 中，导致通用组件的展示边界与加载策略边界混杂。

本次重构只调整内部组织方式，不改变图片加载策略和调用契约。

## 目标

- `SmartImage.vue` 只作为通用图片组件的公开外观层。
- 图片资源加载和可见性优先级分别形成独立、可测试的职责边界。
- 保持现有 props、事件载荷、DOM 状态和视觉效果不变。
- 保持候选域名回退、全局并发限制、视口优先级及降级行为不变。
- 基于当前工作区中的 `SmartImage.vue` 迁移，不覆盖用户已有未提交修改。

## 非目标

- 不重写全局图片调度器。
- 不引入第三方状态机或新的状态管理方案。
- 不合并 `v-lazy` 指令与 `SmartImage` 的加载实现。
- 不增加新的公开 props、事件或插槽。
- 不在本次重构中调整骨架屏、模糊过渡和失败占位样式。

## 目录与职责

```text
apps/web-user/src/components/common/SmartImage/
├── SmartImage.vue
├── SmartImage.test.js
├── useSmartImage.js
├── useSmartImage.test.js
├── useImageVisibilityPriority.js
└── useImageVisibilityPriority.test.js
```

现有底层工具保留原位置：

```text
apps/web-user/src/utils/image/
├── imageCandidates.js
└── imageLoadScheduler.js
```

### `SmartImage/SmartImage.vue`

职责：

- 声明并维持现有 props 默认值。
- 声明 `load`、`error` 事件。
- 持有根元素和 `<img>` 的模板引用。
- 调用 `useSmartImage`，将返回的只读状态绑定到模板。
- 保留骨架屏、渐进式显示和失败占位的模板与样式。

它不直接创建观察器、定时器或调度任务，也不直接处理候选地址切换。

### `SmartImage/useSmartImage.js`

职责：

- 根据 `src` 派生候选图片地址。
- 管理当前候选索引以及 `loaded`、`failed` 状态。
- 调用 `imageLoadScheduler` 创建、取消或更新加载任务。
- 为真实 `<img>` 绑定并清理 `load`、`error` 处理器。
- 某个候选加载失败后切换到下一个候选，全部失败后报告失败。
- 响应 `src`、`eager`、`priority` 变化，重置或重新启动加载生命周期。
- 在组件卸载时释放任务、DOM 事件和可见性资源。
- 通过回调把成功和最终失败交给组件派发事件。

输入使用 options 对象，包含响应式 props getter、根元素引用、图片元素引用和事件回调。返回 `loaded`、`failed` 两个只读状态。

### `SmartImage/useImageVisibilityPriority.js`

职责：

- 创建预加载区和真实视口两个 `IntersectionObserver`。
- 管理 `loadDelay` 定时器以及当前是否位于预加载区、真实视口。
- 将可见性转换为少量明确意图：
  - 按普通优先级排队；
  - 按视口优先级立即排队；
  - 提升或降低尚未运行任务的优先级；
  - 离开预加载区时取消尚未运行的任务。
- 在不支持 `IntersectionObserver` 时请求立即加载。
- 在重新启动和卸载时统一清理观察器与定时器。

该 composable 不读取图片 URL，不操作 `<img>`，也不知道候选地址和失败回退规则。它只负责“何时加载、以什么优先级加载”。

### 现有底层工具

- `imageCandidates.js` 继续作为纯函数层，只负责生成去重后的候选 URL。
- `imageLoadScheduler.js` 继续作为应用级基础设施，只负责全局并发、队列顺序、取消和优先级更新。

## 数据流

1. `SmartImage.vue` 将 props 与模板引用传给 `useSmartImage`。
2. `useSmartImage` 创建候选地址状态，并组合 `useImageVisibilityPriority`。
3. 可见性 composable 将观察结果转成加载或队列控制意图。
4. `useSmartImage` 使用当前候选地址调用全局调度器。
5. 调度器获得执行槽后，`useSmartImage` 才给 `<img>` 设置 `src`。
6. 加载成功时更新状态并通知组件派发 `load`。
7. 加载失败时尝试下一个候选；候选耗尽后更新状态并派发 `error`。

数据流保持单向：组件提供输入，composable 管理内部状态，组件只消费只读状态并向外派发事件。

## 兼容性

以下公开契约保持不变：

- props：`src`、`alt`、`eager`、`priority`、`skeleton`、`progressive`、`rootMargin`、`loadDelay`。
- 事件：`load`、`error`，载荷继续为 `{ src }`。
- 默认值和优先级计算方式。
- `src` 更新后的重置与重新加载行为。
- `IntersectionObserver` 缺失时立即加载。
- 已开始的浏览器图片请求不被强制中断。
- CSS 类名、失败文案和现有视觉状态。

组件文件迁入 `components/common/SmartImage/SmartImage.vue`。仓库内的显式导入和全局注册同步更新到新路径；组件标签 `<SmartImage>` 的使用方式不变。

## 测试策略

### 组件契约测试

保留轻量集成测试，验证：

- props 能正确驱动骨架、渐进式样式和失败状态。
- composable 返回状态能够映射到既有 DOM。
- `load`、`error` 事件及载荷保持不变。

### `useImageVisibilityPriority` 单元测试

覆盖：

- 快速离开预加载区会取消延迟，不产生加载意图。
- 进入真实视口会立即请求加载或提升排队任务。
- 离开真实视口但仍处于预加载区时恢复普通优先级。
- 离开预加载区会取消尚未运行任务。
- 不支持 `IntersectionObserver` 时立即加载。
- 重启和卸载会清理两个观察器及定时器。

### `useSmartImage` 单元测试

覆盖：

- 首个候选成功后的状态与事件。
- 候选失败后按顺序回退。
- 候选耗尽后的失败状态与事件。
- `src` 更新会清理旧任务和 DOM 处理器并重置状态。
- 已排队任务支持取消和优先级更新。
- 已开始请求不会因可见性变化而重复设置 `src`。

## 验证

完成重构后运行：

```bash
pnpm --filter @elm-platform/web-user exec vitest run src/components/common/SmartImage
pnpm --filter @elm-platform/web-user run type-check
pnpm --filter @elm-platform/web-user run lint
```

如目录过滤未匹配测试文件，则改为显式传入三个测试文件。验证通过的标准是现有行为测试与新增职责测试全部通过，类型检查和 lint 不引入新错误。

## 风险与控制

- **异步竞态**：旧候选的回调可能在 `src` 更新后到达。通过每次重置时清理 DOM 处理器和任务句柄，并在测试中覆盖快速切换。
- **任务重复提交**：由 `useSmartImage` 统一持有 `requestStarted` 和任务句柄，任何可见性意图都只能经过这一入口。
- **抽象过度**：只拆分两个具有独立变化原因的 composable，不建立通用状态机、类层次或插件机制。
- **迁移路径破坏**：一次性更新仓库内两个已知导入点与测试路径，并通过全局搜索确认没有旧路径残留。
