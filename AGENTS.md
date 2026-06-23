# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

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
pnpm --filter @elm-platform/server run start:dev
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

`apps/server/src/main.ts` bootstraps the Nest app, installs global exception filters, logging/response transform interceptors, `ValidationPipe`, CORS, global API prefix, and Swagger. `apps/server/src/app.module.ts` wires the global `ConfigModule`, `PrismaModule`, `RedisModule`, and business modules: `user`, `auth`, `admin`, and `elm`.

Prisma is configured in `apps/server/prisma/schema.prisma` for PostgreSQL. The schema currently models users, login logs, roles, menus, departments, operation logs, and system logs. Shared backend infrastructure lives under `src/common`, `src/config`, `src/prisma`, and `src/redis`; feature APIs live under `src/modules/*`.

### Admin web app

`apps/web-admin/src/main.ts` creates Pinia with persisted state, sets up the shared HTTP client, installs Vue Router, i18n, directives, Element Plus styles, SVG icons, and global styles. The app uses an FSD-like split: `app` for providers/router, `entities` for domain state, `features` for user actions, `pages` for route pages, `widgets` for composed UI, and `shared` for API/config/lib/styles/ui.

Routing is centered in `src/app/router`. Static routes are registered up front; dynamic routes are built from backend menu data by `build-routes.ts`, adapted/normalized through `menu-adapter.ts` and `menu-schema.ts`, and registered/reset by `dynamic-routes.ts`. Component resolution is constrained through `component-map.ts`, so menu `component` keys must map to known page components.

HTTP access goes through `src/shared/api`: `createHttpClient` unwraps `{ code, data, message }` responses and centralizes token injection plus 401/403/error callbacks. `src/app/providers/http.ts` connects those callbacks to the auth store, router redirects, i18n messages, and Element Plus notifications.

### User web app

`apps/web-user/src/main.js` registers Pinia, the router, global components, directives, SVG icons, Vant-related setup, and app styles. The app is a mobile SPA with feature views under `src/views` and reusable logic split across `src/components`, `src/composables`, `src/services`, `src/stores`, and `src/untils`.

Routing is module based: `src/router/index.ts` auto-collects `src/router/modules/*.ts` using `import.meta.glob`, creates hash history, and applies auth/page-title guards. When adding pages, define the route in the relevant module and keep route meta consistent with the existing `RouteMeta` type.

API calls are organized by feature under `src/services/api`, with endpoint constants under `src/services/api/endpoints`. All network traffic should go through `src/services/http`: `http.js` exposes `get/post/put/patch/del`, `request.js` owns the Axios instance/interceptors, and `policies.js` implements request retry, dedupe, cache, location injection, loading integration, throttled error alerts, and log sanitization via `config.meta` options.

Pinia stores live in `src/stores/modules` for user/session, addresses, locations, and loading. Location state is important because HTTP policies can inject latitude/longitude into location-based requests. Composables are grouped by scope: `app` for app-level behavior, `ui` for interface interactions, `swr` for stale-while-revalidate data fetching, and `features` for business-specific logic.

`apps/web-user` has its own existing `AGENTS.md` and `AGENTS.md`; consult them when working only inside that app because they contain more detailed mobile-app guidance.

## Configuration Notes

- Both web apps use `@` as an alias for their local `src` directory.
- `apps/web-admin/vite.config.ts` proxies `/api` to `http://127.0.0.1:3000` and auto-imports Vue, Vue Router, Pinia, Vue I18n, and Element Plus APIs/components.
- `apps/web-user/vite.config.js` proxies `/api`, `/ele-api`, and `/pay-api` to the local Nest backend on port `3000`; `dev:mock` enables mocks from `apps/web-user/mock`.
- Web builds run `vue-tsc --noEmit` before `vite build`; fix type errors before treating a build as successful.
- User-web Vitest runs in `happy-dom` and matches `src/**/*.test.{js,ts}`. Admin Vitest runs in `node` and matches `src/**/*.{test,spec}.ts`. Backend Jest matches `apps/server/src/**/*.spec.ts` via the package-local Jest config.

