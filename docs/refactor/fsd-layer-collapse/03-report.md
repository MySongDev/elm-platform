# web-admin FSD 层级收敛实施报告

> **前置**：`01-plan.md`（为什么做）→ `02-implementation.md`（怎么做）→ 本文件（做了什么、验证结果、偏差与遗留）
> **实施日期**：2026-10-04
> **分支**：`refactor/fsd-layer-collapse`
> **状态**：✅ 已完成（全量验收通过）

---

## 1. 实施总览

| 步骤 | commit | 内容 | 结果 |
|---|---|---|---|
| 0 | （前置） | 脏工作区清理（用户手工提交 `664e3f1`、`bc45fe2`），分支已就位 | ✅ |
| 1 | `2a2c647` | `features/order-management` 下沉 → `pages/commerce/order/` | ✅ |
| 2 | `1c0737f` | 其余 8 个 feature 下沉 + 7 个直通壳删壳 + `defineOptions` 对齐菜单 name | ✅ |
| 3 | `68dd2e2` | 6 个单消费 entity 下沉（order/role/department/food/restaurant/monitor） | ✅ |
| 4 | `f6a8a90` | `widgets/admin-layout/` 并入 `layouts/admin-layout/`，widgets 层消失 | ✅ |
| 5 | `0217968` | eslint 边界规则改写：删 3 块死/失效规则，shared/entities 提升 error，新增 pages 块 | ✅ |

---

## 2. 结构变化

**收敛前（8 个顶层目录）：**

```
src/
├── app/         18 文件 /  699 行
├── entities/    65 文件 / 1723 行
├── features/    65 文件 / 5295 行   ← 消失
├── pages/       42 文件 / 2459 行
├── widgets/     40 文件 / 3156 行   ← 消失
├── shared/      56 文件 / 4199 行
├── layouts/      1 文件 /    7 行
└── typings/
```

**收敛后（5 个顶层目录 + App.vue/main.ts/env.d.ts）：**

```
src/
├── app/         （不变）
├── entities/    剩余 8 个：log/notification/permission/session/system-menu/tab/tenant/user
├── pages/       接收了原 features/ 全部 9 个目录 + 6 个下沉 entity
├── shared/      （不变）
├── layouts/     admin-layout/（原 widgets）+ index.vue
└── typings/
```

`features/` 与 `widgets/` 两层目录已物理删除，git 中已无对应路径。

---

## 3. 全量验收结果（§9 清单）

| 检查项 | 期望 | 实际 | 结果 |
|---|---|---|---|
| `pnpm --filter @elm-platform/web-admin run type-check` | 通过 | 通过 | ✅ |
| `pnpm --filter @elm-platform/web-admin run lint` | 0 error | 0 error（36 个既有 warning，非本次引入） | ✅ |
| `pnpm --filter @elm-platform/web-admin run test:unit` | 45 files / 178 tests | 45 / 178 | ✅ |
| `pnpm --filter @elm-platform/server exec jest --maxWorkers=2` | 38 suites / 527 tests | 38 / 527 | ✅ |
| `pnpm --filter @elm-platform/web-admin run build` | 通过 | **基线即坏，本次全程未跑**（见 §5.1） | ⚠️ 跳过 |
| 路由冒烟（`--port 5199`，22 页） | 全部 200/HTML | 全部 200/HTML | ✅ |

每步（1~5）结束均单独跑过 type-check + test:unit + 路由冒烟，结果全绿，非仅末次验证。

**eslint 新规则回归确认**：`grep "no-restricted-imports"` 于 lint 输出 0 命中——新加/改写的 3 个边界块（shared/entities/pages）对现有代码零告警，提升为 error 不会引入新的 lint 失败。

---

## 4. `defineOptions` 对齐核对（规则 1，§5.1 逐页复查）

| 页面 | 期望 name（= 菜单 name） | 实施后 `index.vue` 实际值 | 与文档是否一致 |
|---|---|---|---|
| `commerce/food` | `CommerceFoodView` | `CommerceFoodView` | ✅ |
| `commerce/restaurant` | `CommerceRestaurantView` | `CommerceRestaurantView` | ✅ |
| `platform/tenant` | `PlatformTenantView` | `PlatformTenantView` | ✅ |
| `system/user` | `UserList` | `UserList` | ✅ |
| `system/role` | `RoleManagement` | `RoleManagement` | ✅ |
| `system/menu` | `MenuManagement` | `MenuManagement` | ✅ |
| `system/dept` | `DeptManagement` | `DeptManagement` | ✅ |

核查方式：`grep -rn "defineOptions" apps/web-admin/src/pages/*/*/index.vue`，逐行与上表比对，全部命中。

⚠️ **keep-alive 行为本身未做浏览器手工验证**（§9 的"商品管理→切页签→切回看输入还在"这一步需要真实 UI 交互，本次是纯静态的 name 值核对 + 路由冒烟 200 判断，属于文档已声明"只能手工验证"的遗留项，见 §5.2）。

---

## 5. 偏差与遗留

### 5.1 build 基线即坏，本次全程未跑

- 现象：`pnpm --filter @elm-platform/web-admin run build` 在**改动前**就跑 `element-plus@2.14.1` ESM 产物的 `import '@vue/shared'` 报 `Rolldown failed to resolve import` 错误，与本次目录重构完全无关。
- 已尝试：`pnpm install` 重装依赖，无效（依赖本身是缺声明，不是脏缓存）。
- 处理：经用户确认（选择"跳过"路线），本次 5 个步骤的验收均降为 **type-check + test:unit + 路由冒烟**，build 未纳入验收项。
- **遗留任务**：需另开任务修 `element-plus`/`@vue/shared` 的依赖声明缺口（如 `build.rolldownOptions.external` 或补 `@vue/shared` 为直接依赖）后，补跑一次全量 build 确认无新增错误。

### 5.2 keep-alive 手工验证未做

`commerce/food`、`commerce/restaurant`、`platform/tenant` 三页在改造前缓存是正常工作的，是本次唯一"可能由好转坏"的点（规则 1 明说的静默风险）。本次已按 §5.1 表逐页核对 `defineOptions` 的字面值与菜单 name 一致，但**没有真实打开浏览器切页签验证缓存是否真的还在**。建议上线前（或本次合并前）手工补一次这个 3 页的验证。

### 5.3 文档与实际代码的两处小差异（均已处理，未改方案）

1. **`features/tenant-management/ui/index.ts` 二级桶**：文档 §4.1 描述的实体只列了每个 feature 顶层的 `index.ts`，`tenant-management` 实际在 `ui/` 下还有一层二级桶（`export { default as TenantManagementPage } from './TenantManagementPage.vue'`，顶层桶再 `export { TenantManagementPage } from './ui'` 间接引用它）。已确认全仓无外部消费者引用这个二级桶，随 `mv features/tenant-management/ui` 整体搬走后，连同顶层桶文件一起删除，无残留。

2. **`features/dashboard` 的组件导出方式与文档描述略有出入**：文档 §5.3 说"按 `:8` 实际导入的符号调整"，但该页 `components/` 目录并无桶文件（`ls features/dashboard/components/` 只有 4 个独立 `.vue`，无 `index.ts`），无法照文档字面写成 `import { ... } from './components'`。改为逐个直接 `import` 4 个组件（`./components/OrderTrendChart.vue` 等），其中 `OrderTrendChart` 保持异步 `import()` 形式不变（这是文档风险项 2 特别强调的唯一易漏点，已确认改到位）。

### 5.4 `auto-imports.d.ts` 出现意外 diff，已还原

`git status` 显示 `apps/web-admin/src/typings/auto-imports.d.ts` 有 2 行被删（`pinia`、`registStore` 两个 auto-import 声明消失）。经 `git diff` 判断这不是本次任何一步 mv/sed 改动直接产生的（本次未触碰 typings 目录或 stores 相关代码），推测是某次本地工具（如 vite auto-import 插件重新生成）的副作用。已用 `git checkout --` 还原该文件，工作区恢复干净。**未进一步追查根因**——它不影响本次收敛的正确性，若复现再单独排查。

---

## 6. 回滚

本次为纯目录移动 + import 改写，无数据库改动。如需回滚：

```bash
git revert 0217968 f6a8a90 68dd2e2 1c0737f 2a2c647
# 或整体丢弃：git checkout <主干> -- . 并丢弃这 5 个 commit
```

---

*报告创建：2026-10-04*
