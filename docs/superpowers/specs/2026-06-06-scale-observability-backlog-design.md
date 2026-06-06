# Phase 4: 规模化与深度可观测 Backlog 设计

## Context

Phase 4 面向中大型团队、真实生产部署、多服务协作和合规要求。当前项目已经具备 monorepo、CI、基础协作规范、质量门禁规划和 requestId 日志关联能力，但还没有证据表明必须立即引入 OpenTelemetry、配置中心、Storybook、Lighthouse CI 或 Vault。

因此 Phase 4 不作为当前立即执行的实现阶段，而作为规模化触发的 backlog。每一项能力都需要明确触发条件、维护 owner、验收方式和退出策略。

## Goals

- 记录第四阶段候选能力，避免后续讨论丢失上下文。
- 明确每个能力的进入条件，防止为“看起来企业级”而过早平台化。
- 为 Phase 1-3 留出平滑演进方向。
- 把深度可观测、安全合规和配置平台能力放入可审查 backlog。

## Non-goals

- 当前不实施 OpenTelemetry。
- 当前不接入配置中心。
- 当前不新增 Lighthouse CI 阻塞规则。
- 当前不引入 Storybook。
- 当前不接 Vault 或其他 Secrets 平台。
- 当前不改造 RBAC 审计存储为不可篡改架构。

## Scale Triggers

满足以下任一条件时，可以为对应能力编写单独设计书：

- 多个后端服务、异步任务或外部支付回调导致 requestId 不足以排障。
- 需要按环境、租户、人群、灰度批次动态调整配置。
- 前端性能回归频繁出现，并且 bundle report 已不足以定位问题。
- 共享组件数量增长，设计、产品、测试需要参与组件级 review。
- 生产密钥数量、轮换频率或权限边界超过普通环境变量管理能力。
- 客户、审计或合规要求证明 RBAC 操作日志需要不可篡改和可检索证据。

## Candidate Capabilities

### OpenTelemetry

目标是用 traceId 串联前端、后端、数据库、Redis 和外部服务。进入条件是 requestId 日志已经稳定，但跨服务排障仍然困难。

### 配置中心

目标是支持运行时动态调参。进入条件是 Feature Flags 和环境变量约定已经稳定，并且出现需要不发版调整配置的真实需求。

### Lighthouse CI

目标是在 PR 中观察前端性能指标变化。进入条件是 bundle report 已形成基线，且性能回归成为常见 review 风险。

### Storybook

目标是为共享组件和复杂业务组件提供可视化文档。进入条件是组件复用增加，设计/产品/测试需要脱离完整应用 review 组件状态。

### Secrets 管理

目标是把生产密钥纳入权限、轮换、审计和最小可见范围。进入条件是部署平台、密钥分类和访问角色已经明确。

### RBAC 不可篡改审计日志

目标是满足“谁在何时对什么资源执行了什么动作”的合规追踪。进入条件是当前 operation/system log 已不能满足查询、追溯或合规证明。

## Governance Rules

- 每个 Phase 4 能力必须有独立 design 和 implementation plan。
- 每个能力必须说明 owner、成本、退出策略和运行维护方式。
- 不能在同一个 PR 中同时引入两个以上 Phase 4 平台能力。
- 平台配置项必须记录在文档中，不能只存在于某个人的控制台记忆里。

## Verification

Phase 4 当前验证目标是文档完整性：

```bash
rg -n "OpenTelemetry|配置中心|Lighthouse|Storybook|Secrets|RBAC" docs/superpowers
```

后续每个能力单独实施时，再定义对应技术验证命令。

## Risks and Tradeoffs

- 过早引入重平台会增加维护成本，稀释业务交付注意力。
- 太晚引入可观测和 Secrets 治理会增加生产事故排查和合规风险。
- Phase 4 backlog 必须定期复盘，否则容易变成永远不执行的愿望清单。
