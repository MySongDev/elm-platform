# Sidebar Pure Admin Alignment Design

## Background

The current admin Sidebar lives in `apps/web-admin/src/widgets/admin-layout/ui/Sidebar/` and contains three files:

- `index.vue`: route filtering, active menu resolution, open key synchronization, Element Plus menu shell, and most Sidebar styling.
- `SidebarItem.vue`: recursive menu rendering and simple "one child" flattening.
- `Logo.vue`: expanded and collapsed logo text.

The reference implementation is `D:\Software\Github\vue-pure-admin-main\src\layout\components\lay-sidebar`. Its Sidebar experience is built around `NavVertical.vue`, recursive `SidebarItem.vue`, link wrapping, center and bottom collapse controls, fixed scroll sizing, Element Plus popup styling, and collapse-specific active indicators.

The goal is to align this project with the reference Sidebar behavior and experience first, without importing the entire vue-pure-admin layout system.

## Scope

Implement an A+C alignment:

- A: align core Sidebar behavior.
- C: align the visible Sidebar experience as much as practical.

This does not include a full B-style restructuring into `NavVertical`, `NavMix`, or `NavHorizontal`. It also does not introduce the reference project's global `useNav`, `layout` modes, `mitt` logo events, global storage model, or theme configuration system.

## Recommended Approach

Use a lightweight reference-inspired implementation inside the existing Sidebar folder.

Keep `AdminLayout.vue` as the source of collapse state. `Sidebar` continues to receive `collapse` from the layout. Add a toggle event from Sidebar so center and bottom collapse controls can reuse the same state transition as the top hamburger.

Add only small local components where they clarify behavior:

- `SidebarLinkItem.vue`: wraps internal routes with `router-link` and external links with `a`.
- `SidebarCenterCollapse.vue`: center floating collapse control shown on hover or while collapsed.
- `SidebarLeftCollapse.vue`: bottom collapse control visible on desktop layout.

Retain and improve:

- `index.vue`: owns route filtering, active path, menu open key synchronization, menu loading shell if needed, and root sidebar layout.
- `SidebarItem.vue`: owns recursive rendering, visible child selection, one-child flattening, icon/title selection, path resolution, and item classes.
- `Logo.vue`: remains a local logo component, with reference-style sizing and alignment.

## Behavior Design

The Sidebar should:

- Filter `authStore.menuRoutes` through the existing permission logic.
- Sort root menu items by `meta.order`.
- Use `route.meta.activePath` before `route.path` for active highlighting.
- Use Element Plus `unique-opened` for reference-like single expanded branch behavior.
- Use `collapse-transition=false` so collapse width animation is controlled by the layout styles rather than Element Plus nested transitions.
- Keep route-driven open key synchronization so refreshing or navigating directly opens the correct parent branch.
- Keep user manual open and close state in sync with route changes.
- Flatten a parent route when there is exactly one visible child unless the parent declares `meta.alwaysShow`.
- Preserve `meta.hidden` filtering.
- Render parent icon or child icon consistently when a parent is flattened to its only child.
- Support external links if a route path or route name is an HTTP URL.

## Experience Design

The Sidebar should visually follow the reference implementation:

- Fixed left sidebar with full height and visible overflow for the center collapse affordance.
- Logo area approximately 48-50px high.
- Scrollbar height accounts for logo and bottom collapse control.
- Center collapse control appears when the mouse is over the sidebar or the sidebar is collapsed.
- Bottom collapse control remains available at the bottom on desktop.
- Active leaf menu items use a primary-color rounded background in expanded state.
- Active collapsed top-level items use a left vertical indicator.
- Inline submenu background uses the darker nested menu background already present in the current implementation.
- Popup submenu background follows the nested submenu color.
- Menu text fades or hides cleanly while collapsed.
- Icons stay centered in collapsed state.

## Component Contracts

`Sidebar/index.vue`

- Props: `collapse: boolean`
- Emits: `toggleCollapse`
- Responsibilities: filtered menu data, active menu, open key sync, hover state for center collapse, root Element Plus menu shell, sidebar layout styles.

`Sidebar/SidebarItem.vue`

- Props: `route: RouteRecordRaw`, `basePath?: string`, `isNest?: boolean`
- Responsibilities: recursive menu rendering, path resolving, one-child flattening, icon/title display, link wrapping, submenu vs leaf decision.

`Sidebar/SidebarLinkItem.vue`

- Props: `to: RouteRecordRaw | string`
- Responsibilities: choose `router-link` for internal routes and `a[target=_blank]` for external links.

`Sidebar/SidebarCenterCollapse.vue`

- Props: `isActive: boolean`
- Emits: `toggleClick`
- Responsibilities: reference-style floating collapse control.

`Sidebar/SidebarLeftCollapse.vue`

- Props: `isActive: boolean`
- Emits: `toggleClick`
- Responsibilities: reference-style bottom collapse control.

`Sidebar/Logo.vue`

- Props: `collapse: boolean`
- Responsibilities: stable logo area, expanded title, compact title, reference-style transition.

## Data Flow

`AdminLayout.vue` owns `isCollapse` and `toggleCollapse()`.

`AdminLayout.vue` passes:

- `:collapse="isCollapse"` to Sidebar and TopNavigation.
- `@toggle-collapse="toggleCollapse"` to Sidebar.

`Sidebar/index.vue` computes menu state from:

- `authStore.menuRoutes`
- `authStore.userInfo?.role`
- `authStore.permissions`
- `route.path`
- `route.meta.activePath`

`SidebarItem.vue` receives already filtered route branches but may still filter children defensively with the existing permission helper to preserve current behavior.

## Styling Plan

Keep styling local to the Sidebar components and reuse the current project variables:

- `$sidebar-width`
- `$sidebar-collapsed-width`
- `$sidebar-bg`
- `$sidebar-text`
- `$sidebar-active-text`
- `$border-light`
- `$white-color`
- `var(--app-transition-duration)`

Avoid copying the entire vue-pure-admin global `sidebar.scss`; extract only relevant vertical-sidebar rules and translate them to the current token system.

## Error Handling And Edge Cases

- Empty menu data renders an empty menu without crashing.
- Routes with hidden meta are skipped.
- Routes with all children filtered out are skipped by existing permission filtering.
- Relative child paths are resolved against the parent full path.
- Duplicate slashes are normalized.
- External links open in a new tab with `rel="noopener"`.
- Active path fallback remains `route.path` when `meta.activePath` is absent.

## Testing And Verification

Run project verification after implementation:

- `pnpm build` from repository root.

If practical, add focused unit coverage for pure menu path helpers or keep manual verification if the change remains SFC/style oriented.

Manual checks:

- Expanded sidebar shows nested menus and highlights active leaf.
- Collapsed sidebar centers icons and shows active indicator.
- Clicking top hamburger, center collapse, and bottom collapse all use the same collapse state.
- Direct navigation to a nested route opens the correct parent branch.
- A route with a single visible child is flattened unless `alwaysShow` is true.
- Popup submenu colors match the nested background.

## Out Of Scope

- `NavHorizontal.vue` and `NavMix.vue`.
- vue-pure-admin global layout mode support.
- Theme switcher integration.
- Mobile drawer/sidebar behavior.
- Full replacement of the current admin layout architecture.
- Introducing `@pureadmin/utils`, `path-browserify`, or reference project storage APIs.
