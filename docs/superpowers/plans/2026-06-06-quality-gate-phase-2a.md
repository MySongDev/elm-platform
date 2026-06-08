# Phase 2A Quality Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add low-risk quality gates: pre-push type-check, coverage report scripts, non-blocking CI coverage, and non-blocking CI security audit.

**Architecture:** Keep local hooks lightweight and put heavier reporting in CI. Coverage remains report-only with no thresholds. Security audit is informational only (`pnpm audit || true`) so existing dependency findings do not block PRs.

**Tech Stack:** Husky, pnpm workspace scripts, Jest coverage, Vitest coverage, GitHub Actions.

---

## File Structure

- `.husky/pre-push` 鈥?lightweight local push guard that runs root `pnpm type-check`.
- `package.json` 鈥?adds root `test:cov` script to orchestrate server/admin/user coverage reports.
- `apps/web-admin/package.json` 鈥?adds `test:coverage` script using Vitest coverage.
- `apps/web-user/package.json` 鈥?adds `test:coverage` script using Vitest coverage.
- `pnpm-workspace.yaml` 鈥?adds the Vitest coverage provider package to catalog if Vitest requires it.
- `.github/workflows/ci.yml` 鈥?adds non-blocking `coverage` and `security-audit` jobs.

No business files should be changed.

---

### Task 1: Add lightweight pre-push hook

**Files:**
- Create: `.husky/pre-push`

- [ ] **Step 1: Create pre-push hook**

Write `.husky/pre-push`:

```bash
pnpm type-check
```

- [ ] **Step 2: Verify hook command directly**

Run:

```bash
pnpm type-check
```

Expected: both frontend `vue-tsc --noEmit` commands complete without type errors. PowerShell may print a NativeCommandError wrapper around successful pnpm output; if there are no TypeScript error lines, treat as pass.

- [ ] **Step 3: Commit**

```bash
git add .husky/pre-push
git commit -m "chore(ci): add pre-push type-check hook"
```

---

### Task 2: Add coverage scripts

**Files:**
- Modify: `package.json`
- Modify: `apps/web-admin/package.json`
- Modify: `apps/web-user/package.json`

- [ ] **Step 1: Add root coverage script**

In root `package.json`, inside `scripts`, add:

```json
"test:cov": "pnpm --filter @elm-platform/server run test:cov && pnpm --filter @elm-platform/web-admin run test:coverage && pnpm --filter @elm-platform/web-user run test:coverage"
```

Place it near the existing `test` script:

```json
"test": "pnpm --filter @elm-platform/server run test && pnpm --filter @elm-platform/web-admin run test:unit && pnpm --filter @elm-platform/web-user run test",
"test:cov": "pnpm --filter @elm-platform/server run test:cov && pnpm --filter @elm-platform/web-admin run test:coverage && pnpm --filter @elm-platform/web-user run test:coverage",
"type-check": "pnpm --filter @elm-platform/web-admin run type-check && pnpm --filter @elm-platform/web-user run type-check"
```

- [ ] **Step 2: Add admin coverage script**

In `apps/web-admin/package.json`, inside `scripts`, add:

```json
"test:coverage": "vitest run --coverage"
```

Expected nearby scripts:

```json
"test:unit": "vitest run",
"test:coverage": "vitest run --coverage",
"preview": "vite preview"
```

- [ ] **Step 3: Add user coverage script**

In `apps/web-user/package.json`, inside `scripts`, add:

```json
"test:coverage": "vitest run --coverage"
```

Expected nearby scripts:

```json
"test": "vitest run",
"test:coverage": "vitest run --coverage",
"test:watch": "vitest"
```

- [ ] **Step 4: Run frontend coverage scripts to detect provider requirement**

Run:

```bash
pnpm --filter @elm-platform/web-admin run test:coverage
pnpm --filter @elm-platform/web-user run test:coverage
```

Expected: If Vitest asks for a coverage provider package (commonly `@vitest/coverage-v8`), install it in the relevant workspace/root catalog in Task 3. If it runs successfully, Task 3 can still add the explicit provider dependency for reproducibility.

- [ ] **Step 5: Commit coverage scripts**

```bash
git add package.json apps/web-admin/package.json apps/web-user/package.json
git commit -m "chore(ci): add coverage report scripts"
```

---

### Task 3: Add Vitest coverage provider if required

**Files:**
- Modify: `pnpm-workspace.yaml`
- Modify: `apps/web-admin/package.json`
- Modify: `apps/web-user/package.json`
- Modify: `pnpm-lock.yaml`

- [ ] **Step 1: Add provider to pnpm catalog**

If `@vitest/coverage-v8` is needed, add this item under `catalog:` in `pnpm-workspace.yaml`:

```yaml
  '@vitest/coverage-v8': ^4.1.6
```

- [ ] **Step 2: Add provider to both frontend devDependencies**

In `apps/web-admin/package.json` devDependencies, add:

```json
"@vitest/coverage-v8": "catalog:"
```

In `apps/web-user/package.json` devDependencies, add:

```json
"@vitest/coverage-v8": "catalog:"
```

- [ ] **Step 3: Install dependencies**

Run:

```bash
pnpm install
```

Expected: lockfile updates cleanly.

- [ ] **Step 4: Verify coverage scripts**

Run:

```bash
pnpm --filter @elm-platform/web-admin run test:coverage
pnpm --filter @elm-platform/web-user run test:coverage
```

Expected: both commands pass and generate coverage output. No threshold should be configured, so low coverage must not fail the command.

- [ ] **Step 5: Commit provider dependency**

```bash
git add pnpm-workspace.yaml apps/web-admin/package.json apps/web-user/package.json pnpm-lock.yaml
git commit -m "chore(ci): add vitest coverage provider"
```

If no provider changes are necessary, skip this commit.

---

### Task 4: Add CI coverage and security audit jobs

**Files:**
- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1: Add `coverage` job**

Add this job after `build-and-test` and before `api-drift`:

```yaml
  coverage:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: elm_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build shared packages
        run: pnpm --filter @elm-platform/contracts run build && pnpm --filter @elm-platform/vite-config run build

      - name: Generate Prisma client
        run: pnpm --filter @elm-platform/server run prisma:generate

      - name: Generate coverage reports
        run: pnpm test:cov
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/elm_test?schema=public
```

Rationale: this mirrors the existing setup pattern and keeps coverage as reporting only.

- [ ] **Step 2: Add `security-audit` job**

Add this job near `lint` or after `coverage`:

```yaml
  security-audit:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run non-blocking dependency audit
        run: pnpm audit || true
```

Rationale: user chose report-only audit for this phase.

- [ ] **Step 3: Validate YAML shape locally by reading CI file**

Run a quick visual/read check:

```bash
git diff -- .github/workflows/ci.yml
```

Expected: indentation is 2 spaces under `jobs`, new jobs are siblings of existing jobs, not nested inside another job.

- [ ] **Step 4: Commit CI changes**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add coverage and non-blocking security audit jobs"
```

---

### Task 5: Final verification

**Files:**
- No new files expected; may include lockfile if Task 3 installed provider.

- [ ] **Step 1: Run type-check**

Run:

```bash
pnpm type-check
```

Expected: PASS.

- [ ] **Step 2: Run coverage command**

Run with DATABASE_URL for server tests:

```bash
DATABASE_URL='postgresql://postgres:postgres@localhost:5432/elm_test?schema=public' pnpm test:cov
```

On Windows PowerShell use:

```powershell
$env:DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/elm_test?schema=public'; pnpm test:cov
```

Expected: server/admin/user coverage commands complete successfully. No coverage threshold failure.

- [ ] **Step 3: Run security audit report-only command**

Run:

```bash
pnpm audit || true
```

Expected: command returns control even if audit reports findings.

- [ ] **Step 4: Run existing quality checks**

Run:

```bash
pnpm lint
pnpm lint:style
pnpm test
pnpm build
```

Expected: same baseline as before. `pnpm lint` may still show existing warnings but must have 0 errors.

- [ ] **Step 5: Push branch**

```bash
git push
```

Expected: remote branch updates successfully.

---

## Self-Review

Spec coverage:
- pre-push hook: Task 1.
- coverage scripts: Task 2.
- coverage provider if required: Task 3.
- CI coverage job: Task 4.
- non-blocking security audit: Task 4.
- no E2E / no thresholds / no logging changes: explicitly preserved by scope and no tasks touch those areas.

Placeholder scan:
- No TBD/TODO placeholders remain.
- Every code/config change includes exact content.

Type consistency:
- Script names match existing package naming: server `test:cov`, admin/user `test:coverage`, root `test:cov`.
- CI uses existing shared package build commands and DATABASE_URL pattern already used in current workflow.

