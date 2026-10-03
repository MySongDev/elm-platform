# web-admin FSD 层级收敛实施书

> **前置**：先读 `01-plan.md`（为什么做、6 个决策的依据）。本文件只讲**怎么做**。
> **状态**：⏸ 未实施
> **数据基线**：2026-10-03 实测
> **配套**：`01-plan.md` → `02-implementation.md`（本文件）→ 实施后补 `03-report.md`

---

## 0. 已定方案：删壳（成本比计划书初版估的高）

**7 个直通壳采用「删壳」**——把 `features/*/ui/*ManagementPage.vue` 提为 `pages/*/index.vue`。

`01-plan.md` 决策 1 的影响面表记的是"9 个 feature → 11 处 import 改动"。**那个数字只统计了外部消费方，漏掉了搬动后组件内部的相对引用**——实际要多改 **27 处**。

实测：每个 `*ManagementPage.vue` 都同时引用 `../config/*`、`../model/*` 和同目录的 `./XxxTable.vue`：

```ts
// features/user-management/ui/UserManagementPage.vue:6-9
import { createUserSearchFields } from '../config/fields'      // 跨目录
import { useUserManagement } from '../model/useUserManagement' // 跨目录
import UserFormDialog from './UserFormDialog.vue'              // 同目录
import UserTable from './UserTable.vue'                        // 同目录
```

把它的内容搬到 `pages/system/user/index.vue`（页面根）之后，**这 4 行全部失效**：

| 原路径 | 搬到页面根后 | 原因 |
|---|---|---|
| `../config/fields` | `./config/fields` | index.vue 在页面根，config 是它的子目录 |
| `../model/useUserManagement` | `./model/useUserManagement` | 同上 |
| `./UserTable.vue` | `./ui/UserTable.vue` | 组件留在了 `ui/` 子目录里 |
| `./UserFormDialog.vue` | `./ui/UserFormDialog.vue` | 同上 |

逐页实测（`grep -n "from '\.\./\|from '\./" features/*/ui/*ManagementPage.vue`）：

| 页面 | 页内相对 import |
|---|---|
| `platform/tenant` | 5 |
| `system/{user,role,menu,dept}` | 4 × 4 |
| `commerce/food`、`commerce/restaurant` | 3 × 2 |
| **合计** | **27 处** |

### 为什么仍选删壳

删壳比「保留壳」多改约 27 处、且必须按规则 1 处理 `defineOptions`。之所以仍然选它：

| 收益 | 说明 |
|---|---|
| **消除薄壳** | 保留壳的话，`index.vue`(9 行) 只是把跳转目标从 `features/` 换成 `pages/*/ui/`——**跳转层级一点没减少**，而"层级多导致跳转"正是本次收敛要解决的问题 |
| **页内形态统一** | 删壳后"页面主文件即实现"，与 `commerce/order`、`monitor/online`、`account/settings.vue` 一致 |
| **`ui/` 目录语义变纯** | 删壳后 `ui/` 只剩子组件，不再混着"页面主组件" |
| **顺手修一个既有缺陷** | `system/*` 四个页面的菜单 name 与组件 name 本来就不一致，keep-alive 从未生效；删壳时按规则 1 对齐即可一并修好 |

**规则 1 是删壳的配套措施，不是可选项。**

---

## 1. 前置规则（所有步骤都适用）

### 规则 1 ⚠️：`defineOptions` 的 name 必须对齐**菜单 name**

这是本次收敛**唯一会静默破坏功能**的点。

#### 机制

```vue
<!-- widgets/admin-layout/ui/MainContent/index.vue:11-15 -->
<router-view v-slot="{ Component, route }">
  <keep-alive :include="tabsStore.cachedViews">
    <component :is="Component" :key="route.fullPath" />
  </keep-alive>
</router-view>
```

`Component` 就是路由组件（即 `pages/*/index.vue`）。Vue 的 `keep-alive include` 匹配的是**被包裹组件自身的 name**，也就是该文件里 `defineOptions({ name })` 的值。

而 `cachedViews` 里装的是什么：

```ts
// entities/tab/model/lib.ts:61-67
export function resolveCacheName(route) {
  if (route.meta?.keepAlive === false)
    return undefined
  return (route.meta?.cacheName as string | undefined)
    || (route.name as string | undefined)   // ← 路由 name
}
```

```ts
// app/router/permission.ts:129
name: menu.name ?? undefined,               // ← 路由 name 来自后端菜单的 name 字段
```

**结论：`cachedViews` 里是"菜单 name"，`keep-alive` 匹配的是"组件 name"。两者必须相等，缓存才生效。**

#### 对照表（2026-10-03 实测）

| 页面 | 菜单 name（`cachedViews` 的值） | 壳的组件 name | **现在缓存？** | 删壳后若沿用实现的 name |
|---|---|---|---|---|
| `commerce/food` | `CommerceFoodView` | `CommerceFoodView` | ✅ 工作 | ❌ **断掉** |
| `commerce/restaurant` | `CommerceRestaurantView` | `CommerceRestaurantView` | ✅ 工作 | ❌ **断掉** |
| `platform/tenant` | `PlatformTenantView` | `PlatformTenantView` | ✅ 工作 | ❌ **断掉** |
| `system/user` | `UserList` | `UserListView` | ❌ 本来就坏 | ❌ 仍坏（可顺手修） |
| `system/role` | `RoleManagement` | `RoleManagementView` | ❌ 本来就坏 | ❌ 仍坏（可顺手修） |
| `system/menu` | `MenuManagement` | `MenuManagementView` | ❌ 本来就坏 | ❌ 仍坏（可顺手修） |
| `system/dept` | `DeptManagement` | `DeptManagementView` | ❌ 本来就坏 | ❌ 仍坏（可顺手修） |
| `commerce/order` | `CommerceOrderView` | `CommerceOrderView` | ✅ 工作 | 不适用（编排页，不动 name） |
| `dashboard` | `DashboardView` | `DashboardView` | ✅ 工作 | 不适用（编排页，不动 name） |

> 📌 后 4 行是一个**既有缺陷**（与本次收敛无关）：`system/*` 的菜单 name 与组件 name 一直不一致，所以那 4 个页面的多页签缓存从来没生效过。

#### 规则

> **删壳时，把搬入 `index.vue` 的 `defineOptions({ name })` 改成该页面「菜单 name」的值。**

- 对 `food` / `restaurant` / `tenant`：菜单 name 与原壳 name 相同 → **保持现状**，缓存不受影响；
- 对 `system/*`：从 `UserListView` 改成 `UserList` → **顺带修复原本失效的缓存**。

#### 为什么这个坑危险

`type-check`、单测、**连"路由冒烟"都发现不了**——页面照样打开、不报 404，问题只表现为"切走页签再切回来，表单里填的内容没了"。

#### 检查命令

```bash
# 菜单 name（cachedViews 的值）
sed -n '263,860p' apps/server/prisma/seed.ts | grep "name: '"

# 组件 name
grep -rn "defineOptions" apps/web-admin/src/pages/*/*/index.vue
```

### 规则 2：判断页面是「编排页」还是「直通壳」

```bash
wc -l apps/web-admin/src/pages/*/*/index.vue apps/web-admin/src/pages/*/*/*/index.vue
```

| 类型 | 特征 | 涉及页面 | 处理 |
|---|---|---|---|
| **编排页** | 页面**已有实现**（几十行），从 feature 取 `config/model/ui` | `commerce/order`(62 行)、`dashboard`(86 行) | 只搬目录 + 改 import，**不动页面文件本身的结构** |
| **直通壳** | 页面只有 9–13 行，整页渲染一个 feature 组件 | `system/{user,role,menu,dept}`、`platform/tenant`、`commerce/{food,restaurant}` | **删壳**（见 §0、§5.2） |

### 规则 3：搬目录后的相对 import 路径

| 情况 | 是否要改 |
|---|---|
| `@/` 开头的绝对路径 | **不用改**（`@` 始终指向 `src`） |
| 目录**整体**搬迁，目录内文件的相互引用 | **不用改**（相对关系没变） |
| 文件**单独**搬到别处（如把 `ui/XxxPage.vue` 提为 `index.vue`） | **必须改**（见 `0.` 节的表） |

---

## 2. 验证基准

**实施前先记录基线**：

```bash
cd <repo-root>
pnpm --filter @elm-platform/web-admin run type-check
pnpm --filter @elm-platform/web-admin run test:unit    # 期望 45 files / 178 tests
pnpm --filter @elm-platform/web-admin run build
NODE_OPTIONS=--max-old-space-size=4096 pnpm --filter @elm-platform/server exec jest --maxWorkers=2
                                                       # 期望 38 suites / 527 tests
```

> ⚠️ 后端测试在本机直跑会 OOM（jest 未配 `maxWorkers`）。必须带 `--maxWorkers=2`。

**每步之后都要跑**（第 4 条不能省）：

```bash
pnpm --filter @elm-platform/web-admin run type-check
pnpm --filter @elm-platform/web-admin run test:unit
pnpm --filter @elm-platform/web-admin run build
# 路由冒烟（见 §8）
```

---

## 3. 步骤 0：前置准备

`01-plan.md` 里列的工作区状态已过时（那批改动已被提交）。**以实际 `git status` 为准**：

```bash
git status --short
```

当前（2026-10-03）残留的无关改动是 `.github/`、`package.json`、`pnpm-lock.yaml`、`pnpm-workspace.yaml`、`apps/uni-user/` 等。**先处理干净或 stash，再开新分支**：

```bash
git switch -c refactor/fsd-layer-collapse
```

---

## 4. 步骤 1：样板 —— `order-management` 下沉（编排页类型）

选 `order` 打样的原因：`config/model/ui` 三件套齐全，且页面是 62 行的**编排页**（不是壳），能完整演示"目录搬迁 + import 改写"而不掺入壳的处理。

### 4.1 现状

```
pages/commerce/order/
  index.vue                          62 行，name: CommerceOrderView

features/order-management/
  config/fields.ts
  config/workflow.ts
  config/workflow.test.ts
  index.ts                           ← 桶文件，搬迁后删除
  model/orderLogDisplay.ts
  model/orderLogDisplay.test.ts
  model/useOrderManagement.ts
  ui/OrderActionColumn.vue
  ui/OrderDetailDrawer.vue
  ui/OrderTable.vue
  ui/RefundRejectDialog.vue
```

### 4.2 操作

```bash
cd apps/web-admin/src

# 1) 搬三个目录（含测试文件，测试要跟着走）
mv features/order-management/config pages/commerce/order/
mv features/order-management/model  pages/commerce/order/
mv features/order-management/ui     pages/commerce/order/

# 2) 删掉 feature 桶文件与空目录
rm features/order-management/index.ts
rmdir features/order-management
```

`pages/commerce/order/index.vue` 里改 import（**11 处待改里的 1 处**）。改前：

```ts
import {
  createOrderSearchFields,
  OrderDetailDrawer,
  OrderTable,
  RefundRejectDialog,
  useOrderManagement,
} from '@/features/order-management'
```

改后（**从桶导入变为同目录相对导入**）：

```ts
import { createOrderSearchFields } from './config/fields'
import { useOrderManagement } from './model/useOrderManagement'
import OrderDetailDrawer from './ui/OrderDetailDrawer.vue'
import OrderTable from './ui/OrderTable.vue'
import RefundRejectDialog from './ui/RefundRejectDialog.vue'
```

> 📌 `index.vue` 里原有的 `defineOptions({ name: 'CommerceOrderView' })` **保持不动**——它是编排页，name 本来就与菜单一致，且缓存正在工作。

### 4.3 `features/order-management` 被外部引用的另外 0 处

`order-management` 只被 `pages/commerce/order/index.vue` 引用，无其他消费方。

### 4.4 验收

```bash
pnpm --filter @elm-platform/web-admin run type-check
pnpm --filter @elm-platform/web-admin run test:unit
```

**另需确认**：`config/workflow.test.ts`、`model/orderLogDisplay.test.ts` 搬迁后仍被 vitest 收集（include 是 `src/**/*.{test,spec}.ts`，位置变了但仍在 `src/` 下，✅ 应正常）。

---

## 5. 步骤 2：其余 8 个 feature

### 5.1 逐个清单（含 `defineOptions` 受影响位置标注）

| feature | 页面 | 页面类型 | 页内相对 import | **`defineOptions` 处理** |
|---|---|---|---|---|
| `dashboard` | `pages/dashboard/index.vue` | 编排页 | 0（页面本就是实现，外部 import 见 §5.3） | 不动（name 已是 `DashboardView`=菜单 name ✅） |
| `user-management` | `pages/system/user/index.vue` | 直通壳 | **4 处** | ⚠️ **改为 `UserList`**（顺带修缓存） |
| `role-management` | `pages/system/role/index.vue` | 直通壳 | **4 处** | ⚠️ **改为 `RoleManagement`**（顺带修缓存） |
| `menu-management` | `pages/system/menu/index.vue` | 直通壳 | **4 处** | ⚠️ **改为 `MenuManagement`**（顺带修缓存） |
| `dept-management` | `pages/system/dept/index.vue` | 直通壳 | **4 处** | ⚠️ **改为 `DeptManagement`**（顺带修缓存） |
| `tenant-management` | `pages/platform/tenant/index.vue` | 直通壳 | **5 处** | ⚠️ **保持 `PlatformTenantView`**（=菜单 name） |
| `food-management` | `pages/commerce/food/index.vue` | 直通壳 | **3 处** | ⚠️ **保持 `CommerceFoodView`**（=菜单 name） |
| `restaurant-management` | `pages/commerce/restaurant/index.vue` | 直通壳 | **3 处** | ⚠️ **保持 `CommerceRestaurantView`**（=菜单 name） |

> 「页内相对 import」= 该页面的 `*ManagementPage.vue` 内部需要改路径的那些（`../config/*` → `./config/*` 等），**合计 27 处**。删壳时若漏改，`type-check` 会立刻报错（相对路径解析失败），不会静默——这一点与规则 1 的 `defineOptions` 不同。

> ⚠️ 标记的行就是**规则 1 的受影响位置**。`food`/`restaurant`/`tenant` 若照抄实现里的 name，会**断掉正在工作的缓存**；`system/*` 改成菜单 name 则是**顺手修 bug**。

### 5.2 直通壳的操作模板（以 `system/user` 为例）

```bash
cd apps/web-admin/src

# 1) 搬目录
mv features/user-management/config pages/system/user/
mv features/user-management/model  pages/system/user/
mv features/user-management/ui     pages/system/user/

# 2) 把实现提为页面入口（覆盖原 9 行壳）
mv pages/system/user/ui/UserManagementPage.vue pages/system/user/index.vue

# 3) 删桶文件与空目录
rm features/user-management/index.ts
rmdir features/user-management
```

> ⚠️ 第 2 步的 `mv` 会**静默覆盖**原来的 `index.vue`。被覆盖的 9 行壳里那唯一一行 `import { UserManagementPage } from '@/features/user-management'` 随之消失——**不需要单独去改它**。

然后改 `pages/system/user/index.vue`（此时它的内容已是原 `UserManagementPage.vue` 的）：

```diff
-import { createUserSearchFields } from '../config/fields'
-import { useUserManagement } from '../model/useUserManagement'
-import UserFormDialog from './UserFormDialog.vue'
-import UserTable from './UserTable.vue'
+import { createUserSearchFields } from './config/fields'
+import { useUserManagement } from './model/useUserManagement'
+import UserFormDialog from './ui/UserFormDialog.vue'
+import UserTable from './ui/UserTable.vue'
```

```diff
-defineOptions({ name: 'UserManagementPage' })
+defineOptions({ name: 'UserList' })        // 规则 1：对齐菜单 name
```

**其余 6 个壳同法处理**，差异只有两处：页内 import 的条数（见 §5.1），以及 `defineOptions` 该写成什么 name（见 §5.1 最后一列）。

### 5.3 `dashboard` 的两处 import（易漏）

`pages/dashboard/index.vue` 有两处引用（**11 处里的 2 处**）：

```ts
// :8  桶导入
import { ... } from '@/features/dashboard'

// :20 唯一一处指向 feature「内部文件」的深层动态 import —— 最容易漏
loader: () => import('@/features/dashboard/components/OrderTrendChart.vue')
```

改后：

```ts
import { ... } from './model/useDashboardOverview'   // 按 :8 实际导入的符号调整
loader: () => import('./components/OrderTrendChart.vue')
```

`features/dashboard` 与其余 feature 结构不同（无 `config/`、无 `ui/`，用 `components/` + `lib/`），搬运时按实际目录走：

```bash
mv features/dashboard/api        pages/dashboard/
mv features/dashboard/components pages/dashboard/
mv features/dashboard/lib        pages/dashboard/
mv features/dashboard/model      pages/dashboard/
rm features/dashboard/index.ts && rmdir features/dashboard
```

### 5.4 测试文件的额外一处

```diff
-// apps/web-admin/src/app/router/__tests__/dynamic-routes.test.ts:5
-import { getDashboardOverview } from '@/features/dashboard/api/dashboard'
+import { getDashboardOverview } from '@/pages/dashboard/api/dashboard'
```

这是 11 处待改 import 里唯一在**测试文件**里的一处。

---

## 6. 步骤 3：6 个单消费 entity 下沉

### 6.1 清单

| entity | 目标位置 | 待改 import |
|---|---|---|
| `entities/order` | `pages/commerce/order/model/` | 8 |
| `entities/role` | `pages/system/role/model/` | 7 |
| `entities/department` | `pages/system/dept/model/` | 5 |
| `entities/food` | `pages/commerce/food/model/` | 4 |
| `entities/restaurant` | `pages/commerce/restaurant/model/` | 4 |
| `entities/monitor` | `pages/monitor/online/model/` | 3 |
| **合计** | | **31** |

**不下沉**：`entities/log`（跨 3 个 page）、`entities/notification`（消费者在布局层）。

> ⚠️ **顺序依赖**：本步必须在步骤 2 之后做——`entities/order` 的消费方在 `features/order-management/` 里，而那个目录在步骤 2 已经搬到 `pages/commerce/order/`。先做步骤 2，这里的替换目标才是最终路径。

### 6.2 操作模板（以 `entities/order` 为例）

**已核实：6 个 entity 结构完全同构，且与目标目录无任何文件名冲突。**

各 entity 都是 `api/index.ts` + `model/index.ts`(1 行纯转发) + `model/types.ts`；而各目标页面的 `model/` 下只有 `use*Management.ts` / `payload.ts` / `permission-tree.ts`，**没有任何 `types.ts`**。

```bash
cd apps/web-admin/src

# 1) api 整体搬入（新建 api/ 子目录，含它的测试文件）
mv entities/order/api pages/commerce/order/api

# 2) model/types.ts 搬入（与已有的 useOrderManagement.ts 并存，不冲突）
mv entities/order/model/types.ts pages/commerce/order/model/types.ts

# 3) model/index.ts 是 1 行纯转发（export * from './types'），按"删桶文件"原则删掉
rm entities/order/model/index.ts
rmdir entities/order/model entities/order
```

**改引用（8 处）**：`entities/order` 的 8 处消费方**全部在 `features/order-management/` 内**（即搬迁后的 `pages/commerce/order/` 内），所以统一改成**相对路径**：

```diff
-// pages/commerce/order/config/fields.ts:7
-import type { FulfillmentStatus, OrderItem, RefundStatus } from '@/entities/order'
+import type { FulfillmentStatus, OrderItem, RefundStatus } from '../model/types'
```

```diff
-// pages/commerce/order/ui/OrderTable.vue:2
-import type { AdminOrderAction, OrderItem } from '@/entities/order'
+import type { AdminOrderAction, OrderItem } from '../model/types'
```

各文件的相对层级不同（`config/`、`model/`、`ui/` 都是页面下一层，统一用 `../model/types`；同目录用 `./types`）。**逐个确认**：

```bash
grep -rn "@/entities/order" pages/commerce/order/
```

**别漏 `api/index.ts` 自己的内部引用**：它原本 `from '../model'` 指向 `entities/order/model`，搬迁后层级变了：

```bash
grep -n "from '\.\." pages/commerce/order/api/index.ts
```

其余 5 个 entity 同法处理，对应关系见 §6.1 清单。

改引用（8 处）：把 `from '@/entities/order'` 换成新路径。

---

## 7. 步骤 4：`widgets` → `layouts/admin-layout/`

```bash
cd apps/web-admin/src
mv widgets/admin-layout layouts/admin-layout
rmdir widgets
```

**4 处 import 要改。推荐做法：统一用别名，只替换路径前缀。**

```bash
cd apps/web-admin/src
# 机械替换：@/widgets/ → @/layouts/
grep -rl "@/widgets/" --include="*.ts" --include="*.vue" . | xargs sed -i 's|@/widgets/|@/layouts/|g'
```

改完后：

| 文件 | 改后 |
|---|---|
| `layouts/index.vue:2` | `@/layouts/admin-layout/ui/AdminLayout.vue` |
| `.../Sidebar/components/collapse/SidebarFooterCollapse.vue:2` | `@/layouts/admin-layout/ui/Sidebar` |
| `.../Sidebar/components/menu/SidebarMenu.vue:4` | `@/layouts/admin-layout/ui/Sidebar/composables/useSidebarMenu` |
| `.../TopNavigation/HeaderSidebarToggle/index.vue:2` | `@/layouts/admin-layout/ui/Sidebar` |

**为什么用别名而不是相对路径**：相对路径要按文件位置逐个数 `../`，实测这几处的深度并不一致（`Sidebar/components/*` 下的文件到 `Sidebar/` 是 `../../`，`TopNavigation/HeaderSidebarToggle/` 下的文件到 `Sidebar/` 也是 `../../`，但目标从"上级目录内的文件"变成了"兄弟目录"——**极易数错**）。别名只需替换一次路径前缀，且可以机械验证：

```bash
grep -rn "@/widgets" apps/web-admin/src   # 期望：改完后 0 命中
grep -rn "@/layouts" apps/web-admin/src   # 期望：4 命中
```

`widgets/admin-layout` 对 `entities/tab`(9)、`entities/notification`(5)、`entities/session`(5) 的依赖**不用改**（这些 entity 留在 `entities/`）。

---

## 8. 步骤 5：eslint 边界规则

按 `01-plan.md` 决策 4 的草案改 `eslint.config.mjs`：

1. **删除** L103-119 全局块（两条 pattern 均为死规则）
2. **删除** L157-173 features 块、L174-189 widgets 块（目录消失后无文件命中）
3. **改写** shared 块 group 为 `['@/app/**', '@/entities/**', '@/pages/**']`
4. **改写** entities 块 group 为 `['@/app/**', '@/pages/**']`
5. **新增** pages 块（草案见 `01-plan.md` 决策 4），severity 提升为 `'error'`

> ⚠️ **行号会漂**：上面的行号基于 2026-10-03 的 `eslint.config.mjs`（226 行）。改动时**按 `files` 匹配和注释定位**，不要按行号。

验收：

```bash
pnpm --filter @elm-platform/web-admin run lint    # 期望 0 error
```

---

## 9. 全量验收

```bash
cd <repo-root>

# 静态
pnpm --filter @elm-platform/web-admin run type-check
pnpm --filter @elm-platform/web-admin run lint
pnpm --filter @elm-platform/web-admin run build

# 测试
pnpm --filter @elm-platform/web-admin run test:unit          # 45 files / 178 tests
NODE_OPTIONS=--max-old-space-size=4096 \
  pnpm --filter @elm-platform/server exec jest --maxWorkers=2 # 38 suites / 527 tests
```

**路由冒烟（不能省）**：

```bash
pnpm --filter @elm-platform/web-admin exec vite --mode mock --port 5199
```

逐个打开 22 个页面确认不出现 404。**`nested/*` 那 5 个深层路径是重灾区。**

> ⚠️ **端口必须固定**：vite 默认端口 5173 常被本地其他 dev server 占用并自动顺延。若不固定，会对别的服务发请求拿到误导性响应。

**keep-alive 手工验证（规则 1 只能这样验证）**：

1. 打开「商品管理」，在搜索框输入内容；
2. 切到另一个页签，再切回来；
3. **输入的内容还在 → 缓存正常**；被清空 → 缓存被破坏（检查该页 `defineOptions` 的 name 是否等于菜单 name）。

对 `commerce/food`、`commerce/restaurant`、`platform/tenant` 三个页面**必须做这一步**——它们在改造前缓存是工作的，是本次唯一的"可能由好转坏"的点。

---

## 10. 回滚

本次是纯目录移动 + import 改写，无数据库改动。回滚：

```bash
git switch -- .            # 丢弃工作区改动
# 或
git revert <本步骤的 commit>
```

---

*文档创建：2026-10-03*
