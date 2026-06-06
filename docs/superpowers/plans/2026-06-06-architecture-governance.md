# Architecture Governance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add lightweight architecture governance: ADRs, API compatibility rules, contract tests, feature flag conventions, migration checklist, changelog automation, and import boundaries.

**Architecture:** Start with documentation and narrow CI checks. Use existing API drift, Conventional Commits, and FSD-like frontend structure as foundations; avoid platform-level release tooling until the team has stable conventions.

**Tech Stack:** Markdown ADRs, GitHub Actions, OpenAPI/api-types, Jest/Vitest contract tests, Prisma migrations, Conventional Commits, ESLint boundary tooling.

---

## File Structure

- `docs/adr/0000-template.md`: ADR template.
- `CONTRIBUTING.md`: links ADR/API/migration governance rules.
- `.github/pull_request_template.md`: expands migration/API/feature flag review fields if needed.
- `docs/api/versioning.md`: future API compatibility policy.
- `docs/database/migration-checklist.md`: future Prisma migration checklist.
- `docs/release/changelog.md`: future changelog generation workflow.
- `apps/server/src/**/*.spec.ts`: backend contract tests.
- `apps/web-admin/src/**/*.test.ts`: admin contract/import-boundary tests.
- `apps/web-user/src/**/*.test.{js,ts}`: user contract tests.
- `eslint.config.mjs`: future import boundary rules.

---

### Task 1: Link ADR and governance rules in collaboration docs

**Files:**
- Modify: `CONTRIBUTING.md`
- Modify: `.github/pull_request_template.md`
- Existing: `docs/adr/0000-template.md`

- [ ] **Step 1: Add ADR usage rules**

In `CONTRIBUTING.md`, add a short section explaining when ADR is required:

```markdown
## 架构决策记录

重大架构、工具链、部署、认证、租户隔离、API 版本、数据库迁移和可观测性决策需要新增 ADR。
ADR 模板位于 `docs/adr/0000-template.md`。
```

- [ ] **Step 2: Extend PR risk checklist if needed**

Ensure `.github/pull_request_template.md` includes fields for:

```markdown
- [ ] 是否涉及 Feature Flag？如有，请说明默认值、灰度范围和清理计划
- [ ] 是否涉及 ADR？如有，请附链接
```

- [ ] **Step 3: Commit docs**

```bash
git add CONTRIBUTING.md .github/pull_request_template.md docs/adr/0000-template.md
git commit -m "docs: add adr governance workflow"
```

---

### Task 2: Define API compatibility policy

**Files:**
- Create: `docs/api/versioning.md`
- Modify: `.github/pull_request_template.md`

- [ ] **Step 1: Create API policy**

Create `docs/api/versioning.md` with:

```markdown
# API Versioning and Compatibility

## Breaking Changes

- Removing a field.
- Renaming a field.
- Changing field meaning.
- Changing enum values.
- Changing error response shape.
- Changing authentication or permission requirements.

## Required Actions

- Update Swagger decorators and DTOs.
- Run `pnpm api:generate`.
- Commit generated API types.
- Document migration notes in the PR.
```

- [ ] **Step 2: Add PR checklist item**

In `.github/pull_request_template.md`, ensure API breaking changes require migration notes and regenerated API types.

- [ ] **Step 3: Verify API drift still works**

Run:

```bash
pnpm api:generate
git diff -- packages/api-types
```

Expected: generated files are either unchanged or intentionally updated by the API change.

- [ ] **Step 4: Commit API policy**

```bash
git add docs/api/versioning.md .github/pull_request_template.md packages/api-types
git commit -m "docs: define api compatibility policy"
```

---

### Task 3: Add migration checklist

**Files:**
- Create: `docs/database/migration-checklist.md`
- Modify: `.github/pull_request_template.md`

- [ ] **Step 1: Create migration checklist**

Create `docs/database/migration-checklist.md`:

```markdown
# Database Migration Checklist

- [ ] Does this migration lock a large table?
- [ ] Is the migration backward compatible with the currently deployed application?
- [ ] Is a data backfill required?
- [ ] Is a rollback possible?
- [ ] Are seed data and tests updated?
- [ ] Are indexes created safely?
```

- [ ] **Step 2: Link checklist from PR template**

In `.github/pull_request_template.md`, link `docs/database/migration-checklist.md` from the database migration risk item.

- [ ] **Step 3: Commit migration docs**

```bash
git add docs/database/migration-checklist.md .github/pull_request_template.md
git commit -m "docs: add database migration checklist"
```

---

### Task 4: Add targeted contract tests

**Files:**
- Modify or create focused backend/frontend tests after selecting one critical API.

- [ ] **Step 1: Select one critical contract**

Start with an existing high-value API such as login, order detail, tenant transition, or payment resume. Avoid broad contract coverage in the first PR.

- [ ] **Step 2: Add backend contract test**

Add a Jest test that asserts DTO validation and response shape for the selected API.

- [ ] **Step 3: Add frontend contract usage test**

Add a Vitest/Jest test in the consumer app verifying the API adapter expects the same shape.

- [ ] **Step 4: Run focused tests**

Run the exact tests added or modified.

- [ ] **Step 5: Commit contract tests**

```bash
git add apps/server apps/web-admin apps/web-user packages
git commit -m "test: add focused api contract tests"
```

---

### Task 5: Establish Feature Flag conventions

**Files:**
- Create: `docs/release/feature-flags.md`
- Modify: `.github/pull_request_template.md`

- [ ] **Step 1: Create feature flag convention**

Create `docs/release/feature-flags.md`:

```markdown
# Feature Flag Conventions

## Naming

Use `domain.feature.variant`, for example `order.refundApproval.enabled`.

## Defaults

Defaults must be conservative and documented.

## PR Requirements

- Default value.
- Rollout scope.
- Rollback path.
- Cleanup condition.
```

- [ ] **Step 2: Link from PR template**

Add a risk checklist item requiring rollout and cleanup notes for Feature Flags.

- [ ] **Step 3: Commit feature flag docs**

```bash
git add docs/release/feature-flags.md .github/pull_request_template.md
git commit -m "docs: define feature flag conventions"
```

---

### Task 6: Add changelog generation workflow

**Files:**
- Modify: `package.json`
- Create: `docs/release/changelog.md`

- [ ] **Step 1: Choose changelog tool**

Prefer a low-maintenance Conventional Commits tool that can run locally and in CI. Document the selected command before adding release automation.

- [ ] **Step 2: Add changelog docs**

Create `docs/release/changelog.md` with the chosen command and release notes workflow.

- [ ] **Step 3: Verify command**

Run the changelog command locally.

- [ ] **Step 4: Commit changelog workflow**

```bash
git add package.json pnpm-lock.yaml docs/release/changelog.md
git commit -m "docs: add changelog workflow"
```

---

### Task 7: Trial import boundary rules

**Files:**
- Modify: `eslint.config.mjs`
- Potentially modify: `apps/web-admin/src/**` only if new rules expose small, safe fixes.

- [ ] **Step 1: Inspect current imports**

Run:

```bash
rg "@/entities|@/features|@/pages|@/widgets|@/shared" apps/web-admin/src -n
```

Expected: understand current dependency direction before adding rules.

- [ ] **Step 2: Add report-only or narrow boundary rule**

Start with web-admin and the least noisy boundary. Prefer warning/report mode or a single high-confidence forbidden direction.

- [ ] **Step 3: Run ESLint**

Run:

```bash
pnpm --filter elm-web-admin run lint
```

Expected: either pass or show a small, intentional set of violations to fix in the same PR.

- [ ] **Step 4: Commit boundary rule**

```bash
git add eslint.config.mjs apps/web-admin/src
git commit -m "lint: trial admin import boundaries"
```

---

## Self-Review

Spec coverage:
- ADR: Task 1.
- API version strategy: Task 2.
- Contract tests: Task 4.
- Feature Flags: Task 5.
- Database migration rules: Task 3.
- Changelog generation: Task 6.
- Import boundaries: Task 7.

Unresolved-marker scan:
- Each task has concrete files and verification commands.
- Contract tests intentionally require selecting one critical API during implementation to keep scope narrow.

Type consistency:
- Documentation paths use `docs/adr`, `docs/api`, `docs/database`, and `docs/release`.
- Import boundary trial starts with `apps/web-admin` to match existing FSD-like structure.
