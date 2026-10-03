# config-crud 简化实施书

## 验证基准（实施前确认）

```bash
pnpm --filter @elm-platform/web-admin run type-check   # 必须通过
pnpm --filter @elm-platform/web-admin run test:unit    # 必须全绿
```

---

## 步骤 1：砍掉反馈适配器层

### 1.1 删除文件

```bash
rm apps/web-admin/src/shared/config-crud/model/feedback.ts
rm apps/web-admin/src/shared/config-crud/adapters/element-plus.ts
# 如果 adapters/ 目录空了就删目录
rmdir apps/web-admin/src/shared/config-crud/adapters
```

### 1.2 修改 `model/useConfigCrud.ts`

**替换 import：**
```diff
-import { createSilentCrudFeedback } from './feedback'
+import { ElMessage, ElMessageBox } from 'element-plus'
```

**删除 feedback 合并逻辑：**
```diff
-  const feedback = {
-    ...createSilentCrudFeedback(),
-    ...options.feedback,
-  }
```

**改写 `submitForm` 中的反馈调用：**
```diff
-  feedback.notifySaveSuccess(resolveSaveSuccessMessage(id))
+  ElMessage.success(resolveSaveSuccessMessage(id))
```

**改写 `handleDelete`：**
```diff
-  async function handleDelete(row: Row) {
-    const confirmed = await feedback.confirmDelete(options.deleteConfirm(row))
-    if (!confirmed)
-      return
-
-    await options.deleteItem(options.getRowId(row))
-    feedback.notifyDeleteSuccess(options.deleteSuccessMessage ?? '删除成功')
-    await fetchRows()
-  }
+  async function handleDelete(row: Row) {
+    try {
+      await ElMessageBox.confirm(options.deleteConfirm(row), '提示', { type: 'warning' })
+    } catch {
+      return
+    }
+
+    await options.deleteItem(options.getRowId(row))
+    ElMessage.success(options.deleteSuccessMessage ?? '删除成功')
+    await fetchRows()
+  }
```

### 1.3 修改 `model/useConfigCrud.types.ts`

**删除 feedback 相关：**
```diff
-import type { ConfigCrudFeedback } from './feedback'
 ...
 interface UseConfigCrudOptions<...> {
   ...
-  feedback?: ConfigCrudFeedback
 }
```

### 1.4 修改 `index.ts`

**删除导出：**
```diff
-export {
-  createElementPlusCrudFeedback,
-} from './adapters/element-plus'
```

### 1.5 修改所有业务模块 (7 个 feature)

对每个文件执行：

```diff
-import { createElementPlusCrudFeedback, useConfigCrud } from '@/shared/config-crud'
+import { useConfigCrud } from '@/shared/config-crud'
```

删除 options 里的 `feedback: createElementPlusCrudFeedback()` 行。

涉及文件：
- `features/user-management/model/useUserManagement.ts`
- `features/role-management/model/useRoleManagement.ts`
- `features/menu-management/model/useMenuManagement.ts`
- `features/dept-management/model/useDeptManagement.ts`
- `features/food-management/model/useFoodManagement.ts`
- `features/restaurant-management/model/useRestaurantManagement.ts`
- `features/tenant-management/model/useTenantManagement.ts`

**特殊：`useRoleManagement.ts`** 还有独立的 `const feedback = createElementPlusCrudFeedback()` 和 `feedback.notifySaveSuccess(...)`，需要改为：
```diff
-  const feedback = createElementPlusCrudFeedback()
   ...
-  feedback.notifySaveSuccess?.(t('role.permissionSaveSuccess'))
+  ElMessage.success(t('role.permissionSaveSuccess'))
```
并添加 `import { ElMessage } from 'element-plus'`。

### 1.6 修改测试文件 (2 个)

**`features/user-management/model/__tests__/useUserManagement.test.ts`：**
```diff
-const crudFeedback = vi.hoisted(() => ({
-  confirmDelete: vi.fn(),
-  notifyDeleteSuccess: vi.fn(),
-  notifySaveSuccess: vi.fn(),
-}))
+vi.mock('element-plus', () => ({
+  ElMessage: { warning: vi.fn(), success: vi.fn() },
+  ElMessageBox: { confirm: vi.fn().mockResolvedValue(undefined) },
+}))

-vi.mock('@/shared/config-crud', async () => {
-  const actual = await vi.importActual<...>('@/shared/config-crud/model/useConfigCrud')
-  return { ...actual, createElementPlusCrudFeedback: () => crudFeedback }
-})
+vi.mock('@/shared/config-crud', async () => {
+  const actual = await vi.importActual<...>('@/shared/config-crud/model/useConfigCrud')
+  return actual
+})
```

删除 `crudFeedback.confirmDelete.mockResolvedValue(true)` 等 setup 行。
删除 `expect(crudFeedback.notifySaveSuccess).toHaveBeenCalledWith(...)` 等断言。

**`features/role-management/model/__tests__/useRoleManagement.test.ts`：** 同理。

### 1.7 修改核心测试 `model/__tests__/useConfigCrud.test.ts`

该测试直接测试 feedback 注入机制。因为 feedback 已内联为 Element Plus 调用，需要改为 mock `element-plus` 模块并断言 `ElMessage.success`/`ElMessageBox.confirm` 被调用。

---

## 步骤 2：减少泛型参数

### 2.1 修改 `model/useConfigCrud.types.ts`

```diff
 interface UseConfigCrudOptions<
   Row,
   Query extends object,
   Form extends object,
-  Payload,
   Id extends CrudId = number,
 > {
   ...
-  createItem: (payload: Payload) => Promise<unknown>
-  updateItem: (id: Id, payload: Payload) => Promise<unknown>
+  createItem: (payload: any) => Promise<unknown>
+  updateItem: (id: Id, payload: any) => Promise<unknown>
   ...
-  toPayload?: (form: Form) => Payload
+  toPayload?: (form: Form) => unknown
 }
```

### 2.2 修改 `model/useConfigCrud.ts` 函数签名

```diff
 export function useConfigCrud<
   Row,
-  Query extends object,
-  Form extends object,
-  Payload = Partial<Form>,
+  Query extends object = Record<string, unknown>,
+  Form extends object = Partial<Row>,
   Id extends CrudId = number,
->(options: UseConfigCrudOptions<Row, Query, Form, Payload, Id>) {
+>(options: UseConfigCrudOptions<Row, Query, Form, Id>) {
```

### 2.3 更新业务模块泛型调用

| 文件 | 简化前 | 简化后 |
|------|--------|--------|
| useDeptManagement | `<DeptItem, DeptQuery, DeptFormState, Partial<DeptItem>>` | `<DeptItem, DeptQuery, DeptFormState>` |
| useFoodManagement | `<FoodItem, FoodQuery, FoodFormState, FoodPayload>` | `<FoodItem, FoodQuery, FoodFormState>` |
| useMenuManagement | `<MenuItem, MenuQuery, MenuFormState, Partial<MenuItem>>` | `<MenuItem, MenuQuery, MenuFormState>` |
| useRestaurantManagement | `<RestaurantItem, RestaurantQuery, RestaurantFormState, Partial<RestaurantItem>>` | `<RestaurantItem, RestaurantQuery, RestaurantFormState>` |
| useRoleManagement | `<RoleItem, RoleQuery, RoleFormState, Partial<RoleItem>>` | `<RoleItem, RoleQuery, RoleFormState>` |
| useTenantManagement | `<TenantInfo, TenantListQuery, TenantFormState, Create|Update, number>` | `<TenantInfo, TenantListQuery, TenantFormState, number>` |
| useUserManagement | `<UserInfo, UserListQuery, UserFormState, Create|Update, number>` | `<UserInfo, UserListQuery, UserFormState, number>` |

同时删除不再需要的类型 import（如 `FoodPayload`, `UpdateUserParams`）。

---

## 步骤 3：合并 ConfigFormDialog 组件

### 3.1 把 `CrudFormDialog.vue` 和 `ConfigFormFields.vue` 的逻辑合并到 `ConfigFormDialog/index.vue`

合并后的 `index.vue` 应该：
1. 接受当前 `index.vue` 的 props（fields, isEdit, saving, dialog, formOptions, action）
2. 直接包含 `el-dialog` + `el-form` + 字段遍历 + footer 按钮
3. 保持 slot 透传：`field-{prop}` 具名 slot
4. 保持 formRef expose、validate-on-submit、clearValidate-on-open

### 3.2 删除文件

```bash
rm apps/web-admin/src/shared/config-crud/components/ConfigFormDialog/CrudFormDialog.vue
rm apps/web-admin/src/shared/config-crud/components/ConfigFormDialog/ConfigFormFields.vue
```

### 3.3 更新 `index.ts` barrel exports

```diff
-export { default as ConfigFormFields } from './components/ConfigFormDialog/ConfigFormFields.vue'
-export { default as CrudFormDialog } from './components/ConfigFormDialog/CrudFormDialog.vue'
```

检查是否有消费方 import 了 `ConfigFormFields` 或 `CrudFormDialog`。如果有，需要调整。

---

## 步骤 4：合并 ConfigTableCellTag 到 ConfigTableColumns

### 4.1 把 tag 渲染内联到 `ConfigTableColumns.vue`

```diff
-import ConfigTableCellTag from './ConfigTableCellTag.vue'
 ...
 <template v-if="column.formatter || column.tag" #default="{ row }">
-  <ConfigTableCellTag v-if="column.tag" :row="row" :column="column" />
+  <el-tag v-if="column.tag?.(row)" :type="column.tag(row).type">
+    {{ column.tag(row).label }}
+  </el-tag>
   <template v-else>
     {{ getCellText(row, column) }}
   </template>
 </template>
```

### 4.2 删除文件

```bash
rm apps/web-admin/src/shared/config-crud/components/ConfigDataTable/ConfigTableCellTag.vue
```

---

## 验证检查点（每步完成后执行）

```bash
pnpm --filter @elm-platform/web-admin run type-check
pnpm --filter @elm-platform/web-admin run test:unit
```

---

## 最终文件结构（简化后）

```
config-crud/                              (16 files, -6)
├── index.ts
├── components/
│   ├── ConfigDataTable/
│   │   ├── index.vue
│   │   └── ConfigTableColumns.vue        (+内联 CellTag)
│   ├── ConfigFormDialog/
│   │   └── index.vue                     (合并了 CrudFormDialog + ConfigFormFields)
│   └── CrudActionColumn/
│       └── index.vue
├── model/
│   ├── useConfigCrud.ts                  (直接用 ElMessage/ElMessageBox)
│   ├── useConfigCrud.types.ts            (4 泛型, 无 feedback)
│   ├── form.ts
│   ├── table.ts
│   ├── table-preferences.ts
│   ├── csv.ts
│   ├── presets.ts
│   └── __tests__/ (4 test files)

shared/ui/form/                           (不变, 11 files)
```

## 删除文件清单

1. `adapters/element-plus.ts`
2. `model/feedback.ts`
3. `components/ConfigFormDialog/CrudFormDialog.vue`
4. `components/ConfigFormDialog/ConfigFormFields.vue`
5. `components/ConfigDataTable/ConfigTableCellTag.vue`
6. `adapters/` 目录
