# Three App Stability Refactor Design

## Background

The repository contains three active applications:

- `apps/server`: NestJS backend with Prisma, Redis, auth, admin APIs, and ELM compatibility APIs.
- `apps/web-admin`: Vue 3 admin dashboard with Element Plus, dynamic routing, Pinia, and a shared `config-crud` layer.
- `apps/web-user`: Vue 3 mobile app with Vant, Pinia, HTTP policies, shop flows, and mobile scrolling behavior.

The current working tree already includes uncommitted work across all three apps. This design treats those changes as existing user work and builds on them without reverting unrelated edits.

## Goals

1. Improve low-risk stability across all three apps.
2. Make small structural refactors where a file or module is clearly carrying unrelated responsibilities.
3. Preserve public API behavior, route behavior, and UI flows.
4. Add or keep focused tests around changed behavior.

## Non-Goals

- No full rewrite of backend admin APIs.
- No broad migration of every admin page to a new CRUD abstraction in this pass.
- No large redesign of the mobile UI.
- No image compression pipeline or asset replacement in this pass.
- No database schema migration unless a failing test proves it is required.

## Backend Design

### Stability

The backend changes focus on authorization and ELM query parsing.

`apps/server/src/modules/auth/guards/roles.guard.ts` should keep accepting role and permission metadata from decorators, but handle missing or null permission arrays safely. It should continue to allow wildcard permission `*:*:*`, reject disabled users, and reject requests without a valid user id.

`apps/server/src/modules/elm/utils/elm-query.ts` should normalize query values consistently:

- string values are returned as-is.
- array values use the first item.
- null, undefined, blank numeric strings, and invalid numbers fall back to the supplied fallback.
- geohash parsing only succeeds for two nonblank numeric coordinates.

### Structure

`apps/server/src/modules/admin/admin.service.ts` is the largest backend file and currently mixes service methods with fallback data and static permission catalogs. This pass should extract static data and related types into a nearby module, for example:

- `apps/server/src/modules/admin/constants/admin-permissions.ts`
- `apps/server/src/modules/admin/constants/admin-fallback-data.ts`

The `AdminService` should import those constants and keep its runtime behavior unchanged.

## Admin Web Design

### Stability

The admin changes should continue the existing `shared/config-crud` direction:

- Keep default table, dialog, form, and action options centralized in model files.
- Support static and function-based save success messages.
- Keep CRUD feedback injectable so model tests can run without Element Plus UI side effects.
- Preserve existing business page behavior and auth directives.

### Structure

The shared CRUD layer should remain the boundary for reusable table/form/action behavior. The pass may refine files under:

- `apps/web-admin/src/shared/config-crud/model/*`
- `apps/web-admin/src/shared/config-crud/components/*`

Business pages should only be touched when required to align with the shared CRUD contract. Avoid migrating unrelated admin pages during this pass.

## User Web Design

### Stability

The mobile app has several production-facing debug logs and small scrolling risks. This pass should:

- Remove page-level debug `console.log` calls from user-facing Vue views.
- Keep dev server logging only in local server files where it is intentionally operational.
- Avoid duplicate scroll listeners in `msite.vue` when the page is kept alive.
- Keep `useLoadMore` behavior stable while avoiding obvious unsafe access patterns.

### Structure

The user app should receive light structural cleanup only:

- Remove unused state introduced by earlier scroll experiments.
- Keep page behavior in place.
- Avoid splitting large mobile views unless the edit is necessary for stability.

## Testing Strategy

Run focused tests after implementation:

- Backend: `pnpm --filter @elm-platform/server run test -- roles.guard.spec.ts elm-query.spec.ts transform.interceptor.spec.ts`
- Admin: `pnpm --filter @elm-platform/web-admin run test:unit -- src/shared/config-crud/model/__tests__/useConfigCrud.test.ts src/shared/config-crud/model/__tests__/table.test.ts src/features/user-management/model/__tests__/useUserManagement.test.ts`
- User: `pnpm --filter @elm-platform/web-user run test -- src/services/http/policies.test.js src/composables/features/home/useHomeLocation.test.ts src/stores/modules/store-locations.test.js`

If those pass, run broader verification as time allows:

- `pnpm build`

## Risks

- The working tree already contains many uncommitted changes. Implementation must avoid overwriting unrelated edits.
- Extracting backend constants can create circular imports if the service types are not separated cleanly.
- Admin `config-crud` generic changes can surface TypeScript issues in business pages.
- User mobile scroll behavior is sensitive to keep-alive lifecycle hooks and should be tested manually if a dev server is available.

## Acceptance Criteria

1. Existing auth and admin API behavior is preserved.
2. Backend query parsing handles null, blank, array, invalid, and geohash edge cases.
3. Admin shared CRUD tests cover dynamic save messages and default option helpers.
4. User mobile app no longer emits page-level debug logs in production-facing views touched by this pass.
5. Focused tests for changed areas pass, or any inability to run them is explicitly reported.

