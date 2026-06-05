# Contributing Guide

感谢参与 elm-platform。本文档用于统一多人协作、开发环境、提交、PR 和验证流程。

## 1. 环境要求

- Node.js: 建议 20.x（CI 使用 Node 20）
- pnpm: 11.5.0（见根目录 `packageManager`）
- Docker Desktop（用于本地 PostgreSQL / Redis）

## 2. 本地启动

```bash
# 安装依赖
pnpm install

# 启动本地依赖服务：PostgreSQL + Redis
docker compose up -d

# 复制并按需修改后端环境变量
cp apps/server/.env.example apps/server/.env

# 生成 Prisma Client
pnpm --filter vue3-elm-node run prisma:generate

# 启动所有应用
pnpm dev
```

常用命令：

```bash
pnpm dev:server
pnpm dev:admin
pnpm dev:user
pnpm build
pnpm test
pnpm type-check
pnpm lint
pnpm lint:style
```

## 3. 分支策略

推荐短生命周期 feature 分支，通过 PR 合并到 `main`：

- `feat/<short-name>` — 新功能
- `fix/<short-name>` — 缺陷修复
- `refactor/<short-name>` — 重构
- `docs/<short-name>` — 文档
- `ci/<short-name>` — CI/CD
- `chore/<short-name>` — 工程杂项

`main` 分支应启用保护规则：

- 必须通过 PR 合并
- 必须通过 CI
- 至少 1 个 reviewer approve
- 不允许直接 force push

## 4. Commit 规范

项目使用 Conventional Commits，并由 commitlint + husky 自动校验：

```text
type(scope): subject
```

示例：

```bash
feat(server): add user avatar upload API
fix(admin): fix order status display
refactor(contracts): extract order action types
ci: add API drift detection workflow
```

允许的 type：

- `feat` — 新功能
- `fix` — 修复
- `docs` — 文档
- `style` — 代码风格，不影响逻辑
- `refactor` — 重构
- `perf` — 性能优化
- `test` — 测试
- `build` — 构建系统
- `ci` — CI/CD
- `chore` — 杂项
- `revert` — 回滚

## 5. PR 流程

创建 PR 前请至少执行：

```bash
pnpm lint
pnpm type-check
pnpm test
pnpm build
```

PR 描述需要说明：

- 改了什么
- 为什么改
- 如何验证
- 是否有数据库 migration / API breaking change / 配置变更

## 6. API 类型生成

后端 Swagger 文档用于生成前端 API 类型：

```bash
# 先启动后端
pnpm dev:server

# 再生成 API 类型
pnpm api:generate
```

生成结果位于：

- `packages/api-types/openapi.json`
- `packages/api-types/generated/index.d.ts`

CI 会检测 `packages/api-types/` 是否发生漂移。

## 7. 数据库变更

涉及 Prisma schema / migration 的 PR 需要说明：

- migration 的目的
- 是否会锁表或影响大表
- 是否需要回滚方案
- 是否需要 seed 数据更新

## 8. Review 建议

Reviewer 优先关注：

- 是否破坏 API 契约
- 是否引入安全风险
- 是否有必要的测试
- 是否复用了 `packages/*` 共享包
- 是否符合分层/模块边界
