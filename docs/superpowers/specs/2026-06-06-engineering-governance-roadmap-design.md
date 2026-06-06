# 企业级工程化治理路线图设计

## Context

本项目已经从单纯的外卖业务实现，逐步扩展成包含 NestJS 后端、Vue 管理端、Vue 移动端、共享 packages、Prisma、Redis、CI、Docker Compose、API 类型生成和多人协作文档的 monorepo。之前的工程化建议如果只按“工具清单”理解，容易和多人协作建议割裂：协作文档、CODEOWNERS、PR 模板负责让团队知道怎么协作；CI、测试、日志、发布治理负责让协作结果能被验证、追踪和长期演进。

因此本设计把工程化能力重新组织为四个递进阶段：

1. 第一阶段解决“能协作”：环境一致、规则清楚、PR 可审。
2. 第二阶段解决“能上线”：质量门禁、基础可观测、安全反馈。
3. 第三阶段解决“能演进”：架构治理、契约稳定、发布可控。
4. 第四阶段解决“能规模化”：深度可观测、平台化配置、安全合规。

当前仓库已经具备第一阶段的大部分基础项，并已开始落地第二阶段的低风险质量门禁和 requestId/结构化日志方向。后续执行不应重复从零实现，而应先校验现状，再补齐缺口。

## Goals

- 把之前的工程化建议和多人协作建议合并成一个统一路线图。
- 标明每个能力项在团队协作链路中的作用，而不是只列技术名词。
- 区分“仓库可提交的改动”和“需要 GitHub/部署平台手动配置的改动”。
- 给后续执行提供阶段顺序、验收标准和拆分边界。
- 保持渐进式落地：每次只推进可验证、可回滚的一小批能力。

## Non-goals

- 本文档不直接修改业务代码、CI 配置或依赖。
- 本文档不把所有工程化能力一次性落地。
- 本文档不承诺第四阶段能力立刻必要；第四阶段只作为中大型团队演进方向。
- 本文档不替代具体阶段的详细设计和实施计划；复杂条目仍需单独 spec 和 plan。

## Current Baseline

| 能力 | 当前状态 | 说明 |
|---|---|---|
| Docker Compose | 已具备 | 根目录 `docker-compose.yml` 已提供 PostgreSQL 和 Redis。 |
| env 校验 | 已具备 | `apps/server/src/config/env.schema.ts` 使用 zod 校验后端环境变量。 |
| CONTRIBUTING.md | 已具备 | 已覆盖环境、启动、分支、提交、PR、数据库变更和 review 建议。 |
| CODEOWNERS | 已具备 | `.github/CODEOWNERS` 已按 app/package/CI 分区。 |
| PR/Issue 模板 | 已具备 | `.github/pull_request_template.md` 和 Issue 模板已存在。 |
| 分支保护 | 平台配置项 | 需在 GitHub 仓库设置中启用，不能只靠提交文件完成。 |
| Dependabot | 已具备 | `.github/dependabot.yml` 已覆盖 npm 和 GitHub Actions。 |
| pnpm catalogs | 已具备 | `pnpm-workspace.yaml` 已集中管理主要依赖版本。 |
| pre-commit/pre-push | 已具备 | `.husky/pre-commit` 跑 lint-staged，`.husky/pre-push` 跑 type-check。 |
| 覆盖率报告入口 | 已具备 | 根 `package.json` 已有 `test:cov`。 |
| CI coverage/security audit | 已具备 | `.github/workflows/ci.yml` 已有 coverage 和非阻塞 audit job。 |
| requestId/结构化日志 | 已设计/执行中 | 已有 `2026-06-06-request-id-structured-logging-design.md` 和对应计划。 |
| 健康检查 | 已具备 | `apps/server/src/health` 已存在健康检查模块。 |
| API drift | 已具备 | CI 已通过 Swagger 生成并检测 `packages/api-types` 漂移。 |

## Design

### Phase 1: 基础设施 + 协作规范

目标是让新人 clone 后能启动，让团队知道如何提需求、开分支、发 PR、审代码和处理依赖更新。

| 项 | 类别 | 协作价值 | 执行策略 |
|---|---|---|---|
| Docker Compose | 环境 | 统一 PostgreSQL/Redis，本地环境不再靠口口相传。 | 已具备，后续补 smoke 验证和 README 链接即可。 |
| env 校验 | 环境 | 缺配置时启动即失败，减少排障成本。 | 已具备，后续保证 `.env.example` 和 schema 同步。 |
| CONTRIBUTING.md | 协作 | 把分支、提交、PR、验证流程写成团队契约。 | 已具备，后续随流程变化维护。 |
| CODEOWNERS | 协作 | 变更自动指派 reviewer，降低漏审风险。 | 已具备，后续按模块 ownership 细化。 |
| PR/Issue 模板 | 协作 | 强制说明 what/why/testing/risk。 | 已具备，后续补设计文档链接字段。 |
| 分支保护 | 协作 | main 必须 PR、CI pass、approve 后合并。 | 需要 GitHub 平台配置，并在文档中记录规则。 |
| Dependabot | 依赖 | 自动创建依赖更新 PR。 | 已具备，后续定义分组合并策略。 |
| pnpm catalogs | 依赖 | monorepo 依赖版本统一。 | 已具备，后续禁止 app 私自绕过 catalog。 |

第一阶段的缺口主要不是代码，而是“校验与显性化”：确认 GitHub 分支保护已开启，补充协作文档和模板中对设计书/计划书的引用，让工程治理真正进入 PR 流程。

### Phase 2: 质量门禁 + 可观测性

目标是让每次改动都有最低验证成本，出了问题能用日志和 requestId 快速定位。

| 项 | 类别 | 协作价值 | 执行策略 |
|---|---|---|---|
| 测试覆盖率门槛 | 质量 | 防止关键模块测试持续下降。 | 先已有 coverage 报告，后续从低阈值开始。 |
| E2E 测试 | 质量 | 保护登录、下单、管理端核心路径。 | 后续引入 Playwright smoke，先不覆盖全量场景。 |
| Bundle size 监控 | 质量 | 防止依赖误引导致首屏体积回退。 | 后续接入 bundle 分析脚本或 CI diff 报告。 |
| pre-push type-check | 质量 | 推送前拦截前端类型错误。 | 已具备。 |
| 结构化日志 + requestId | 运维 | 多人排障时能用同一个 ID 串联请求、异常和审计。 | 已有独立设计/计划，按 Phase 2B 执行。 |
| 健康检查 + 优雅关停 | 运维 | 发布、容器、负载均衡需要可靠健康信号。 | 健康检查已具备，优雅关停后续补齐。 |
| Sentry 错误追踪 | 运维 | 线上错误自动聚合并关联 sourcemap/user context。 | 等 requestId 和 sourcemap 流程稳定后再接。 |
| 依赖安全审计 | 安全 | PR 中及时暴露已知漏洞。 | 已有非阻塞 audit，后续升级 high/critical 阻塞。 |

第二阶段应采用“报告先行、阈值后置”的策略。先让团队看到 coverage、audit、日志关联信息，再逐步提高阻塞强度，避免历史问题一次性压垮所有 PR。

### Phase 3: 架构治理 + 发布能力

目标是让项目在多人持续迭代后仍能保持边界清楚、接口稳定、发布可控。

| 项 | 类别 | 协作价值 | 执行策略 |
|---|---|---|---|
| ADR 文档 | 架构 | 重大技术决策有记录，减少重复争论。 | 新建 `docs/adr` 模板，PR 模板要求关联 ADR。 |
| API 版本策略 | 架构 | 接口变更不会直接打挂线上客户端。 | 先定义 breaking change 规则，再考虑 `/api/v1`。 |
| 契约测试 | 架构 | 前后端接口变更互相感知。 | 在现有 API drift 基础上增加关键 DTO/响应契约测试。 |
| Feature Flags | 发布 | 支持灰度、A/B、快速回滚。 | 先做配置驱动开关，不急于引入平台。 |
| 数据库迁移规范 | 架构 | 降低锁表、不可回滚 migration 风险。 | CONTRIBUTING 已有说明，后续补 migration checklist。 |
| Changelog 自动生成 | 发布 | 发版自动汇总变更。 | 基于 Conventional Commits 生成 release notes。 |
| Import 边界 | 架构 | 防止 feature 间互相依赖形成耦合。 | 先在 web-admin FSD 边界试点，再扩到 web-user。 |

第三阶段每一项都可能改变团队工作方式，因此需要单独设计、单独计划、单独验收，不适合和 Phase 2 的可观测性混在一个 PR 中。

### Phase 4: 规模化 + 深度可观测

目标是为中大型团队、生产环境、多服务部署和合规要求做准备。当前不应急于全部落地，但设计上要给前面阶段留演进空间。

| 项 | 类别 | 协作价值 | 执行策略 |
|---|---|---|---|
| OpenTelemetry | 运维 | 一个 traceId 串联前端、后端、DB 和外部服务。 | 在 requestId 稳定后再接入 traceId 对齐。 |
| 配置中心 | 运维 | 运行时动态调参，不用重新部署。 | 先明确哪些配置允许运行时变更。 |
| Lighthouse CI | 质量 | 每个 PR 对比性能指标。 | 等前端核心路径稳定后接入。 |
| Storybook | 文档 | 组件可视化文档，设计/产品可参与 review。 | 优先用于共享组件和复杂业务组件。 |
| Secrets 管理 | 安全 | 生产密钥不在环境变量明文散落。 | 依赖部署平台，先定义 secret 分类。 |
| RBAC 审计日志 | 安全 | 满足“谁在何时做了什么”的合规追踪。 | 当前已有日志基础，后续增强不可篡改和查询能力。 |

第四阶段的原则是“不为展示而平台化”。只有当团队规模、部署复杂度或合规要求真的出现时，才推进这些较重能力。

## Collaboration Flow

工程化治理应进入日常协作链路：

1. Issue 说明背景、目标、影响范围。
2. 复杂改动先写设计书，明确 goals、non-goals、风险和验收。
3. 设计通过后写计划书，拆成小任务和验证命令。
4. 通过 feature 分支实现，PR 关联设计书/计划书/Issue。
5. CODEOWNERS 自动指派 reviewer。
6. CI 执行 lint、type-check、test、build、coverage、audit、API drift。
7. reviewer 按 PR 模板检查测试、风险、migration、API 兼容性。
8. 合并后由 changelog/release notes 汇总发布信息。

这条链路把“多人协作”和“工程化能力”合成一个闭环：协作文档定义流程，CI 和日志提供证据，ADR 和计划书保留决策上下文。

## Execution Principles

- 先补已存在能力的文档和验收，再新增高成本工具。
- 仓库内可提交的改动和平台配置项分开管理。
- 每个阶段都要有可运行命令或人工验收清单。
- 阻塞型门禁必须渐进启用，先报告、再设阈值、再阻塞。
- 涉及业务代码、数据库 schema、发布流程的条目必须单独设计。
- 不为“企业级”堆工具；每个工具都必须回答它解决哪个协作痛点。

## Risks and Tradeoffs

- 当前工作区已有大量未提交改动，后续执行必须避免覆盖他人变更。
- 分支保护、Secrets、Sentry、OpenTelemetry 后端平台等能力不能只通过代码提交完成，需要维护外部配置记录。
- 质量门禁过快升级为阻塞会影响现有开发节奏，应先收集基线。
- Storybook、Lighthouse、OpenTelemetry 等能力维护成本较高，过早引入会稀释业务交付注意力。

## Acceptance

- 后续计划书能清楚区分 Phase 1 到 Phase 4。
- 已具备能力不会被重复规划为从零实现。
- 每个阶段都有明确协作价值、执行策略和验收方式。
- 下一步执行时可以从计划书中选择一个小批次推进。
