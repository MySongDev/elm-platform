# Phase 2A: 低风险质量门禁设计

## Context

当前项目已经完成 monorepo 共享包、commitlint、husky、lint-staged、CI、Docker Compose、env 校验、协作文档与模板等基础工程化能力。下一步进入“质量门禁与基础可观测性”阶段，但不适合一次性引入覆盖率阈值、E2E、结构化日志和链路追踪等高改动内容。

本设计选择低风险起步：先补齐提交/推送前的基本检查、覆盖率报告入口和 CI 安全审计报告能力。目标是增强多人协作质量保障，同时不阻塞当前业务开发节奏。

## Goals

- 在 push 前尽早发现前端类型错误。
- 提供统一 coverage 命令和报告生成入口。
- 在 CI 中输出依赖安全审计结果，但暂不阻塞合并。
- 保持低风险：不引入 E2E、不设置覆盖率阈值、不修改业务逻辑。

## Non-goals

- 不实现 Playwright/Cypress E2E。
- 不设置 coverage threshold。
- 不改造日志结构、requestId 或 OpenTelemetry。
- 不改动业务代码。
- 不要求 audit 有漏洞时 CI fail。

## Design

### 1. pre-push hook

新增 `.husky/pre-push`：

```bash
pnpm type-check
```

只执行 type-check，不执行完整 test/build。原因：pre-push 是开发者本地路径，太重会降低协作体验。完整 build/test 仍由 CI 保证。

### 2. Coverage scripts

Root `package.json` 新增：

```json
"test:cov": "pnpm --filter vue3-elm-node run test:cov && pnpm --filter elm-web-admin run test:coverage && pnpm --filter vue3-elm-js run test:coverage"
```

Web apps 新增：

```json
"test:coverage": "vitest run --coverage"
```

Server 已有 `test:cov`，无需新增。

Coverage 只作为报告入口，不配置阈值，避免因现有覆盖率不足阻塞开发。

### 3. CI coverage report job

在 `.github/workflows/ci.yml` 中新增 `coverage` job：

- 安装依赖
- 构建共享包
- 生成 Prisma Client
- 执行 `pnpm test:cov`
- server 阶段注入 `DATABASE_URL`

如果 coverage 工具缺失，则在实现阶段补充对应依赖或调整为最小可运行脚本。

### 4. CI security audit job

新增 `security-audit` job：

```bash
pnpm audit || true
```

此 job 只报告，不阻塞。原因：当前项目处于工程化补强阶段，历史依赖问题不应突然阻塞所有 PR；后续可升级为 high/critical fail。

## Files to Change

- `.husky/pre-push`
- `package.json`
- `apps/web-admin/package.json`
- `apps/web-user/package.json`
- `.github/workflows/ci.yml`
- 如 Vitest coverage 需要，可能调整：
  - `apps/web-admin/vitest.config.ts`
  - `apps/web-user/vitest.config.js`
  - `pnpm-workspace.yaml`

## Verification

本地验证：

```bash
pnpm type-check
pnpm test:cov
pnpm audit || true
```

CI 预期：

- `build-and-test` 保持原有阻塞能力。
- `coverage` 能生成报告，但不因覆盖率低失败。
- `security-audit` 能输出 audit 结果，但不阻塞 PR。

## Risks and Tradeoffs

- `vitest --coverage` 可能需要额外 coverage provider 依赖，实装时需按 Vitest 当前版本补齐。
- `pnpm test:cov` 会比普通 test 慢，不放入 pre-push。
- `pnpm audit || true` 只报告不阻塞，安全治理强度有限，但适合当前阶段低风险落地。
- 覆盖率没有阈值，短期不能防止覆盖率下降；后续 Phase 2B 再引入阈值。

## Follow-up

Phase 2B 可继续推进：

- coverage threshold（先低阈值）
- Playwright smoke E2E
- requestId + structured logging
- high/critical audit blocking
