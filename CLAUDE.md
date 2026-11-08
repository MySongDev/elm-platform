# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Elm Platform is a pnpm workspace for a food-delivery full-stack app:

- `apps/server`: NestJS 10 backend with Prisma, PostgreSQL, Redis, JWT/Passport auth, Swagger.
- `apps/web-admin`: Vue 3 + TypeScript admin dashboard using Element Plus, Pinia, Vue Router, Vite.
- `apps/web-user`: Vue 3 + TypeScript/JavaScript mobile user app using Vant, Pinia, Vue Router, Vite, Vitest, and optional mock data.
- `packages/*`: workspace slot for shared packages; currently included by `pnpm-workspace.yaml`.

Root scripts use `pnpm --filter` to target workspace packages. Prefer running commands from the repository root unless a command explicitly requires app-local context.

## Common Commands

### Workspace

```bash
pnpm install
pnpm dev              # run server, admin, and user apps in parallel
pnpm dev:server       # NestJS watch mode
pnpm dev:admin        # admin Vite dev server
pnpm dev:user         # user Vite dev server
pnpm build            # build all apps
pnpm build:server
pnpm build:admin
pnpm build:user
pnpm lint             # run lint in all workspaces
pnpm clean            # removes node_modules, dist, .turbo in workspaces
```

### Backend (`apps/server`)

```bash
pnpm --filter @elm-platform/server run dev
pnpm --filter @elm-platform/server run build
pnpm --filter @elm-platform/server run lint
pnpm --filter @elm-platform/server run test
pnpm --filter @elm-platform/server run test -- path/to/file.spec.ts
pnpm --filter @elm-platform/server run test:e2e
pnpm --filter @elm-platform/server run test:cov
pnpm --filter @elm-platform/server run prisma:generate
pnpm --filter @elm-platform/server run prisma:migrate
pnpm --filter @elm-platform/server run prisma:studio
pnpm --filter @elm-platform/server run prisma:seed
```

Backend environment variables are documented in `apps/server/.env.example`. The Nest app defaults to port `3000`, global prefix `api`, and Swagger at `http://localhost:3000/api-docs`.

### Admin web (`apps/web-admin`)

```bash
pnpm --filter @elm-platform/web-admin run dev
pnpm --filter @elm-platform/web-admin run build        # runs vue-tsc before vite build
pnpm --filter @elm-platform/web-admin run type-check
pnpm --filter @elm-platform/web-admin run test:unit
pnpm --filter @elm-platform/web-admin exec vitest run src/app/router/__tests__/build-routes.test.ts
pnpm --filter @elm-platform/web-admin run lint
pnpm --filter @elm-platform/web-admin run lint:style
pnpm --filter @elm-platform/web-admin run preview
```

### User web (`apps/web-user`)

```bash
pnpm --filter @elm-platform/web-user run dev            # proxies API to local backend
pnpm --filter @elm-platform/web-user run dev:mock       # enables vite-plugin-mock
pnpm --filter @elm-platform/web-user run build          # runs vue-tsc before vite build
pnpm --filter @elm-platform/web-user run type-check
pnpm --filter @elm-platform/web-user run test
pnpm --filter @elm-platform/web-user exec vitest run src/services/http/policies.test.js
pnpm --filter @elm-platform/web-user run test:watch
pnpm --filter @elm-platform/web-user run lint
pnpm --filter @elm-platform/web-user run preview
```

## Architecture

### Backend service

`apps/server/src/main.ts` bootstraps the Nest app, installs global exception filters, logging/response transform interceptors, `ValidationPipe`, CORS, global API prefix, and Swagger. `apps/server/src/app.module.ts` wires the global `ConfigModule`, `PrismaModule`, `RedisModule`, and the HTTP assembly entry `ApiModule`.

后端接口统一放在 `apps/server/src/api`：第一层按 `admin`、`customer`、`merchant`、`shared`、`callbacks`、`compatibility` 分类，端内按业务类别组织 Controller，HTTP DTO 位于 `api/<端>/<资源>/dto/`。业务 Service、框架无关的输入类型、规则和种子数据按领域放在 `src/modules/*`；业务模块只导出能力，不注册 Controller，也不得反向依赖接口模块（测试除外）。新增接口必须在相应的 `*-api.module.ts` 注册，目录本身不会增加 URL 前缀或权限。完整规范见 `docs/engineering/016-backend-api-domain-boundaries.md`。

原 `AdminService` 已拆为角色、菜单、部门和监控业务；权限目录为静态常量，没有空转发 Service。订单列表/详情归 `OrderQueryService`，状态流转归 `OrderWorkflowService`，支付渠道与通知处理归 `PaymentService`，共同使用 `order-summary.mapper.ts`。旧 Elm 未鉴权的餐馆/食品写入接口单独放在 `api/compatibility`，不表示已获得管理端权限保护。移动或拆分 Controller 时保留现有 URL、Guard、角色/权限、状态码与响应 schema；更换类名还需保留 OpenAPI operationId。

这里的 `modules` 是实用业务/应用层，不是严格纯 DDD domain。HTTP DTO 已按「端 → 资源」统一迁入接口层，业务 Service 使用自有 `*.inputs.ts` 输入类型；Elm 已拆为 media/upstream/catalog/location/legacy 五个业务模块，`ElmModule` 只负责聚合。后端静态依赖边界已在根 `eslint.config.mjs` 以 `error` 启用：生产 `modules → api`、`api → Prisma`、`common → modules/api` 禁止，覆盖常规相对路径、别名、类型导入和转导出；测试及两个已知 Elm 导入 CLI 豁免。类型与当前用户抽象、JWT/异常回退、数据库级租户兜底明确待定，未经用户确认不得顺带实施。具体判断、现状、检查命令与待定清单集中维护在 `docs/engineering/016-backend-api-domain-boundaries.md` 第9、10节。

Prisma is configured in `apps/server/prisma/schema.prisma` for PostgreSQL. Shared backend infrastructure lives under `src/common`, `src/config`, `src/prisma`, and `src/redis`; health business logic lives under `src/health`.

### Admin web app

`apps/web-admin/src/main.ts` creates Pinia with persisted state, sets up the shared HTTP client, installs Vue Router, i18n, directives, Element Plus styles, SVG icons, and global styles. The app uses an FSD-like split: `app` for providers/router, `entities` for domain state, `features` for user actions, `pages` for route pages, `widgets` for composed UI, and `shared` for API/config/lib/styles/ui.

Routing is centered in `src/app/router`. Static routes are registered up front; dynamic routes are built from backend menu data by `build-routes.ts`, adapted/normalized through `menu-adapter.ts` and `menu-schema.ts`, and registered/reset by `dynamic-routes.ts`. Component resolution is constrained through `component-map.ts`, so menu `component` keys must map to known page components.

HTTP access goes through `src/shared/api`: `createHttpClient` unwraps `{ code, data, message }` responses and centralizes token injection plus 401/403/error callbacks. `src/app/providers/http.ts` connects those callbacks to the auth store, router redirects, i18n messages, and Element Plus notifications.

### User web app

`apps/web-user/src/main.js` registers Pinia, the router, global components, directives, SVG icons, Vant-related setup, and app styles. The app is a mobile SPA with feature views under `src/views` and reusable logic split across `src/components`, `src/composables`, `src/services`, `src/stores`, and `src/untils`.

Routing is module based: `src/router/index.ts` auto-collects `src/router/modules/*.ts` using `import.meta.glob`, creates hash history, and applies auth/page-title guards. When adding pages, define the route in the relevant module and keep route meta consistent with the existing `RouteMeta` type.

API calls are organized by feature under `src/services/api`, with endpoint constants under `src/services/api/endpoints`. All network traffic should go through `src/services/http`: `http.js` exposes `get/post/put/patch/del`, `request.js` owns the Axios instance/interceptors plus token injection and 401 refresh, and `policies/` holds the meta-driven helpers (location injection, loading integration, business-error detection, throttled error alerts, log sanitization) read through `config.meta`. Cache/dedupe/retry strategies were removed from the pipeline on 2026-10-02 for having no callers; their code is archived (not wired in) at `src/services/http/extras/optional-policies.js`, with re-enable steps in `docs/engineering/010-http-optional-policies.md`.

Pinia stores live in `src/stores/modules` for user/session, addresses, locations, and loading. Location state is important because HTTP policies can inject latitude/longitude into location-based requests. Composables are grouped by scope: `app` for app-level behavior, `ui` for interface interactions, `swr` for stale-while-revalidate data fetching, and `features` for business-specific logic.

`apps/web-user` has its own existing `CLAUDE.md` and `AGENTS.md`; consult them when working only inside that app because they contain more detailed mobile-app guidance.

## Test Policy

Before creating, changing, or deleting automated tests, read and follow the repository-wide [AI_TEST_POLICY.md](AI_TEST_POLICY.md). By default, do not add or change tests. Only do so when a policy-defined necessary scenario applies or the user explicitly requests it. If the need is unclear, do not write tests; instead run the smallest relevant validation and state why no test was added.

## Git Conventions

- **禁止**在 commit message 中添加 `Co-Authored-By` 或任何 AI 署名行。不论使用哪个模型，commit 信息中都不得包含 AI 工具的归属信息。

## Configuration Notes

- Both web apps use `@` as an alias for their local `src` directory.
- `apps/web-admin/vite.config.ts` proxies `/api` to `http://127.0.0.1:3000` and auto-imports Vue, Vue Router, Pinia, Vue I18n, and Element Plus APIs/components.
- `apps/web-user/vite.config.js` proxies `/api`, `/ele-api`, and `/pay-api` to the local Nest backend on port `3000`; `dev:mock` enables mocks from `apps/web-user/mock`.
- Web builds run `vue-tsc --noEmit` before `vite build`; fix type errors before treating a build as successful.
- User-web Vitest runs in `happy-dom` and matches `src/**/*.test.{js,ts}`. Admin Vitest runs in `node` and matches `src/**/*.{test,spec}.ts`. Backend Jest matches `apps/server/src/**/*.spec.ts` via the package-local Jest config.

