# Monorepo 工程指南

## 目的

本仓库是 Elm Platform 的 pnpm workspace Monorepo。本指南的目标是明确各包的职责、命令入口、构建顺序和依赖边界，使本地开发和 CI 使用相同的工作流程。

## 工作区布局

```text
apps/
  server      NestJS 后端，使用 Prisma、Redis、JWT/Passport、Swagger
  web-admin   Vue 3 管理后台，使用 Element Plus、Pinia、Vue Router、Vite
  web-user    Vue 3 移动端应用，使用 Vant、Pinia、Vue Router、Vite、Vitest
packages/
  contracts   共享业务契约、常量和领域类型
  api-types   由工具生成的 OpenAPI TypeScript 类型声明
  tsconfig    共享 TypeScript 配置文件
  vite-config 共享 Vite 辅助工具函数，供 Web 应用使用
```

工作区成员定义在 `pnpm-workspace.yaml` 中。新的应用应放在 `apps/*` 下；可复用的包应放在 `packages/*` 下。

## 共享包职责

### `@elm-platform/contracts`

用于多个应用共享的运行时安全的领域契约、常量、枚举和类型。目前被后端和管理后台使用。

不要将框架特定的 NestJS、Vue、Element Plus、Vant 或数据库实现代码放在这里。

### `@elm-platform/api-types`

用于由工具生成的 OpenAPI TypeScript 类型声明。通过以下命令更新：

```bash
pnpm api:generate
```

当生成的类型可以复用时，不要在应用中手动重复定义 API 响应类型。

### `@elm-platform/tsconfig`

用于共享的 TypeScript 编译器配置。新的 TypeScript 包应继承这些配置文件，而不是复制编译器选项。

### `@elm-platform/vite-config`

用于共享的 Vite 配置辅助工具，如路径别名、API 代理配置、SCSS 选项和 SVG 图标设置。

Web 应用应导入这些辅助函数，而不是重复编写相同的 Vite 配置。

## 标准命令

常用工作流使用根目录命令。

| 命令 | 用途 |
|---|---|
| `pnpm dev` | 并行运行 server、admin 和 user 应用 |
| `pnpm build:packages` | 构建可构建的共享包 |
| `pnpm build:apps` | 构建 server、admin 和 user 应用 |
| `pnpm build:all` | 先构建共享包，再构建应用 |
| `pnpm build` | 应用构建的兼容入口 |
| `pnpm ci:lint` | 运行 ESLint 和 Stylelint（CI 用） |
| `pnpm ci:type-check` | 运行工作区类型检查 |
| `pnpm ci:test` | 运行工作区测试 |
| `pnpm ci:build` | 运行完整 Monorepo 构建 |
| `pnpm ci:coverage` | 运行覆盖率命令 |
| `pnpm ci:api-drift` | 生成 API 类型用于漂移检查 |
| `pnpm ci:workspace` | 校验工作区包的元数据 |
| `pnpm lint:boundaries` | 报告当前 web-admin 的导入边界警告 |
| `pnpm turbo:build` | 通过 Turborepo 任务图构建（带缓存） |
| `pnpm turbo:type-check` | 通过 Turborepo 任务图进行类型检查 |
| `pnpm turbo:test` | 通过 Turborepo 任务图运行 `test` 和 `test:unit` |
| `pnpm turbo:lint` | 通过 Turborepo 任务图运行 lint |

CI 应尽量使用标准根目录命令，而不是在工作流 YAML 中重复冗长的包特定命令链。

## 构建顺序

可构建的共享包必须在消费其 `dist` 导出的应用之前构建。

推荐的完整本地检查：

```bash
pnpm build:all
pnpm ci:type-check
pnpm ci:test
```

当 API 类型可能过期时，运行：

```bash
pnpm ci:api-drift
```

然后检查生成的变更：

```bash
git diff -- packages/api-types
```

## 使用 Turborepo 进行任务编排

`turbo.json` 定义了任务图。Turborepo 读取 `workspace:*` 依赖来推断构建顺序，因此共享包会自动在消费它们的应用之前构建，无需手动编写顺序。

试运行命令：

```bash
pnpm turbo:build
pnpm turbo:type-check
pnpm turbo:test
pnpm turbo:lint
```

`turbo.json` 中的关键任务规则：

- `build` 依赖 `^build`（上游包的构建），并缓存 `dist/**`。
- `type-check`、`test` 和 `test:unit` 依赖 `^build`，确保消费者始终使用最新的包产物。
- `test:coverage` 和 `test:cov` 缓存 `coverage/**`。
- `generate` 和 `dev` 禁用缓存；`dev` 标记为持久运行。

目前缓存仅限本地。全新构建会编译所有包；未变更的重新运行会回放缓存产物并显示 `FULL TURBO`。缓存目录 `.turbo/` 已加入 `.gitignore`。

这些 `turbo:*` 脚本是试运行阶段，与现有的 `pnpm build:all` 和 `pnpm ci:*` 命令并行运行。标准的 `ci:*` 入口尚未切换到 Turborepo；只有在试运行确认稳定后才会迁移。

## 仅受影响的任务

Turborepo 可以将任务限制为仅针对相对于基准分支发生变更的包。这避免了为一个小改动而重新构建或重新测试整个仓库。

试运行命令（默认基准为 `main`）：

```bash
pnpm turbo:affected:build
pnpm turbo:affected:test
pnpm turbo:affected:lint
```

`--affected` 将工作分支与 `main` 进行比较，选择发生变更的包以及所有依赖它们的包，使用与完整命令相同的任务图。由于复用了依赖图，修改 `@elm-platform/contracts` 会正确地重新包含 `server` 和 `web-admin`。

在 CI 中，基准 ref 可以通过 `TURBO_SCM_BASE` 环境变量覆盖（例如 pull request 的基准 SHA），并且 checkout 必须使用足够的 git 历史（`fetch-depth: 0`）才能使比较正常工作。

这是本地试运行。尚未接入阻塞式 CI 任务；标准 CI 命令仍然运行完整工作区。仅受影响的 CI 应在 Turborepo 试运行确认稳定后才采用，以确保不会过早地用正确性换取速度。

## 依赖规则

- 应用可以依赖 `packages/*` 下的共享包。
- 共享包不得依赖 `apps/*` 下的应用。
- 应用不得依赖其他应用。
- 内部依赖应使用 `workspace:*`。
- 当外部依赖已在 `pnpm-workspace.yaml` 中统一管理时，版本应使用 `catalog:`。
- 共享包应保持职责单一，避免导入框架特定代码，除非该包本身就是框架特定的。

## 工作区元数据校验

`scripts/validate-workspace.mjs` 作为自动化检查来强制执行上述依赖规则。本地运行：

```bash
pnpm workspace:validate
```

CI 在 lint 任务中通过 `pnpm ci:workspace` 运行相同的检查。

校验器会在以下情况报错：

- 工作区包缺少 `name`，或两个包使用了相同的 `name`。
- 内部依赖使用了 `workspace:*` 以外的版本范围。
- `packages/*` 下的包依赖了 `apps/*` 下的应用。
- 应用依赖了其他应用。
- 包通过 `main`、`module`、`types`、`exports` 或 `files` 暴露了 `dist` 产物，但没有 `build` 脚本。

由工具生成的包（如 `@elm-platform/api-types`）暴露 `generated` 而非 `dist`，因此不需要声明 `build` 脚本。

## 导入边界策略

`apps/web-admin` 目前在 `eslint.config.mjs` 中配置了 FSD 风格的导入边界规则：

- `shared` 不得导入上层模块。
- `entities` 可以依赖 `shared`，不得依赖上层模块。
- `features` 可以依赖 `entities` 和 `shared`，不得依赖 `pages`、`widgets` 或 `app`。
- `widgets` 可以依赖 `features`、`entities` 和 `shared`，不得依赖 `pages` 或 `app`。

这些规则目前是警告级别。使用以下命令进行专项报告：

```bash
pnpm lint:boundaries
```

在没有清理计划的情况下，不要将历史警告转变为阻塞式 CI 失败。预期的推进计划是：

1. 本地/报告命令。
2. 非阻塞式 CI 可见性。
3. 对变更文件进行严格检查。
4. 违规全部解决后全面严格执行。

完整的层级排序、当前已知违规列表和推进计划记录在 `docs/architecture/import-boundaries.md` 中。

## 添加新包

1. 在 `packages/<name>` 下创建。
2. 使用作用域包名，如 `@elm-platform/<name>`。
3. 内部依赖使用 `workspace:*`。
4. 受管的外部依赖使用 `catalog:`。
5. 使用 TypeScript 时继承 `@elm-platform/tsconfig`。
6. 如果包从 `dist` 导出文件，添加 `build` 脚本。
7. 如果包成为共享平台包，在本指南中记录其职责。

## 发布与 API 治理

Monorepo 的发布和 API 契约规则在专门的文档中，此处引用以便工作区指南作为唯一入口：

- API 兼容性和破坏性变更规则：`docs/api/versioning.md`。API 契约变更必须运行 `pnpm api:generate` 并提交生成的 `packages/api-types` 变更；CI 会在未检测到的漂移上失败。
- 变更日志和发布说明：`docs/release/changelog.md`。在审查时使用 `pnpm changelog:preview`，发布时使用 `pnpm changelog:update`。
- 导入边界：`docs/architecture/import-boundaries.md`。
- CI 与部署工作流：`docs/engineering/github-actions-workflows.md`。包含 `ci.yml` 和 `deploy-pages.yml` 的完整语法讲解和编写依据。

目前发布说明是仓库级别的。如果包需要独立发布或版本管理，后续可以添加按包的版本控制和变更日志。
