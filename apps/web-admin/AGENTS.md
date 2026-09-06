# AGENTS.md

本文件为 Codex / opencode 等 AI 代理在 `apps/web-admin` 中工作时提供指引。所有目录与文件说明均以本应用当前代码为准,修改代码时请保持本文件同步。

## Project Overview

Vue 3 + TypeScript 管理后台。技术栈:Vite、Element Plus、Pinia、Vue Router(Hash 模式)、Vue I18n、SCSS。采用 FSD(Feature-Sliced Design) 分层:`app`(装配) / `entities`(领域状态) / `features`(业务功能) / `pages`(路由页面) / `widgets`(复合组件) / `shared`(可复用基础能力)。

- 后端 API 通过 `/api` 代理到 `http://127.0.0.1:3000`(NestJS 服务)
- 组件与 API 由 `unplugin-vue-components` / `unplugin-auto-import` 自动导入,类型声明生成在 `src/typings/components.d.ts`
- 构建前先跑 `vue-tsc --noEmit`,类型错误视为构建失败
- 单文件约定 JSDoc 头:`@file`(文件名)、`@domain`(所属域)、`@description`(作用,副作用型文件用"有副作用:"开头)

## Development Commands

```bash
pnpm --filter @elm-platform/web-admin run dev          # Vite 开发服务器
pnpm --filter @elm-platform/web-admin run dev:mock     # 启用 vite-plugin-mock
pnpm --filter @elm-platform/web-admin run build        # vue-tsc --noEmit + vite build
pnpm --filter @elm-platform/web-admin run type-check   # 仅类型检查
pnpm --filter @elm-platform/web-admin run test:unit    # Vitest(node 环境,匹配 src/**/*.{test,spec}.ts)
pnpm --filter @elm-platform/web-admin run lint
pnpm --filter @elm-platform/web-admin run preview
```

## 目录作用总览

### `src/shared`(可复用基础能力)

| 路径 | 作用 |
|---|---|
| `api/request.ts` | 全局单例 HTTP 客户端;`configureHttpClient()` 供应用启动时注入 token/错误回调 |
| `api/http.ts` | Axios 工厂:`createHttpClient` 统一 token 注入、`{code,data,message}` 解包、401/403/网络错误回调 |
| `api/endpoints.ts` | 全部后端接口路径常量(auth / users / admin / tenants / merchant-onboarding / notifications) |
| `config/paths.ts` | 路由路径常量:首页 `/dashboard/index`、登录、403、500 |
| `config/access.ts` | 角色类型与全部按钮级权限码 `Permissions`(roles.ts 仅转发 access.ts) |
| `config-crud/index.ts` | 配置化 CRUD 引擎统一出口(见下方细目) |
| `config-crud/model/table.ts` | 表格列 / 批量操作 / 密度等类型定义与默认值 |
| `config-crud/model/table-preferences.ts` | 列显隐偏好:默认列、localStorage 读取/合并/持久化 |
| `config-crud/model/form.ts` | 表单弹窗字段类型(基于 field-schema)与弹窗/表单/操作默认配置 |
| `config-crud/model/csv.ts` | CSV 导出:单元格转义与内容构建 |
| `config-crud/model/useConfigCrud.ts` | CRUD 流程 composable:列表加载(带 AbortController)、增删改查、确认框、保存反馈 |
| `config-crud/model/presets.ts` | 转发 lib/admin-display 的启用状态选项 / 状态标签预设 |
| `config-crud/components/ConfigDataTable/index.vue` | 增强表格:密度切换、列设置、批量操作、CSV 导出 |
| `config-crud/components/ConfigDataTable/ConfigTableColumns.vue` | 按列配置渲染单元格(标签 / formatter / 空值) |
| `config-crud/components/ConfigFormDialog/index.vue` | schema 驱动表单弹窗:校验、提交、`showWhen` 条件字段 |
| `config-crud/components/CrudActionColumn/index.vue` | 编辑/删除操作列,支持 `v-auth` 权限与前后插槽 |
| `i18n/index.ts` | vue-i18n 实例、Element Plus 语言包合并、语言持久化、非组件环境翻译(`transformI18n` / `useLocale` / `$t`) |
| `i18n/lang/zh-CN.ts`、`i18n/lang/en.ts` | 中英文语言包 |
| `icons/svg/` | 14 个自定义 SVG 图标(配合 `ui/SvgIcon` 使用) |
| `lib/permission.ts` | 权限路由工具:`filterRoutesByRole` / `filterRoutesByAccess` / `canAccessRoute` / `hasPermission` |
| `lib/tree.ts` | 通用树展开 `flattenTree` 与保留祖先的过滤 `filterTree` |
| `lib/format.ts` | 日期时间格式化 `formatDateTime` |
| `lib/admin-display.ts` | 启用状态选项 / 搜索选项 / 状态标签的 i18n 预设 |
| `lib/useReadonlyTable.ts` | 只读列表 composable(monitor、permission 等页复用):loading / query / 过滤 / 刷新 |
| `styles/tokens.scss` | 设计令牌 CSS 变量(颜色、间距、尺寸、搜索控件宽度等) |
| `styles/global.scss` | 全局重置、过渡动画、NProgress 主题、公共工具类 |
| `styles/_variables.scss`、`styles/_mixins.scss` | SCSS 变量与混入(组件内使用,构建时全局注入) |
| `ui/AdminSearchForm/index.vue` | schema 驱动搜索表单:内联布局、条件字段、字段插槽、查询/重置 |
| `ui/AdminSearchForm/types.ts` | 搜索字段类型(复用 field-schema 类型别名) |
| `ui/AdminTablePage/index.vue` | 列表页骨架:标题栏、搜索区、按钮区、刷新、五态视图容器 |
| `ui/form/field-schema.ts` | 表单字段 schema 类型联合:input / password / textarea / inputNumber / select / radio / date / dateRange / custom |
| `ui/form/FieldRenderer/index.vue` | 字段渲染分发器:`field.type` → 对应渲染器组件(v-model 双向绑定) |
| `ui/form/FieldRenderer/renderer-map.ts` | type → 渲染器组件映射 |
| `ui/form/FieldRenderer/renderers/*.vue` | 8 个字段渲染器(Element Plus 控件薄封装) |
| `ui/state/` | 页面五态组件:forbidden / loading / error / empty / ready;`AdminStateView` 统一调度,`useSubmitGuard` 防重复提交 |
| `ui/SvgIcon/index.vue` | SVG sprite 图标组件(`<use #icon-xxx>`) |
| `workflow/` | 通用状态机 UI 套件:`StatusTag`(状态标签)、`StateMachineActions`(动作按钮:后端可用动作 + 权限 + 确认框)、`StateMachineTimeline`(操作时间线);`model/types.ts` 纯 UI 类型,`model/permissions.ts` 动作可见性规则 |

### `src/app`(应用装配层)

| 路径 | 作用 |
|---|---|
| `providers/http.ts` | 把认证 store / 路由跳转 / i18n 文案 / ElMessage 注入共享 HTTP 客户端;含租户错误码文案翻译 |
| `directives/index.ts` | 指令自动注册插件:`import.meta.glob` 收集 `directives/*/index.ts`,以 `app.use()` 统一注册 |
| `directives/auth/index.ts` | `v-auth` 权限指令:无权限时移除 DOM(新增指令按同结构放入 `directives/<name>/index.ts`) |
| `router/index.ts` | 创建 Hash Router、注册静态路由与守卫管线 |
| `router/routes/auth.ts` | 认证公开路由(登录页,不参与侧边栏/标签页) |
| `router/routes/error.ts` | 403 / 404 / 500 错误页路由 + 兜底 `notFoundRoute` |
| `router/routes/standalone.ts` | 独立布局路由(账号设置页,不挂 AdminLayout) |
| `router/routes/index.ts` | 静态路由聚合出口 |
| `router/guards/index.ts` | 守卫注册管线(注册顺序即执行优先级) |
| `router/guards/progressGuard.ts` | NProgress 进度条(切页开始/结束) |
| `router/guards/chunkErrorGuard.ts` | 动态 import chunk 加载失败检测与单次重试 |
| `router/guards/authGuard.ts` | 登录态拦截:未登录重定向登录页、已登录访问登录页回首页 |
| `router/guards/dynamicRouteGuard.ts` | 刷新后拉取用户信息与后端菜单,构建并注册动态路由 |
| `router/guards/permissionGuard.ts` | 按 `meta.roles/auths` 校验访问权限,无权限跳 403 |
| `router/guards/tabSyncGuard.ts` | 切换后同步 `document.title` 与标签页状态 |
| `router/permission.ts` | 后端菜单树 → 动态路由单文件实现(组件解析、排序、redirect、404 兜底、注册/重置) |
| `router/dynamic-routes.ts` | 薄委托层,转发 `permission.ts` 的注册/重置接口 |
| `router/utils.ts` | 路由路径规范化 `normalizePath` |
| `router/types/route-meta.ts` | 扩展 `RouteMeta` 类型(权限/缓存/标签页/排序字段) |

### `src/widgets`(复合组件)

`admin-layout/` 是唯一的 widget,组装整体后台布局:

| 路径 | 作用 |
|---|---|
| `ui/AdminLayout.vue` | 布局根组件:侧边栏 + 主区(顶栏 / 标签栏 / 内容),管理折叠状态 |
| `ui/MainContent/index.vue` | 路由出口:`router-view` + keep-alive 缓存 + 页面切换过渡 |
| `ui/Sidebar/index.vue` | 侧边栏容器:Logo + 菜单 + 折叠控件 |
| `ui/Sidebar/index.ts` | 导出 `SidebarToggle` 供顶栏复用 |
| `ui/Sidebar/components/brand/Logo.vue` | 侧边栏品牌 Logo(折叠时缩写) |
| `ui/Sidebar/components/menu/SidebarMenu.vue` | el-menu 渲染(权限过滤、折叠模式、样式文件) |
| `ui/Sidebar/components/menu/SidebarItem.vue` | 菜单项递归组件:子菜单降级、外部链接、图标继承 |
| `ui/Sidebar/components/menu/SidebarLinkItem.vue` | 菜单链接包装:内部 `router-link` / 外部 `<a target=_blank>` |
| `ui/Sidebar/components/menu/sidebarItemPresentation.ts` | 菜单标题折叠样式类计算 |
| `ui/Sidebar/components/collapse/*.vue` | 折叠控件:底部按钮 + 悬停中缝按钮 |
| `ui/Sidebar/components/toggle/SidebarToggle.vue` + `sidebarTogglePresentation.ts` | 折叠切换按钮(aria 语义与 tooltip 文案) |
| `ui/Sidebar/composables/useSidebarMenu.ts` | 菜单逻辑:过滤路由、展开项同步、当前激活项 |
| `ui/TabBar/index.vue` | 多页签栏:横向滚动(箭头/滚轮/自动滚到激活页)、右键菜单、下拉命令 |
| `ui/TabBar/composables/useScroll.ts` | 标签栏滚动状态与行为(ResizeObserver、边界容差) |
| `ui/TabBar/composables/useMenu.ts` | 右键菜单定位与 dismiss 监听(视口夹紧) |
| `ui/TabBar/composables/useTabActions.ts` | 标签命令执行:关闭当前/左/右/其他/全部、刷新、路由跳转 |
| `ui/TabBar/composables/useTabCommandState.ts` | 命令状态响应式封装 |
| `ui/TabBar/model/tabCommands.ts` | 标签命令配置表(文案、图标、禁用/隐藏规则) |
| `ui/TabBar/model/createTabCommandState.ts` | 由标签列表 + 目标路径计算命令状态(纯函数) |
| `ui/TabBar/ui/TabBarActions.vue` | 下拉命令菜单按钮 |
| `ui/TabBar/ui/TabBarContextMenu.vue` | 右键命令菜单(Teleport 到 body,暴露 `rootEl` 供测量) |
| `ui/TabBar/ui/TabBarItem.vue` | 单个页签(激活态、关闭按钮、键盘支持) |
| `ui/TopNavigation/index.vue` | 顶栏:折叠按钮、面包屑、租户徽标、搜索、通知、语言、用户菜单 |
| `ui/TopNavigation/components/HoverDropdown.vue` | 悬停下拉包装 |
| `ui/TopNavigation/components/TopNavigationAction.vue` | 顶栏圆形/胶囊操作按钮 |
| `ui/TopNavigation/Breadcrumb/index.vue` | 面包屑(基于 `route.matched`) |
| `ui/TopNavigation/HeaderSidebarToggle/index.vue` | 顶栏折叠按钮 |
| `ui/TopNavigation/LangSwitcher/index.vue` | 语言切换 |
| `ui/TopNavigation/NotificationBell/index.vue` | 通知铃铛:未读徽标、分类标签、已读/清除 |
| `ui/TopNavigation/Search/index.vue` | 全局搜索弹窗(Ctrl+K):Teleport、键盘导航 |
| `ui/TopNavigation/Search/useSearchDialog.ts` | 搜索逻辑:菜单扁平化、关键词过滤、历史记录(localStorage) |
| `ui/TopNavigation/Search/SearchResultItem.vue`、`types.ts` | 搜索结果项组件与类型(含 `isSearchHistoryItem` 类型守卫) |
| `ui/TopNavigation/Search/lib/flatten-menu.ts` | 路由树 → 扁平搜索菜单项(图标继承、父子路径拼接),`flattenRoutes` / `FlatRoute` |
| `ui/TopNavigation/SearchButton/index.vue` | 顶栏搜索入口按钮 |
| `ui/TopNavigation/TenantContextBadge/index.vue` | 租户上下文徽标(平台/租户/店铺数据范围) |
| `ui/TopNavigation/UserMenu/index.vue` | 用户菜单:账号设置、退出登录(清标签页/通知) |

### `src/layouts`

| 路径 | 作用 |
|---|---|
| `index.vue` | 布局入口,仅包装 `AdminLayout`,供动态路由以 `@/layouts/index.vue` 引用,避免路由依赖 widget 内部路径 |

## 关键约定

- 新页面路由定义在 `src/app/router` 体系内:静态页放 `routes/*.ts`,菜单驱动的页面由后端菜单 → `permission.ts` 动态构建,`component` 字段必须能在 `src/pages/**/index.vue` 中解析到
- 新后台 CRUD 页面优先复用 `shared/config-crud`(表格/表单/搜索/操作列全部 schema 驱动)
- 新字段类型先检查 `shared/ui/form/field-schema.ts` 是否已支持,不足再扩展 schema 而非在页面内写死控件
- 新权限点需同时登记:`shared/config/access.ts` 的 `Permissions` 常量 + 后端权限码
- 页面加载/空/错误/无权限态统一使用 `shared/ui/state` 的 `AdminStateView`
- 禁止新增与 `TabBar` 功能重复的标签栏实现(曾存在废弃的 `TabBarFromScratch`,已移除)
