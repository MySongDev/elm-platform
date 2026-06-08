# 质量门禁 Phase 2C 验证报告

日期：2026-06-08

## 范围

本报告用于验证 Phase 2C 质量门禁的实现情况：

- server、web-admin 和 web-user 的覆盖率阈值。
- Playwright 冒烟 E2E 设置。
- CI 中的高严重级别依赖审计命令。
- 包体积报告脚本。

## 静态检查

- `package.json` 包含 `test:e2e` 和 `bundle:report`。
- `.github/workflows/ci.yml` 包含阻塞式的 `pnpm audit --audit-level high --registry=https://registry.npmjs.org`。
- `.github/workflows/ci.yml` 包含带有 Postgres 和 Redis 服务的 `e2e-smoke` 任务。
- `playwright.config.ts`、`scripts/run-playwright-e2e.mjs` 和 `tests/e2e/*` 均已存在。
- 覆盖率阈值已配置在：
  - `apps/server/package.json`
  - `apps/web-admin/vitest.config.ts`
  - `apps/web-user/vitest.config.js`

## 覆盖率基线

最新执行命令：

```bash
pnpm test:cov
```

结果：通过。

- server：语句覆盖率 50.74%，分支覆盖率 48.79%，函数覆盖率 45.36%，行覆盖率 51.23%。
- web-admin：语句覆盖率 69.82%，分支覆盖率 60.85%，函数覆盖率 66.75%，行覆盖率 70.40%。
- web-user：语句覆盖率 38.80%，分支覆盖率 34.82%，函数覆盖率 30.99%，行覆盖率 38.88%。

## 包体积基线

最新执行命令：

```bash
pnpm bundle:report
```

结果：通过。

- web-admin：104 个文件，原始体积 2.14 MiB，gzip 后 645.1 KiB。
- web-user：67 个文件，原始体积 758.0 KiB，gzip 后 288.1 KiB。

## 构建验证

最新执行命令：

```bash
pnpm build
```

结果：通过。

已知警告：

- `unplugin-vue-components` 报告已有的 TabBar 组件名称冲突。
- Rollup 报告已有的 `@vueuse/core` PURE 注解警告。
- Vite 报告已有的 admin chunk 体积警告。

## E2E 验证

最新执行命令：

```bash
pnpm test:e2e
```

结果：通过。

- Docker Desktop 已在本地运行。
- `elm-postgres` 正在运行，并发布 `0.0.0.0:5432->5432/tcp`。
- `elm-redis` 正在运行，并发布 `0.0.0.0:6379->6379/tcp`。
- Playwright 冒烟测试套件通过了 3 个测试：server health、admin app shell 和 user app shell。

此前的本地阻塞点是 Postgres/Redis 不可用。E2E 运行器在启动 Nest 之前仍会执行依赖预检，因此当本地服务缺失时，会快速失败并给出清晰提示。

## 审计基线

最新执行命令：

```bash
pnpm audit --audit-level high --registry=https://registry.npmjs.org
```

结果：通过高严重级别 CI 门禁。

已应用的修复：

- 移除了未修补的 mock 技术栈（`mockjs` 和 `vite-plugin-mock`）。
- 使用 `apps/web-user/mock` 下的本地 Vite mock 中间件进行替换。
- 为存在漏洞的传递依赖范围添加了 pnpm overrides：`braces`、`glob`、`lodash`、`multer`、`picomatch` 和 `tmp`。
- 刷新了 `pnpm-lock.yaml`。

剩余审计基线：仍有 13 个非阻塞发现低于当前配置的 high 门禁阈值，其中包含 2 个低严重级别漏洞和 11 个中等严重级别漏洞。

CI 状态：该命令已在 `.github/workflows/ci.yml` 中配置为阻塞式高严重级别审计门禁。
