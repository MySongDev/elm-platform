# Monorepo Maturity Batch 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the first low-risk Monorepo maturity batch: canonical root commands, CI command reuse, Monorepo engineering documentation, and a non-blocking boundary report command.

**Architecture:** Keep the existing pnpm workspace and app/package layout unchanged. Add root-level scripts as the canonical orchestration layer, update GitHub Actions to call those scripts instead of duplicating command chains, and document package roles and boundaries without introducing disruptive enforcement.

**Tech Stack:** pnpm workspace, GitHub Actions, ESLint, Stylelint, Markdown documentation.

---

## File Structure

- Modify: `package.json`
  - Adds canonical root scripts for package builds, app builds, CI workflows, and boundary reporting.
  - Preserves existing `build` behavior by making it delegate to `build:apps`.
- Modify: `.github/workflows/ci.yml`
  - Replaces repeated inline shared-package build commands with `pnpm build:packages`.
  - Replaces suitable duplicated CI command chains with `pnpm ci:*` root scripts.
  - Keeps existing CI jobs, services, and API drift behavior.
- Create: `docs/engineering/monorepo.md`
  - Documents workspace layout, shared package responsibilities, canonical commands, build order, dependency rules, CI rules, and boundary rollout.
- Optionally modify: `CONTRIBUTING.md`
  - Add a short pointer to canonical Monorepo commands only if the file exists and already has command/contribution guidance.

---

### Task 1: Add canonical Monorepo scripts

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Inspect existing root scripts**

Run:

```bash
node -e "const p=require('./package.json'); console.log(JSON.stringify(p.scripts,null,2))"
```

Expected: prints the current root scripts, including `dev`, `build`, `test`, `type-check`, `api:generate`, `lint`, and `lint:style`.

- [ ] **Step 2: Update `package.json` scripts**

Modify the `scripts` object so these entries exist exactly. Keep unrelated existing scripts unchanged.

```json
{
  "dev": "pnpm --filter @elm-platform/server --filter @elm-platform/web-admin --filter @elm-platform/web-user --parallel run dev",
  "dev:server": "pnpm --filter @elm-platform/server run start:dev",
  "dev:admin": "pnpm --filter @elm-platform/web-admin run dev",
  "dev:user": "pnpm --filter @elm-platform/web-user run dev",
  "build": "pnpm build:apps",
  "build:packages": "pnpm --filter @elm-platform/contracts --filter @elm-platform/vite-config run build",
  "build:apps": "pnpm --filter @elm-platform/server --filter @elm-platform/web-admin --filter @elm-platform/web-user run build",
  "build:all": "pnpm build:packages && pnpm build:apps",
  "build:server": "pnpm --filter @elm-platform/server run build",
  "build:admin": "pnpm --filter @elm-platform/web-admin run build",
  "build:user": "pnpm --filter @elm-platform/web-user run build",
  "bundle:report": "pnpm build:admin && pnpm build:user && node scripts/report-bundle-size.mjs",
  "changelog:preview": "conventional-changelog -p conventionalcommits --stdout --output-unreleased",
  "changelog:update": "conventional-changelog -p conventionalcommits -i CHANGELOG.md -o CHANGELOG.md",
  "lint": "eslint . --fix --cache",
  "lint:style": "stylelint \"apps/{web-admin,web-user}/src/**/*.{vue,scss,css}\" --fix --config stylelint.config.mjs",
  "lint:boundaries": "eslint apps/web-admin/src --cache",
  "lint:all": "pnpm lint && pnpm lint:style",
  "test": "pnpm --filter @elm-platform/server run test && pnpm --filter @elm-platform/web-admin run test:unit && pnpm --filter @elm-platform/web-user run test",
  "test:cov": "pnpm --filter @elm-platform/server run test:cov && pnpm --filter @elm-platform/web-admin run test:coverage && pnpm --filter @elm-platform/web-user run test:coverage",
  "test:e2e": "pnpm --filter @elm-platform/server run prisma:generate && node scripts/run-playwright-e2e.mjs",
  "type-check": "pnpm --filter @elm-platform/web-admin run type-check && pnpm --filter @elm-platform/web-user run type-check",
  "api:generate": "pnpm --filter @elm-platform/api-types run generate",
  "ci:lint": "pnpm lint && pnpm lint:style",
  "ci:type-check": "pnpm type-check",
  "ci:test": "pnpm test",
  "ci:build": "pnpm build:all",
  "ci:coverage": "pnpm test:cov",
  "ci:api-drift": "pnpm api:generate",
  "clean": "pnpm -r exec rm -rf node_modules dist .turbo",
  "prepare": "husky"
}
```

Important details:

- Do not remove existing `build:server`, `build:admin`, or `build:user` scripts.
- Keep `build` compatible by delegating to `build:apps`, not `build:all`.
- Keep `lint:all` for local compatibility, even though CI will use `ci:lint`.
- Do not add Turborepo in this batch.

- [ ] **Step 3: Verify script names parse**

Run:

```bash
node -e "const p=require('./package.json'); for (const k of ['build:packages','build:apps','build:all','ci:lint','ci:type-check','ci:test','ci:build','ci:coverage','ci:api-drift','lint:boundaries']) if (!p.scripts[k]) throw new Error(k); console.log('scripts ok')"
```

Expected:

```text
scripts ok
```

- [ ] **Step 4: Run the smallest functional script check**

Run:

```bash
pnpm build:packages
```

Expected: `@elm-platform/contracts` and `@elm-platform/vite-config` build successfully.

- [ ] **Step 5: Commit this task**

```bash
git add package.json
git commit -m "chore: add monorepo canonical scripts"
```

Do not add AI co-author metadata.

---

### Task 2: Update CI to reuse canonical root commands

**Files:**
- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1: Replace lint job command chain**

In `.github/workflows/ci.yml`, replace the two lint steps:

```yaml
      - name: ESLint
        run: pnpm lint

      - name: Stylelint
        run: pnpm lint:style
```

with one canonical step:

```yaml
      - name: Lint workspace
        run: pnpm ci:lint
```

Expected: lint behavior remains equivalent to `pnpm lint && pnpm lint:style`.

- [ ] **Step 2: Replace repeated shared-package build commands**

Replace every occurrence of this command:

```yaml
run: pnpm --filter @elm-platform/contracts run build && pnpm --filter @elm-platform/vite-config run build
```

with:

```yaml
run: pnpm build:packages
```

When updating the step name, use:

```yaml
      - name: Build workspace packages
        run: pnpm build:packages
```

Expected affected jobs include:

- `build-and-test`
- `coverage`
- `e2e-smoke`
- `api-drift`

- [ ] **Step 3: Replace type-check steps in `build-and-test`**

Replace:

```yaml
      - name: Type check admin
        run: pnpm --filter @elm-platform/web-admin run type-check

      - name: Type check user
        run: pnpm --filter @elm-platform/web-user run type-check
```

with:

```yaml
      - name: Type check workspace
        run: pnpm ci:type-check
```

Expected: behavior remains equivalent to the existing root `pnpm type-check` command.

- [ ] **Step 4: Replace coverage command**

Replace:

```yaml
      - name: Generate coverage reports
        run: pnpm test:cov
```

with:

```yaml
      - name: Generate coverage reports
        run: pnpm ci:coverage
```

Expected: coverage job still runs server, admin, and user coverage scripts.

- [ ] **Step 5: Replace API generation command in api-drift job**

Replace:

```yaml
      - name: Generate API types
        run: pnpm api:generate
```

with:

```yaml
      - name: Generate API types
        run: pnpm ci:api-drift
```

Expected: generated API type behavior remains unchanged; the following `git diff` drift check remains in YAML.

- [ ] **Step 6: Decide build granularity and update build steps**

Use the lower-risk CI log preserving option in this first batch: keep separate app build steps, but ensure `Build workspace packages` runs before them.

Leave these existing steps unchanged:

```yaml
      - name: Build server
        run: pnpm --filter @elm-platform/server run build

      - name: Build admin
        run: pnpm --filter @elm-platform/web-admin run build

      - name: Build user
        run: pnpm --filter @elm-platform/web-user run build
```

Do not replace them with `pnpm ci:build` yet. This preserves granular CI logs while still removing duplicated package build logic.

- [ ] **Step 7: Validate workflow still contains no duplicated shared build chain**

Run:

```bash
node -e "const fs=require('fs'); const s=fs.readFileSync('.github/workflows/ci.yml','utf8'); const old='pnpm --filter @elm-platform/contracts run build && pnpm --filter @elm-platform/vite-config run build'; if (s.includes(old)) throw new Error('old shared build chain still present'); console.log('ci shared build cleanup ok')"
```

Expected:

```text
ci shared build cleanup ok
```

- [ ] **Step 8: Commit this task**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: reuse monorepo root commands"
```

Do not add AI co-author metadata.

---

### Task 3: Add Monorepo engineering documentation

**Files:**
- Create: `docs/engineering/monorepo.md`

- [ ] **Step 1: Create the engineering docs directory if missing**

Run:

```bash
mkdir -p docs/engineering
```

Expected: `docs/engineering` exists.

- [ ] **Step 2: Write `docs/engineering/monorepo.md`**

Create the file with this content:

```markdown
# Monorepo Engineering Guide

## Purpose

This repository is a pnpm workspace Monorepo for the Elm Platform. The goal of this guide is to make package roles, command entrypoints, build order, and dependency boundaries explicit so local development and CI use the same workflow.

## Workspace layout

```text
apps/
  server      NestJS backend with Prisma, Redis, JWT/Passport, Swagger
  web-admin   Vue 3 admin dashboard with Element Plus, Pinia, Vue Router, Vite
  web-user    Vue 3 mobile app with Vant, Pinia, Vue Router, Vite, Vitest
packages/
  contracts   Shared business contracts, constants, and domain types
  api-types   Generated OpenAPI TypeScript declarations
  tsconfig    Shared TypeScript configuration files
  vite-config Shared Vite helper utilities for web apps
```

The workspace membership is defined in `pnpm-workspace.yaml`. New apps should live under `apps/*`; reusable packages should live under `packages/*`.

## Shared package responsibilities

### `@elm-platform/contracts`

Use this package for runtime-safe shared domain contracts, constants, enums, and types that are consumed by more than one app. It is currently consumed by the backend and admin app.

Do not put framework-specific NestJS, Vue, Element Plus, Vant, or database implementation code here.

### `@elm-platform/api-types`

Use this package for generated OpenAPI TypeScript declarations. Update it through:

```bash
pnpm api:generate
```

Do not manually duplicate generated API response types inside apps when the generated type can be reused.

### `@elm-platform/tsconfig`

Use this package for shared TypeScript compiler settings. New TypeScript packages should extend one of these files instead of copying compiler options.

### `@elm-platform/vite-config`

Use this package for shared Vite configuration helpers such as source aliases, API proxy configuration, SCSS options, and SVG icon setup.

Web apps should import these helpers instead of duplicating equivalent Vite configuration.

## Canonical commands

Use root commands for common workflows.

| Command | Purpose |
|---|---|
| `pnpm dev` | Run server, admin, and user apps in parallel. |
| `pnpm build:packages` | Build buildable shared packages. |
| `pnpm build:apps` | Build server, admin, and user apps. |
| `pnpm build:all` | Build shared packages first, then apps. |
| `pnpm build` | Compatibility entrypoint for app builds. |
| `pnpm ci:lint` | Run ESLint and Stylelint for CI. |
| `pnpm ci:type-check` | Run workspace type checks. |
| `pnpm ci:test` | Run workspace tests. |
| `pnpm ci:build` | Run full Monorepo build. |
| `pnpm ci:coverage` | Run coverage commands. |
| `pnpm ci:api-drift` | Generate API types for drift checks. |
| `pnpm lint:boundaries` | Report current web-admin import boundary warnings. |

CI should call canonical root commands where practical instead of duplicating long package-specific command chains in workflow YAML.

## Build order

Buildable shared packages must be built before apps that consume their `dist` exports.

Recommended full local check:

```bash
pnpm build:all
pnpm ci:type-check
pnpm ci:test
```

When API types may be stale, run:

```bash
pnpm ci:api-drift
```

Then inspect generated changes:

```bash
git diff -- packages/api-types
```

## Dependency rules

- Apps may depend on shared packages under `packages/*`.
- Shared packages must not depend on apps under `apps/*`.
- Apps must not depend on other apps.
- Internal dependencies should use `workspace:*`.
- External dependency versions should use `catalog:` when the dependency is already governed by `pnpm-workspace.yaml`.
- Shared packages should keep narrow responsibilities and avoid importing framework-specific code unless the package is explicitly framework-specific.

## Import boundary policy

`apps/web-admin` currently has FSD-style import boundary rules in `eslint.config.mjs`:

- `shared` must not import upper layers.
- `entities` may depend on `shared`, not on upper layers.
- `features` may depend on `entities` and `shared`, not on `pages`, `widgets`, or `app`.
- `widgets` may depend on `features`, `entities`, and `shared`, not on `pages` or `app`.

These rules are currently warnings. Use this command for focused reporting:

```bash
pnpm lint:boundaries
```

Do not turn historical warnings into blocking CI failures without a cleanup plan. The intended rollout is:

1. local/reporting command,
2. non-blocking CI visibility,
3. strict checks for changed files,
4. full strict enforcement after violations are resolved.

## Adding a new package

1. Create it under `packages/<name>`.
2. Give it a scoped package name such as `@elm-platform/<name>`.
3. Use `workspace:*` for internal dependencies.
4. Use `catalog:` for governed external dependencies.
5. Extend `@elm-platform/tsconfig` when using TypeScript.
6. Add a `build` script if the package exports files from `dist`.
7. Document the package responsibility in this guide if it becomes a shared platform package.
```

- [ ] **Step 3: Check markdown file exists**

Run:

```bash
node -e "const fs=require('fs'); const p='docs/engineering/monorepo.md'; if (!fs.existsSync(p)) throw new Error('missing monorepo doc'); console.log('monorepo doc ok')"
```

Expected:

```text
monorepo doc ok
```

- [ ] **Step 4: Commit this task**

```bash
git add docs/engineering/monorepo.md
git commit -m "docs: add monorepo engineering guide"
```

Do not add AI co-author metadata.

---

### Task 4: Optionally add CONTRIBUTING pointer

**Files:**
- Optional Modify: `CONTRIBUTING.md`

- [ ] **Step 1: Check whether `CONTRIBUTING.md` exists**

Run:

```bash
node -e "const fs=require('fs'); console.log(fs.existsSync('CONTRIBUTING.md') ? 'exists' : 'missing')"
```

Expected: prints either `exists` or `missing`.

- [ ] **Step 2: If missing, skip this task**

If the previous command prints `missing`, do not create `CONTRIBUTING.md` in this batch. Continue to Task 5.

- [ ] **Step 3: If it exists, add this short section near existing development/verification guidance**

```markdown
## Monorepo commands

Use root commands for common verification so local development and CI stay aligned:

- `pnpm ci:lint`
- `pnpm ci:type-check`
- `pnpm ci:test`
- `pnpm ci:build`
- `pnpm ci:api-drift`

See `docs/engineering/monorepo.md` for package roles, build order, and dependency boundary rules. Prefer adding reusable root scripts over duplicating long command chains directly in GitHub Actions.
```

- [ ] **Step 4: Commit this task if changed**

If `CONTRIBUTING.md` was modified:

```bash
git add CONTRIBUTING.md
git commit -m "docs: reference monorepo commands in contributing guide"
```

If it was not modified, do not commit.

Do not add AI co-author metadata.

---

### Task 5: Run verification for Batch 1

**Files:**
- No source edits expected.

- [ ] **Step 1: Verify package builds**

Run:

```bash
pnpm build:packages
```

Expected: build succeeds for `@elm-platform/contracts` and `@elm-platform/vite-config`.

- [ ] **Step 2: Verify app build command is still available**

Run:

```bash
pnpm build:apps
```

Expected: server, admin, and user app builds run in the same way the old root `build` script did.

- [ ] **Step 3: Verify full build command**

Run:

```bash
pnpm build:all
```

Expected: shared packages build first, then app builds run.

- [ ] **Step 4: Verify CI lint entrypoint**

Run:

```bash
pnpm ci:lint
```

Expected: same behavior as `pnpm lint && pnpm lint:style`.

- [ ] **Step 5: Verify type-check entrypoint**

Run:

```bash
pnpm ci:type-check
```

Expected: same behavior as `pnpm type-check`.

- [ ] **Step 6: Verify test entrypoint**

Run:

```bash
pnpm ci:test
```

Expected: same behavior as `pnpm test`.

- [ ] **Step 7: Verify boundary report command**

Run:

```bash
pnpm lint:boundaries
```

Expected: ESLint runs against `apps/web-admin/src`. Boundary warnings may appear; this command is reporting-focused and should not be promoted to strict CI in this batch.

- [ ] **Step 8: Verify API drift generation entrypoint**

Run:

```bash
pnpm ci:api-drift
```

Expected: same behavior as `pnpm api:generate`.

Then run:

```bash
git diff -- packages/api-types
```

Expected: no diff unless API types were already stale.

- [ ] **Step 9: Inspect final diff**

Run:

```bash
git diff -- package.json .github/workflows/ci.yml docs/engineering/monorepo.md CONTRIBUTING.md
```

Expected: diff only contains canonical scripts, CI command reuse, Monorepo documentation, and optional contributing guide pointer.

- [ ] **Step 10: Commit verification fixes if needed**

If any verification step required a fix, commit the fix with a focused message such as:

```bash
git add package.json .github/workflows/ci.yml docs/engineering/monorepo.md CONTRIBUTING.md
git commit -m "chore: fix monorepo batch one verification"
```

Do not add AI co-author metadata.

---

## Self-Review

- Spec coverage: Batch 1 covers root command canonicalization, shared package build order, CI duplicate-command cleanup, Monorepo documentation, and non-blocking boundary reporting.
- Placeholder scan: no placeholder tasks remain; every code or documentation addition includes exact content or exact replacement snippets.
- Type/name consistency: script names match across `package.json`, CI YAML, and documentation: `build:packages`, `build:apps`, `build:all`, `ci:lint`, `ci:type-check`, `ci:test`, `ci:build`, `ci:coverage`, `ci:api-drift`, and `lint:boundaries`.
