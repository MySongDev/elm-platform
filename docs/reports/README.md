# 工程报告索引

> 本目录是项目的本地报告台账，按「归属应用 / 领域」分类，每个改动一个日期目录。
> 目录约定：`docs/reports/<类别>/<YYYY-MM-DD-中文标题>/`。
> 2026-11-06 起，原仓库根目录的 `reports/` 已整体并入本目录，旧索引存档见 [`archive/`](archive/reports-index-before-merge.md)。
> ⚠️ `docs/*` 已被 `.gitignore` 忽略（仅 `docs/engineering`、`docs/refactor` 放行），默认报告只在本地。2026-11-23 按用户指令，将三份管理端 CRUD 重构报告及证据单独纳入本地 docs 提交；其他报告仍仅本地留存。

## 分类导航

| 类别 | 职责 | 目录数 | 文件数 |
|---|---|---:|---:|
| [`server/`](server/) | NestJS 后端：接口、鉴权、Prisma/Redis、数据本地化、上传与存储 | 23 | 28 |
| [`web-admin/`](web-admin/) | Vue 3 管理后台：动态路由、菜单 schema、TabBar、权限、Mock 类型 | 34 | 55 |
| [`web-user/`](web-user/) | Vue 3 移动端（web-user）：定位、购物车、HTTP 层、登录态、KeepAlive | 23 | 27 |
| [`uni-user/`](uni-user/) | uni-app 小程序端（uni-user）：迁移批次、msite、SvgIcon/BackTop、微信支付 | 25 | 29 |
| [`ci-cd/`](ci-cd/) | 部署与流水线：GitHub Actions/Pages、Render、Nginx/PM2、跨域与 API 地址 | 15 | 21 |
| [`tooling/`](tooling/) | 工程化工具链：pnpm/turbo、lint、TypeScript、Vite、Playwright、构建优化 | 23 | 24 |
| [`architecture/`](architecture/) | 架构与选型：路由模式取舍、契约优先类型闭环、工具选型否决 | 5 | 8 |

---

## server（28 篇）

NestJS 后端：接口、鉴权、Prisma/Redis、数据本地化、上传与存储。

| 日期 | 报告 | 主题 | 文件 |
|---|---|---|---:|
| — | [`杂项合集/`](server/杂项合集/2026-09-30-本地化实施期的两个通用坑.md) | 本地化实施期的两个通用坑（jsonb 键序 / eslint --fix 挪导入） | 2 |
| 2026-06-13 | [`2026-06-13-prisma-migration-troubleshooting/`](server/2026-06-13-prisma-migration-troubleshooting/learning-review-report.md) | Prisma 迁移问题排查与解决（汇总） | 1 |
| 2026-07-02 | [`2026-07-02-fix-reverse-geo-coding-cors/`](server/2026-07-02-fix-reverse-geo-coding-cors/report.md) | 修复逆地理编码接口跨域问题 | 1 |
| 2026-08-23 | [`order-state-machine-simplify-20260823/`](server/order-state-machine-simplify-20260823/engineering-report.md) | 订单状态机精简（三状态解耦 + 拒绝过度设计） | 3 |
| 2026-08-29 | [`2026-08-29-后端测试目录迁移/`](server/2026-08-29-后端测试目录迁移/测试目录迁移计划书-实施书.md) | 后端测试目录迁移计划书 / 实施书 | 1 |
| 2026-09-01 | [`2026-09-01-JWT载荷Zod运行时校验/`](server/2026-09-01-JWT载荷Zod运行时校验/report.md) | JWT 载荷 Zod 运行时校验改动报告 | 1 |
| 2026-09-04 | [`2026-09-04-RedisService封装/`](server/2026-09-04-RedisService封装/engineering-change-report.md) | 收紧 RedisService 封装并移除业务层 getClient() | 2 |
| 2026-09-06 | [`2026-09-06-Prisma7升级/`](server/2026-09-06-Prisma7升级/engineering-report.md) | Prisma 6.19.3 → 7.9.1 升级（重做版） | 1 |
| 2026-09-09 | [`2026-09-09-拆分用户认证验证码接口/`](server/2026-09-09-拆分用户认证验证码接口/engineering-report.md) | 拆分用户认证验证码接口 | 1 |
| 2026-09-23 | [`2026-09-23-收货地址接口迁移到数据库/`](server/2026-09-23-收货地址接口迁移到数据库/engineering-change-report.md) | 用户端收货地址接口从内存兼容层迁移到数据库 | 1 |
| 2026-09-23 | [`2026-09-23-头像上传改为本地存储/`](server/2026-09-23-头像上传改为本地存储/engineering-change-report.md) | 用户端头像上传改为本地存储 | 1 |
| 2026-09-23 | [`2026-09-23-忘记密码改为短信验证码重置/`](server/2026-09-23-忘记密码改为短信验证码重置/engineering-change-report.md) | 忘记密码改为短信验证码重置 | 1 |
| 2026-09-29 | [`2026-09-29-后端启动命令文档勘误/`](server/2026-09-29-后端启动命令文档勘误/report.md) | 后端启动命令文档勘误（`start:dev` → `dev`） | 1 |
| 2026-09-30 | [`2026-09-30-定位反查接口收敛与改名/`](server/2026-09-30-定位反查接口收敛与改名/report.md) | 定位反查接口收敛与改名（三合一 → `/api/geo/reverse-geocode`） | 1 |
| 2026-10-01 | [`2026-10-01-商家数据本地化/`](server/2026-10-01-商家数据本地化/report.md) | 商家数据本地化 工程报告 | 1 |
| 2026-10-02 | [`2026-10-02-customer-profile响应瘦身/`](server/2026-10-02-customer-profile响应瘦身/report.md) | customer-auth/profile 响应瘦身（删三组冗余别名 + 修 avatar 契约） | 1 |
| 2026-10-04 | [`2026-10-04-Redis连接修复/`](server/2026-10-04-Redis连接修复/engineering-report.md) | Redis 连接失败修复（后端连错地址） | 1 |
| 2026-10-05 | [`2026-10-05-头像孤儿文件静默清理/`](server/2026-10-05-头像孤儿文件静默清理/report.md) | 头像孤儿文件静默清理 | 1 |
| 2026-11-04 | [`2026-11-04-ioredis迁移node-redis/`](server/2026-11-04-ioredis迁移node-redis/engineering-report.md) | ioredis 迁移到 node-redis（含连接容错） | 1 |
| 2026-11-06 | [`2026-11-06-商家图片本地化/`](server/2026-11-06-商家图片本地化/engineering-report.md) | 商家图片本地化（2026-11-07 真实下载+断上游验收完成，遗留 CategoryPanel 收口） | 1 |
| 2026-11-08 | [`2026-11-08-elm控制器按端分目录/`](server/2026-11-08-elm控制器按端分目录/engineering-report.md) | elm 控制器按消费端拆到 admin/user/merchant/shared 四个子目录（零路由变化） | 1 |
| 2026-11-08 | [`2026-11-08-后端DTO统一归属与Elm模块拆分/`](server/2026-11-08-后端DTO统一归属与Elm模块拆分/engineering-report.md) | 016 第1/3条：Elm 拆 5 模块（media/upstream/catalog/location/legacy）+ HTTP DTO 按「端→资源」迁入 api，零契约变化 | 1 |
| 2026-11-09 | [`2026-11-09-API契约产物同步修复CI/`](server/2026-11-09-API契约产物同步修复CI/engineering-report.md) | PR #23 api-drift：同步分类分页与接口重排产物，生成脚本保证 JSON 末尾 LF | 1 |
| — | [`reverse-geocode-api-doc.md`](server/reverse-geocode-api-doc.md) | 逆地理编码备用接口文档 | 1 |

## web-admin（54 篇）

Vue 3 管理后台：动态路由、菜单 schema、TabBar、权限、Mock 类型。

| 日期 | 报告 | 主题 | 文件 |
|---|---|---|---:|
| 2026-06-10 | [`2026-06-10-admin-state-view-design/`](web-admin/2026-06-10-admin-state-view-design/engineering-change-report.md) | AdminStateView 状态视图设计演进方案 | 1 |
| 2026-06-13 | [`2026-06-13-admin-dynamic-route-component-map-404/`](web-admin/2026-06-13-admin-dynamic-route-component-map-404/learning-review-report.md) | admin 动态路由命中后仍显示 404 | 1 |
| 2026-06-13 | [`2026-06-13-admin-login-401-error-message/`](web-admin/2026-06-13-admin-login-401-error-message/engineering-change-report.md) | 修复管理端登录失败无错误提示 | 1 |
| 2026-06-13 | [`2026-06-13-router-directory-restructure/`](web-admin/2026-06-13-router-directory-restructure/report.md) | Router 目录结构重组 | 1 |
| 2026-06-20 | [`2026-06-20-notification-mock-governance/`](web-admin/2026-06-20-notification-mock-governance/engineering-change-report.md) | 通知中心从侵入式 Mock 迁移到真实 HTTP 回源 | 2 |
| 2026-07-15 | [`2026-07-15-admin-dashboard-chart-async/`](web-admin/2026-07-15-admin-dashboard-chart-async/engineering-change-report.md) | Admin Dashboard 订单趋势图异步拆包 | 2 |
| 2026-07-20 | [`2026-07-20-tabbar-command-state-consolidation/`](web-admin/2026-07-20-tabbar-command-state-consolidation/engineering-change-report.md) | TabBar 命令状态收口为 commandState | 2 |
| 2026-07-20 | [`2026-07-20-tabbar-contextmenu-measured-position/`](web-admin/2026-07-20-tabbar-contextmenu-measured-position/engineering-change-report.md) | TabBar 右键菜单改为真实 DOM 测量定位 | 2 |
| 2026-07-20 | [`2026-07-20-tabbar-contextmenu-vueuse-on-demand/`](web-admin/2026-07-20-tabbar-contextmenu-vueuse-on-demand/engineering-change-report.md) | TabBar 右键菜单改为 VueUse 按需监听 | 2 |
| 2026-07-20 | [`2026-07-20-tabbar-scroll-scheme-a-usetemplateref/`](web-admin/2026-07-20-tabbar-scroll-scheme-a-usetemplateref/engineering-change-report.md) | TabBar 滚动收敛为方案 A（DOM 在视图层 + useTemplateRef） | 2 |
| 2026-07-20 | [`2026-07-20-tabbar-scroll-scheme-b-design/`](web-admin/2026-07-20-tabbar-scroll-scheme-b-design/scheme-b-design-and-comparison.md) | TabBar 滚动做成“自带 DOM 插槽”的独立功能包 | 1 |
| 2026-07-21 | [`2026-07-21-tabbar-directory-scheme-r/`](web-admin/2026-07-21-tabbar-directory-scheme-r/engineering-change-report.md) | TabBar 目录按方案 R 分层归类 | 2 |
| 2026-07-22 | [`2026-07-22-remove-tabbar-mitt-dead-code/`](web-admin/2026-07-22-remove-tabbar-mitt-dead-code/engineering-change-report.md) | 删除 TabBar mitt 死订阅并卸载 mitt 直接依赖 | 1 |
| 2026-07-22 | [`2026-07-22-tabbar-item-event-payload/`](web-admin/2026-07-22-tabbar-item-event-payload/engineering-change-report.md) | TabBarItem 事件契约改为“父组件显式传身份” | 2 |
| 2026-07-22 | [`2026-07-22-tabbar-scroll-without-scrollintoview/`](web-admin/2026-07-22-tabbar-scroll-without-scrollintoview/report.md) | TabBar 放弃 `scrollIntoView`，改为只滚横向容器 | 1 |
| 2026-07-27 | [`2026-07-27-menu-schema-一次walk双产物重构/`](web-admin/2026-07-27-menu-schema-一次walk双产物重构/engineering-change-report.md) | menu-schema 方案 B（一次 walk 双产物）重构 | 2 |
| 2026-07-27 | [`2026-07-27-tabbar-命令视图下沉至子组件/`](web-admin/2026-07-27-tabbar-命令视图下沉至子组件/engineering-change-report.md) | TabBar 命令视图从父层下沉至子组件（方案一） | 1 |
| 2026-07-29 | [`2026-07-29-admin-菜单禁用状态过滤职责迁移/`](web-admin/2026-07-29-admin-菜单禁用状态过滤职责迁移/engineering-change-report.md) | Admin 菜单禁用状态过滤职责迁移 | 1 |
| 2026-08-06 | [`router-refactor-20260806/`](web-admin/router-refactor-20260806/engineering-report.md) | Admin 端动态路由构建器精简重构 | 3 |
| 2026-08-09 | [`2026-08-09-permission-resolveComponent-simplify/`](web-admin/2026-08-09-permission-resolveComponent-simplify/engineering-change-report.md) | 精简 permission.ts 中 resolveComponent 兼容策略，从 5 级兜底减至单策略 | 2 |
| 2026-08-09 | [`dynamic-route-component-fix-20260809/`](web-admin/dynamic-route-component-fix-20260809/engineering-report.md) | 动态路由组件解析失败修复报告 | 1 |
| 2026-08-09 | [`dynamic-route-guard-loop-fix-20260809/`](web-admin/dynamic-route-guard-loop-fix-20260809/operation-report.md) | 操作报告：动态路由守卫无限循环问题修复 | 2 |
| 2026-08-09 | [`login-404-fix-20260809/`](web-admin/login-404-fix-20260809/operation-report.md) | 操作报告：登录后主内容区显示 404 问题修复 | 2 |
| 2026-08-09 | [`merchant-onboarding-refactor-20260809/`](web-admin/merchant-onboarding-refactor-20260809/engineering-report.md) | Admin 端商家入驻审批精简重构 | 3 |
| 2026-08-10 | [`config-crud-converge-20260810/`](web-admin/config-crud-converge-20260810/engineering-report.md) | Admin 端 useConfigCrud 收敛改版 | 3 |
| 2026-08-27 | [`2026-08-27-admin-logout-backend-wiring/`](web-admin/2026-08-27-admin-logout-backend-wiring/report.md) | 管理端登出未通知后端（在线态残留）修复报告 | 1 |
| 2026-10-03 | [`2026-10-03-mock类型检查盲区修复/`](web-admin/2026-10-03-mock类型检查盲区修复/report.md) | web-admin mock 数据的类型检查盲区修复 | 1 |
| 2026-11-06 | [`2026-11-06-顶部导航搜索目录合并与文档/`](web-admin/2026-11-06-顶部导航搜索目录合并与文档/engineering-report.md) | 聚合搜索入口与弹窗目录，补 TopNavigation 模块说明 | 1 |
| — | [`merchant-onboarding-backend-integration-report.md`](web-admin/merchant-onboarding-backend-integration-report.md) | 管理端商家入驻审批后端接入报告 | 1 |
| 2026-11-09 | [`杂项合集/通知排序测试的时间依赖`](web-admin/杂项合集/2026-11-09-通知排序测试的时间依赖.md) | 修正最新通知固定 ID 断言，避免 UTC 18:00/20:00 刚过时 CI 失败 | 1 |
| 2026-11-10 | [`2026-11-10-路由meta类型注释收敛/`](web-admin/2026-11-10-路由meta类型注释收敛/engineering-report.md) | RouteMeta 只补 7 处「会静默改错」的注释，删死字段 `parentRoute`，收敛 `RouteMetaWithOrder` 重复声明 | 1 |
| 2026-11-11 | [`2026-11-11-tab-store注释精简与规范偏差复盘/`](web-admin/2026-11-11-tab-store注释精简与规范偏差复盘/engineering-report.md) | tab store 注释精简（去 WHY/WHAT IF 模板化）+ 补 closeLeft/closeRight 边界机制 + AI 未遵循已生效规范偏差复盘 | 1 |
| 2026-11-21 | [`2026-11-21-角色管理查询试验回退/`](web-admin/2026-11-21-角色管理查询试验回退/engineering-report.md) | 回退角色管理 Colada 示例，恢复完整 CRUD 与权限面板并验证 | 3 |
| 2026-11-21 | [`2026-11-21-CRUD封装层级精简/`](web-admin/2026-11-21-CRUD封装层级精简/engineering-report.md) | 压平字段控件层、收紧七个弹窗接口与用户状态，178 个既有测试通过 | 26 |
| 2026-11-21 | [`2026-11-21-用户管理列表与编辑职责拆分/`](web-admin/2026-11-21-用户管理列表与编辑职责拆分/engineering-report.md) | 独立列表与编辑器、公共插槽兼容、178 回归与浏览器 smoke，通过基线快照支持阶段回滚 | 16 |
| 2026-11-22 | [`2026-11-21-六个CRUD页面职责拆分/`](web-admin/2026-11-21-六个CRUD页面职责拆分/engineering-report.md) | 六页独立列表/编辑器/纯转换，旧引擎清理，178 回归与126浏览器检查通过，快照支持阶段回滚 | 53 |

## web-user（27 篇）

Vue 3 移动端（web-user）：定位、购物车、HTTP 层、登录态、KeepAlive。

| 日期 | 报告 | 主题 | 文件 |
|---|---|---|---:|
| — | [`杂项合集/`](web-user/杂项合集/2026-10-01-formdata上传被全局json头序列化.md) | 头像上传后端报「请选择要上传的图片」（FormData 被全局 JSON 头序列化） | 1 |
| 2026-07-04 | [`2026-07-04-smart-image-viewport-priority/`](web-user/2026-07-04-smart-image-viewport-priority/工程报告.md) | 工程报告：SmartImage 视口优先加载改造 | 1 |
| 2026-08-07 | [`http-policies-refactor-20260807/`](web-user/http-policies-refactor-20260807/engineering-report.md) | User 端 HTTP 策略层精简重构 | 3 |
| 2026-08-19 | [`2026-08-19-购物车store瘦身/`](web-user/2026-08-19-购物车store瘦身/engineering-report.md) | store-cart.js 兼容层删除 + 纯函数层抽取 | 1 |
| 2026-09-06 | [`2026-09-06-购物车空商家问题修复/`](web-user/2026-09-06-购物车空商家问题修复/engineering-report.md) | 工程变更报告 | 1 |
| 2026-09-07 | [`2026-09-07-定位逻辑下沉到-location-store/`](web-user/2026-09-07-定位逻辑下沉到-location-store/report.md) | 定位逻辑下沉到 location store | 1 |
| 2026-09-09 | [`2026-09-09-登录密码框间距修复/`](web-user/2026-09-09-登录密码框间距修复/engineering-report.md) | 登录密码框间距修复 | 1 |
| 2026-09-09 | [`2026-09-09-登录页视觉重设计/`](web-user/2026-09-09-登录页视觉重设计/engineering-report.md) | 登录页视觉重设计 | 1 |
| 2026-09-10 | [`2026-09-10-区域级Loading自动化重构/`](web-user/2026-09-10-区域级Loading自动化重构/engineering-report.md) | 区域级 Loading 自动化重构 | 1 |
| 2026-09-11 | [`2026-09-11-购物车标题残留修复/`](web-user/2026-09-11-购物车标题残留修复/engineering-change-report.md) | 支付返回后的购物车标题残留修复 | 1 |
| 2026-09-18 | [`2026-09-18-food滚动恢复精简与KeepAlive核查/`](web-user/2026-09-18-food滚动恢复精简与KeepAlive核查/engineering-change-report.md) | food 页面滚动恢复功能精简与 keepAlive 声明清理 | 2 |
| 2026-09-19 | [`2026-09-19-msite-定位缓存秒开与后台刷新/`](web-user/2026-09-19-msite-定位缓存秒开与后台刷新/report.md) | msite 定位缓存秒开与后台 silent 刷新 | 1 |
| 2026-09-19 | [`2026-09-19-登录态与身份真相源收敛/`](web-user/2026-09-19-登录态与身份真相源收敛/engineering-change-report.md) | 登录态与身份真相源收敛 | 2 |
| 2026-09-19 | [`2026-09-19-支付请求并入全局http实例/`](web-user/2026-09-19-支付请求并入全局http实例/report.md) | 支付请求并入全局 http 实例 | 1 |
| 2026-09-23 | [`2026-09-23-登录拆包收拢与死接口清理/`](web-user/2026-09-23-登录拆包收拢与死接口清理/report.md) | 清理用户端登录的重复拆包与死接口 | 1 |
| 2026-10-01 | [`2026-10-01-http默认content-type取舍/`](web-user/2026-10-01-http默认content-type取舍/report.md) | 讨论：HTTP 层默认 Content-Type 的取舍（FormData 失效引出的根因修复） | 1 |
| 2026-10-01 | [`2026-10-01-shop页面结构重构/`](web-user/2026-10-01-shop页面结构重构/engineering-report.md) | shop.vue 页面结构重构 —— 删除冗余包裹层、降低嵌套深度 | 1 |
| 2026-10-01 | [`2026-10-01-密码登录成功却不跳转/`](web-user/2026-10-01-密码登录成功却不跳转/report.md) | 密码登录接口成功却不跳转、不记录登录态 | 1 |
| 2026-10-01 | [`2026-10-01-前端商家数据本地化验证/`](web-user/2026-10-01-前端商家数据本地化验证/engineering-report.md) | 前端商家数据本地化端到端验证 | 1 |
| 2026-10-02 | [`2026-10-02-store-user单源化重构/`](web-user/2026-10-02-store-user单源化重构/report.md) | store-user 用户名「双数据源」分叉与单源化重构 | 1 |
| 2026-10-02 | [`2026-10-02-剔除未接入的http可选策略/`](web-user/2026-10-02-剔除未接入的http可选策略/report.md) | 剔除 web-user HTTP 层未接入的缓存 / 去重 / 重试策略 | 1 |
| 2026-11-17 | [`2026-11-17-搜索历史复用存储封装/`](web-user/2026-11-17-搜索历史复用存储封装/engineering-report.md) | 搜索历史复用 storage.js，保留去重、排序与 10 条上限 | 1 |
| 2026-11-17 | [`2026-11-17-搜索历史改为区分大小写/`](web-user/2026-11-17-搜索历史改为区分大小写/engineering-report.md) | 大小写版本共存，按原文去重与删除 | 2 |

## uni-user（29 篇）

uni-app 小程序端（uni-user）：迁移批次、msite、SvgIcon/BackTop。

| 日期 | 报告 | 主题 | 文件 |
|---|---|---|---:|
| — | [`杂项合集/`](uni-user/杂项合集/2026-09-29-空购物车莫名滚动.md) | 空购物车莫名滚动（常驻底部安全距所致） | 1 |
| 2026-09-27 | [`2026-09-27-uniapp迁移方案/`](uni-user/2026-09-27-uniapp迁移方案/batch05-poc-measure.md) | Batch 0.5 — shop 滚动 PoC 测量指南 | 4 |
| 2026-09-28 | [`2026-09-28-profile页迁移校验与lint自动fix卷入注释/`](uni-user/2026-09-28-profile页迁移校验与lint自动fix卷入注释/report.md) | profile 主页迁移校验报告（Batch 3） | 1 |
| 2026-09-28 | [`2026-09-28-SvgIcon样式隔离机制修正/`](uni-user/2026-09-28-SvgIcon样式隔离机制修正/report.md) | SvgIcon 样式隔离机制修正（任务 A） | 1 |
| 2026-09-29 | [`2026-09-29-BackTop图标渲染链路与布局混乱修复/`](uni-user/2026-09-29-BackTop图标渲染链路与布局混乱修复/report.md) | [uni-user] BackTop 图标渲染链路 + 布局混乱修复（空字形→换 svg→宽度压扁→PNG 兜底） | 1 |
| 2026-09-29 | [`2026-09-29-msite-BackTop一直显示修复/`](uni-user/2026-09-29-msite-BackTop一直显示修复/report.md) | msite BackTop 一直显示（scroll-view 内静态提升丢 v-show） | 1 |
| 2026-09-29 | [`2026-09-29-msite-JS误写TS标注致setup崩溃/`](uni-user/2026-09-29-msite-JS误写TS标注致setup崩溃/report.md) | msite setup 中断致定位未触发（JS 文件误写 TS 类型标注） | 1 |
| 2026-09-29 | [`2026-09-29-msite滚动延迟跳动修复/`](uni-user/2026-09-29-msite滚动延迟跳动修复/report.md) | msite 滚动延迟/跳动修复（onScroll 逐帧 setData 根因） | 1 |
| 2026-09-29 | [`2026-09-29-msite商家列表定位静默失效/`](uni-user/2026-09-29-msite商家列表定位静默失效/report.md) | msite 商家列表定位静默失效（含本地调试链路三阶段排查） | 1 |
| 2026-09-29 | [`2026-09-29-uni-user-msite连本地与商家列表不渲染排查/`](uni-user/2026-09-29-uni-user-msite连本地与商家列表不渲染排查/report.md) | msite 连本地后端 & 商家列表不渲染排查报告 | 1 |
| 2026-09-29 | [`2026-09-29-全局隐藏滚动条/`](uni-user/2026-09-29-全局隐藏滚动条/report.md) | 全局隐藏滚动条（uni-user 微信小程序端） | 1 |
| 2026-10-06 | [`2026-10-06-order-login组迁移/`](uni-user/2026-10-06-order-login组迁移/report.md) | order 组 + login 组 迁移报告（Batch 3 · 任务 D） | 1 |
| 2026-10-06 | [`2026-10-06-profile子页迁移/`](uni-user/2026-10-06-profile子页迁移/report.md) | profile 5 个子页迁移报告（Batch 3） | 1 |
| 2026-10-16 | [`2026-10-16-uni-user入库与工程校验适配/`](uni-user/2026-10-16-uni-user入库与工程校验适配/report.md) | uni-user 首次入库与工程校验适配 | 1 |
| 2026-11-07 | [`2026-11-07-搜索结果图片改用SmartImage/`](uni-user/2026-11-07-搜索结果图片改用SmartImage/engineering-report.md) | 搜索结果商家图改用 SmartImage（含「哪些图该用懒加载」判定标准） | 1 |
| 2026-11-11 | [`2026-11-11-商家点菜区组件拆分/`](uni-user/2026-11-11-商家点菜区组件拆分/engineering-report.md) | ShopMenu 收拢点菜模板、滚动与分页触发；页面 script 内部 337→115 行 | 1 |
| 2026-11-12 | [`2026-11-12-微信支付分会话开发文档/`](uni-user/2026-11-12-微信支付分会话开发文档/engineering-report.md) | 七个会话的计划/实施/短交接；可版本化入口在 docs/refactor，代码未验收 | 1 |
| 2026-11-12 | [`2026-11-12-微信支付第一波并行基础开发/`](uni-user/2026-11-12-微信支付第一波并行基础开发/engineering-report.md) | 三代理独立开发协议、可信金额与快照；主会话收口，223项相关测试通过，付款未接通 | 1 |
| 2026-11-12 | [`2026-11-12-微信支付S6整体回归与接入说明/`](uni-user/2026-11-12-微信支付S6整体回归与接入说明/engineering-report.md) | 整体回归：修掉到账/履约跨事务缺陷；交付 019 启用指南；四层验收状态分开记录 | 1 |
| 2026-11-13 | [`2026-11-13-微信支付审查问题修复/`](uni-user/2026-11-13-微信支付审查问题修复/engineering-report.md) | 修复通知失败应答、未付款扣车、重试换键、已消费兜底清店、CLOSED 未结束结算 | 1 |
| 2026-11-17 | [`2026-11-17-同步H5商家页近期重构/`](uni-user/2026-11-17-同步H5商家页近期重构/engineering-report.md) | 对照凌晨提交同步页签 id/label 与小程序 add 透传契约，保留独立滚动结构 | 1 |
| 2026-11-17 | [`2026-11-17-搜索历史同步大小写规则/`](uni-user/2026-11-17-搜索历史同步大小写规则/engineering-report.md) | 搜索历史同步精确去重与原文删除，保留平台存储适配 | 2 |

## ci-cd（21 篇）

部署与流水线：GitHub Actions/Pages、Render、Nginx/PM2、跨域与 API 地址。

| 日期 | 报告 | 主题 | 文件 |
|---|---|---|---:|
| 2026-06-12 | [`2026-06-12-backend-deploy-render/`](ci-cd/2026-06-12-backend-deploy-render/engineering-change-report.md) | 使用 Render + Neon + Upstash 部署 NestJS 后端 | 2 |
| 2026-06-12 | [`2026-06-12-cross-origin-frontend-backend/`](ci-cd/2026-06-12-cross-origin-frontend-backend/learning-review-report.md) | 前后端分离部署的跨域通信与 API 地址配置 | 1 |
| 2026-06-12 | [`2026-06-12-github-actions-ci-fixes/`](ci-cd/2026-06-12-github-actions-ci-fixes/engineering-change-report.md) | 修复 GitHub Actions 部署工作流的 3 个 CI 兼容性问题 | 2 |
| 2026-06-12 | [`2026-06-12-github-pages-deploy-setup/`](ci-cd/2026-06-12-github-pages-deploy-setup/engineering-change-report.md) | 配置 GitHub Actions 自动部署前端到 GitHub Pages | 2 |
| 2026-06-12 | [`2026-06-12-render-deploy-issues/`](ci-cd/2026-06-12-render-deploy-issues/engineering-change-report.md) | 修复 Render 后端部署的 3 个构建失败问题 | 1 |
| 2026-06-12 | [`2026-06-12-repo-merge-to-platform/`](ci-cd/2026-06-12-repo-merge-to-platform/engineering-change-report.md) | 合并分支并推送到 elm-platform 新仓库 | 2 |
| 2026-06-13 | [`2026-06-13-api-url-environment-adapt/`](ci-cd/2026-06-13-api-url-environment-adapt/learning-review-report.md) | API 地址如何根据部署环境自动切换 | 1 |
| 2026-06-13 | [`2026-06-13-devops-overview/`](ci-cd/2026-06-13-devops-overview/report.md) | DevOps 是什么，你的项目做到了哪一步 | 1 |
| 2026-06-13 | [`2026-06-13-frontend-api-url-mismatch/`](ci-cd/2026-06-13-frontend-api-url-mismatch/report.md) | 前端构建后 API 地址错误导致请求失败 | 1 |
| 2026-06-13 | [`2026-06-13-linux-nginx-deploy/`](ci-cd/2026-06-13-linux-nginx-deploy/engineering-change-report.md) | 使用 Nginx + PM2 在 Linux 上手动部署全栈应用 | 2 |
| 2026-06-13 | [`2026-06-13-nginx-static-resource-404/`](ci-cd/2026-06-13-nginx-static-resource-404/learning-review-report.md) | Nginx 静态资源 404 与 location 匹配规则 | 1 |
| 2026-08-16 | [`2026-08-16-ci-simplify/`](ci-cd/2026-08-16-ci-simplify/engineering-change-report.md) | 精简 CI 流水线并修复脚本缺失 | 2 |
| 2026-09-20 | [`2026-09-20-CI步骤添加name提升可读性/`](ci-cd/2026-09-20-CI步骤添加name提升可读性/engineering-report.md) | CI 步骤添加 name 提升 Actions 日志可读性 | 1 |
| 2026-09-20 | [`2026-09-20-简化build-and-test委托Turbo编排/`](ci-cd/2026-09-20-简化build-and-test委托Turbo编排/engineering-report.md) | 简化 build-and-test，委托 Turbo 编排任务 | 1 |
| 2026-09-23 | [`2026-09-23-CI测试脚本修复/`](ci-cd/2026-09-23-CI测试脚本修复/report.md) | 修复 GitHub CI 测试失败 | 1 |

## tooling（24 篇）

工程化工具链：pnpm/turbo、lint、TypeScript、Vite、Playwright、构建优化。

| 日期 | 报告 | 主题 | 文件 |
|---|---|---|---:|
| 2026-06-10 | [`2026-06-10-readme-update-and-pnpm-lock/`](tooling/2026-06-10-readme-update-and-pnpm-lock/engineering-change-report.md) | 更新 README 文档并锁定 pnpm 包管理器 | 1 |
| 2026-06-13 | [`2026-06-13-cdn-vs-tree-shaking/`](tooling/2026-06-13-cdn-vs-tree-shaking/report.md) | CDN 加速 vs 按需导入：什么时候用 CDN | 1 |
| 2026-06-13 | [`2026-06-13-commitlint-conventional-commits/`](tooling/2026-06-13-commitlint-conventional-commits/report.md) | Commitlint 与 Conventional Commits 规范 | 1 |
| 2026-06-13 | [`2026-06-13-dist-vs-coverage/`](tooling/2026-06-13-dist-vs-coverage/report.md) | dist 与 coverage 目录的区别 | 1 |
| 2026-06-13 | [`2026-06-13-frontend-build-optimization/`](tooling/2026-06-13-frontend-build-optimization/report.md) | 前端构建优化：Gzip、分包、打包分析 | 1 |
| 2026-06-13 | [`2026-06-13-git-commit-message-conventions/`](tooling/2026-06-13-git-commit-message-conventions/report.md) | Git Commit Message 规范与语言选择 | 1 |
| 2026-06-13 | [`2026-06-13-git-commit-push-skip-ci/`](tooling/2026-06-13-git-commit-push-skip-ci/report.md) | Git commit 与 push 的区别，以及 [skip ci] 标记 | 1 |
| 2026-06-13 | [`2026-06-13-npm-lifecycle-scripts/`](tooling/2026-06-13-npm-lifecycle-scripts/learning-review-report.md) | npm/pnpm 生命周期脚本与 preinstall 检查机制 | 1 |
| 2026-06-13 | [`2026-06-13-playwright-e2e-testing/`](tooling/2026-06-13-playwright-e2e-testing/report.md) | Playwright 端到端测试配置说明 | 1 |
| 2026-06-13 | [`2026-06-13-turborepo-task-config/`](tooling/2026-06-13-turborepo-task-config/report.md) | Turborepo 与 turbo.json 配置说明 | 1 |
| 2026-06-13 | [`2026-06-13-typescript-config-errors/`](tooling/2026-06-13-typescript-config-errors/learning-review-report.md) | TypeScript 配置错误（rootDir 与类型声明） | 1 |
| 2026-06-13 | [`2026-06-13-typescript-triple-slash-reference/`](tooling/2026-06-13-typescript-triple-slash-reference/learning-review-report.md) | TypeScript 三斜线指令与 Vite 类型声明 | 1 |
| 2026-06-13 | [`2026-06-13-wsl-node-modules-incompatibility/`](tooling/2026-06-13-wsl-node-modules-incompatibility/learning-review-report.md) | WSL 与 Windows 的 node_modules 不兼容问题 | 1 |
| 2026-06-21 | [`2026-06-21-typescript-declaration-files/`](tooling/2026-06-21-typescript-declaration-files/learning-review-report.md) | TypeScript 中 `.d.ts` 声明文件的作用 | 1 |
| 2026-06-21 | [`2026-06-21-vite-proxy-type-conflict/`](tooling/2026-06-21-vite-proxy-type-conflict/engineering-change-report.md) | 修复 web-admin Vite 配置中的 proxy 类型冲突 | 2 |
| 2026-08-25 | [`2026-08-25-业务代码行数统计/`](tooling/2026-08-25-业务代码行数统计/engineering-report.md) | 项目纯业务代码行数统计 | 1 |
| 2026-09-09 | [`2026-09-09-AI测试准入政策/`](tooling/2026-09-09-AI测试准入政策/engineering-report.md) | AI 测试准入政策 | 1 |
| 2026-09-19 | [`2026-09-19-统一lint走Turbo编排/`](tooling/2026-09-19-统一lint走Turbo编排/report.md) | 统一 lint 走 Turbo 编排 —— 一个"声明了却没被调用"的一致性问题 | 1 |
| 2026-11-06 | [`2026-11-06-报告目录按类别归档/`](tooling/2026-11-06-报告目录按类别归档/engineering-report.md) | docs/reports 报告目录按类别归档 | 1 |
| 2026-11-06 | [`2026-11-06-大任务拆分与上下文控制/`](tooling/2026-11-06-大任务拆分与上下文控制/engineering-report.md) | AI 大任务自主拆分与上下文控制规则 | 1 |
| 2026-11-10 | [`2026-11-10-agent-git规范/`](tooling/2026-11-10-agent-git规范/engineering-report.md) | Agent Git 工作规范（CONTRIBUTING §11：红线、分支、粒度、scope 映射） | 1 |
| 2026-11-10 | [`2026-11-10-注释说人话与精简/`](tooling/2026-11-10-注释说人话与精简/engineering-report.md) | 注释规范补「说人话、要短、具体」：禁术语堆砌、去掉 WHY/WHAT IF 模板化 | 1 |
| 2026-11-20 | [`2026-11-20-TypeScript-6.0升级/`](tooling/2026-11-20-TypeScript-6.0升级/engineering-report.md) | TypeScript 5.9→6.0：types/rootDir/strict 三处默认值变化，连带 tsup 8→9 | 1 |

## architecture（8 篇）

架构与选型：路由模式取舍、契约优先类型闭环、工具选型否决。

| 日期 | 报告 | 主题 | 文件 |
|---|---|---|---:|
| 2026-06-11 | [`2026-06-11-vue-router-hash-vs-history/`](architecture/2026-06-11-vue-router-hash-vs-history/learning-review-report.md) | Vue Router 的 Hash 路由与 History 路由的区别与选型 | 1 |
| 2026-08-22 | [`2026-08-22-api-types-契约优先闭环/`](architecture/2026-08-22-api-types-契约优先闭环/实施报告.md) | 补完 api-types 契约优先闭环 | 4 |
| 2026-08-23 | [`2026-08-23-项目必要性评估/`](architecture/2026-08-23-项目必要性评估/评估报告.md) | Elm Platform 项目必要性评估报告 | 1 |
| 2026-08-25 | [`2026-08-25-半成品诊断/`](architecture/2026-08-25-半成品诊断/engineering-report.md) | 工程诊断报告：elm 为何是"半成品" | 1 |
| 2026-11-20 | [`2026-11-20-Oxlint评估后不采用/`](architecture/2026-11-20-Oxlint评估后不采用/engineering-report.md) | Oxlint 评估后不采用：命中率 1/11、速度论据不成立、type-aware 被 TS 7 堵死 | 1 |

---

## 其他目录

| 目录 | 用途 |
|---|---|
| [`report-templates/`](report-templates/engineering-report.md) | 工程报告模板，新报告从这里复制 |
| [`archive/reports-index-before-merge.md`](archive/reports-index-before-merge.md) | 2026-11-06 合并前根目录 `reports/README.md` 的存档（旧路径） |
| [`archive/duplicates/`](archive/duplicates/) | 与现存报告重复的历史副本（保留原件，不在主索引中重复列出） |

---

## 新增报告怎么放

1. 先判断归属端：后端 -> `server/`，管理端 -> `web-admin/`，H5 用户端 -> `web-user/`，小程序端 -> `uni-user/`。
2. 跨端的基础设施改动 -> `tooling/`；部署、CI、Nginx、跨域 -> `ci-cd/`；选型与分层设计 -> `architecture/`。
3. 目录名固定 `YYYY-MM-DD-中文标题`，主文件优先命名 `report.md`（或沿用同目录已有命名）。
4. 单篇零散笔记放进对应类别的 `杂项合集/`，不要散落在根目录。
5. 新增后回到本文件补一行。
