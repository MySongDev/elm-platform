# 管理端企业级体验提升设计�?
## 1. 背景

当前 `apps/web-admin` 已经具备后台管理系统的基础能力：Vue 3 + TypeScript + Element Plus 技术栈、Pinia 状态管理、Vue Router 动态路由、i18n、三层权限体系、配置驱�?CRUD，以及订�?租户状态流转能力�?
但从“企业级后台”的观感和工程沉淀看，还缺少几类关键能力：

1. 页面状态不够统一：加载、异常、空数据、无权限、重复提交分散在各页面和组件里�?2. Dashboard 仍是静态卡片和图表占位，缺少运营数据可视化�?3. 表格能力偏基础，缺少批量操作、列设置、密度、导出等后台常用能力�?4. 订单和租户已有状态机雏形，但状态标签、动作按钮、时间线尚未抽象成通用能力�?5. 缺少一个完整审批类业务闭环来展示“流程审�?+ 材料审核 + 权限控制 + 操作留痕”的企业后台特征�?
本设计书目标是把管理端从”能用的 CRUD 后台”升级为更有企业级体验的运营管理平台�?
## 2. 目标

### 2.1 业务目标

1. 管理端页面具备统一的加载、异常、空数据、无权限和重试体验�?2. Dashboard 能展示运营概览、订单趋势、店铺排行和待处理事项�?3. 常见列表页可以按需启用批量操作、列设置、密度切换和导出�?4. 订单、租户、商家入驻等状态流转页面共享统一的状态机 UI 表达�?5. 新增商家入驻审批流程，形成一个完整的企业后台审批业务案例�?
### 2.2 工程目标

1. 优先复用现有 `shared/config-crud`、`AdminTablePage`、`AdminSearchForm`、权限和 i18n 能力�?2. 新能力先沉淀�?`shared`，再落地到业务页面，避免每个页面重复实现�?3. 所有增强能力默认不影响旧页面，尽量通过 opt-in 配置开启�?4. 后端只提供最小接口和 mock 数据，不在本阶段做大规模后端重构�?5. 关键组合式函数、状态机配置和导出逻辑需要有 Vitest 覆盖�?
## 3. 非目�?
本阶段不做以下内容：

- 不做完整 BI 平台或复杂报表系统�?- 不做自定义拖�?Dashboard�?- 不做复杂 Excel 样式导出，第一版只�?CSV 导出�?- 不引�?XState 等通用状态机框架�?- 不引入重�?PDF/Office 文档预览库�?- 不做后端多租户和数据隔离重构；这些能力已在前置多租户阶段处理�?- 不一次性迁移所有旧页面，只选择代表性页面接入增强能力�?
## 4. 当前基础与可复用能力

### 4.1 配置驱动 CRUD

现有核心文件�?
- `apps/web-admin/src/shared/config-crud/model/useConfigCrud.ts`
- `apps/web-admin/src/shared/config-crud/model/useConfigCrud.types.ts`
- `apps/web-admin/src/shared/config-crud/model/table.ts`
- `apps/web-admin/src/shared/config-crud/components/ConfigDataTable/index.vue`
- `apps/web-admin/src/shared/config-crud/components/ConfigDataTable/ConfigTableColumns.vue`
- `apps/web-admin/src/shared/config-crud/components/ConfigFormDialog/index.vue`
- `apps/web-admin/src/shared/config-crud/components/CrudActionColumn/index.vue`

现有 `useConfigCrud` 已经封装�?
- 列表查询�?- loading/saving�?- 表单弹窗�?- 新增/编辑/删除�?- 分页�?- 前端过滤�?- abort 旧请求；
- feedback 注入�?
后续表格增强应该扩展这些文件，而不是新写一套表格系统�?
### 4.2 页面壳和搜索表单

现有文件�?
- `apps/web-admin/src/shared/ui/AdminTablePage/index.vue`
- `apps/web-admin/src/shared/ui/AdminSearchForm/index.vue`
- `apps/web-admin/src/shared/ui/form/field-schema.ts`
- `apps/web-admin/src/shared/ui/form/FieldRenderer/index.vue`

这些组件已经形成管理端页面的基本布局和表单渲染模式。新增商家入驻审批页应继续使用这些组件�?
### 4.3 权限体系

现有文件�?
- `apps/web-admin/src/shared/config/access.ts`
- `apps/web-admin/src/app/providers/directives.ts`
- `apps/web-admin/src/shared/lib/permission.ts`
- `apps/web-admin/src/entities/session/model/store.ts`

状态机动作和待处理事项展示都应同时考虑�?
1. 后端返回�?`availableActions`�?2. 前端权限码；
3. 当前业务状态�?
### 4.4 动态路由和菜单

现有文件�?
- `apps/web-admin/src/app/router/component-map.ts`
- `apps/web-admin/src/app/router/build-routes.ts`
- `apps/web-admin/src/app/router/dynamic-routes.ts`
- `apps/web-admin/src/entities/session/model/dev-auth.ts`

新增页面应遵�?`src/pages/**/index.vue` 的组件映射约定，并在 dev mock 菜单中补入口�?
### 4.5 订单和租户状态机参�?
订单相关�?
- `apps/web-admin/src/features/order-management/config/workflow.ts`
- `apps/web-admin/src/features/order-management/ui/OrderActionColumn.vue`
- `apps/web-admin/src/features/order-management/ui/OrderDetailDrawer.vue`
- `apps/web-admin/src/features/order-management/ui/RefundRejectDialog.vue`

租户相关�?
- `apps/web-admin/src/entities/tenant/model/types.ts`
- `apps/web-admin/src/entities/tenant/api/index.ts`
- `apps/web-admin/src/features/tenant-management/model/useTenantManagement.ts`
- `apps/web-admin/src/features/tenant-management/ui/TenantManagementPage.vue`
- `apps/web-admin/src/features/tenant-management/ui/TenantTable.vue`
- `apps/web-admin/src/features/tenant-management/ui/TenantActionLogDialog.vue`

这些代码提供了可抽象的状态机 UI 模式：状态标签、动作按钮、操作日志和时间线�?
## 5. 总体方案

分五步推进：

| Step | 名称 | 规模 | 预估工作�?| 依赖 |
|------|------|------|-----------|------|
| 1 | 异常�?/ 加载态组件化 | S | 1�? �?| �?|
| 2 | Dashboard 数据看板 | M | 2�? �?| Step 1 |
| 3 | 批量操作 + 表格增强 + 列设�?| M | 2�? �?| �?|
| 4 | 状态机通用组件抽取 | M | 2�? �?| �?|
| 5 | 商家入驻审批工作�?| L | 3�? �?| Step 1, 3, 4 |

总计�?10�?5 天。Step 2�?�? 之间无依赖，可并行推进�?
这个顺序的原因：

- Step 5 会依�?Step 1 的状态组件；
- Step 5 会依�?Step 3 的增强表格；
- Step 5 会依�?Step 4 的状态机组件�?- Step 2 相对独立，但可以复用 Step 1 的状态组件�?
### 5.1 并行策略

```
Week 1:  [Step 1] ──────────�?         [Step 3] ───────────�?         [Step 4] ───────────�?Week 2:  [Step 2] ───────────�?         [Step 5] ◀──────────�?```

Step 1 优先完成（其�?Step 会复用状态组件），Step 2/3/4 可并行，Step 5 最后收尾�?
## 6. Step 1 设计：异常�?/ 加载态组件化

### 6.1 新增模块

新增目录�?
`apps/web-admin/src/shared/ui/state`

包含�?
- `AdminStateView.vue`：统一状态容器�?- `AdminSkeleton.vue`：骨架屏�?- `AdminEmptyState.vue`：空状态�?- `AdminErrorState.vue`：错误重试状态�?- `AdminForbiddenHint.vue`：页内无权限提示�?- `useSubmitGuard.ts`：提交防重复组合式函数�?- `index.ts`：统一导出�?
### 6.2 状态模�?
`AdminStateView` 接收以下状态：

```ts
export type AdminEmptyReason = 'no-data' | 'no-filter-result'
export type AdminSkeletonVariant = 'table' | 'form' | 'card'

export interface AdminStateViewProps {
  loading?: boolean
  error?: unknown | string
  empty?: boolean
  emptyReason?: AdminEmptyReason
  forbidden?: boolean
  skeleton?: AdminSkeletonVariant | false
}
```

状态优先级�?
1. `forbidden`（纯前端权限判断，不触发数据请求�?2. `loading`
3. `error`
4. `empty`
5. default slot

说明：`forbidden` 优先级最高是因为它在路由守卫或组件挂载时即可通过前端权限码判定，不需要等待接口返回。如果权限判定依赖后�?403 响应，则�?403 会被归入 `error` 分支处理，不�?`forbidden` 路径�?
### 6.3 空状态区�?
- `no-data`：数据源本身为空�?- `no-filter-result`：筛选条件导致当前结果为空�?
这能让用户知道是“系统没有数据”还是“筛选条件太严格”�?
### 6.4 提交防重�?
`useSubmitGuard` 负责保护异步提交�?
```ts
const { submitting, guardedSubmit } = useSubmitGuard()
await guardedSubmit(async () => {
  await submitForm()
})
```

同一提交未完成前，后续调用直接忽略，避免双击保存、双击审核造成重复请求�?
## 7. Step 2 设计：Dashboard 数据看板

### 7.1 模块结构

新增�?
`apps/web-admin/src/features/dashboard`

包含�?
- `model/types.ts`
- `api/dashboard.ts`
- `model/useDashboardOverview.ts`
- `components/StatCardGrid.vue`
- `components/OrderTrendChart.vue`
- `components/ShopRankingTable.vue`
- `components/PendingWorkList.vue`

修改�?
- `apps/web-admin/src/pages/dashboard/index.vue`

### 7.2 数据结构

```ts
export interface DashboardOverview {
  stats: DashboardStatCard[]
  orderTrend: OrderTrendPoint[]
  shopRanking: ShopRankingItem[]
  pendingItems: PendingWorkItem[]
}

export interface DashboardStatCard {
  key: string
  label: string
  value: number
  unit?: string
  trend?: number
  type: 'primary' | 'success' | 'warning' | 'danger'
}

export interface OrderTrendPoint {
  date: string
  paid: number
  completed: number
  refunded: number
}

export interface ShopRankingItem {
  shopId: string
  shopName: string
  orderCount: number
  revenue: number
  rating?: number
}

export interface PendingWorkItem {
  key: string
  title: string
  count: number
  permission?: string
  routeName?: string
}
```

### 7.3 图表方案

新增依赖�?
- `echarts`
- `vue-echarts`

原因�?
- ECharts 是后台数据看板的常见选择�?- `vue-echarts` 能减少手写初始化、销毁和 resize 逻辑�?- 当前 dashboard 已明确写�?ECharts 占位文案�?
按需引入策略（初始实现即采用，不作为后续优化）：

```ts
// apps/web-admin/src/features/dashboard/lib/echarts.ts
import { use } from 'echarts/core'
import { LineChart, BarChart, PieChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

use([
  CanvasRenderer,
  LineChart,
  BarChart,
  PieChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
])

export { default as VChart } from 'vue-echarts'
```

ECharts 引入文件放在 `features/dashboard/lib/` 而非 `shared/lib/`，因为当前仅 Dashboard 使用图表。如后续其他页面需�?ECharts，再提升�?shared�?
Dashboard 页面使用路由级懒加载（`() => import(...)`），确保 ECharts 代码不会打入首屏 chunk。全�?ECharts �?1MB（gzip �?~300KB），按需引入后仅保留所需图表类型，预�?gzip �?60�?00KB�?
### 7.4 看板布局

- 顶部：统计卡片�?- 中部：订单趋势图 + 待处理事项�?- 底部：店铺排行�?
所有数据请求统一�?`useDashboardOverview` 处理，图表组件只负责展示�?
## 8. Step 3 设计：批量操�?+ 表格增强 + 列设�?
### 8.1 扩展�?
现有 `ConfigDataTable` 已经是所有配置表格的统一入口，因此增强能力应添加在：

- `apps/web-admin/src/shared/config-crud/model/table.ts`
- `apps/web-admin/src/shared/config-crud/components/ConfigDataTable/index.vue`
- `apps/web-admin/src/shared/config-crud/components/ConfigDataTable/ConfigTableColumns.vue`

### 8.2 新能�?
1. 多选：通过 Element Plus selection column 实现�?2. 批量操作：根据选中行和权限展示按钮�?3. 列设置：�?`preferencesKey` 持久化列显隐�?4. 密度切换：支持默认、舒适、紧凑�?5. CSV 导出：导出当前可见列和当前数据�?
### 8.3 列设置持久化方案

持久化存储选择 `localStorage`�?
- 不增加后端接口依赖，符合"后端只提供最小接�?原则�?- 后台系统通常单设备使用，跨设备同步需求不强；
- 存储 key 格式：`admin:table-prefs:{preferencesKey}`�?- 存储内容：列 key 数组（记录可见列�? 密度设置�?
如后续有跨设备需求，可扩展为"localStorage 做缓�?+ 后端偏好接口做持久化"的两级方案�?
新增纯函数模块：

```ts
// apps/web-admin/src/shared/config-crud/model/table-preferences.ts
export function getColumnPreferenceKey(key: string): string { ... }
export function getDefaultVisibleColumnKeys(columns: ConfigTableColumn[]): string[] { ... }
export function parseStoredVisibleColumnKeys(key: string): string[] | null { ... }
export function mergeVisibleColumnKeys(stored: string[], columns: ConfigTableColumn[]): string[] { ... }
```

采用纯函数而非 composable，原因：逻辑无响应式依赖，纯函数更易测试，在 `ConfigDataTable` 内部直接调用即可�?
### 8.4 CSV 导出范围

导出范围定义�?
- **默认行为**：导出当前筛选条件下的全量数据（非仅当前页）�?- **实现方式**：如果后端支持不分页查询，则一次请求全量；否则循环分页请求后合并�?- **数据上限**：前端限制最大导�?10,000 条，超出时提示用户缩小筛选范围�?- **导出�?*：取当前可见列（经过列设置筛选后的列）�?- **进度反馈**：导出过程中显示 loading 状态，大数据量时显示进度百分比�?
### 8.5 默认兼容

所有增强项默认关闭，旧页面不传新配置时行为不变�?
### 8.6 CSV 优先

第一版不�?`.xlsx`�?
- CSV 依赖少；
- 易测试；
- 满足大多数后台导出场景；
- 样式 Excel 导出可以作为后续增强�?
## 9. Step 4 设计：状态机通用组件抽取

### 9.1 新增模块

新增目录�?
`apps/web-admin/src/shared/workflow`

包含�?
- `model/types.ts`
- `model/permissions.ts`
- `components/StatusTag.vue`
- `components/StateMachineActions.vue`
- `components/StateMachineTimeline.vue`
- `index.ts`

### 9.2 抽象边界

shared workflow 只负责通用 UI 和通用判断�?
- 状态标签如何展示；
- 动作如何按权限和 availableActions 显示�?- 时间线如何展示�?
不放业务规则�?
- 订单退款逻辑仍在订单 feature�?- 租户生命周期规则仍在租户 feature�?- 商家入驻审批规则仍在商家入驻 feature�?
### 9.3 动作可见�?
动作展示必须同时满足�?
1. 如果传入 `availableActions`，动�?key 必须包含在其中；
2. 如果配置�?`permission`，当前用户必须拥有权限；
3. 如果配置�?`visible(record)`，必须返�?true�?
### 9.4 现有代码迁移策略

订单和租户的状态机 UI 迁移�?shared workflow 组件时，采用适配包装而非直接替换�?
1. **保留原有 feature 文件**：`OrderActionColumn.vue`、`TenantTable.vue` 等不删除�?2. **内部替换为共享组�?*：这些文件的模板改为使用 `StatusTag`、`StateMachineActions` 等，传入各自�?workflow 配置�?3. **业务配置不迁�?*：`workflow.ts` 中的状态转换规则、动作定义仍留在各自 feature 目录�?4. **验证方式**：迁移后运行现有测试，确保行为不变�?
这样外部引用不变，内部实现统一，降低迁移风险�?
## 10. Step 5 设计：商家入驻审批工作流

### 10.1 模块结构

新增 entity�?
`apps/web-admin/src/entities/merchant-onboarding`

新增 feature�?
`apps/web-admin/src/features/merchant-onboarding`

新增 page�?
`apps/web-admin/src/pages/merchant-onboarding/index.vue`

### 10.2 状�?
```ts
export type MerchantApplicationStatus
  = | 'PENDING'
    | 'UNDER_REVIEW'
    | 'SUPPLEMENT_REQUESTED'
    | 'APPROVED'
    | 'REJECTED'
    | 'CANCELED'
```

### 10.3 状态转换图

```
                  ┌─────────────────────────────────────�?                  �?                                    �?[PENDING] ──�?[UNDER_REVIEW] ──�?[APPROVED]       [CANCELED]
                  �?      �?                           �?                  �?      └──�?[REJECTED]              �?                  �?                                    �?                  └──�?[SUPPLEMENT_REQUESTED] ──�?[PENDING]
```

转换规则�?
| 当前状�?| 动作 | 目标状�?| 所需权限 |
|---------|------|---------|---------|
| PENDING | 开始审�?| UNDER_REVIEW | MERCHANT_ONBOARDING_REVIEW |
| UNDER_REVIEW | 通过 | APPROVED | MERCHANT_ONBOARDING_APPROVE |
| UNDER_REVIEW | 驳回 | REJECTED | MERCHANT_ONBOARDING_REJECT |
| UNDER_REVIEW | 要求补充材料 | SUPPLEMENT_REQUESTED | MERCHANT_ONBOARDING_REVIEW |
| SUPPLEMENT_REQUESTED | 商家重新提交 | PENDING | �?(商家端触�? |
| PENDING / SUPPLEMENT_REQUESTED | 商家取消 | CANCELED | �?(商家端触�? |

说明：`SUPPLEMENT_REQUESTED` 是独立状态而非回退�?`PENDING`，原因：
- 管理员能区分"新申�?�?补充材料后重新提�?�?- 时间线能清晰展示补充材料的往返记录；
- 后续可对补充次数做限制�?
### 10.4 动作

```ts
export type MerchantApplicationAction
  = | 'VIEW'
    | 'START_REVIEW'
    | 'APPROVE'
    | 'REJECT'
    | 'REQUEST_SUPPLEMENT'
```

### 10.5 页面能力

商家入驻审批页包含：

1. 申请列表（使用增强表格，支持批量操作和列设置）�?2. 状态筛选（支持多状态组合筛选）�?3. 详情抽屉（展示申请信息、材料和时间线）�?4. 审核弹窗（通过/驳回需填写意见，驳回意见必填）�?5. 材料预览�?6. 审核时间线（使用 `StateMachineTimeline` 组件）�?7. 权限控制（按钮级别）�?8. 操作后刷新（乐观更新 + 后台刷新确认）�?
### 10.6 权限

新增权限�?
- `MERCHANT_ONBOARDING_VIEW`
- `MERCHANT_ONBOARDING_REVIEW`
- `MERCHANT_ONBOARDING_APPROVE`
- `MERCHANT_ONBOARDING_REJECT`

### 10.6 材料预览

材料类型�?
- `image`：使�?Element Plus image preview�?- `pdf`：提供打开链接�?- `file`：提供打开/下载链接�?
不引入重型文档预览库�?
## 11. 测试策略

### 11.1 必测组合式函�?
- `useSubmitGuard`
- `useDashboardOverview`
- `useMerchantOnboarding`

### 11.2 必测纯函�?
- `table-preferences`（列偏好读写与合并）�?- CSV escaping/export�?- 状态机动作可见性�?- 状态标签配置映射�?- 状态优先级解析（state-priority）�?
### 11.3 必测组件（使�?@vue/test-utils�?
- `StatusTag`：验证不同状态映射到正确�?type �?label�?- `StateMachineActions`：验证权�?+ availableActions + visible 三条件交叉下的按钮渲染�?- `AdminStateView`：验证状态优先级渲染逻辑（forbidden > loading > error > empty > slot）�?- `StateMachineTimeline`：验证时间线条目排序和内容展示�?
### 11.4 必测业务配置

- 商家入驻 workflow 状态转换�?- 订单 workflow 迁移后保持兼容�?
### 11.5 验证命令

```powershell
pnpm --filter @elm-platform/web-admin run test:unit
pnpm --filter @elm-platform/web-admin run type-check
pnpm --filter @elm-platform/web-admin run lint
pnpm --filter @elm-platform/web-admin run build
```

## 12. 风险与取�?
### 12.1 共享表格改动影响面大

缓解：所有增强能力默认关闭；先在一个代表页面启用，不全量迁移�?
### 12.2 状态机抽象过度

缓解：shared workflow 不放业务规则，只�?UI 和通用动作可见性判断�?
### 12.3 ECharts 包体�?
缓解：初始实现即采用按需注册（见 7.3），Dashboard 页面路由级懒加载，ECharts 代码不进入首�?chunk�?
### 12.4 后端未就�?
缓解：dashboard 和商家入驻先稳定 TypeScript 接口�?mock 数据，后端接入时替换 API 实现，不�?UI 合约�?
### 12.5 CSV 大数据量导出性能

缓解：前端限制最大导�?10,000 条；超出时引导用户缩小筛选范围或联系后端提供异步导出。后续可扩展为后端生成下载链接的方案�?
## 13. 验收标准

1. Dashboard 不再是静态占位，能展示运营数据和趋势图�?2. 共享状态组件能覆盖加载、错误、空数据、筛选无结果和无权限提示�?3. 至少一个现有列表页启用表格增强并保持旧页面兼容�?4. 订单/租户状�?UI 能迁移到共享 workflow 组件且行为不变�?5. 商家入驻审批流程能完成列表查看、详情查看、材料预览、审核通过/驳回/要求补充材料和时间线展示�?6. ECharts 按需引入，Dashboard chunk 独立于首�?bundle�?7. `test:unit`、`type-check`、`lint`、`build` 全部通过�?
## 14. 术语�?
| 术语 | 含义 |
|------|------|
| availableActions | 后端根据当前记录状态返回的允许动作列表 |
| preferencesKey | 表格列设置的持久化标识，每个表格页唯一 |
| opt-in | 需要显式传入配置才启用的能力，不传则不生效 |
| workflow config | 各业务模块定义的状态机配置（状态、动作、转换规则） |
| StateMachineActions | 通用动作按钮组件，根据权限和状态渲染可用操�?|

