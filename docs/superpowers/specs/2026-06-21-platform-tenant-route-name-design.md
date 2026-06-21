# 租户页面 Route Name 统一设计

## 背景

后端菜单、权限常量与种子数据已经使用 `PlatformTenantView`，但 `apps/web-admin` 的 dashboard 待办、开发菜单 fixture、动态路由测试、标题映射以及租户页面组件名仍使用 `TenantListView`。真实后端菜单注册后，dashboard 按旧名称解析路由会失败。

## 方案

以前端消费的后端菜单契约为唯一来源，将 `apps/web-admin` 内所有 `TenantListView` 替换为 `PlatformTenantView`，不保留旧名称别名，也不改为路径跳转。涉及范围仅限：

- dashboard 租户待办的 `routeName`
- 动态路由测试菜单及断言
- `route-title-map` 的已知路由名映射
- session mock 菜单 fixture
- 租户页面 SFC 的 `defineOptions` 名称

## 数据流

后端返回名为 `PlatformTenantView` 的租户菜单，前端动态路由构建器按该名称注册 `/platform/tenant`。dashboard 待办使用同一名称调用 Vue Router，最终解析并跳转到 `/platform/tenant`。

## 测试

先修改动态路由集成测试，使测试菜单模拟真实后端的 `PlatformTenantView`，并断言 dashboard 待办包含该名称且可解析为 `/platform/tenant`。确认测试因 dashboard 仍使用旧名称而失败后，再完成最小生产代码和 fixture 更新，最后运行目标测试、相关路由测试及类型检查。

## 非目标

- 不修改后端既有菜单名称。
- 不增加 `TenantListView` 兼容别名。
- 不重构 dashboard 或动态路由架构。
