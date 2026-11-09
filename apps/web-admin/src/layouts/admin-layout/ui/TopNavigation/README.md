# TopNavigation 顶部导航

## 功能总览

| 功能 | 实现位置 | 说明 |
|---|---|---|
| 顶部导航组装 | [`index.vue`](index.vue) | 左侧放侧栏折叠入口与面包屑，右侧放身份提示、搜索、通知、语言与用户菜单 |
| 侧栏折叠入口 | [`HeaderSidebarToggle/index.vue`](HeaderSidebarToggle/index.vue) | 复用侧栏的 `SidebarToggle`，转发切换事件，不自行保存折叠状态 |
| 面包屑 | [`Breadcrumb/index.vue`](Breadcrumb/index.vue) | 根据当前路由的 `matched` 记录生成导航，末项只展示、不跳转 |
| 租户身份提示 | [`TenantContextBadge/index.vue`](TenantContextBadge/index.vue) | 根据用户数据范围、租户与绑定店铺展示身份；不是租户切换器 |
| 菜单搜索入口 | [`Search/index.vue`](Search/index.vue) | 展示顶部按钮，挂载搜索弹窗，通过组件引用调用 `open()` |
| 搜索弹窗 | [`Search/SearchDialog.vue`](Search/SearchDialog.vue) | 展示输入框、结果、历史与快捷键提示，处理遮罩关闭和焦点定位 |
| 搜索状态与匹配 | [`Search/useSearchDialog.ts`](Search/useSearchDialog.ts)、[`Search/lib/flatten-menu.ts`](Search/lib/flatten-menu.ts) | 展开当前用户菜单，按标题或路径匹配，管理历史记录与键盘操作 |
| 搜索结果项与类型 | [`Search/SearchResultItem.vue`](Search/SearchResultItem.vue)、[`Search/types.ts`](Search/types.ts) | 区分页面结果与历史词条，转发选择和激活事件 |
| 通知中心 | [`NotificationBell/index.vue`](NotificationBell/index.vue) | 展示未读数与通知/消息/待办，支持单条已读、当前分类全部已读和清空 |
| 语言切换 | [`LangSwitcher/index.vue`](LangSwitcher/index.vue) | 提供中文与英文选项，通过共享 i18n 入口更新语言偏好 |
| 用户菜单 | [`UserMenu/index.vue`](UserMenu/index.vue) | 展示用户名与首字母头像，提供账户设置和退出登录 |
| 公共操作按钮 | [`components/TopNavigationAction.vue`](components/TopNavigationAction.vue) | 统一按钮外观、原生类型与可访问名称，支持默认、圆形和胶囊形 |
| 公共悬浮下拉 | [`components/HoverDropdown.vue`](components/HoverDropdown.vue) | 统一 hover 触发、右下方展开、插槽与 `command` 事件转发 |

本文记录当前实现的职责边界与修改约束，不把已有界面等同于完整的业务闭环。代码行为变化时，应同步更新相应章节；历史变更过程另外记录在工程报告中。

## 目录与阅读顺序

```text
TopNavigation/
├── index.vue
├── README.md
├── Breadcrumb/index.vue
├── HeaderSidebarToggle/index.vue
├── TenantContextBadge/index.vue
├── Search/
│   ├── index.vue              # 功能入口：按钮 + 弹窗挂载
│   ├── SearchDialog.vue       # 弹窗视图
│   ├── SearchResultItem.vue   # 结果/历史项视图
│   ├── useSearchDialog.ts     # 状态、搜索、历史、键盘交互
│   ├── types.ts
│   └── lib/flatten-menu.ts    # 路由树展开
├── NotificationBell/
│   ├── index.vue
│   └── index.test.ts
├── LangSwitcher/index.vue
├── UserMenu/index.vue
└── components/
    ├── TopNavigationAction.vue
    └── HoverDropdown.vue
```

先看 `index.vue` 理解组装关系，再进入要修改的功能目录。搜索入口与弹窗放在同一目录，是因为二者属于同一个功能；保留两个组件，是为了分开顶部按钮布局与弹窗布局。外部顶部导航只需引入 `Search/index.vue`，不必知道弹窗内部如何实现。

目录名为 `Search`，入口组件的运行时名称与顶部导入名为 `TopNavigationSearch`，避免将 HTML 保留名称 `Search` 用作组件 `name`；弹窗保留运行时名称 `GlobalSearchDialog`。

## 1. 布局与状态归属

顶部导航由 [`AdminLayout.vue`](../AdminLayout.vue) 挂载。折叠状态的唯一维护者是布局组件，而不是顶部导航或按钮。

```text
AdminLayout.isCollapse
  → TopNavigation 的 collapse prop
  → HeaderSidebarToggle 的 collapsed prop
  → SidebarToggle

点击 SidebarToggle
  → HeaderSidebarToggle 发出 toggleClick
  → TopNavigation 发出 toggleCollapse
  → AdminLayout.toggleCollapse() 更新 isCollapse
  → 侧栏与顶部按钮收到同一份新状态
```

`TopNavigation` 的外部契约：

- `collapse: boolean`：必传，表示当前侧栏是否折叠。
- `toggleCollapse`：无参数事件，请求父组件切换状态。

**修改约束**：不要在顶部导航再维护一个折叠 `ref`，否则顶部按钮与侧栏可能出现状态不一致。折叠按钮复用 `Sidebar` 的导出组件，也不需要另写一套图标与 tooltip 逻辑。

面包屑读取 `route.matched`，只保留有 `meta.title` 且未设置 `meta.hidden` 的记录，并使用 `transformI18n` 翻译标题。前面的层级使用 `router-link`，最后一项为纯文本。新增页面后若面包屑缺项，应先检查路由 meta，而不是给组件硬编码页面名称。

## 2. 搜索链路与关键约定

### 2.1 入口与弹窗生命周期

```text
顶部按钮点击
  → Search/index.vue 的 openSearchDialog()
  → SearchDialog 通过 defineExpose 暴露的 open()
  → useSearchDialog 设置 visible、清空 keyword、重置 activeIndex
  → nextTick 后聚焦输入框
```

`SearchDialog` 始终随入口组件挂载；内部用 `v-if="visible"` 控制弹窗 DOM，使用 `Teleport` 将遮罩放到 `body`，避免被顶部布局容器限制。

快捷键监听在 `useSearchDialog` 挂载时注册到 `document`，卸载时移除。因此，**不要随意将整个 `SearchDialog` 改成“打开后才挂载”**：这样首次打开之前没有快捷键监听，Ctrl+K / Cmd+K 就无法打开它。

### 2.2 搜索的数据来源

搜索使用 [`session store`](../../../../entities/session/model/store.ts) 的 `menuRoutes`，不是遍历全部页面文件，也不会在输入时请求后端。

`flattenRoutes()` 的规则：

- 当前节点 `meta.hidden` 为真，或没有 `meta.title` 时，跳过该节点及其子树。
- 有子节点时继续递归，只把叶子节点加入结果；父级分组不会作为独立结果展示。
- 相对子路径拼接父路径，绝对子路径保留原值。
- 叶子没有图标时继承父级图标，标题通过 `transformI18n` 转换为展示文案。

输入内容去除首尾空格并转小写，随后对标题或路径做 `includes` 匹配。不提供模糊搜索、相关度排序或服务端全文检索。

**修改约束**：菜单构建与权限来源仍归路由/session 层，搜索不另维护一份菜单或权限状态。如果新增页面搜不到，优先检查它是否进入 `menuRoutes`、是否为叶子以及祖先节点的 meta。搜索入口的可见性不等于权限校验，不能替代路由守卫和后端鉴权。

### 2.3 历史记录不是导航收藏

- 使用 VueUse `useLocalStorage`，键名为 `elm-admin-search-history`，最多保存 8 条。
- 保存的是选中结果的**展示标题**，不是路由路径或路由 ID，也不是每次输入的关键词。
- 选中页面结果后，标题移到历史首位、去重、截断，再调用 `router.push(item.path)` 并关闭弹窗。
- 输入为空时展示历史；点击历史项只将标题填回输入框、重新搜索，**不会直接跳转**。
- 当前历史记录不按用户或租户隔离，退出登录也不会清除它；切换语言不会将已保存的标题重新翻译。

如果以后需要按账号隔离、增加清空入口或改变历史数据结构，应同时设计旧数据处理和清理时机，不能只修改 localStorage 键名或读取逻辑。

### 2.4 键盘与鼠标

- Ctrl+K / Cmd+K：切换弹窗开关。
- 输入框区域中的 ↑ / ↓：循环切换当前候选项；Enter：选择当前项；Esc：关闭。
- 鼠标悬停结果项：更新 `activeIndex`；点击：选择。
- 点击遮罩自身：关闭；点击弹窗内容：不会触发遮罩关闭。

弹窗已有 `dialog`、`combobox`、`listbox`、`option` 等角色和相关 ARIA 属性，但当前没有完整的焦点圈定与关闭后焦点恢复机制。不要仅凭这些属性宣称已经具备完整的无障碍弹窗行为。

## 3. 通知：展示、远端操作与加载边界

通知数据来自 [`notification store`](../../../../entities/notification/model/store.ts)，store 通过 [`NotificationApi`](../../../../entities/notification/api/index.ts) 使用共享 HTTP 客户端。组件自身不持有另一份通知集合。

- 铃铛徽标统计所有分类的未读数；为 0 时隐藏，超过 99 时由 `el-badge` 显示上限提示。
- 默认分类为 `notification`，另外两类为 `message` 和 `todo`。
- 点击单条通知调用 `markAsRead(id)`。
- “全部已读”传入当前分类，调用 `markAllAsRead(activeType)`；不是所有分类一起标记。
- “清空”同样只针对当前分类，调用 `clearAll(activeType)`。
- 时间展示复用 [`formatRelativeTime`](../../../../entities/notification/lib/format-relative-time.ts)。

**当前能力边界**：`NotificationBell` 不调用 `loadNotifications()`；当前业务代码中也未接入这个加载方法，列表初始为空。没有自动轮询、WebSocket 或其他实时推送链路。store 虽然提供远端列表读取能力，但不能因此把这个界面描述为“已自动加载通知”。

store 的 `loadNotifications()` 在已加载时默认跳过，传入 `true` 才强制刷新；`reset()` 会重置集合及加载状态。未来接入加载时，需明确首次加载、重新登录与刷新时机，并考虑加载/失败的界面反馈。当前组件只展示列表或空态，没有消费 store 的 `loading` / `error`。

## 4. 身份、语言与用户菜单

### 4.1 租户身份提示

`TenantContextBadge` 读取 `authStore.userInfo`：没有用户信息时隐藏；缺少 `dataScope` 时按 `ALL` 展示。

- `ALL`：显示“平台管理员 · 全部租户”。
- `SHOP`：显示租户名称及已绑定店铺数量；没有绑定店铺时省略数量。
- 其他数据范围：显示“租户管理员 · 租户名称”。
- 缺少租户名称时显示“未知租户”。

它是**展示组件，不是租户选择器或权限判断器**。文案目前直接写为中文，未接入语言包；默认显示“全部租户”也不代表后台授予了全部租户权限。

### 4.2 语言切换

`LangSwitcher` 使用 `HoverDropdown` 展示 `zh-CN` / `en` 选项，当前语言对应项禁用。选择后调用 [`useLocale().setLocale()`](../../../../shared/i18n/index.ts)，同时更新 i18n 运行时与 localStorage 的 `locale`。

语言偏好由共享 i18n 管理，不在顶部导航另建 store。新增语言时还要补共享语言包，不能只增加下拉选项。

### 4.3 用户菜单与退出登录

头像使用用户名首字母转大写，不是图片头像；缺少用户名时头像回退为 `A`，名称回退为 `Admin`。账户设置跳转到 `/account/settings`。

退出入口当前按以下顺序**发起调用**：

```text
tabsStore.clearTabs()
notificationStore.clearAll()
authStore.logout()
router.push('/login')
```

这里存在两个必须区分的语义：

1. `notificationStore.clearAll()` 会调用后端清空接口，不是只清理本地缓存；本地重置方法是 `reset()`，当前退出入口没有使用它。
2. `authStore.logout()` 是异步方法，内部先尝试通知后端，再清理 token、用户与菜单状态；退出入口没有 `await` 通知清空或登出，所以**上述顺序不是异步完成顺序**，不能描述为“全部清理成功后才跳转”。

本目录说明仅记录现状。如果以后调整退出登录，应先确定退出是否应该删除远端通知，再处理本地重置、异步顺序与重复点击；不要把远端 `clearAll()` 当成通用缓存清理方法。

## 5. 公共组件契约

### TopNavigationAction

- `type`：`button | submit | reset`，默认 `button`，避免嵌入表单时意外提交。
- `shape`：`default | circle | pill`，默认 `default`。
- `ariaLabel`：可选，绑定到原生按钮的 `aria-label`；无文字的图标按钮应提供可理解的名称。
- 默认插槽：按钮内容。调用方的 `class`、`@click` 等通过 Vue 单根组件属性透传作用于原生按钮。

`shape` 在模板中生成 `top-navigation-action--${shape}` 类名，所以即使脚本中没有读取它，也不是未使用的 prop。

`default` 依靠 `.top-navigation-action` 的基础样式，没有独立的 `--default` 规则；`circle` 提供 32px 圆形外观，用于通知和语言；`pill` 提供胶囊外观，用于用户入口。搜索使用默认形状。

### HoverDropdown

内部使用 `el-dropdown`，固定 `trigger="hover"` 与 `placement="bottom-end"`。默认插槽提供触发区，`dropdown` 插槽提供菜单；`command` 事件原样转发，载荷类型为 `string | number | object`。

语言切换通过 `command` 处理选项；用户菜单直接监听菜单项点击。这个封装不负责业务动作，也不是同时支持 hover/click 两种模式的通用下拉组件。

## 6. 修改与验收提示

- 新增顶部入口：在 `index.vue` 组装，复杂功能按职责放入自己的目录；仅当前顶部使用的组件不必提升到 `shared`。
- 修改路径：同时检查显式导入、[`src/typings/components.d.ts`](../../../../typings/components.d.ts) 与应用级 `AGENTS.md`。类型声明由 `unplugin-vue-components` 生成，构建后检查是否仍有旧路径，不要把生成文件当成独立组件注册逻辑。
- 修改响应式布局：当前 ≤768px 隐藏搜索按钮文字与用户名；搜索弹窗及结果项另有 ≤520px 适配。不要由此假设整个顶部导航已经适配所有窄屏场景。
- 修改状态或业务链路：先核实相应 store/API；不要只改展示层，就宣称已改变权限、持久化或服务端数据。

目录调整可先运行类型检查、针对性 lint 和构建：

```bash
pnpm --filter @elm-platform/web-admin run type-check
pnpm --filter @elm-platform/web-admin exec eslint src/layouts/admin-layout/ui/TopNavigation
pnpm --filter @elm-platform/web-admin run build
```

人工检查时，应覆盖：点击搜索和 Ctrl+K / Cmd+K、标题/路径匹配、上下键与 Enter、历史项重新搜索、Esc/遮罩关闭，以及侧栏折叠后顶部按钮状态同步。修改通知或退出链路时，还应检查实际网络请求，而不能只观察弹窗消失或页面跳转。以上是验收建议，不表示这些人工操作已执行。
