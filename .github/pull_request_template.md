## Summary

<!-- 说明本 PR 改了什么 -->

## Why

<!-- 说明为什么需要这个改动，关联 issue/需求/设计文档 -->

## Design / Plan

- Design:
- Plan:
- ADR:

## Changes

- 

## Verification

- [ ] `pnpm lint`
- [ ] `pnpm type-check`
- [ ] `pnpm test`
- [ ] `pnpm build`
- [ ] 已手动验证关键路径

## Risk Checklist

- [ ] 是否包含数据库 migration？如有，请按 `docs/database/migration-checklist.md` 说明锁表风险、回滚方案和 seed/test 更新
- [ ] 是否包含 API breaking change？如有，请按 `docs/api/versioning.md` 说明迁移方案，并更新 Swagger、API 类型和文档
- [ ] 是否涉及 Feature Flag？如有，请按 `docs/release/feature-flags.md` 说明默认值、灰度范围、回滚方式和清理计划
- [ ] 是否涉及 ADR？如有，请在上方 `ADR` 字段附链接
- [ ] 是否新增或修改环境变量？如有，请更新 `.env.example`
- [ ] 是否影响权限/RBAC/安全逻辑？如有，请说明审计点
- [ ] 是否需要更新 `packages/api-types`？如有，请运行 `pnpm api:generate`

## Screenshots / Recordings

<!-- UI 改动请附截图或录屏 -->
