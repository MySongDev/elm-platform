---
title: TabBar 教学重写设计
created: 2026-05-28
scope: apps/web-admin/src/widgets/admin-layout/ui/TabBarFromScratch
---

# TabBar 教学重写设计

## 目标

在保留当�?`TabBar` 可用实现不被破坏的前提下，新建一�?`TabBarFromScratch` 练习版。后续实现时，由我一步一步解释思路，用户跟着从最小可用版本写起，最终得到一套可临时接入 `AdminLayout` 验证�?TabBar�?
## 架构与边�?
`TabBarFromScratch` �?admin 布局里的页签操作面板练习实现。它不负责路由权限、菜单生成或 tab 创建，只消费已有状态并响应用户操作�?
边界如下�?
- `entities/tab`：保�?tab 状态，提供 `tabs`、`activeTab`、`closeTab()`、`reloadTab()` 等能力�?- `vue-router`：提供当前路�?`route.fullPath`，并通过 `router.push()` 完成页面切换�?- `TabBarFromScratch`：渲�?tab 列表，把点击、关闭、右键菜单、更多操作转换成 store/router 调用�?
核心数据流：

```text
tabsStore.tabs
  �?TabBarFromScratch 渲染每一�?tab
  �?点击 tab �?router.push(fullPath)
关闭 tab �?tabsStore.closeTab(fullPath) �?必要时跳转到下一�?tab
  �?route.fullPath 决定哪个 tab active
```

教学实现原则是先写通主流程，再拆组件和 composable�?
## 实现阶段

### 阶段 1：最小可�?TabBar

先只�?`TabBarFromScratch/index.vue` 里完成核心闭环：

1. �?`useTabsStore()` 读取 `tabsStore.tabs`�?2. �?`v-for` 渲染 tab�?3. �?`tabsStore.getTitle(tab, transformI18n)` 显示标题�?4. �?`route.fullPath === tab.fullPath` 判断 active�?5. 点击非当�?tab 时执�?`router.push(tab.fullPath)`�?
阶段 1 暂不实现�?
- 关闭按钮
- 左右滚动按钮
- 右键菜单
- 更多操作按钮
- `TabBarActions.vue`
- `TabBarContextMenu.vue`
- `useScroll.ts`
- `useMenu.ts`
- 键盘交互
- 单元测试

### 阶段 2：抽�?`TabBarItem.vue`

当单�?tab 的模板开始承载图标、标题、省略号、active/fixed 样式后，抽成 `TabBarItem.vue`。关闭和右键事件先作为组件契约预留，阶段 3/4 再真正接入�?
`TabBarItem.vue` 的边界：

```text
props:
  tab
  title
  active
  closable

emits:
  click(fullPath)
  close(fullPath)
  contextmenu(event, fullPath)
```

它只负责展示和事件转发，不直接调�?router，也不直接修�?tabsStore�?
### 阶段 3：补上关闭页�?
在阶�?2 的组件边界上补关闭能力：

1. 使用 `isTabClosable(tab)` 判断是否允许关闭�?2. 固定 tab 和唯一 tab 不显示关闭按钮�?3. 点击关闭按钮时阻止冒泡，避免同时触发 tab 切换�?4. 父组件调�?`tabsStore.closeTab(fullPath)`�?5. 如果 store 返回 next path，父组件执行 `router.push(next)`�?
### 阶段 4：抽出命令逻辑并补回菜单与滚动体验

当关闭逻辑扩展为多个命令后，抽�?`useTabActions.ts`�?
它统一处理�?
- reload
- close-current
- close-left
- close-right
- close-others
- close-all

右上角更多按钮和右键菜单最终都调用同一套命令执行逻辑，避免两处行为不一致�?
`useMenu.ts` 只管理右键菜�?UI 状态：

- 是否显示
- 显示坐标
- 当前目标 tab
- 点击空白、滚动、窗口变化、Esc 时关�?
`useScroll.ts` 只管理横向滚动体验：

- 是否溢出
- 是否能向�?向右滚动
- 左右按钮滚动
- 鼠标滚轮横向滚动
- active tab 自动滚入视口

最终结构保持为�?
```text
TabBarFromScratch/
  index.vue
  TabBarItem.vue
  TabBarActions.vue
  TabBarContextMenu.vue
  tabCommands.ts
  useTabActions.ts
  useMenu.ts
  useScroll.ts
```

## 数据流与操作流程

### 页面进入

TabBarFromScratch 不创�?tab。路由变化时，外部逻辑负责调用 `tabsStore.addTab(route)`。TabBarFromScratch 只读�?`tabsStore.tabs` 并渲染�?
### 激活�?
当前 tab 使用 `route.fullPath` 判断�?
```ts
function isActiveTab(fullPath: string) {
  return fullPath === route.fullPath
}
```

这样可以区分�?query 的页面，例如 `/order/detail?id=1` �?`/order/detail?id=2`�?
### 点击 tab

点击 tab 只改变路由：

```ts
router.push(fullPath)
```

路由变化后，TabBarFromScratch 根据新的 `route.fullPath` 自动更新 active 状态�?
### 关闭 tab

关闭流程�?
```text
点击关闭
  �?tabsStore.closeTab(fullPath)
  �?如果关闭的是当前页，store 返回 next path
  �?router.push(next)
```

组件不重复计算“关闭后应该跳到哪一�?tab”，该规则由 store 统一维护�?
## 边界情况

1. 只剩一�?tab 时不显示关闭按钮，避免没有导航锚点�?2. 固定 tab 与首�?tab 不允许关闭�?3. 可关闭性优先使�?`isTabClosable(tab)`，不要在组件里散落多套规则�?4. 关闭当前 tab 后，使用 `tabsStore.closeTab(fullPath)` 返回�?next path 跳转�?5. 如果右键菜单目标 tab 已不存在，命令自然不执行，不额外弹错误�?6. 滚动和菜单是体验增强，不影响最小版本的切换和关闭主流程�?
## 测试与验�?
### 阶段 1 验收

- 页面能显�?tab 列表�?- 当前页面对应 tab �?active 样式�?- 点击其他 tab 能切换路由�?- 不出现关闭、滚动、右键、更多操作等增强 UI�?
### 阶段 2 验收

- 拆出 `TabBarItem.vue` 后，阶段 1 行为保持不变�?- `TabBarItem.vue` 不直接依�?router�?- `TabBarItem.vue` 不直接依�?tabsStore�?- 它只通过 props 接收状态，通过 emits 通知父组件�?
### 阶段 3 验收

- 非固�?tab 显示关闭按钮�?- 固定 tab / 首页 tab 不显示关闭按钮�?- 关闭非当�?tab 后，当前页面不跳转�?- 关闭当前 tab 后，跳到 store 返回的下一�?tab�?
### 阶段 4 验收

- 右键菜单能打开，并在点击空白、滚动、窗口变化、Esc 时关闭�?- “关闭左�?/ 右侧 / 其他 / 全部”在固定 tab 和唯一 tab 场景下正确禁用或隐藏�?- tab 数量很多时，左右滚动按钮出现�?- 路由切换�?active tab 自动滚入视口�?- 鼠标滚轮可以横向滚动 tab 区域�?
### 自动化检�?
每完成一个阶段，运行�?
```bash
pnpm --filter @elm-platform/web-admin run type-check
pnpm --filter @elm-platform/web-admin run test:unit
```

如果修改�?UI，还需要启�?admin 页面实际检查：

```bash
pnpm --filter @elm-platform/web-admin run dev
```

