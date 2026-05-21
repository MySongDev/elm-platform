# Entities Cohesion Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor every `src/entities/*` slice into a consistent folder-based public API structure without changing runtime behavior.

**Architecture:** Each entity exposes a single public barrel from `src/entities/<entity>/index.ts`. API functions live in `api/index.ts`; domain types and stores live in `model/`; external code imports only from `@/entities/<entity>`. Existing Vue/FSD boundaries stay unchanged.

**Tech Stack:** Vue 3, TypeScript, Pinia, Vite path alias `@`, `vue-tsc --noEmit` for validation.

---

## File Structure

### Normal data entities

Convert these entities from flat files to folder-based modules:

- `src/entities/department`
- `src/entities/food`
- `src/entities/log`
- `src/entities/monitor`
- `src/entities/order`
- `src/entities/permission`
- `src/entities/restaurant`
- `src/entities/role`
- `src/entities/system-menu`
- `src/entities/user`

Target shape for each entity that has both API and types:

```txt
src/entities/<entity>/
  api/index.ts      # contents of old api.ts
  model/types.ts    # contents of old types.ts
  model/index.ts    # export * from './types'
  index.ts          # export * from './api'; export * from './model'
```

For `log`, which currently has `api.ts`, `types.ts`, and `index.ts`, use the same shape.

### Store/model entities

Normalize these entities:

```txt
src/entities/session/
  api/index.ts
  model/store.ts
  model/types.ts
  model/index.ts
  index.ts

src/entities/tab/
  model/lib.ts
  model/store.ts
  model/types.ts
  model/index.ts
  index.ts

src/entities/notification/
  model/store.ts
  model/types.ts
  model/index.ts
  index.ts
```

Remove legacy compatibility files after imports are verified:

- `src/entities/session/api.ts`
- `src/entities/session/types.ts`
- `src/entities/session/model.ts`
- `src/entities/tab/model.ts`
- `src/entities/notification/model.ts`
- every old flat `api.ts` and `types.ts` that was moved.

---

### Task 1: Inventory Current Entity Imports

**Files:**
- Inspect: `src/**/*.ts`
- Inspect: `src/**/*.vue`

- [ ] **Step 1: Find forbidden deep entity imports before moving files**

Run:

```bash
npx vue-tsc --noEmit
```

Expected: command exits `0` before refactor starts.

Run:

```bash
rg "@/entities/[^'\"]+/(api|types|model)(['\"]|/)" src
```

Expected: no output. If there is output, update those imports to the public entity barrel before moving files. Example replacement:

```ts
// after
import type { OrderItem } from '@/entities/order'
// before
import type { OrderItem } from '@/entities/order/types'

import { getOrders } from '@/entities/order'
import { getOrders } from '@/entities/order/api'
```

---

### Task 2: Migrate Normal Data Entities

**Files:**
- Move: `src/entities/department/api.ts` → `src/entities/department/api/index.ts`
- Move: `src/entities/department/types.ts` → `src/entities/department/model/types.ts`
- Create/Modify: `src/entities/department/model/index.ts`
- Modify: `src/entities/department/index.ts`
- Repeat for `food`, `log`, `monitor`, `order`, `permission`, `restaurant`, `role`, `system-menu`, `user`

- [ ] **Step 1: Create folders for normal entities**

Run:

```powershell
$entities = 'department','food','log','monitor','order','permission','restaurant','role','system-menu','user'; foreach ($entity in $entities) { New-Item -ItemType Directory -Force "src/entities/$entity/api" | Out-Null; New-Item -ItemType Directory -Force "src/entities/$entity/model" | Out-Null }
```

Expected: command exits `0`.

- [ ] **Step 2: Move old API and type files**

Run:

```powershell
$entities = 'department','food','log','monitor','order','permission','restaurant','role','system-menu','user'; foreach ($entity in $entities) { if (Test-Path "src/entities/$entity/api.ts") { Move-Item "src/entities/$entity/api.ts" "src/entities/$entity/api/index.ts" }; if (Test-Path "src/entities/$entity/types.ts") { Move-Item "src/entities/$entity/types.ts" "src/entities/$entity/model/types.ts" } }
```

Expected: files move into their new folders.

- [ ] **Step 3: Create model barrels for normal entities**

Run:

```powershell
$entities = 'department','food','log','monitor','order','permission','restaurant','role','system-menu','user'; foreach ($entity in $entities) { Set-Content -Encoding utf8 "src/entities/$entity/model/index.ts" "export * from './types'`n" }
```

Expected: each entity has `model/index.ts` exporting `types.ts`.

- [ ] **Step 4: Rewrite public barrels for normal entities**

Run:

```powershell
$entities = 'department','food','log','monitor','order','permission','restaurant','role','system-menu','user'; foreach ($entity in $entities) { Set-Content -Encoding utf8 "src/entities/$entity/index.ts" "export * from './api'`nexport * from './model'`n" }
```

Expected: each normal entity exposes API and model from the root barrel.

---

### Task 3: Normalize Session Entity

**Files:**
- Move: `src/entities/session/api.ts` → `src/entities/session/api/index.ts`
- Move: `src/entities/session/types.ts` → `src/entities/session/model/types.ts`
- Keep: `src/entities/session/model/store.ts`
- Modify: `src/entities/session/model/index.ts`
- Modify: `src/entities/session/index.ts`
- Delete: `src/entities/session/model.ts`

- [ ] **Step 1: Create session API folder and move files**

Run:

```powershell
New-Item -ItemType Directory -Force "src/entities/session/api" | Out-Null; if (Test-Path "src/entities/session/api.ts") { Move-Item "src/entities/session/api.ts" "src/entities/session/api/index.ts" }; if (Test-Path "src/entities/session/types.ts") { Move-Item "src/entities/session/types.ts" "src/entities/session/model/types.ts" }
```

Expected: `session/api/index.ts` and `session/model/types.ts` exist.

- [ ] **Step 2: Rewrite session barrels**

Set `src/entities/session/model/index.ts` to:

```ts
export * from './store'
export * from './types'
```

Set `src/entities/session/index.ts` to:

```ts
export * from './api'
export * from './model'
```

- [ ] **Step 3: Delete legacy session model shim**

Run:

```powershell
if (Test-Path "src/entities/session/model.ts") { Remove-Item "src/entities/session/model.ts" }
```

Expected: `src/entities/session/model.ts` is gone.

---

### Task 4: Normalize Tab and Notification Entities

**Files:**
- Keep: `src/entities/tab/model/lib.ts`
- Keep: `src/entities/tab/model/store.ts`
- Keep: `src/entities/tab/model/types.ts`
- Modify: `src/entities/tab/model/index.ts`
- Modify: `src/entities/tab/index.ts`
- Delete: `src/entities/tab/model.ts`
- Keep: `src/entities/notification/model/store.ts`
- Keep: `src/entities/notification/model/types.ts`
- Modify: `src/entities/notification/model/index.ts`
- Modify: `src/entities/notification/index.ts`
- Delete: `src/entities/notification/model.ts`

- [ ] **Step 1: Rewrite tab barrels**

Set `src/entities/tab/model/index.ts` to:

```ts
export * from './lib'
export * from './store'
export * from './types'
```

Set `src/entities/tab/index.ts` to:

```ts
export * from './model'
```

- [ ] **Step 2: Rewrite notification barrels**

Set `src/entities/notification/model/index.ts` to:

```ts
export * from './store'
export * from './types'
```

Set `src/entities/notification/index.ts` to:

```ts
export * from './model'
```

- [ ] **Step 3: Delete legacy model shims**

Run:

```powershell
if (Test-Path "src/entities/tab/model.ts") { Remove-Item "src/entities/tab/model.ts" }; if (Test-Path "src/entities/notification/model.ts") { Remove-Item "src/entities/notification/model.ts" }
```

Expected: legacy top-level model shim files are gone.

---

### Task 5: Fix Internal Relative Imports After Moves

**Files:**
- Inspect/Modify: `src/entities/**/api/index.ts`
- Inspect/Modify: `src/entities/**/model/store.ts`
- Inspect/Modify: `src/entities/**/model/lib.ts`

- [ ] **Step 1: Fix API files that imported sibling `types.ts`**

Search:

```bash
rg "from './types'|from \"./types\"|from '../types'|from \"../types\"" src/entities
```

Expected: any moved API file importing old sibling types must change to `../model` or `../model/types`.

Use this pattern:

```ts
// in src/entities/order/api/index.ts
import type { OrderItem } from '../model'
```

- [ ] **Step 2: Fix store files that imported moved root types/API**

Search:

```bash
rg "from '../api'|from '../types'|from './types'" src/entities/session src/entities/tab src/entities/notification
```

Expected patterns:

```ts
// store imports same-folder types
import type { SessionUser } from './types'

// store imports sibling api folder
import { getUserInfo } from '../api'
```

Keep same-folder `./types` imports in model files. Change any `../types` imports to `./types`.

---

### Task 6: Verify Public Import Rule

**Files:**
- Inspect/Modify: `src/**/*.ts`
- Inspect/Modify: `src/**/*.vue`

- [ ] **Step 1: Search for forbidden deep imports**

Run:

```bash
rg "@/entities/[^'\"]+/(api|types|model)(['\"]|/)" src
```

Expected: no output.

If output exists, replace each with the root entity barrel:

```ts
import type { RoleItem } from '@/entities/role'
import { getRoles } from '@/entities/role'
```

- [ ] **Step 2: Search for deleted file imports**

Run:

```bash
rg "entities/.+/(api|types|model)\.ts|ConfigTableColumns|ConfigTableCellTag" src
```

Expected: no output for deleted entity file paths. `ConfigTableColumns` and `ConfigTableCellTag` may appear only inside `src/shared/config-crud/components/ConfigDataTable/`.

---

### Task 7: Run Type Check and Fix Path Errors

**Files:**
- Modify any file reported by `vue-tsc` with broken imports.

- [ ] **Step 1: Run type check**

Run:

```bash
npx vue-tsc --noEmit
```

Expected: exits `0` with no output.

- [ ] **Step 2: Fix any import path failures**

Common fixes:

```ts
// after
import type { UserInfo } from '../model'

// API file moved from entity/api.ts to entity/api/index.ts
// before
import type { UserInfo } from './types'
```

```ts
// model store file should import local model types
// before
import type { TabItem } from '../types'

// after
import type { TabItem } from './types'
```

Run `npx vue-tsc --noEmit` again after every group of fixes. Expected final result: no output.

---

### Task 8: Final Structure Check

**Files:**
- Inspect: `src/entities/**`

- [ ] **Step 1: Confirm no flat legacy files remain**

Run:

```bash
find src/entities -maxdepth 2 \( -name api.ts -o -name types.ts -o -name model.ts \)
```

Expected: no output.

On PowerShell, use:

```powershell
Get-ChildItem "src/entities" -Recurse -File | Where-Object { $_.Name -in @('api.ts','types.ts','model.ts') } | Select-Object -ExpandProperty FullName
```

Expected: no output.

- [ ] **Step 2: Confirm public barrels exist**

Run:

```powershell
$entities = Get-ChildItem "src/entities" -Directory; foreach ($entity in $entities) { if (-not (Test-Path "$($entity.FullName)/index.ts")) { Write-Output $entity.Name } }
```

Expected: no output.

---

## Self-Review

- Spec coverage: plan covers normal entities, store/model entities, barrel exports, deep import policy, old file deletion, and type validation.
- Placeholder scan: no placeholder steps remain; commands and expected outputs are explicit.
- Type consistency: target import rules use entity root barrels externally and relative `../model` or `./types` internally.
