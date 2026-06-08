# Feature Flag Conventions

Feature flags are for controlled rollout, fast rollback, and short-lived compatibility windows. They are not a substitute for permanent configuration, permissions, or tenant policy.

## Naming

Use `domain.feature.variant`.

Examples:

- `order.refundApproval.enabled`
- `tenant.onboarding.selfServe`
- `payment.alipay.resumeFallback`

## Defaults

Defaults must be conservative and documented.

- New user-facing behavior defaults to `false` unless the rollout plan says otherwise.
- Risky backend behavior defaults to the currently deployed behavior.
- Environment-specific overrides must be documented in the PR.
- Do not rely on a missing flag value as an implicit rollout decision.

## Rollout

Every PR that adds or changes a flag must document:

- Default value.
- Rollout scope.
- Owner.
- Verification signal.
- Rollback path.
- Cleanup condition.

## Cleanup

Flags should be removed once the rollout is complete and the fallback path is no longer needed.

- Include the cleanup condition in the original PR.
- Prefer removing stale flags in the next normal release cycle.
- Do not leave permanent branches in business logic without a follow-up ADR.
