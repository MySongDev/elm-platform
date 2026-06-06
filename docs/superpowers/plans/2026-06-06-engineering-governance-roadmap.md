# Engineering Governance Roadmap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the enterprise engineering roadmap into an executable sequence that integrates collaboration rules, CI quality gates, observability, architecture governance, and release maturity.

**Architecture:** Treat this as a governance backlog, not a single mega-change. Phase 1 verifies and documents existing collaboration infrastructure, Phase 2 strengthens quality and observability, Phase 3 adds architecture/release controls, and Phase 4 remains opt-in for scale-driven needs.

**Tech Stack:** pnpm workspace, GitHub Actions, Husky, commitlint, Dependabot, CODEOWNERS, Prisma, NestJS, Vue 3, Vitest/Jest, Playwright, OpenAPI, ADR markdown docs, optional Sentry/OpenTelemetry/Lighthouse/Storybook.

---

## File Structure

- `docs/superpowers/specs/2026-06-06-engineering-governance-roadmap-design.md`: source design for the four-stage roadmap.
- `docs/superpowers/plans/2026-06-06-engineering-governance-roadmap.md`: this execution queue.
- `CONTRIBUTING.md`: collaboration guide; later tasks may add links to design/plan/ADR workflow.
- `.github/pull_request_template.md`: later tasks may require design/plan/ADR links for risky changes.
- `.github/CODEOWNERS`: ownership map; later tasks may refine module ownership.
- `.github/dependabot.yml`: dependency update cadence and grouping; later tasks may tune grouping.
- `.github/workflows/ci.yml`: quality gates; Phase 2/3 tasks may extend jobs.
- `docs/adr/`: future ADR directory and templates.
- `docs/release/`: optional future release checklist/changelog notes.
- `apps/server/src/**`: later observability, graceful shutdown, health, contract, and audit work.
- `apps/web-admin/src/**`: later E2E, import boundary, feature flag, and Storybook candidates.
- `apps/web-user/src/**`: later E2E, performance, feature flag, and frontend request correlation candidates.
- `packages/*`: shared contracts and tooling boundaries.

No business implementation should be changed while executing Phase 1 documentation/checklist tasks.

---

### Task 1: Record Phase 1 baseline and platform checklist

**Files:**
- Modify: `CONTRIBUTING.md`
- Modify: `.github/pull_request_template.md`
- Create: `docs/superpowers/plans/2026-06-06-phase-1-governance-checklist.md`

- [ ] **Step 1: Add design/plan references to CONTRIBUTING**

In `CONTRIBUTING.md`, after section `## 5. PR 流程`, add:

```markdown
复杂改动建议先关联设计书和计划书：

- 设计书：`docs/superpowers/specs/*.md`
- 计划书：`docs/superpowers/plans/*.md`
- ADR：重大架构决策后续放入 `docs/adr/`

满足任一条件时，PR 描述应附设计书或计划书链接：

- 涉及数据库 migration、权限、支付、认证、租户隔离或日志审计。
- 改动跨越两个以上 app/package。
- 引入新的工程化工具、CI job、部署配置或外部服务。
- 改动 API 契约或前后端共享类型。
```

- [ ] **Step 2: Add governance links to PR template**

In `.github/pull_request_template.md`, after `## Why`, add:

```markdown
## Design / Plan

- Design:
- Plan:
- ADR:
```

Keep fields empty by default so small PRs are not blocked.

- [ ] **Step 3: Create platform checklist**

Create `docs/superpowers/plans/2026-06-06-phase-1-governance-checklist.md`:

```markdown
# Phase 1 Governance Checklist

## Repository Files

- [ ] `docker-compose.yml` starts PostgreSQL and Redis with health checks.
- [ ] `apps/server/.env.example` matches `apps/server/src/config/env.schema.ts`.
- [ ] `CONTRIBUTING.md` documents setup, branch strategy, commit rules, PR flow, API drift, database changes, and review focus.
- [ ] `.github/CODEOWNERS` maps ownership for root, apps, packages, and CI.
- [ ] `.github/pull_request_template.md` asks for summary, why, verification, risk, and design/plan links.
- [ ] `.github/ISSUE_TEMPLATE/bug_report.md` captures reproducible bugs.
- [ ] `.github/ISSUE_TEMPLATE/feature_request.md` captures background, goals, acceptance, and impact.
- [ ] `.github/dependabot.yml` covers npm and GitHub Actions.
- [ ] `pnpm-workspace.yaml` uses `catalog:` for shared dependency versions.

## GitHub Platform Settings

- [ ] Protect `main`.
- [ ] Require pull request before merging.
- [ ] Require at least one approving review.
- [ ] Require status checks: `commitlint`, `lint`, `build-and-test`, `coverage`, `security-audit`, `api-drift`.
- [ ] Disallow force pushes to `main`.
- [ ] Require branches to be up to date before merge if the team wants linear CI evidence.

## Local Verification

```bash
docker compose config
pnpm install --frozen-lockfile
pnpm lint
pnpm type-check
pnpm test
pnpm build
```
```

- [ ] **Step 4: Verify documentation diff**

Run:

```bash
git diff -- CONTRIBUTING.md .github/pull_request_template.md docs/superpowers/plans/2026-06-06-phase-1-governance-checklist.md
```

Expected: only collaboration documentation and checklist changes.

- [ ] **Step 5: Commit Phase 1 governance docs**

```bash
git add CONTRIBUTING.md .github/pull_request_template.md docs/superpowers/plans/2026-06-06-phase-1-governance-checklist.md
git commit -m "docs: document phase 1 governance checklist"
```

---

### Task 2: Complete Phase 2B requestId and structured logging

**Files:**
- Use existing spec: `docs/superpowers/specs/2026-06-06-request-id-structured-logging-design.md`
- Use existing plan: `docs/superpowers/plans/2026-06-06-request-id-structured-logging.md`

- [ ] **Step 1: Re-read existing requestId design and plan**

Run:

```bash
git diff -- docs/superpowers/specs/2026-06-06-request-id-structured-logging-design.md docs/superpowers/plans/2026-06-06-request-id-structured-logging.md
```

Expected: understand whether these files have uncommitted changes before editing implementation files.

- [ ] **Step 2: Execute the requestId plan task-by-task**

Follow `docs/superpowers/plans/2026-06-06-request-id-structured-logging.md`.

Expected implementation scope:

- `apps/server/src/common/middleware/request-id.middleware.ts`
- `apps/server/src/common/middleware/request-id.middleware.spec.ts`
- `apps/server/src/main.ts`
- `apps/server/src/common/interceptors/logging.interceptor.ts`
- `apps/server/src/common/interceptors/logging.interceptor.spec.ts`

- [ ] **Step 3: Verify requestId behavior**

Run:

```bash
pnpm --filter vue3-elm-node run test -- request-id.middleware.spec.ts
pnpm --filter vue3-elm-node run test -- logging.interceptor.spec.ts
pnpm --filter vue3-elm-node run build
```

Expected: middleware and logging tests pass; server builds.

- [ ] **Step 4: Commit requestId work**

```bash
git add apps/server/src/common/middleware apps/server/src/main.ts apps/server/src/common/interceptors/logging.interceptor.ts apps/server/src/common/interceptors/logging.interceptor.spec.ts
git commit -m "feat(server): add request id logging"
```

---

### Task 3: Add Phase 2C quality thresholds and E2E smoke design

**Files:**
- Create: `docs/superpowers/specs/2026-06-06-quality-gate-phase-2c-design.md`
- Create: `docs/superpowers/plans/2026-06-06-quality-gate-phase-2c.md`

- [ ] **Step 1: Write Phase 2C design**

Create `docs/superpowers/specs/2026-06-06-quality-gate-phase-2c-design.md` with:

```markdown
# Phase 2C: 阈值化质量门禁与 E2E Smoke 设计

## Context

Phase 2A 已提供 coverage 报告和非阻塞安全审计，Phase 2B 提供 requestId 日志关联。下一步要把“能看到问题”推进为“关键问题能阻塞 PR”，但仍要避免一次性高压门禁。

## Goals

- 为 server/admin/user 设置低起点 coverage threshold。
- 引入 Playwright smoke E2E，覆盖登录页、用户端首页、管理端基础路由加载。
- 将 `pnpm audit` 升级为 high/critical 阻塞，medium/low 只报告。
- 为 bundle size 提供报告入口，暂不阻塞。

## Non-goals

- 不追求高覆盖率。
- 不覆盖完整下单/支付链路。
- 不引入云端浏览器矩阵。
- 不在本阶段接 Sentry 或 OpenTelemetry。

## Design

1. Coverage threshold 从当前基线附近开始，目标是防止继续下降。
2. Playwright 只做 smoke，优先验证应用能启动、关键页面不白屏、登录入口可见。
3. 安全审计只阻塞 high/critical，避免历史 medium/low 问题阻塞协作。
4. Bundle size 先输出报告，积累基线后再设置预算。

## Verification

```bash
pnpm test:cov
pnpm exec playwright test
pnpm audit --audit-level high
pnpm build
```
```

- [ ] **Step 2: Write Phase 2C implementation plan**

Create `docs/superpowers/plans/2026-06-06-quality-gate-phase-2c.md` with tasks for:

```markdown
# Quality Gate Phase 2C Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add low-threshold coverage gates, Playwright smoke E2E, high/critical audit blocking, and bundle size reporting.

**Architecture:** Start from report-only Phase 2A outputs, capture baselines, then enable narrow blocking rules for only high-signal checks.

**Tech Stack:** Vitest, Jest, Playwright, pnpm, GitHub Actions, Vite bundle analysis.

---

## Task Outline

- [ ] Capture current coverage baseline for server/admin/user.
- [ ] Configure minimal coverage thresholds near baseline.
- [ ] Add Playwright dependency and workspace script.
- [ ] Add smoke specs for admin login, user home, and backend health/API docs.
- [ ] Update CI with E2E smoke job.
- [ ] Change security audit command to high/critical blocking.
- [ ] Add bundle report script without blocking threshold.
- [ ] Run `pnpm test:cov`, `pnpm exec playwright test`, `pnpm audit --audit-level high`, and `pnpm build`.
```

- [ ] **Step 3: Review scope before implementation**

Expected decision: do not implement Phase 2C until the user approves this new design and plan.

- [ ] **Step 4: Commit Phase 2C docs**

```bash
git add docs/superpowers/specs/2026-06-06-quality-gate-phase-2c-design.md docs/superpowers/plans/2026-06-06-quality-gate-phase-2c.md
git commit -m "docs: plan phase 2c quality gates"
```

---

### Task 4: Add Phase 3 architecture governance design

**Files:**
- Create: `docs/superpowers/specs/2026-06-06-architecture-governance-design.md`
- Create: `docs/superpowers/plans/2026-06-06-architecture-governance.md`
- Create: `docs/adr/0000-template.md`

- [ ] **Step 1: Create ADR template**

Create `docs/adr/0000-template.md`:

```markdown
# ADR-0000: Title

## Status

Proposed

## Context

Describe the forces, constraints, and problem.

## Decision

Describe the chosen decision.

## Consequences

Describe tradeoffs, follow-up work, and migration impact.
```

- [ ] **Step 2: Write Phase 3 design**

Create `docs/superpowers/specs/2026-06-06-architecture-governance-design.md` covering:

```markdown
# Phase 3: 架构治理与发布能力设计

## Goals

- ADR 记录重大决策。
- API breaking change 有版本策略。
- 契约测试补充现有 API drift。
- Feature Flags 支持灰度和快速回滚。
- 数据库 migration 有 checklist。
- Changelog 自动生成 release notes。
- Import 边界约束 FSD 和 shared packages。

## Non-goals

- 不一次性引入复杂发布平台。
- 不重写现有路由/API/数据库层。
- 不要求所有历史模块立刻满足 import boundary。

## Design

从文档治理开始，再接入自动化检查。先在 web-admin 和 packages 试点 import boundary，再逐步扩展。Feature Flags 先采用配置驱动，不引入外部平台。
```

- [ ] **Step 3: Write Phase 3 implementation plan**

Create `docs/superpowers/plans/2026-06-06-architecture-governance.md` with task groups:

```markdown
# Architecture Governance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add lightweight architecture governance: ADRs, API compatibility rules, contract tests, feature flag conventions, migration checklist, changelog automation, and import boundaries.

**Architecture:** Use documentation and narrow CI checks first. Avoid platform-level release tooling until the team has stable conventions.

**Tech Stack:** Markdown ADRs, GitHub Actions, OpenAPI/api-types, Vitest/Jest contract tests, Prisma migrations, Conventional Commits, ESLint import boundary tooling.

---

## Task Outline

- [ ] Add ADR template and CONTRIBUTING link.
- [ ] Define API breaking change policy.
- [ ] Add migration checklist to PR template.
- [ ] Add contract tests around generated API types and critical DTOs.
- [ ] Introduce feature flag naming and config conventions.
- [ ] Add changelog generation script.
- [ ] Trial import boundary rules in web-admin.
- [ ] Expand import boundary rules only after baseline warnings are understood.
```

- [ ] **Step 4: Commit Phase 3 docs**

```bash
git add docs/adr/0000-template.md docs/superpowers/specs/2026-06-06-architecture-governance-design.md docs/superpowers/plans/2026-06-06-architecture-governance.md
git commit -m "docs: plan architecture governance"
```

---

### Task 5: Keep Phase 4 as scale-triggered backlog

**Files:**
- Create: `docs/superpowers/specs/2026-06-06-scale-observability-backlog-design.md`
- Create: `docs/superpowers/plans/2026-06-06-scale-observability-backlog.md`

- [ ] **Step 1: Write Phase 4 design**

Create `docs/superpowers/specs/2026-06-06-scale-observability-backlog-design.md`:

```markdown
# Phase 4: 规模化与深度可观测 Backlog 设计

## Context

Phase 4 面向中大型团队、真实生产部署、多服务协作和合规要求。当前项目不应为了“看起来企业级”而提前引入重平台。

## Scale Triggers

- 多个后端服务或异步任务导致 requestId 不足以排障。
- 需要按环境、租户或人群动态调整配置。
- 前端性能成为 PR review 的常态风险。
- 共享组件数量增长，需要设计/产品参与组件 review。
- 生产密钥数量和轮换要求超过普通环境变量管理能力。
- RBAC 审计需要满足合规或客户审计要求。

## Candidate Capabilities

- OpenTelemetry traceId.
- 配置中心.
- Lighthouse CI.
- Storybook.
- Secrets 管理.
- RBAC 不可篡改审计日志.
```

- [ ] **Step 2: Write Phase 4 backlog plan**

Create `docs/superpowers/plans/2026-06-06-scale-observability-backlog.md`:

```markdown
# Scale Observability Backlog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve Phase 4 as a scale-triggered backlog instead of immediate implementation work.

**Architecture:** Each Phase 4 capability requires a separate design, proof of need, owner, and rollback plan before implementation.

**Tech Stack:** OpenTelemetry, Sentry, Lighthouse CI, Storybook, Vault or platform secret manager, append-only audit storage.

---

## Entry Criteria

- [ ] A concrete incident, team-size pressure, compliance requirement, or performance regression justifies the capability.
- [ ] Existing Phase 1-3 controls are already in use.
- [ ] A named owner can maintain the new tool after merge.
- [ ] A rollback/removal path exists.

## Candidate Backlog

- [ ] OpenTelemetry design after requestId logging is stable.
- [ ] Configuration center design after feature flag conventions are stable.
- [ ] Lighthouse CI design after bundle reporting has a baseline.
- [ ] Storybook design after shared component ownership is clear.
- [ ] Secrets manager design with deployment platform details.
- [ ] RBAC audit hardening design after current audit query needs are known.
```

- [ ] **Step 3: Commit Phase 4 backlog docs**

```bash
git add docs/superpowers/specs/2026-06-06-scale-observability-backlog-design.md docs/superpowers/plans/2026-06-06-scale-observability-backlog.md
git commit -m "docs: capture scale observability backlog"
```

---

### Task 6: Final roadmap verification

**Files:**
- All docs changed in this roadmap.

- [ ] **Step 1: Search for unresolved markers**

Run:

```bash
rg -n "TB[D]|TO[D]O|待[补]|以后[再]说|fill[ ]in|place[ -]?holder" docs/superpowers/specs docs/superpowers/plans docs/adr CONTRIBUTING.md .github/pull_request_template.md
```

Expected: no unresolved marker strings in newly created files. Existing unrelated matches, if any, should be reviewed and left untouched unless part of this roadmap.

- [ ] **Step 2: Verify roadmap links**

Run:

```bash
rg -n "engineering-governance-roadmap|Phase 1|Phase 2|Phase 3|Phase 4|ADR|Design / Plan" docs/superpowers CONTRIBUTING.md .github/pull_request_template.md
```

Expected: roadmap docs and collaboration docs reference the same flow.

- [ ] **Step 3: Inspect final diff**

Run:

```bash
git diff -- docs/superpowers/specs docs/superpowers/plans docs/adr CONTRIBUTING.md .github/pull_request_template.md
```

Expected: changes are documentation/governance only unless a later task explicitly implemented code.

- [ ] **Step 4: Run lightweight docs-safe verification**

Run:

```bash
pnpm --version
git status --short
```

Expected: pnpm is available; git status shows only intended docs/governance changes plus any unrelated pre-existing worktree changes.

- [ ] **Step 5: Commit final docs if not already committed task-by-task**

```bash
git add docs/superpowers/specs docs/superpowers/plans docs/adr CONTRIBUTING.md .github/pull_request_template.md
git commit -m "docs: add engineering governance roadmap"
```

---

## Self-Review

Spec coverage:
- Phase 1 infrastructure and collaboration: Task 1.
- Phase 2 quality gates and observability: Tasks 2 and 3.
- Phase 3 architecture governance and release capability: Task 4.
- Phase 4 scale/deep observability backlog: Task 5.
- Final verification and unresolved-marker scan: Task 6.

Unresolved-marker scan:
- This plan intentionally includes future file contents for follow-up docs.
- No unresolved marker strings are used.

Type consistency:
- Phase names match the design document.
- Existing Phase 2A and Phase 2B documents are reused instead of duplicated.
- Platform-only settings, such as branch protection and secrets management, are listed as checklist/configuration work rather than repository-only implementation.
