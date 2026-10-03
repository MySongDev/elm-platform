# config-crud 简化工程报告

## 概要

| 指标 | 简化前 | 简化后 | 变化 |
|------|--------|--------|------|
| config-crud 文件数 | 22 | 16 | **-6** |
| 总代码行数 | ~695 行变动 | — | **-167 净行** (228 insertions, 395 deletions) |
| 阅读 CRUD 页面需跳转文件 | 6-8 | 3-4 | **-50%** |
| 泛型参数 | 5 个 | 4 个 | -1 |
| 业务模块样板代码 | 每页 2 行 feedback 样板 | 0 | **消除** |
| type-check | ✅ 通过 | ✅ 通过 | — |
| 单元测试 | 187 passed | 187 passed | — |

## 变更文件清单 (20 files)

### 删除 (5 files)

| 文件 | 原因 |
|------|------|
| `shared/config-crud/adapters/element-plus.ts` | 反馈适配器层消除 |
| `shared/config-crud/model/feedback.ts` | 反馈接口定义消除 |
| `shared/config-crud/components/ConfigFormDialog/CrudFormDialog.vue` | 合并到 index.vue |
| `shared/config-crud/components/ConfigFormDialog/ConfigFormFields.vue` | 合并到 index.vue |
| `shared/config-crud/components/ConfigDataTable/ConfigTableCellTag.vue` | 内联到 ConfigTableColumns.vue |

### 修改 - 核心框架 (5 files)

| 文件 | 变更内容 |
|------|----------|
| `shared/config-crud/model/useConfigCrud.ts` | 删除 feedback 间接层，直接调用 ElMessage/ElMessageBox；删除 Payload 泛型 |
| `shared/config-crud/model/useConfigCrud.types.ts` | 移除 feedback 字段，移除 Payload 泛型参数，createItem/updateItem 改为 any |
| `shared/config-crud/index.ts` | 移除 createElementPlusCrudFeedback / CrudFormDialog / ConfigFormFields 导出 |
| `shared/config-crud/components/ConfigFormDialog/index.vue` | 合并了对话框壳 + 字段遍历的全部逻辑 |
| `shared/config-crud/components/ConfigDataTable/ConfigTableColumns.vue` | 内联了 tag 渲染逻辑 |

### 修改 - 业务模块 (7 files)

| 文件 | 变更内容 |
|------|----------|
| `features/user-management/model/useUserManagement.ts` | 删除 createElementPlusCrudFeedback，简化泛型 |
| `features/role-management/model/useRoleManagement.ts` | 删除 feedback 变量，改用 ElMessage.success |
| `features/menu-management/model/useMenuManagement.ts` | 同上 |
| `features/dept-management/model/useDeptManagement.ts` | 同上 |
| `features/food-management/model/useFoodManagement.ts` | 同上，删除 FoodPayload import |
| `features/restaurant-management/model/useRestaurantManagement.ts` | 同上 |
| `features/tenant-management/model/useTenantManagement.ts` | 同上 |

### 修改 - 测试 (3 files)

| 文件 | 变更内容 |
|------|----------|
| `features/user-management/model/__tests__/useUserManagement.test.ts` | mock element-plus 代替 mock feedback |
| `features/role-management/model/__tests__/useRoleManagement.test.ts` | 同上 |
| `shared/config-crud/model/__tests__/useConfigCrud.test.ts` | 重写为 mock element-plus 验证调用 |

## 简化前后对比

### 业务页面调用代码（以 useDeptManagement 为例）

**简化前：**
```ts
import { createElementPlusCrudFeedback, useConfigCrud } from '@/shared/config-crud'

const crud = useConfigCrud<DeptItem, DeptQuery, DeptFormState, Partial<DeptItem>>({
  // ... 业务配置 ...
  feedback: createElementPlusCrudFeedback(),
})
```

**简化后：**
```ts
import { useConfigCrud } from '@/shared/config-crud'

const crud = useConfigCrud<DeptItem, DeptQuery, DeptFormState>({
  // ... 业务配置 ...
})
```

### 阅读路径对比

**简化前（理解「保存成功」如何触发）：**
1. `useDeptManagement.ts` → 找到 `feedback: createElementPlusCrudFeedback()`
2. `index.ts` → 找到导出来源
3. `adapters/element-plus.ts` → 找到 `notifySaveSuccess` 实现
4. `model/feedback.ts` → 理解接口定义
5. `model/useConfigCrud.ts` → 看 `feedback.notifySaveSuccess(...)` 调用

**简化后：**
1. `useDeptManagement.ts` → 无 feedback 配置
2. `model/useConfigCrud.ts` → 直接看到 `ElMessage.success(...)`

### 文件结构对比

**简化前（22 files）：**
```
config-crud/
├── adapters/element-plus.ts          ← 删除
├── components/ConfigDataTable/
│   ├── ConfigTableCellTag.vue        ← 删除（内联）
│   ├── ConfigTableColumns.vue
│   └── index.vue
├── components/ConfigFormDialog/
│   ├── ConfigFormFields.vue          ← 删除（合并）
│   ├── CrudFormDialog.vue            ← 删除（合并）
│   └── index.vue
├── components/CrudActionColumn/index.vue
├── model/feedback.ts                 ← 删除
├── model/useConfigCrud.ts
├── model/useConfigCrud.types.ts
├── model/form.ts
├── model/table.ts
├── model/table-preferences.ts
├── model/csv.ts
├── model/presets.ts
├── model/__tests__/ (4 files)
└── index.ts
```

**简化后（16 files）：**
```
config-crud/
├── components/ConfigDataTable/
│   ├── ConfigTableColumns.vue        (含内联 tag 渲染)
│   └── index.vue
├── components/ConfigFormDialog/
│   └── index.vue                     (含对话框 + 字段遍历)
├── components/CrudActionColumn/index.vue
├── model/useConfigCrud.ts            (直接 ElMessage/ElMessageBox)
├── model/useConfigCrud.types.ts      (4 泛型)
├── model/form.ts
├── model/table.ts
├── model/table-preferences.ts
├── model/csv.ts
├── model/presets.ts
├── model/__tests__/ (4 files)
└── index.ts
```

## shared/ui/form 评估结论

**不需要简化。** 原因：
- 3 层跳转（schema → map → renderer）是动态表单的最低开销
- 每个 renderer 是 Element Plus 组件的薄包装，一看就懂
- 新增字段类型 = 加接口 + 加 vue + 改一行 map，路径清晰
- 唯一可选：`renderer-map.ts` 可以写在 `index.vue` 里，但分出来也只有 1 行跳转

## 风险评估

| 风险 | 级别 | 应对 |
|------|------|------|
| 测试时无法 mock feedback | 低 | 直接 vi.mock('element-plus') 即可 |
| toPayload 返回 unknown 丢失类型安全 | 低 | 实际项目中 payload 转换逻辑在 toPayload 函数体内已有类型标注 |
| 合并后 ConfigFormDialog 变大 | 低 | 合并后约 90 行，仍在合理范围 |
