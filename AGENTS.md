# AGENTS.md

本文件为在此仓库中工作的 AI 工具（Codex、Claude Code、opencode 等）提供指引。

## 项目概览

Elm Platform 是一个外卖全栈应用的 pnpm workspace：

- `apps/server`：NestJS 10 后端，使用 Prisma、PostgreSQL、Redis、JWT/Passport 认证、Swagger。
- `apps/web-admin`：Vue 3 + TypeScript 管理后台，使用 Element Plus、Pinia、Vue Router、Vite。
- `apps/web-user`：Vue 3 + TypeScript/JavaScript 移动端用户应用，使用 Vant、Pinia、Vue Router、Vite、Vitest，支持可选 mock 数据。
- `packages/*`：共享包工作区槽位；当前由 `pnpm-workspace.yaml` 纳入。

根脚本通过 `pnpm --filter` 定位各 workspace 包。除非命令明确要求应用内上下文，否则优先在仓库根目录执行命令。

## 常用命令

### Workspace

```bash
pnpm install
pnpm dev              # 并行运行 server、admin、user 三个应用
pnpm dev:server       # NestJS watch 模式
pnpm dev:admin        # admin Vite 开发服务器
pnpm dev:user         # user Vite 开发服务器
pnpm build            # 构建所有应用
pnpm build:server
pnpm build:admin
pnpm build:user
pnpm lint             # 在所有 workspace 运行 lint
pnpm clean            # 清理 workspace 中的 node_modules、dist、.turbo
```

### 后端（`apps/server`）

```bash
pnpm --filter @elm-platform/server run start:dev
pnpm --filter @elm-platform/server run build
pnpm --filter @elm-platform/server run lint
pnpm --filter @elm-platform/server run test
pnpm --filter @elm-platform/server run test -- path/to/file.spec.ts
pnpm --filter @elm-platform/server run test:e2e
pnpm --filter @elm-platform/server run test:cov
pnpm --filter @elm-platform/server run prisma:generate
pnpm --filter @elm-platform/server run prisma:migrate
pnpm --filter @elm-platform/server run prisma:studio
pnpm --filter @elm-platform/server run prisma:seed
```

后端环境变量见 `apps/server/.env.example`。Nest 应用默认端口 `3000`，全局前缀 `api`，Swagger 位于 `http://localhost:3000/api-docs`。

### 管理端（`apps/web-admin`）

```bash
pnpm --filter @elm-platform/web-admin run dev
pnpm --filter @elm-platform/web-admin run build        # vite build 前先跑 vue-tsc
pnpm --filter @elm-platform/web-admin run type-check
pnpm --filter @elm-platform/web-admin run test:unit
pnpm --filter @elm-platform/web-admin exec vitest run src/app/router/__tests__/build-routes.test.ts
pnpm --filter @elm-platform/web-admin run lint
pnpm --filter @elm-platform/web-admin run lint:style
pnpm --filter @elm-platform/web-admin run preview
```

### 用户端（`apps/web-user`）

```bash
pnpm --filter @elm-platform/web-user run dev            # 代理 API 到本地后端
pnpm --filter @elm-platform/web-user run dev:mock       # 启用 vite-plugin-mock
pnpm --filter @elm-platform/web-user run build          # vite build 前先跑 vue-tsc
pnpm --filter @elm-platform/web-user run type-check
pnpm --filter @elm-platform/web-user run test:unit      # vitest run（注意：脚本名是 test:unit，不是 test）
pnpm --filter @elm-platform/web-user exec vitest run src/services/http/policies.test.js
pnpm --filter @elm-platform/web-user run test:watch
pnpm --filter @elm-platform/web-user run lint
pnpm --filter @elm-platform/web-user run preview
```

## 架构

### 后端服务

`apps/server/src/main.ts` 引导 Nest 应用，安装全局异常过滤器、日志/响应转换拦截器、`ValidationPipe`、CORS、全局 API 前缀和 Swagger。`apps/server/src/app.module.ts` 装配全局 `ConfigModule`、`PrismaModule`、`RedisModule` 及业务模块：`user`、`auth`、`admin`、`elm`。

Prisma 在 `apps/server/prisma/schema.prisma` 中配置为 PostgreSQL。当前 schema 建模了用户、登录日志、角色、菜单、部门、操作日志和系统日志。共享后端基础设施位于 `src/common`、`src/config`、`src/prisma`、`src/redis` 下；业务 API 位于 `src/modules/*` 下。

### 管理端应用

`apps/web-admin/src/main.ts` 创建带持久化的 Pinia、配置共享 HTTP 客户端、安装 Vue Router、i18n、指令、Element Plus 样式、SVG 图标和全局样式。应用采用类 FSD 分层：`app` 提供 providers/router，`entities` 为领域状态，`features` 为用户操作，`pages` 为路由页面，`widgets` 为组合 UI，`shared` 为 API/config/lib/styles/ui。

路由以 `src/app/router` 为中心。静态路由预先注册；动态路由由 `build-routes.ts` 基于后端菜单数据构建，经 `menu-adapter.ts` 与 `menu-schema.ts` 适配/规范化，由 `dynamic-routes.ts` 注册/重置。组件解析通过 `component-map.ts` 约束，因此菜单 `component` 键必须映射到已知页面组件。

HTTP 访问经由 `src/shared/api`：`createHttpClient` 解包 `{ code, data, message }` 响应，并集中处理 token 注入及 401/403/错误回调。`src/app/providers/http.ts` 将这些回调连接到认证 store、路由重定向、i18n 消息和 Element Plus 通知。

### 用户端应用

`apps/web-user/src/main.js` 注册 Pinia、路由、全局组件、指令、SVG 图标、Vant 相关设置和应用样式。应用是移动端 SPA，功能视图位于 `src/views`，可复用逻辑分布在 `src/components`、`src/composables`、`src/services`、`src/stores`、`src/utils`。

路由按模块组织：`src/router/index.ts` 使用 `import.meta.glob` 自动收集 `src/router/modules/*.ts`，创建 hash 路由，并应用认证/页面标题守卫。新增页面时在对应模块中定义路由，并保持路由 meta 与现有 `RouteMeta` 类型一致。

API 调用按功能组织在 `src/services/api` 下，端点常量位于 `src/services/api/endpoints`。所有网络流量应经由 `src/services/http`：`http.js` 暴露 `get/post/put/patch/del`，`request.js` 拥有 Axios 实例/拦截器，`policies.js` 通过 `config.meta` 选项实现请求重试、去重、缓存、定位注入、loading 集成、节流错误提示和日志脱敏。

Pinia store 位于 `src/stores/modules`，涵盖用户/会话、地址、定位和 loading。定位状态很重要，因为 HTTP 策略会向基于位置的请求注入经纬度。Composables 按作用域分组：`app` 为应用级行为，`ui` 为界面交互，`swr` 为 stale-while-revalidate 数据获取，`features` 为业务特定逻辑。

`apps/web-user` 有自己的 `AGENTS.md` 和 `CLAUDE.md`；仅在该应用内工作时请查阅它们，其中包含更详细的移动端应用指引。

`apps/web-admin` 有自己的 `AGENTS.md`，包含 `src/shared`、`src/app`、`src/widgets`、`src/layouts` 的完整模块地图；在该应用内工作时请查阅。

## 配置说明

- 两个 Web 应用均使用 `@` 作为各自本地 `src` 目录的别名。
- `apps/web-admin/vite.config.ts` 将 `/api` 代理到 `http://127.0.0.1:3000`，并自动导入 Vue、Vue Router、Pinia、Vue I18n 和 Element Plus 的 API/组件。
- `apps/web-user/vite.config.js` 将 `/api`、`/ele-api`、`/pay-api` 代理到本地 Nest 后端 3000 端口；`dev:mock` 启用 `apps/web-user/mock` 下的 mock。
- Web 构建在 `vite build` 前运行 `vue-tsc --noEmit`；修复类型错误后再视为构建成功。
- 用户端 Vitest 运行在 `happy-dom` 环境，匹配 `src/**/*.test.{js,ts}`。管理端 Vitest 运行在 `node` 环境，匹配 `src/**/*.{test,spec}.ts`。后端 Jest 通过包内 Jest 配置匹配 `apps/server/src/**/*.spec.ts`。

## 写报告约定

任何工程变更（重构、缺陷修复、新功能、配置、依赖升级）都必须在 `reports/` 中留档，供后续 AI 会话和人类复查。此规则适用于在本仓库工作的所有 AI 工具。

- **目录命名**：`reports/YYYY-MM-DD-中文名称/` —— 日期加简短中文标题（内部允许英文术语，如 `2026-08-19-购物车store瘦身`）。不要使用纯英文 slug。
- **报告文件**：日期目录内固定为 `engineering-report.md`（学习笔记则为 `learning-report.md`）。
- **模板**：复制 `reports/report-templates/engineering-report.md` 并填充 `{{占位符}}`。保留全部章节，不要另创新结构。
- **必备内容**：变更前后量化统计（行数、文件数、耗时）；带证据的决策依据（`file:line`、grep 结果、版本号）；被否决的方案及理由；具体改动；验证结果（只能使用你实际执行过的 lint / type-check / 测试命令）；影响范围；风险；回滚指南。
- 当你的改动涉及 store 时，检查是否存在 `apps/web-user/src/utils/cart.js` 式的纯函数抽取机会，并遵循既有模块约定。
- `reports/README.md` 维护报告索引；将你的报告登记进去。

## 自动报告生成规则

**触发条件**：当你完成一次完整的代码改动任务后（不是每改一行，而是完成一个功能点/修复一个bug后），必须自动生成工程变更报告。

**核心原则**：报告的目的是**完整记录思考过程和改动内容**，让后续的自己或他人能快速理解：为什么这样做、解决了什么、怎么做的、验证了什么。格式灵活，但内容必须完整。

**执行流程**：

### 第一步：收集改动信息
在开始改动前，先执行以下命令记录基线：
```bash
git status --short
git diff --stat
```

改动完成后，收集：
- 修改/新增/删除的文件列表
- 每个文件的改动摘要

### 第二步：执行验证命令
根据改动范围，执行对应的验证命令并记录**实际执行的命令和真实结果**：
```bash
pnpm --filter @elm-platform/server run lint        # 后端改动
pnpm --filter @elm-platform/server run build       # 后端构建
pnpm --filter @elm-platform/web-admin run lint     # 管理端改动
pnpm --filter @elm-platform/web-admin run type-check
pnpm --filter @elm-platform/web-user run lint      # 用户端改动
pnpm --filter @elm-platform/web-user run type-check
```

### 第三步：生成报告
1. 创建报告目录：`reports/YYYY-MM-DD-中文名称/`
2. 复制模板：`cp reports/report-templates/engineering-report.md reports/YYYY-MM-DD-中文名称/engineering-report.md`
3. 填充内容（**重点是说清楚事情，不是填表格**）：

**可以包含以下几个问题**：

| 问题 | 说明 |
|------|------|
| **为什么做？** | 背景和动机，遇到了什么问题，有什么约束条件 |
| **为什么这样做？** | 决策依据，考虑过哪些方案，为什么选了这个，否决了什么 |
| **做了什么？** | 具体改动了哪些文件，每个文件改了什么，关键代码变化 |
| **解决了什么？** | 改动后的效果，验证结果（必须是实际执行的命令） |
| **还有什么没做？** | 遗留问题、后续事项、风险点 |
| **变更概览** | 文件变更清单（新增/修改/删除） |
| **背景与动机** | 为什么要做这个改动，问题是什么 |
| **具体改动** | 每个文件做了什么，必要时贴代码对比 |
| **验证结果** | 实际执行的1int/build命令及结果 |
| **影响范围** | 改动影响哪些模块 |
| **风险与注意事项** | 可能的风险点 |
| **回滚指南** | 如何回滚这个改动 |
| **代码改动前后对比** | 改动前后文件/代码的对比，必要时，给出代码对比 |



**不要求固定章节结构**，上诉问题是可选的，不是必须的，可有可无。可以按逻辑自然组织，允许有发散性思维，比如：

- 先讲背景问题
- 再讲思考过程和方案选择
- 然后讲具体改动
- 最后讲验证和后续
- ........

**但是，要讲清楚具体改动结果**

### 第四步：更新索引
将新报告登记到 `reports/README.md`。

**输出格式**：
完成上述步骤后，在回复末尾输出以下摘要：
```
---
## 📋 改动报告摘要
- **报告路径**：reports/YYYY-MM-DD-中文名称/engineering-report.md
- **改动文件**：N 个文件（+X 新增, Y 修改, Z 删除）
- **验证状态**：✅ 已通过 lint / type-check
- **下一步**：[如果有待办事项]
---
```
