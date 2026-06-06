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
