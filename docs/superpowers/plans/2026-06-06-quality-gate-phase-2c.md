# Quality Gate Phase 2C Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add low-threshold coverage gates, Playwright smoke E2E, high/critical audit blocking, and bundle size reporting.

**Architecture:** Start from report-only Phase 2A outputs, capture baselines, then enable narrow blocking rules for high-signal checks. Keep E2E smoke small and deterministic; keep bundle size report-only until a stable baseline exists.

**Tech Stack:** Jest, Vitest, Playwright, pnpm, GitHub Actions, Vite build output, optional Node bundle report script.

---

## File Structure

- `package.json`: root scripts for E2E, audit, and bundle report orchestration.
- `.github/workflows/ci.yml`: CI jobs for Playwright smoke and high/critical audit blocking.
- `apps/server/package.json`: server coverage command already exists; confirm Jest coverage threshold location.
- `apps/web-admin/vitest.config.ts`: admin coverage threshold.
- `apps/web-user/vitest.config.js`: user coverage threshold.
- `playwright.config.ts`: shared Playwright smoke configuration.
- `tests/e2e/admin-login.spec.ts`: management app smoke test.
- `tests/e2e/user-home.spec.ts`: user app smoke test.
- `tests/e2e/server-health.spec.ts`: backend smoke test.
- `scripts/report-bundle-size.mjs`: optional report-only build artifact size summary.

---

### Task 1: Capture current coverage and audit baseline

**Files:**
- No file changes expected.

- [ ] **Step 1: Run coverage baseline**

Run:

```bash
pnpm test:cov
```

Expected: capture server/admin/user coverage output. If the command fails because a provider or existing test is broken, record the failing package and fix the minimal tooling problem before setting thresholds.

- [ ] **Step 2: Run high-level audit baseline**

Run:

```bash
pnpm audit --audit-level high --registry=https://registry.npmjs.org
```

Expected: determine whether high/critical vulnerabilities already exist. If it fails, resolve or document the blocking dependency before turning CI blocking on.

- [ ] **Step 3: Record baseline in implementation notes**

Create or update the implementation PR description with:

```markdown
Coverage baseline:
- server:
- web-admin:
- web-user:

Audit baseline:
- high/critical:
```

Do not commit empty baseline values.

---

### Task 2: Configure low coverage thresholds

**Files:**
- Modify: `apps/server/package.json` or server Jest config if threshold is config-based.
- Modify: `apps/web-admin/vitest.config.ts`
- Modify: `apps/web-user/vitest.config.js`

- [ ] **Step 1: Add server coverage threshold**

Set server global thresholds slightly below the measured baseline. Example shape:

```json
"coverageThreshold": {
  "global": {
    "branches": 20,
    "functions": 20,
    "lines": 20,
    "statements": 20
  }
}
```

Use actual baseline-aware numbers, not the example blindly.

- [ ] **Step 2: Add admin Vitest threshold**

In `apps/web-admin/vitest.config.ts`, add coverage thresholds under `test.coverage.thresholds` using baseline-aware values.

- [ ] **Step 3: Add user Vitest threshold**

In `apps/web-user/vitest.config.js`, add coverage thresholds under `test.coverage.thresholds` using baseline-aware values.

- [ ] **Step 4: Verify coverage gates**

Run:

```bash
pnpm test:cov
```

Expected: PASS with thresholds enabled.

- [ ] **Step 5: Commit coverage thresholds**

```bash
git add apps/server/package.json apps/web-admin/vitest.config.ts apps/web-user/vitest.config.js
git commit -m "ci: add low coverage thresholds"
```

---

### Task 3: Add Playwright smoke E2E

**Files:**
- Modify: `package.json`
- Modify: `pnpm-workspace.yaml` if Playwright is added to catalog.
- Modify: `pnpm-lock.yaml`
- Create: `playwright.config.ts`
- Create: `tests/e2e/admin-login.spec.ts`
- Create: `tests/e2e/user-home.spec.ts`
- Create: `tests/e2e/server-health.spec.ts`

- [ ] **Step 1: Add Playwright dependency**

Add Playwright using the project dependency style:

```bash
pnpm add -D -w @playwright/test
```

If using catalogs, add `@playwright/test` to `pnpm-workspace.yaml` and root `devDependencies` as `catalog:`.

- [ ] **Step 2: Add root E2E script**

In root `package.json`, add:

```json
"test:e2e": "playwright test"
```

- [ ] **Step 3: Add Playwright config**

Create `playwright.config.ts` with local dev-server orchestration for server/admin/user, or document manual server startup if automatic startup is too brittle for the current repo.

- [ ] **Step 4: Add smoke specs**

Create three smoke tests:

```ts
// tests/e2e/server-health.spec.ts
import { expect, test } from '@playwright/test'

test('server health endpoint responds', async ({ request }) => {
  const response = await request.get('/health')
  expect(response.ok()).toBe(true)
})
```

```ts
// tests/e2e/admin-login.spec.ts
import { expect, test } from '@playwright/test'

test('admin login page renders', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('input').first()).toBeVisible()
})
```

```ts
// tests/e2e/user-home.spec.ts
import { expect, test } from '@playwright/test'

test('user app home renders', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('body')).toBeVisible()
})
```

Adjust base URLs and selectors to the actual app routes before committing.

- [ ] **Step 5: Verify smoke E2E**

Run:

```bash
pnpm test:e2e
```

Expected: smoke specs pass locally.

- [ ] **Step 6: Commit Playwright smoke**

```bash
git add package.json pnpm-workspace.yaml pnpm-lock.yaml playwright.config.ts tests/e2e
git commit -m "test: add playwright smoke e2e"
```

---

### Task 4: Upgrade CI audit and add smoke job

**Files:**
- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1: Upgrade security audit command**

Change the security audit job command from report-only to high/critical blocking:

```yaml
- name: Run high severity dependency audit
  run: pnpm audit --audit-level high --registry=https://registry.npmjs.org
```

- [ ] **Step 2: Add Playwright smoke job**

Add a CI job that installs dependencies, installs Playwright browsers if needed, starts the required dev servers, and runs:

```bash
pnpm test:e2e
```

- [ ] **Step 3: Verify CI YAML diff**

Run:

```bash
git diff -- .github/workflows/ci.yml
```

Expected: only audit and Playwright smoke CI changes.

- [ ] **Step 4: Commit CI changes**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: enforce high audit and e2e smoke"
```

---

### Task 5: Add bundle size report

**Files:**
- Modify: `package.json`
- Create: `scripts/report-bundle-size.mjs`

- [ ] **Step 1: Add report script**

Create `scripts/report-bundle-size.mjs` to scan admin/user `dist` assets and print JS/CSS file sizes. Keep this report-only.

- [ ] **Step 2: Add root script**

In root `package.json`, add:

```json
"bundle:report": "pnpm build:admin && pnpm build:user && node scripts/report-bundle-size.mjs"
```

- [ ] **Step 3: Run report**

Run:

```bash
pnpm bundle:report
```

Expected: build succeeds and prints file size summary. No size threshold should fail the command.

- [ ] **Step 4: Commit bundle report**

```bash
git add package.json scripts/report-bundle-size.mjs
git commit -m "ci: add bundle size report"
```

---

### Task 6: Final verification

**Files:**
- All files changed in this phase.

- [ ] **Step 1: Run coverage**

```bash
pnpm test:cov
```

Expected: PASS with low thresholds.

- [ ] **Step 2: Run E2E smoke**

```bash
pnpm test:e2e
```

Expected: PASS.

- [ ] **Step 3: Run high audit**

```bash
pnpm audit --audit-level high --registry=https://registry.npmjs.org
```

Expected: PASS or documented dependency remediation PR.

- [ ] **Step 4: Run build**

```bash
pnpm build
```

Expected: PASS.

- [ ] **Step 5: Inspect final diff**

```bash
git diff --stat
git status --short
```

Expected: only intended Phase 2C files remain changed.

---

## Self-Review

Spec coverage:
- Coverage thresholds: Task 2.
- Playwright E2E smoke: Task 3 and Task 4.
- Bundle size monitoring: Task 5.
- Audit high/critical blocking: Task 4.
- Verification: Task 6.

Unresolved-marker scan:
- Baseline values must be measured during implementation and must not be committed as blanks.
- Example thresholds and selectors require replacement with actual baseline-aware values before implementation commits.

Type consistency:
- Root script names are `test:e2e` and `bundle:report`.
- Audit level is consistently `high`.
