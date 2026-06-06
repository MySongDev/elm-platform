# Phase 2C: 阈值化质量门禁与 E2E Smoke 设计

## Context

Phase 2A 已经提供低风险质量门禁：pre-push type-check、coverage 报告入口、CI coverage job、非阻塞依赖安全审计。Phase 2B 已经让后端请求具备 requestId 传播和日志关联能力。下一步可以把“能看到问题”逐步升级为“关键问题能阻塞 PR”，但仍不适合一次性设置很高覆盖率、全量 E2E 或严格 bundle budget。

本阶段采用低压门禁策略：先抓当前基线，再设置贴近基线的阈值；E2E 只做 smoke；安全审计只阻塞 high/critical；bundle size 先产出报告，不立即阻塞。

## Goals

- 为 server、web-admin、web-user 设置低起点 coverage threshold，防止覆盖率继续下降。
- 引入 Playwright smoke E2E，验证后端健康检查、管理端登录页、用户端首页等关键入口不白屏。
- 将 `pnpm audit` 从非阻塞报告升级为 high/critical 阻塞。
- 为 bundle size 提供报告入口，积累后续预算基线。
- 所有新增门禁都要能在本地和 CI 中复现。

## Non-goals

- 不追求高覆盖率或一次性补齐历史测试债。
- 不覆盖完整下单、支付、退款、租户审批等长业务链路。
- 不引入云端浏览器矩阵或跨浏览器兼容套件。
- 不在本阶段接入 Sentry、OpenTelemetry、Lighthouse CI 阻塞规则。
- 不改变业务行为。

## Design

### 1. Coverage threshold

先运行现有 `pnpm test:cov` 获取 server/admin/user 当前覆盖率。阈值应贴近当前基线并略低于基线，目标不是追求漂亮数字，而是防止新 PR 继续降低覆盖率。

建议策略：

- server 使用 Jest coverage threshold。
- web-admin 和 web-user 使用 Vitest coverage threshold。
- 初始阈值只设置全局 statements/branches/functions/lines，不给每个目录单独设阈值。
- 如果某端历史覆盖率明显偏低，先设置该端可通过的最低阈值，再建立后续提升任务。

### 2. Playwright smoke E2E

E2E 先验证“服务能启动、页面能加载、核心入口可见”：

- 后端：`/health` 或 `/api-docs-json` 能返回成功。
- 管理端：登录页可打开，用户名/密码输入入口可见。
- 用户端：首页或定位/登录入口可打开，页面不白屏。

Smoke 不做复杂数据准备，不依赖真实支付，不覆盖全量业务路径。

### 3. Security audit blocking

当前 CI 中 `pnpm audit --registry=https://registry.npmjs.org || true` 只报告不阻塞。Phase 2C 升级为：

```bash
pnpm audit --audit-level high --registry=https://registry.npmjs.org
```

medium/low 仍可在日志中观察，但不阻塞 PR。

### 4. Bundle size report

先新增构建产物体积报告入口，例如：

- admin build 后输出主要 chunk gzip/brotli size。
- user build 后输出主要 chunk gzip/brotli size。
- CI 上传或打印报告。

本阶段不设置 hard budget，避免历史体积一次性阻塞协作。后续在形成基线后再升级为预算门禁。

## Files to Change

后续实施预计涉及：

- `package.json`
- `.github/workflows/ci.yml`
- `apps/server/package.json`
- `apps/server/jest.config.*` 或 package-local Jest 配置
- `apps/web-admin/vitest.config.ts`
- `apps/web-user/vitest.config.js`
- `playwright.config.ts`
- `tests/e2e/*.spec.ts` 或 `e2e/*.spec.ts`
- 可选 bundle report 脚本：`scripts/report-bundle-size.mjs`

## Verification

本地验证：

```bash
pnpm test:cov
pnpm exec playwright test
pnpm audit --audit-level high --registry=https://registry.npmjs.org
pnpm build
```

CI 预期：

- coverage 阈值低起点阻塞明显回退。
- Playwright smoke 能稳定运行。
- high/critical 漏洞阻塞 PR。
- bundle size 报告可见但不阻塞。

## Risks and Tradeoffs

- 覆盖率阈值如果高于当前基线，会造成无意义阻塞；必须先采集基线。
- Playwright 需要浏览器依赖，CI 时间会增加。
- audit high 阻塞可能暴露历史依赖问题，实施前应先跑一次确认是否会立即失败。
- bundle size 只报告不阻塞，短期不能防止体积回退，但能先建立观察基础。

## Follow-up

- 将 smoke E2E 扩展到登录、下单、管理端订单审核等业务链路。
- 将 bundle report 升级为 budget。
- 将 coverage threshold 分模块提升。
- 将 Sentry sourcemap 上传接入发布流程。
