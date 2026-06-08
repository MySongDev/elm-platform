# Changelog Workflow

This repository uses Conventional Commits as the source for release notes.

## Tool

Use `conventional-changelog` with the `conventionalcommits` preset.

Commands:

```bash
pnpm changelog:preview
pnpm changelog:update
```

`pnpm changelog:preview` prints unreleased release notes to stdout without modifying files. Use it during PR review or before cutting a release.

`pnpm changelog:update` updates `CHANGELOG.md` from commits since the latest semver tag. Use it only during release preparation.

## Release Notes Process

1. Ensure commits follow Conventional Commits.
2. Run `pnpm changelog:preview`.
3. Review the generated sections for user-facing clarity.
4. Run `pnpm changelog:update` during release preparation.
5. Commit the generated `CHANGELOG.md` with the release commit.
6. Tag the release after the changelog commit.

## Breaking Changes

Breaking API or behavior changes must include migration notes in the PR and changelog entry.

Required details:

- What changed.
- Who is affected.
- Migration path.
- Rollback path.
- Deprecation or removal date, if applicable.

## Monorepo Notes

The initial workflow generates repository-level release notes. Per-package changelogs can be introduced later if independent package versioning becomes necessary.
