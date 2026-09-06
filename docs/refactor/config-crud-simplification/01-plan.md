# config-crud 简化计划书

## 背景

`apps/web-admin/src/shared/config-crud` 和 `apps/web-admin/src/shared/ui/form` 存在过度设计问题：
- config-crud: 22 个文件，5 层抽象（composable → types → feedback 策略 → table/form 类型 → 7 个组件）
- form: 11 个文件，3 层抽象（schema → renderer map → renderers）

阅读/维护一个 CRUD 页面需要跳转 6-8 个文件。

## 当前文件结构（简化前）

```
config-crud/                              (22 files)
├── index.ts                              barrel exports
├── adapters/
│   └── element-plus.ts                   Element Plus 反馈适配器
├── components/
│   ├── ConfigDataTable/
│   │   ├── index.vue                     主表格组件
│   │   ├── ConfigTableColumns.vue        列渲染
│   │   └── ConfigTableCellTag.vue        Tag 单元格
│   ├── ConfigFormDialog/
│   │   ├── index.vue                     组合入口
│   │   ├── CrudFormDialog.vue            对话框壳
│   │   └── ConfigFormFields.vue          字段遍历
│   └── CrudActionColumn/
│       └── index.vue                     操作列
├── model/
│   ├── useConfigCrud.ts                  核心 composable
│   ├── useConfigCrud.types.ts            类型定义
│   ├── feedback.ts                       反馈接口 + 静默实现
│   ├── form.ts                           表单字段类型/选项
│   ├── table.ts                          表格列类型/选项
│   ├── table-preferences.ts             列可见性持久化
│   ├── csv.ts                            CSV 导出
│   ├── presets.ts                        预设工具
│   └── __tests__/ (4 test files)

shared/ui/form/                           (11 files)
├── field-schema.ts                       判别联合类型
└── FieldRenderer/
    ├── index.vue                         动态分发
    ├── renderer-map.ts                   类型→组件映射
    └── renderers/ (8 .vue files)
```

## 评估结论

| 模块 | 过度设计？ | 原因 |
|------|-----------|------|
| `shared/ui/form` | ❌ 不是 | 3 层跳转合理，每个 renderer 是 Element Plus 薄包装 |
| `config-crud` | ⚠️ 中度过度 | 核心思路对，但层太多、缝太多 |

## 简化目标

| 维度 | 简化前 | 简化后 |
|------|--------|--------|
| config-crud 文件数 | 22 | ~16 |
| 阅读路径跳转 | 6-8 | 3-4 |
| 泛型参数 | 5 个 `<Row,Query,Form,Payload,Id>` | 4 个 `<Row,Query,Form,Id>` |
| 业务页面调用代码 | 含 feedback 样板 | 无样板 |
| form 模块 | 不变 | 不变（设计合理） |

## 简化方向

### 方向 1：砍掉反馈适配器层
- 删除 `model/feedback.ts`
- 删除 `adapters/element-plus.ts`
- `useConfigCrud.ts` 直接 import `ElMessage`/`ElMessageBox`
- 测试 mock `element-plus` 模块即可

### 方向 2：合并 ConfigFormDialog 组件
- 把 `CrudFormDialog.vue` + `ConfigFormFields.vue` 合并到 `index.vue`
- 3 个文件 → 1 个文件

### 方向 3：合并 ConfigDataTable 子组件
- 把 `ConfigTableCellTag.vue` 内联到 `ConfigTableColumns.vue`
- 3 个文件 → 2 个文件

### 方向 4：减少泛型参数
- 删除独立的 `Payload` 泛型
- `createItem`/`updateItem` 统一接受 `any`，配合可选 `toPayload` 转换
- `Id` 默认 `= number`，大多数页面无需传

## 受影响范围

### 直接调用方（8 个 feature + 4 个 monitor 页面 + 1 个 lib）

| 模块 | 用到的导出 |
|------|------------|
| user-management | `useConfigCrud`, `createElementPlusCrudFeedback`, `ConfigDataTable`, `ConfigFormDialog`, `CrudActionColumn`, `ConfigFieldOption` |
| role-management | 同上 |
| menu-management | 同上 |
| dept-management | 同上 |
| food-management | 同上 |
| restaurant-management | 同上 |
| tenant-management | 同上 |
| order-management | `ConfigDataTable` (只读) |
| monitor/online | `ConfigDataTable` (只读) |
| monitor/logs/* (3) | `ConfigDataTable` (只读) |
| shared/lib/admin-display | `ConfigFieldOption`, `ConfigTableColumnTag` (类型) |

## 不动的部分

- `shared/ui/form` — 设计合理，不需要改
- `model/table.ts` — 表格列类型定义，职责单一
- `model/form.ts` — 表单字段类型桥接，只做 re-export
- `model/csv.ts` + `model/table-preferences.ts` — 可选功能，保持分离
- `model/presets.ts` — 预设工具函数
- `components/CrudActionColumn/index.vue` — 独立组件，不需合并
