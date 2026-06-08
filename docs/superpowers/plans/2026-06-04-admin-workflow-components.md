# 管理端状态机通用组件实现计划

> **执行要求�?* 实现本计划时，建议使�?`superpowers:executing-plans` �?`superpowers:subagent-driven-development`。每个任务使�?checkbox 跟踪进度，完成一个任务后先运行对应的聚焦测试�?
**目标�?* 从订单管理和租户管理中抽取通用状态机 UI 能力，沉淀�?`shared/workflow`：状态标签、动作按钮、动作可见性判断、操作时间线。业务规则仍保留在各 feature 中，共享层只处理通用展示和通用判断�?
**前端研习重点�?*

- 如何把重复业�?UI 抽象成共享组件，而不把业务规则塞�?shared�?- 如何�?TypeScript 泛型描述“任意记�?+ 任意动作 key + 任意状�?key”�?- 如何把权限、后�?`availableActions`、前�?`visible(record)` 三类条件组合成可测试的纯函数�?- 如何让状态标签、动作按钮、时间线在订单、租户、商家入驻三个场景中复用�?
---

## 1. 范围

本计划实现设计书 Step 4：状态机通用组件抽取�?
包含�?
- 新增 `shared/workflow` 模块�?- 新增状态标签组�?`StatusTag.vue`�?- 新增状态机动作组件 `StateMachineActions.vue`�?- 新增状态机时间线组�?`StateMachineTimeline.vue`�?- 新增动作可见性纯函数与测试�?- 选择订单或租户中的一个代表性位置接入，验证抽象可用�?
不包含：

- 不改订单、租户、商家入驻的真实业务状态规则�?- 不引�?XState 等状态机库�?- 不全量迁移所有页面�?- 不新增后端接口�?
## 2. 文件结构

### 新增

- `apps/web-admin/src/shared/workflow/model/types.ts`
  - 通用状态、动作、时间线类型�?- `apps/web-admin/src/shared/workflow/model/permissions.ts`
  - 动作可见性判断纯函数�?- `apps/web-admin/src/shared/workflow/model/__tests__/permissions.test.ts`
  - 覆盖 `availableActions`、权限、`visible(record)` 的组合规则�?- `apps/web-admin/src/shared/workflow/components/StatusTag.vue`
  - 通用状态标签�?- `apps/web-admin/src/shared/workflow/components/StateMachineActions.vue`
  - 通用动作按钮组�?- `apps/web-admin/src/shared/workflow/components/StateMachineTimeline.vue`
  - 通用操作时间线�?- `apps/web-admin/src/shared/workflow/index.ts`
  - 统一导出�?
### 修改

- `apps/web-admin/src/features/order-management/config/workflow.ts`
  - 让订�?action 配置可适配通用 `WorkflowActionConfig`�?- `apps/web-admin/src/features/order-management/ui/OrderActionColumn.vue`
  - �?`StateMachineActions` 替换手写动作按钮逻辑�?- 可选：`apps/web-admin/src/features/tenant-management/ui/TenantTable.vue`
  - 如果订单接入顺利，再�?`StateMachineActions` 替换租户动作按钮�?- 可选：`apps/web-admin/src/features/tenant-management/ui/TenantActionLogDialog.vue`
  - 后续可用 `StateMachineTimeline` 替换表格日志，但第一版可以只新增组件，不强行迁移�?
## 3. 类型设计

新增 `apps/web-admin/src/shared/workflow/model/types.ts`�?
```ts
import type { Component } from 'vue'

export type WorkflowTagType = 'primary' | 'success' | 'info' | 'warning' | 'danger'

export interface WorkflowStatusConfig<Status extends string = string> {
  status: Status
  label: string
  type?: WorkflowTagType
}

export interface WorkflowActionConfig<Record extends object = object, Action extends string = string> {
  key: Action
  label: string
  permission?: string | string[]
  type?: WorkflowTagType
  danger?: boolean
  confirmMessage?: string
  icon?: Component
  visible?: (record: Record) => boolean
  disabled?: (record: Record) => boolean
}

export interface ResolveWorkflowActionsOptions<Record extends object, Action extends string = string> {
  record: Record
  actions: WorkflowActionConfig<Record, Action>[]
  availableActions?: readonly Action[]
  hasPermission?: (permission: string | string[]) => boolean
}

export interface WorkflowTimelineItem<Status extends string = string> {
  id: string | number
  title: string
  status?: Status
  statusLabel?: string
  statusType?: WorkflowTagType
  actorName?: string
  description?: string
  createdAt?: string
}
```

注意：共享类型字段使�?`label`，不直接依赖 i18n key。业务层可以�?`t('xxx')` 后的结果，也可以传静态文案�?
## 4. 任务

### Task 1：实现动作可见性纯函数

- [ ] 新增 `apps/web-admin/src/shared/workflow/model/__tests__/permissions.test.ts`�?- [ ] 测试以下场景�?  - 未传 `availableActions` 时，只按权限�?`visible(record)` 判断�?  - 传入 `availableActions` 时，只展�?key 在其中的动作�?  - 配置 `permission` 时，必须通过 `hasPermission`�?  - 配置 `visible(record)` 时，必须返回 `true`�?  - `disabled(record)` 不影响可见性，只交�?UI 禁用按钮�?- [ ] 新增 `apps/web-admin/src/shared/workflow/model/permissions.ts`�?- [ ] 实现�?
```ts
import type { ResolveWorkflowActionsOptions, WorkflowActionConfig } from './types'

function hasActionPermission(permission: string | string[] | undefined, hasPermission?: (permission: string | string[]) => boolean) {
  if (!permission)
    return true
  if (!hasPermission)
    return false
  return hasPermission(permission)
}

export function resolveVisibleWorkflowActions<Record extends object, Action extends string = string>(
  options: ResolveWorkflowActionsOptions<Record, Action>,
): WorkflowActionConfig<Record, Action>[] {
  const availableActionSet = options.availableActions ? new Set(options.availableActions) : undefined

  return options.actions.filter((action) => {
    if (availableActionSet && !availableActionSet.has(action.key))
      return false
    if (!hasActionPermission(action.permission, options.hasPermission))
      return false
    if (action.visible && !action.visible(options.record))
      return false
    return true
  })
}
```

- [ ] 运行�?
```powershell
corepack pnpm --filter @elm-platform/web-admin exec vitest run src/shared/workflow/model/__tests__/permissions.test.ts
```

### Task 2：实�?`StatusTag.vue`

- [ ] 新增 `apps/web-admin/src/shared/workflow/components/StatusTag.vue`�?- [ ] props�?  - `label: string | number`
  - `type?: WorkflowTagType`
  - `effect?: 'dark' | 'light' | 'plain'`
- [ ] 使用 Element Plus `el-tag` 渲染�?- [ ] 默认 `type` �?`info`，默�?`effect` �?`light`�?- [ ] 样式只做最小间距，不做强业务色彩�?
示意�?
```vue
<script setup lang="ts">
import type { WorkflowTagType } from '../model/types'

defineOptions({ name: 'StatusTag' })

withDefaults(defineProps<{
  label: string | number
  type?: WorkflowTagType
  effect?: 'dark' | 'light' | 'plain'
}>(), {
  type: 'info',
  effect: 'light',
})
</script>

<template>
  <el-tag :type="type" :effect="effect" round>
    {{ label }}
  </el-tag>
</template>
```

### Task 3：实�?`StateMachineActions.vue`

- [ ] 新增 `apps/web-admin/src/shared/workflow/components/StateMachineActions.vue`�?- [ ] props�?  - `record`
  - `actions`
  - `availableActions?`
  - `hasPermission?`
  - `link?: boolean`
- [ ] emits�?  - `action: [actionKey, record]`
- [ ] 内部使用 `resolveVisibleWorkflowActions()`�?- [ ] `danger` 动作映射�?Element Plus `danger` 类型�?- [ ] `disabled(record)` �?true 时禁用按钮�?- [ ] 只负责发出动作事件，不在组件内做确认弹窗和接口调用；确认弹窗保留在业务层�?
### Task 4：实�?`StateMachineTimeline.vue`

- [ ] 新增 `apps/web-admin/src/shared/workflow/components/StateMachineTimeline.vue`�?- [ ] props�?  - `items: WorkflowTimelineItem[]`
  - `emptyText?: string`
- [ ] 使用 Element Plus `el-timeline` �?`el-timeline-item`�?- [ ] 展示：标题、状态标签、操作人、描述、时间�?- [ ] 无数据时�?`el-empty` 或简单空文案�?- [ ] 时间格式暂不�?shared 内强行格式化，第一版直接展示业务层传入�?`createdAt` 文本；如要格式化，由业务层先处理�?
### Task 5：统一导出

- [ ] 新增 `apps/web-admin/src/shared/workflow/index.ts`�?
```ts
export { default as StatusTag } from './components/StatusTag.vue'
export { default as StateMachineActions } from './components/StateMachineActions.vue'
export { default as StateMachineTimeline } from './components/StateMachineTimeline.vue'
export { resolveVisibleWorkflowActions } from './model/permissions'
export type {
  ResolveWorkflowActionsOptions,
  WorkflowActionConfig,
  WorkflowStatusConfig,
  WorkflowTagType,
  WorkflowTimelineItem,
} from './model/types'
```

### Task 6：迁移订单动作列作为代表场景

- [ ] 修改 `apps/web-admin/src/features/order-management/config/workflow.ts`�?  - 保留现有订单状�?label map �?type map�?  - 新增一个函数把订单 action config 转成 `WorkflowActionConfig<OrderItem, AdminOrderAction>[]`�?  - 或直接把 `orderActionConfig` 的结构调整为接近通用 action config，但不要破坏现有测试�?- [ ] 修改 `apps/web-admin/src/features/order-management/ui/OrderActionColumn.vue`�?  - 继续保留“详情”按钮�?  - 订单状态动作改�?`StateMachineActions`�?  - `availableActions` �?`row.availableActions`�?  - `hasPermission` �?`authStore.hasPermission`�?  - `@action` 继续 emit 给上层，保持上层行为不变�?- [ ] 运行订单 workflow 测试�?
```powershell
corepack pnpm --filter @elm-platform/web-admin exec vitest run src/features/order-management/config/workflow.test.ts src/shared/workflow/model/__tests__/permissions.test.ts
```

### Task 7：可选迁移租户动作列

如果 Task 6 顺利，再迁移租户表格动作列：

- [ ] 在租�?feature 中定�?`TenantEvent` 对应�?`WorkflowActionConfig<TenantInfo, TenantEvent>[]`�?- [ ] �?`StateMachineActions` 替换 `TenantTable.vue` 里的 `v-for="action in availableActions"`�?- [ ] 注意租户动作当前没有接权限，第一版可以只�?`availableActions`，后续再补权限�?
## 5. 验证命令

```powershell
corepack pnpm --filter @elm-platform/web-admin exec vitest run src/shared/workflow/model/__tests__/permissions.test.ts
corepack pnpm --filter @elm-platform/web-admin exec vitest run src/features/order-management/config/workflow.test.ts src/shared/workflow/model/__tests__/permissions.test.ts
corepack pnpm --filter @elm-platform/web-admin run test:unit
corepack pnpm --filter @elm-platform/web-admin run type-check
corepack pnpm --filter @elm-platform/web-admin run lint
corepack pnpm --filter @elm-platform/web-admin run build
```

## 6. 验收标准

- `shared/workflow` 可以被业�?feature 直接导入�?- 动作可见性判断有单元测试覆盖�?- `StateMachineActions` 同时支持 `availableActions`、权限和 `visible(record)`�?- 订单动作列迁移后，按钮展示与原行为一致�?- 业务确认弹窗、接口调用、刷新逻辑仍留在订�?feature，不进入 shared�?- 全量测试、类型检查、lint、build 通过�?
## 7. 复盘问题

实现完成后建议复盘：

1. 哪些东西适合抽到 shared，哪些东西应该留�?feature�?2. `availableActions`、权限、前�?visible 三者分别解决什么问题？
3. 为什么确认弹窗不放进 `StateMachineActions`�?4. 如果以后商家入驻审批要复用这些组件，需要补哪些字段�?
