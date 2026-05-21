# elm-platform 前端重构落地指南

本文档记录 `apps/web-admin` 的重构规则和样板结构。当前先以用户管理页作为样板，后续 `role`、`menu`、`dept`、`monitor` 模块按同样方式迁移。

## 1. CSS 治理

### 原始基础解法

历史代码主要依赖 `scoped lang="scss"`、Sass 变量和局部覆盖：

```vue
<style scoped lang="scss">
.el-select {
  width: 180px;
}
</style>
```

这种写法能跑，但不能治理设计系统。新增字段、换主题或改 Element Plus 组件时，需要在多个 scoped 文件里反复确认。

### 逐步优化路径

1. 使用 `src/assets/styles/tokens.scss` 管理颜色、间距、圆角、布局尺寸。
2. 组件内颜色优先使用 `var(--app-*)`，不再新增裸色值。
3. scoped 内避免直接覆盖 `.el-*` 根类，改用业务语义类。
4. 使用 `stylelint.config.js` 拦截裸色值、`!important`、过高选择器复杂度。

### 为什么必须这样做

如果继续散写 Sass 变量和裸色值，新增暗色主题或品牌主题时会从“改 1 个 token 文件”变成“全项目搜索替换”。如果继续直接覆盖 `.el-select`，一个页面里新增第二个 Select 就可能被旧样式误伤。

### 重构前后对比

重构前：

```scss
.el-select {
  width: 180px;
}

.title {
  color: #303133;
}
```

重构后：

```scss
.user-filter__select {
  width: 180px;
}

.user-filter__title {
  color: var(--app-text-primary);
}
```

### 成本影响

- 维护成本：主题色调整从改多个组件降为改 `tokens.scss` 1 个文件。
- 拓展成本：新增后台列表页时，样式从“局部写一套”降为复用 token 和区块类。

### 验证方法

```bash
pnpm --filter elm-web-admin run lint:style
pnpm --filter elm-web-admin run build
```

## 2. 组件边界

### 原始基础解法

`views/user/index.vue` 曾同时负责请求、查询、过滤、表格、弹窗、删除确认、权限判断和样式，属于轻量上帝组件。

### 逐步优化路径

1. 新增 `src/entities/user`，把用户类型、用户 API、用户列表 store 收束为领域实体。
2. 新增 `src/features/user-management`，把用户查询、删除、创建、编辑等管理动作放入 feature。
3. 新增 `src/pages/user-management/ui/UserListPage.vue`，页面只做编排。
4. 新增 `src/widgets/admin-table-page`，把后台表格页壳从 `components` 提升为页面级区块。
5. `features/user-management/config/userTable.columns.ts` 管表格普通列。

### 为什么必须这样做

如果页面继续直接写所有逻辑，新增一个字段通常要改查询表单、过滤逻辑、表格列、弹窗表单、接口类型 5 到 8 处。拆分后，普通表格列只改配置，表单字段只改弹窗和类型。

### 重构前后对比

重构前：

```txt
views/user/index.vue
  请求、查询、表格、删除、弹窗、权限、样式
```

重构后：

```txt
pages/user-management/ui/UserListPage.vue             页面编排
features/user-management/model/useUserList.ts         用户管理业务逻辑
features/user-management/ui/UserFilter.vue            查询 UI
features/user-management/ui/UserTable.vue             表格 UI
features/user-management/ui/UserFormDialog.vue        表单弹窗
features/user-management/config/userTable.columns.ts  表格配置
entities/user/model/types.ts                          用户领域类型
entities/user/model/user.store.ts                     用户实体状态
entities/user/api/user.api.ts                         用户实体接口
widgets/admin-table-page/ui/AdminTablePage.vue        后台表格页壳
```

### 成本影响

- 维护成本：用户页单文件从 160+ 行下降为多个 40 到 90 行小文件。
- 拓展成本：新增普通列从改模板多行下降为改 `userTable.columns.ts` 1 行。

### 验证方法

```bash
pnpm --filter elm-web-admin run type-check
pnpm --filter elm-web-admin run build
```

## 3. 架构分层

### 原始基础解法

历史 `utils/request.ts` 同时依赖 axios、router、Pinia store、Element Plus Message，基础设施层反向知道业务和 UI。

### 逐步优化路径

1. `shared/api/http.ts` 只保留 axios 客户端工厂。
2. `app/providers/http.ts` 注入 token、登录过期、无权限、错误提示策略。
3. `utils/request.ts` 作为兼容导出口，避免一次性改全项目 API。
4. 新 feature 的 API 放在 `features/*/api`，领域类型放在 `features/*/api/*.types.ts` 或后续 `entities`。

### 为什么必须这样做

如果 HTTP 基础设施继续直接 import router/store，后续 `web-user` 或测试环境想复用请求层时会被后台业务绑死，也更容易出现循环依赖。

### 重构前后对比

重构前：

```txt
utils/request -> router
utils/request -> authStore
authStore -> api/user
api/user -> utils/request
```

重构后：

```txt
shared/api/http -> axios only
app/providers/http -> router/store/message/i18n
utils/request -> shared/api/http
app/providers/http -> utils/request
entities/user/api -> utils/request
```

### 成本影响

- 维护成本：修改 401 跳转策略只改 provider。
- 拓展成本：新增另一个端的请求策略时，只需新建 provider，不复制 axios 核心封装。

### 验证方法

```bash
pnpm --filter elm-web-admin run lint
pnpm --filter elm-web-admin run type-check
```

## 4. 可读性

### 原始基础解法

历史代码里存在 `any` 和匿名业务判断：

```ts
tableData.value = (data as any[]).sort((a, b) => {
  if (a.role === 'admin' && b.role !== 'admin')
    return -1

  return a.id - b.id
})
```

### 逐步优化路径

1. 用 `sortUsersByRoleThenId`、`matchesUserQuery` 这类语义函数表达意图。
2. 用类型贯穿 API、store、UI props。
3. 注释只解释“为什么”，不重复代码。
4. ESLint 增加复杂度、函数长度、`any` 门禁。

### 为什么必须这样做

不命名业务规则，后续新增 `manager` 等角色时只能靠读 if 猜逻辑。不限制复杂度，页面会在几轮需求后重新膨胀。

### 重构前后对比

重构后：

```ts
function matchesUserQuery(user: UserInfo, query: UserListQuery) {
  const matchesUsername = !query.username || user.username.includes(query.username)
  const matchesRole = !query.role || user.role === query.role
  const matchesStatus = query.status === '' || String(user.status) === query.status

  return matchesUsername && matchesRole && matchesStatus
}
```

### 成本影响

- 维护成本：业务判断从读实现变为读函数名。
- 拓展成本：新增角色排序时只改角色优先级配置。

### 验证方法

```bash
pnpm --filter elm-web-admin run lint
pnpm --filter elm-web-admin run type-check
```

## 5. 后续推广顺序

1. 用户管理页作为样板验收。
2. 迁移 `system/role`。
3. 迁移 `system/menu`。
4. 迁移 `system/dept`。
5. 迁移监控日志类页面。

每迁移一个模块，都需要满足：页面只编排、逻辑进 composable、表格列进 config、API 和类型留在 feature 内。
