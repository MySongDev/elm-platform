# 管理端状态机通用 UI 抽取设计�?
## 1. 背景

当前管理端已经出现多处“状态流转类”页面：

- 订单履约 / 退款：`features/order-management/config/workflow.ts` 定义状态文案、状态类型和动作权限，`OrderActionColumn.vue` 渲染动作按钮�?- 租户生命周期：`TenantTable.vue` 直接在组件内定义动作文案和按钮类型，`TenantActionLogDialog.vue` 展示操作日志�?
这些页面已经具备企业后台常见的状态机雏形，但 UI 表达分散：状态标签、动作可见性、动作按钮和时间线分别写在不同业务模块中。后续商家入驻审批也会复用同样模式，因此需要先抽取共享能力�?
## 2. 目标

1. �?`shared/workflow` 下新增通用状态机 UI 能力�?2. 保持业务规则仍在业务 feature 内，不把订单、租户、商家入驻规则塞�?shared�?3. 抽取三个前端研习价值高的通用单元�?   - `StatusTag`：统一状态标签展示�?   - `StateMachineActions`：统一动作按钮展示与权限过滤�?   - `StateMachineTimeline`：统一时间线展示�?4. 迁移订单动作列和租户动作列使用共享动作组件�?5. 为动作可见性和状态配置映射补�?Vitest 覆盖�?
## 3. 非目�?
- 不引�?XState 等通用状态机框架�?- 不重写订单、租户业务状态流转逻辑�?- 不要求一次性迁移所有业务页面�?- 不新增后端接口�?- 不在 shared 中硬编码订单、租户、商家入驻的业务状态�?
## 4. 模块边界

新增目录：`apps/web-admin/src/shared/workflow`

### 4.1 `model/types.ts`

定义共享类型�?
- `WorkflowStatusType`：Element Plus tag/button 可用的语义类型�?- `WorkflowStatusConfig`：状态标签配置�?- `WorkflowActionConfig`：动作按钮配置�?- `WorkflowTimelineItem`：时间线条目配置�?
这些类型只描�?UI 合约，不描述业务流转规则�?
### 4.2 `model/permissions.ts`

定义纯函数：

- `isWorkflowActionVisible(action, context)`
- `getVisibleWorkflowActions(actions, context)`

可见性规则固定为�?
1. 如果传入 `availableActions`，动�?key 必须包含在其中�?2. 如果动作配置�?`permission`，当前用户必须拥有该权限�?3. 如果动作配置�?`visible(record)`，必须返�?true�?4. 以上条件都满足才展示�?
### 4.3 `components/StatusTag.vue`

输入状态值和状态配置，输出统一�?`el-tag`�?
设计要点�?
- 支持 `label` 直接文案�?- 支持 `labelKey` + i18n 翻译�?- 未匹配配置时回退显示原始状态值�?
### 4.4 `components/StateMachineActions.vue`

输入动作配置、当前记录、`availableActions` 和权限判断函数，输出统一按钮组�?
设计要点�?
- 只负责展示和 emit，不发起业务请求�?- 支持 `link` 按钮样式，保持现有表格动作列观感�?- 支持 `danger`、`type`、`disabled`、`visible(record)`�?- emit `action` 时返回动�?key、当前记录和动作配置�?
### 4.5 `components/StateMachineTimeline.vue`

输入标准�?timeline items，输�?`el-timeline`�?
设计要点�?
- shared 不关心日志来源�?- 业务侧负责把订单日志、租户日志、商家审核日志转换为 `WorkflowTimelineItem[]`�?- 支持 actor、description、remark、timestamp 等常见字段展示�?
## 5. 业务迁移策略

### 5.1 订单

保留 `features/order-management/config/workflow.ts` 中订单专属配置和权限码�?
调整�?
- `getVisibleOrderActions` 改为调用 shared �?`getVisibleWorkflowActions`�?- `OrderActionColumn.vue` 改为�?`StateMachineActions` 渲染动作按钮�?- 现有 `workflow.test.ts` 继续验证后端 `availableActions` 与权限共同生效�?
### 5.2 租户

新增租户 workflow 配置文件�?
- `features/tenant-management/config/workflow.ts`

迁移内容�?
- �?`TenantTable.vue` 抽出 `eventLabels` �?`eventTypes`�?- 为租户动作补�?action config�?- `TenantTable.vue` 使用 `StateMachineActions` 渲染 `availableActions`�?
### 5.3 时间�?
先提�?`StateMachineTimeline` 组件和纯类型，不强制迁移所有日志弹窗。租户日志弹窗可在本 Step 做轻量迁移：将日志条目映射为 `WorkflowTimelineItem[]` 后交给共享组件展示�?
## 6. 错误与空状�?
- 动作配置缺失时不展示该动作，避免出现无文案按钮�?- `StatusTag` 遇到未知状态显示原始状态值，便于发现后端新增状态�?- `StateMachineTimeline` 条目为空时显�?`el-empty`，避免空白面板�?
## 7. 测试策略

新增测试�?
- `shared/workflow/model/__tests__/permissions.test.ts`
  - availableActions 过滤�?  - permission 过滤�?  - visible(record) 过滤�?  - 未传 availableActions 时只按权限和 visible 判断�?- `features/tenant-management/config/workflow.test.ts`
  - 租户动作配置�?availableActions 输出�?  - 标签/类型配置保持稳定�?- 保留并调整订�?workflow 测试，确保迁移后行为不变�?
验证命令�?
```powershell
corepack pnpm --filter @elm-platform/web-admin exec vitest run src/shared/workflow/model/__tests__/permissions.test.ts src/features/order-management/config/workflow.test.ts src/features/tenant-management/config/workflow.test.ts
corepack pnpm --filter @elm-platform/web-admin run type-check
corepack pnpm --filter @elm-platform/web-admin run lint
```

## 8. 验收标准

1. `shared/workflow` 提供统一导出�?2. 订单动作列通过共享 `StateMachineActions` 渲染，行为不变�?3. 租户动作列不再在组件内硬编码动作 label/type�?4. 租户日志可通过共享 `StateMachineTimeline` 展示�?5. 动作可见性纯函数有单元测试覆盖�?6. 目标 Vitest、type-check、lint 通过或只剩既�?warning�?
