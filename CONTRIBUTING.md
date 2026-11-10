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
pnpm --filter @elm-platform/server run prisma:generate

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

## 3. Monorepo 命令

Use root commands for common verification so local development and CI stay aligned:

- `pnpm ci:lint`
- `pnpm ci:type-check`
- `pnpm ci:test`
- `pnpm ci:build`
- `pnpm ci:api-drift`

See `docs/engineering/monorepo.md` for package roles, build order, and dependency boundary rules. Prefer adding reusable root scripts over duplicating long command chains directly in GitHub Actions.

## 4. 分支策略

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

## 5. Commit 规范

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
- `merge` — 合并分支（仅用于合并提交）
- `revert` — 回滚

## 6. PR 流程

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

复杂改动建议先关联设计书和计划书：

- 设计书：`docs/superpowers/specs/*.md`
- 计划书：`docs/superpowers/plans/*.md`
- ADR：重大架构决策放入 `docs/adr/`

满足任一条件时，PR 描述应附设计书或计划书链接：

- 涉及数据库 migration、权限、支付、认证、租户隔离或日志审计。
- 改动跨越两个以上 app/package。
- 引入新的工程化工具、CI job、部署配置或外部服务。
- 改动 API 契约或前后端共享类型。

## 7. 架构决策记录（ADR）

重大架构、工具链、部署、认证、租户隔离、API 版本、数据库迁移、可观测性和安全策略变更需要新增 ADR。

ADR 模板位于 `docs/adr/0000-template.md`。新 ADR 文件建议使用递增编号，例如 `docs/adr/0001-use-feature-flags.md`。

ADR 至少需要说明：

- 背景和约束
- 被考虑过的备选方案
- 最终决策
- 代价、风险、迁移影响和后续清理计划

PR 涉及 ADR 时，请在 PR 模板的 `ADR` 字段附上链接。

## 8. API 类型生成与兼容性

API 兼容性策略见 `docs/api/versioning.md`。

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

## 9. 数据库变更

数据库迁移检查清单见 `docs/database/migration-checklist.md`。

涉及 Prisma schema / migration 的 PR 需要说明：

- migration 的目的
- 是否会锁表或影响大表
- 是否需要回滚方案
- 是否需要 seed 数据更新

## 10. Review 建议

Reviewer 优先关注：

- 是否破坏 API 契约
- 是否引入安全风险
- 是否有必要的测试
- 是否复用了 `packages/*` 共享包
- 是否符合分层/模块边界

## 11. Agent Git 工作规范

本节约束在本仓库执行 git 操作的 AI agent（Codex、Claude Code、opencode 等）。人类协作者仍以 §4–§6 为准；格式校验仍由 §5 与 `commitlint.config.mjs` 保证，本节只写 agent 与人类流程不同的部分。

优先级：用户当次明确指令 > 本节 > 本文其他章节。

### 11.1 红线

以下操作默认禁止。确有必要时，先说明影响范围并取得用户明确同意：

- `git reset --hard`、`git checkout -- .`、`git clean -fd`，以及静默 `git stash` 他人改动。
- `git add -A` / `git add .`：按路径显式 add，提交前用 `git diff --cached` 复核。
- `git commit --no-verify`；为通过检查而修改、关闭 lint / 类型检查 / 测试。
- `git commit --amend` 修改非本次会话创建的提交。
- `git push --force`、改写已推送提交、删除分支、打 tag、修改 `git config`。
- 在 commit message 中添加 `Co-Authored-By` 或任何 AI 署名。

### 11.2 工作区纪律

- 改动前记录基线：`git status --short`、`git diff --stat`。
- 工作区中已存在的未提交改动视为用户工作：不还原、不暂存、不夹带提交。确实需要修改同一文件时，先在回复中说明。
- 只提交本次任务产生的路径；未跟踪文件先判断归属（生成物 / 用户草稿），拿不准就问。
- `.gitattributes` 已设 `* text=auto eol=lf`。若 `git diff` 显示整文件变更，先确认是行尾还是生成物噪音，再决定是否提交。

### 11.3 提交粒度

- 一个 commit 只做一件事，且能用一句话说清；不混入「顺便」改动。
- 每个 commit 应能独立构建（便于 bisect）；确实无法单独构建时，在 body 说明原因。
- 重构与行为变更分开提交。
- 生成物与源码同 commit：`packages/api-types/*`、Prisma Client、`*-auto-imports.d.ts` 等，否则 `pnpm ci:api-drift` 会失败。
- 报告按 `AGENTS.md` 的报告约定单独提交为 `docs(<scope>): ...`，不与代码 commit 混合。

### 11.4 提交信息

沿用 §5 的 Conventional Commits，并补充：

- `type(scope)` 用英文，subject 用中文（与仓库现有提交一致），结尾不加句号。
- subject 写清结果，不写文件名清单或「更新代码」这类空话。
- body 说明为什么改、如何验证；破坏性变更用 `!` 并在 body 写 `BREAKING CHANGE:`。
- 多 scope 按 `server → admin → user → uni-user → contracts` 排序，仅用于同源改动。

scope 与目录的对应关系：

| 改动位置 | scope |
| --- | --- |
| `apps/server` | `server` |
| `apps/web-admin` | `admin` |
| `apps/web-user` | `user` |
| `apps/uni-user` | `uni-user` |
| `packages/contracts` | `contracts` |
| `packages/api-types` | `api-types` |
| `.github/workflows` | `ci` |
| 依赖版本 | `deps` |
| 根 tsconfig / 共享 vite 配置 | `tsconfig`、`vite-config` |
| `docs/**` | 省略 scope |

根配置、turbo、eslint、`scripts/` 暂无专属 scope：优先归入 `ci` / `deps` / `tsconfig`，无法归类时省略 scope。`scope-enum` 当前是 warning，不要为消除 warning 生造 scope。

正例：

```text
feat(server): 头像孤儿文件静默清理机制
fix(admin): 菜单图标在暗色主题下不可见
docs: 落地教学型注释规范
```

反例（信息量为零，review 时无法判断影响面）：

```text
fix: 修改了一些问题
feat(server): 更新文件
```

### 11.5 分支：功能走分支，维护直提 main

`main` 必须始终可构建、可启动。功能开发在分支上完成，合并回 `main` 才算交付；错字、注释、单文件修复这类维护改动直接进 `main`。

任务开始时 agent 按下表给出建议并等一句确认；整段任务只问一次，不逐 commit 询问。

**开分支**（满足任一，且必须在第一个 commit 之前开）：

- 完成它需要多个 commit，且中间状态单独构建不过。
- 改动 API 契约（`packages/api-types` 产物）或 Prisma schema / migration。
- 跨端改动：server 与前端必须同时就位才成立。
- 可能整体放弃的试验（选型验证、大规模重构）。
- 需要 PR 评审，或与另一个会话并行改动。
- 用户明确要求。

**不开分支**（直接 `main`，单 commit 完成且改完立刻绿）：

- 错字、注释、日志、版本号、单文件缺陷修复。
- 纯 `docs(` / `chore(` 提交。

判断口诀：**做完之前不敢让别人 `git pull main` 继续干活，就开分支。**

命名 `<type>/<scope>-<短描述>`，type 复用 §5，scope 复用 11.4，例如 `feat/server-avatar-cleanup`、`refactor/admin-fsd-collapse`。

- 分支先留在本地，需要备份或跨机时再推送。
- 合并后立即删除本地与远端分支；分支存活不超过 2 个工作日。
- 同步 `main` 用 `git merge main`，不 rebase 已推送分支。
- 大规模重构前打 `backup/<原因>-<YYYY-MM-DD>` tag 做快照，不新增长期备份分支。
- 只有并行会话才用 worktree，普通功能用分支即可。
- 若远端 `main` 已按 §4 启用分支保护，以保护规则为准：走分支 + PR，不尝试绕过。

### 11.6 推送、PR 与合并

- 默认只提交到本地；`git push`、创建或合并 PR、打 tag 均需用户明确指令。
- 合并回 `main` 前：分支自身验证通过，并先 `git merge main` 同步。
- 用 `--no-ff` 合并以保留功能边界；不 squash，避免压掉 §11.3 的原子提交。
- 合并提交用 `merge: 合并 <branch>（摘要）`，与仓库历史一致；`merge` 已于 2026-11-10 加入 `type-enum`。不要为通过合并而使用 `--no-verify`。
- `.husky/pre-push` 会执行全仓 `pnpm type-check`，因此批量推送，不要每完成一步就推。
- 推送前执行与改动匹配的最小验证；创建 PR 前按 §6 执行完整四项检查。回复中只写实际执行过的命令与真实结果。
- 不修改他人 PR、不在解决远端冲突后直接强推。

### 11.7 失败处理与回滚

- pre-commit / commit-msg / pre-push 失败：修代码或修提交信息，不跳过钩子。
- commit 已生成但夹带无关文件：`git reset --soft HEAD~1` 后按路径重新 add，不用 `--hard`。
- 误改用户文件：`git restore --source=HEAD --staged --worktree <path>`，并在回复中说明影响。
- 冲突不整体选边（`--ours` / `--theirs`）：逐文件判断并说明取舍。
- 已推送的提交需要撤销时用 `git revert`，不改写历史。

### 11.8 收尾自检

任务结束前执行，并把结果写进回复：

```bash
git status --short      # 无意外文件，用户改动未被夹带
git log --oneline -3    # 提交信息与实际改动一致
git diff HEAD~1 --stat  # 文件范围符合预期
```
