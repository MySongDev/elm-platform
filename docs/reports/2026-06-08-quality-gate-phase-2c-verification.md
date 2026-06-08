# Quality Gate Phase 2C Verification

Date: 2026-06-08

## Scope

This report verifies the Phase 2C quality-gate implementation:

- Coverage thresholds for server, web-admin, and web-user.
- Playwright smoke E2E setup.
- High severity dependency audit command in CI.
- Bundle size report script.

## Static Check

- `package.json` contains `test:e2e` and `bundle:report`.
- `.github/workflows/ci.yml` contains blocking `pnpm audit --audit-level high --registry=https://registry.npmjs.org`.
- `.github/workflows/ci.yml` contains the `e2e-smoke` job with Postgres and Redis services.
- `playwright.config.ts`, `scripts/run-playwright-e2e.mjs`, and `tests/e2e/*` are present.
- Coverage thresholds are configured in:
  - `apps/server/package.json`
  - `apps/web-admin/vitest.config.ts`
  - `apps/web-user/vitest.config.js`

## Coverage Baseline

Fresh command:

```bash
pnpm test:cov
```

Result: passed.

- server: statements 50.74%, branches 48.79%, functions 45.36%, lines 51.23%.
- web-admin: statements 69.82%, branches 60.85%, functions 66.75%, lines 70.40%.
- web-user: statements 38.80%, branches 34.82%, functions 30.99%, lines 38.88%.

## Bundle Baseline

Fresh command:

```bash
pnpm bundle:report
```

Result: passed.

- web-admin: 104 files, 2.14 MiB raw, 645.1 KiB gzip.
- web-user: 67 files, 758.0 KiB raw, 288.1 KiB gzip.

## Build Verification

Fresh command:

```bash
pnpm build
```

Result: passed.

Known warnings:

- `unplugin-vue-components` reports existing TabBar component name conflicts.
- Rollup reports existing `@vueuse/core` PURE annotation warnings.
- Vite reports the existing admin chunk size warning.

## E2E Verification

Fresh command:

```bash
pnpm test:e2e
```

Result: passed.

- Docker Desktop is running locally.
- `elm-postgres` is running and publishes `0.0.0.0:5432->5432/tcp`.
- `elm-redis` is running and publishes `0.0.0.0:6379->6379/tcp`.
- Playwright smoke suite passed 3 tests: server health, admin app shell, and user app shell.

The earlier local blocker was missing Postgres/Redis availability. The E2E runner still performs a dependency preflight before starting Nest, so missing local services fail fast with a clear message.

## Audit Baseline

Fresh command:

```bash
pnpm audit --audit-level high --registry=https://registry.npmjs.org
```

Result: passed for the high-severity CI gate.

Remediation applied:

- Removed the unpatched mock stack (`mockjs` and `vite-plugin-mock`) from `apps/web-user`.
- Replaced it with a local Vite mock middleware under `apps/web-user/mock`.
- Added pnpm overrides for vulnerable transitive ranges: `braces`, `glob`, `lodash`, `multer`, `picomatch`, and `tmp`.
- Refreshed `pnpm-lock.yaml`.

Remaining audit baseline: 13 non-blocking findings remain below the configured high gate threshold, with 2 low and 11 moderate vulnerabilities.

CI status: the command is configured as a blocking high-severity audit gate in `.github/workflows/ci.yml`.
