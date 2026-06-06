# Phase 3: 架构治理与发布能力设计

## Context

Phase 1 已经让团队具备基本协作规范，Phase 2 正在补质量门禁和基础可观测性。随着后端、管理端、用户端、共享 packages 和业务模块继续增长，项目风险会从“能不能跑起来”转向“多人持续迭代后边界会不会失控、接口会不会误破坏、发布能不能灰度和回滚”。

Phase 3 的目标不是引入一套沉重的平台，而是建立轻量治理机制：重大决策可追溯，API 变更有规则，前后端契约可检测，功能发布可控，数据库迁移有审查，发布内容能自动汇总，模块 import 边界能被工具守住。

## Goals

- 引入 ADR 文档，记录重大架构、工具和协作决策。
- 定义 API 版本和 breaking change 策略，减少客户端被接口变更直接打挂的风险。
- 在现有 API drift 基础上补充契约测试，覆盖关键 DTO 和响应结构。
- 建立 Feature Flags 约定，支持灰度、A/B 和快速回滚的最小能力。
- 补充数据库 migration checklist，降低锁表、不可回滚和数据不一致风险。
- 基于 Conventional Commits 生成 changelog/release notes。
- 试点 import 边界规则，防止 feature 之间形成隐式耦合。

## Non-goals

- 不一次性引入复杂发布平台。
- 不重写现有路由、API、数据库层或权限系统。
- 不要求所有历史模块立刻满足 import boundary。
- 不在本阶段实现完整配置中心或远程 feature flag 平台。
- 不把 ADR 变成所有小改动的强制流程。

## Design

### 1. ADR 文档

新增 `docs/adr/0000-template.md` 作为模板。需要 ADR 的场景包括：

- 新增或替换核心框架、构建工具、测试工具、监控工具。
- 改变 monorepo package 边界或应用分层规则。
- 引入新的部署、发布、鉴权、租户隔离或数据治理策略。
- 对 API 版本、数据库迁移、日志审计等长期约束做出决策。

PR 模板中已有 `Design / Plan / ADR` 字段，小改动可以留空，复杂改动必须关联。

### 2. API 版本策略

短期保持当前 `APP_PREFIX=api`，先通过规则治理 breaking change：

- 删除字段、改变字段含义、改变状态枚举、改变错误码结构都算 breaking change。
- breaking change 必须更新 `packages/api-types`，并在 PR 中说明迁移方式。
- 对外稳定接口后，再考虑 `/api/v1` 命名空间。

### 3. 契约测试

现有 CI 已有 API drift 检测，能发现 Swagger 类型文件未更新。Phase 3 在此基础上增加关键契约测试：

- 后端 DTO 到 Swagger schema 的关键字段测试。
- 管理端/用户端调用关键 API 时的响应结构测试。
- 支付、订单、租户、权限等高风险领域优先覆盖。

### 4. Feature Flags

先采用配置驱动的最小方案，不接外部平台：

- flag 命名采用 `domain.feature.variant`。
- flag 默认值必须保守。
- 代码中必须有清晰回滚路径。
- 涉及用户可见行为的 flag 需要在 PR 中说明灰度范围。

### 5. 数据库迁移规范

在 CONTRIBUTING 和 PR 模板中强化 migration checklist：

- 是否锁表。
- 是否需要 backfill。
- 是否可回滚。
- 是否需要兼容旧代码和新代码同时运行。
- 是否更新 seed 和测试数据。

### 6. Changelog 自动生成

基于 Conventional Commits 生成 release notes，先以手动命令产出，再决定是否接入 CI release job。

### 7. Import 边界

先在 web-admin 试点，因为该应用已有 FSD-like 分层：

- `shared` 不依赖 `entities/features/pages/widgets`。
- `entities` 不依赖 `features/pages/widgets`。
- `features` 不依赖 `pages/widgets`。
- `pages/widgets` 可组合下层能力。

初期只报告或只限制新增违规，避免历史问题一次性阻塞所有 PR。

## Verification

后续实施阶段应至少验证：

```bash
pnpm lint
pnpm test
pnpm build
pnpm api:generate
```

针对 import boundary 和 changelog 的新增命令应在各自计划中单独列出。

## Risks and Tradeoffs

- ADR 过度使用会增加流程成本，因此只覆盖重大决策。
- API 版本策略如果过早做 `/api/v1` 重构，会扩大改动范围，因此先从规则和契约测试开始。
- Feature Flags 如果缺少清理机制，会留下长期分支逻辑，后续需要过期策略。
- import boundary 初期可能暴露大量历史问题，必须先试点和分级处理。

## Acceptance

- `docs/adr/0000-template.md` 存在并可被 PR 引用。
- 后续计划书明确列出 API、契约测试、feature flag、migration、changelog、import boundary 的执行顺序。
- Phase 3 不直接阻塞当前业务开发，而是以轻量规则和试点自动化逐步推进。
