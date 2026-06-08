# Admin Table Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add opt-in enterprise table capabilities to the admin ConfigDataTable: row selection, batch actions, column visibility preferences, density switching, and CSV export.

**Architecture:** Extend the existing `shared/config-crud` table model instead of creating a second table system. Put pure logic in small testable files (`table-preferences.ts`, `csv.ts`) and keep `ConfigDataTable` as the UI integration layer. Enable the new features on one representative page (`RestaurantManagementPage`) to prove compatibility without migrating all pages.

**Tech Stack:** Vue 3, TypeScript, Element Plus, Vitest, existing `shared/config-crud`, existing `AdminTablePage`.

---

## Scope

This plan implements Step 3 from `docs/superpowers/specs/2026-06-03-admin-enterprise-enhancement-design.md`:

- Selection column
- Batch action toolbar
- Column visibility settings with `preferencesKey`
- Table density switching
- CSV export for current visible columns and current data
- Representative opt-in usage on Restaurant Management

This plan does not implement Step 4 workflow components or Step 5 merchant onboarding.

## Files

### Create

- `apps/web-admin/src/shared/config-crud/model/table-preferences.ts`
  - Pure helpers for default visible keys, storage parsing, and visibility merging.
- `apps/web-admin/src/shared/config-crud/model/csv.ts`
  - Pure CSV escaping and export content generation.
- `apps/web-admin/src/shared/config-crud/model/__tests__/table-preferences.test.ts`
  - Tests preference merge and invalid storage fallback.
- `apps/web-admin/src/shared/config-crud/model/__tests__/csv.test.ts`
  - Tests CSV escaping and visible-column export.

### Modify

- `apps/web-admin/src/shared/config-crud/model/table.ts`
  - Extend table types with enhanced options and helper exports.
- `apps/web-admin/src/shared/config-crud/components/ConfigDataTable/index.vue`
  - Add toolbar, selection, column settings, density select, and CSV export.
- `apps/web-admin/src/shared/config-crud/components/ConfigDataTable/ConfigTableColumns.vue`
  - Render only visible columns passed from parent.
- `apps/web-admin/src/shared/config-crud/index.ts`
  - Export new types/helpers.
- `apps/web-admin/src/shared/i18n/lang/zh-CN.ts`
  - Add `tableEnhance` labels.
- `apps/web-admin/src/shared/i18n/lang/en.ts`
  - Add matching labels.
- `apps/web-admin/src/features/restaurant-management/model/useRestaurantManagement.ts`
  - Add `batchDeleteRows()` for one-confirm batch delete.
- `apps/web-admin/src/features/restaurant-management/ui/RestaurantManagementPage.vue`
  - Enable selection, batch delete, column settings, density, and CSV export.

## Tasks

### Task 1: Pure helpers and tests

- [ ] Add `table-preferences.ts` with helpers:
  - `getColumnPreferenceKey(column, index)`
  - `getDefaultVisibleColumnKeys(columns)`
  - `mergeVisibleColumnKeys(columns, storedKeys)`
  - `parseStoredVisibleColumnKeys(value)`
- [ ] Add `csv.ts` with helpers:
  - `escapeCsvCell(value)`
  - `buildCsvContent(columns, rows)`
- [ ] Add Vitest coverage for both files.
- [ ] Run:

```powershell
corepack pnpm --filter @elm-platform/web-admin exec vitest run src/shared/config-crud/model/__tests__/table-preferences.test.ts src/shared/config-crud/model/__tests__/csv.test.ts
```

### Task 2: Extend table model and ConfigDataTable UI

- [ ] Extend `ConfigTableColumn` with:
  - `key?: string`
  - `hideable?: boolean`
  - `defaultVisible?: boolean`
  - `exportable?: boolean`
- [ ] Add table option types:
  - `ConfigTableDensity = 'default' | 'comfortable' | 'compact'`
  - `ConfigTableBatchAction<Row>`
  - enhanced options on `ConfigDataTableOptions`
- [ ] Add selection column when `table.selection` is enabled.
- [ ] Add toolbar when any enhanced feature is enabled.
- [ ] Add column checkbox popover when `preferencesKey` exists.
- [ ] Add density select when `density` exists.
- [ ] Add CSV export button when `exportable` is true.
- [ ] Emit `batch-action` with selected rows.

### Task 3: Representative Restaurant page opt-in

- [ ] Add i18n labels for table enhancement controls.
- [ ] Add `batchDeleteRows(rows)` to `useRestaurantManagement()` with one confirmation and one success message.
- [ ] Enable enhanced table options in `RestaurantManagementPage`:
  - selection
  - batch delete
  - preferencesKey: `commerce.restaurant.table`
  - density: default
  - exportable
- [ ] Wire `@batch-action` to batch delete handler.

### Task 4: Verification

- [ ] Run focused tests.
- [ ] Run full admin tests.
- [ ] Run type-check.
- [ ] Run lint.
- [ ] Run build.

## Verification Commands

```powershell
corepack pnpm --filter @elm-platform/web-admin exec vitest run src/shared/config-crud/model/__tests__/table-preferences.test.ts src/shared/config-crud/model/__tests__/csv.test.ts src/shared/config-crud/model/__tests__/table.test.ts
corepack pnpm --filter @elm-platform/web-admin run test:unit
corepack pnpm --filter @elm-platform/web-admin run type-check
corepack pnpm --filter @elm-platform/web-admin run lint
corepack pnpm --filter @elm-platform/web-admin run build
```

## Notes

- All enhanced features are opt-in.
- Old pages that do not pass enhanced table options should keep the same behavior.
- CSV export is intentionally simple and dependency-free.
- Batch delete is enabled only on Restaurant Management in this step.

