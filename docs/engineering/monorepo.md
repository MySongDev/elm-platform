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
| `pnpm ci:workspace` | Validate workspace package metadata. |
| `pnpm lint:boundaries` | Report current web-admin import boundary warnings. |
| `pnpm turbo:build` | Build through the Turborepo task graph with caching. |
| `pnpm turbo:type-check` | Type-check through the Turborepo task graph. |
| `pnpm turbo:test` | Run `test` and `test:unit` through the Turborepo task graph. |
| `pnpm turbo:lint` | Lint through the Turborepo task graph. |

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

## Task orchestration with Turborepo

`turbo.json` defines the task graph. Turborepo reads `workspace:*` dependencies to infer build order, so shared packages build before the apps that consume them without any hand-written ordering.

Pilot commands:

```bash
pnpm turbo:build
pnpm turbo:type-check
pnpm turbo:test
pnpm turbo:lint
```

Key task rules in `turbo.json`:

- `build` depends on `^build` (upstream package builds) and caches `dist/**`.
- `type-check`, `test`, and `test:unit` depend on `^build` so consumers always see fresh package output.
- `test:coverage` and `test:cov` cache `coverage/**`.
- `generate` and `dev` disable caching; `dev` is marked persistent.

Caching is local-only for now. A clean run builds every package; an unchanged re-run replays cached output and reports `FULL TURBO`. The cache directory `.turbo/` is gitignored.

These `turbo:*` scripts are a pilot that runs alongside the existing `pnpm build:all` and `pnpm ci:*` commands. The canonical `ci:*` entrypoints are not switched to Turborepo yet; that migration happens only after the pilot is confirmed stable.

## Affected-only tasks

Turborepo can restrict a task to only the packages affected by changes relative to a base branch. This avoids rebuilding or retesting the whole repo for a small change.

Pilot commands (default base is `main`):

```bash
pnpm turbo:affected:build
pnpm turbo:affected:test
pnpm turbo:affected:lint
```

`--affected` compares the working branch against `main` and selects changed packages plus everything that depends on them, using the same task graph as the full commands. Because it reuses the dependency graph, a change to `@elm-platform/contracts` correctly re-includes `server` and `web-admin`.

In CI, the base ref can be overridden with the `TURBO_SCM_BASE` environment variable (for example the pull request base SHA), and the checkout must use sufficient git history (`fetch-depth: 0`) for the comparison to work.

This is a local pilot. It is not wired into the blocking CI jobs yet; the canonical CI commands still run the full workspace. Affected-only CI should be adopted only after the Turborepo pilot is confirmed stable, so that correctness is never traded away for speed prematurely.

## Dependency rules

- Apps may depend on shared packages under `packages/*`.
- Shared packages must not depend on apps under `apps/*`.
- Apps must not depend on other apps.
- Internal dependencies should use `workspace:*`.
- External dependency versions should use `catalog:` when the dependency is already governed by `pnpm-workspace.yaml`.
- Shared packages should keep narrow responsibilities and avoid importing framework-specific code unless the package is explicitly framework-specific.

## Workspace metadata validation

`scripts/validate-workspace.mjs` enforces the dependency rules above as an automated check. Run it locally with:

```bash
pnpm workspace:validate
```

CI runs the same check through `pnpm ci:workspace` in the lint job.

The validator fails when:

- a workspace package is missing a `name`, or two packages share the same `name`,
- an internal dependency uses a range other than `workspace:*`,
- a package under `packages/*` depends on an app under `apps/*`,
- an app depends on another app,
- a package exposes `dist` output through `main`, `module`, `types`, `exports`, or `files` but has no `build` script.

Generated packages such as `@elm-platform/api-types` expose `generated` instead of `dist`, so they are not required to declare a `build` script.

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

The full layer ordering, the current known-violations list, and the rollout plan are documented in `docs/architecture/import-boundaries.md`.

## Adding a new package

1. Create it under `packages/<name>`.
2. Give it a scoped package name such as `@elm-platform/<name>`.
3. Use `workspace:*` for internal dependencies.
4. Use `catalog:` for governed external dependencies.
5. Extend `@elm-platform/tsconfig` when using TypeScript.
6. Add a `build` script if the package exports files from `dist`.
7. Document the package responsibility in this guide if it becomes a shared platform package.

## Release and API governance

The Monorepo's release and API-contract rules live in dedicated documents and are referenced here so the workspace guide stays the single entry point:

- API compatibility and breaking-change rules: `docs/api/versioning.md`. API contract changes must run `pnpm api:generate` and commit the resulting `packages/api-types` changes; CI fails on undetected drift.
- Changelog and release notes: `docs/release/changelog.md`. Use `pnpm changelog:preview` during review and `pnpm changelog:update` when cutting a release.
- Import boundaries: `docs/architecture/import-boundaries.md`.

Release notes are repository-level for now. Per-package versioning and changelogs can be added later if packages need to be published or versioned independently.

