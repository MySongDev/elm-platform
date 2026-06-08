# Import Boundaries

This document records the import boundary rules enforced through ESLint in this Monorepo, their current enforcement level, and the planned path to stricter enforcement.

The goal is to keep modules loosely coupled so that lower layers can be understood and changed without breaking upper layers, and so that sibling features do not form hidden dependencies on each other.

## Enforcement level

All boundary rules are currently configured as ESLint `warn` in `eslint.config.mjs`. They report problems but do not fail `pnpm lint` or block CI yet. This is deliberate: enforcement is rolled out gradually so historical violations do not block unrelated work.

Use the focused report command to see only the web-admin boundary picture:

```bash
pnpm lint:boundaries
```

## web-admin FSD layers

`apps/web-admin` follows a Feature-Sliced Design style layering. From lowest to highest:

```text
shared  <  entities  <  features  <  widgets  <  pages  <  app
```

The rules in `eslint.config.mjs` encode this ordering through `no-restricted-imports`:

- `shared` must not import `app`, `entities`, `features`, `pages`, or `widgets`. It is the lowest layer.
- `entities` may import `shared` only, not `app`, `features`, `pages`, or `widgets`.
- `features` may import `entities` and `shared`, not `app`, `pages`, or `widgets`.
- `widgets` may import `features`, `entities`, and `shared`, not `app` or `pages`.
- Any web-admin file must not import `@/views/**` (legacy layer being retired) or another feature's `@/features/*/pages/**`.

`pages` and `app` are the top composition layers and may depend on the layers below them.

## Known violations

The boundary report (`pnpm lint:boundaries`) currently surfaces **no** outstanding `no-restricted-imports` violations in web-admin.

Resolved:

- `shared/ui/DataScopeHint` previously imported `@/entities/session`, inverting the layer ordering. It was moved up to `entities/session/ui/DataScopeHint` (where depending on the session store is valid) and is now exported from the `@/entities/session` public API. The three `pages/commerce/*` consumers import it from `@/entities/session`.

Because the list is empty, the `shared`-layer rule is a candidate for promotion from `warn` to `error` to lock in the fix and prevent regressions (see rollout step 4 below).

## web-user

`apps/web-user` does not yet have FSD-style layer boundaries encoded in ESLint. Its structure (`views`, `components`, `composables`, `services`, `stores`, `untils`/`utils`) is flatter. Boundary rules for web-user are intentionally out of scope for now and should only be introduced once its layering is clarified.

## Package-level boundaries

Cross-package boundaries between workspace packages are enforced separately by `scripts/validate-workspace.mjs` (run via `pnpm workspace:validate` / `pnpm ci:workspace`). Those rules ensure `packages/*` never depend on `apps/*`, apps never depend on other apps, and internal dependencies use `workspace:*`. See `docs/engineering/monorepo.md` for details.

## Rollout plan

Boundaries are tightened in stages so they never block unrelated work:

1. Local and reporting command only (`pnpm lint:boundaries`) — current state.
2. Non-blocking CI visibility: surface the report in CI without failing the build.
3. Strict for changed files: fail only when a pull request introduces a new violation.
4. Full strict enforcement: promote the rules from `warn` to `error` once the known-violations list is empty.

Each step should only happen after the previous one is stable. Promoting a rule to `error` requires the corresponding known violations to be resolved first.
