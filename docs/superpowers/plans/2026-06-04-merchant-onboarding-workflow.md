# 商家入驻审批工作流实现计�?
> **执行要求�?* 实现本计划时，建议先完成 `2026-06-04-admin-workflow-components.md`。本计划以前端研习为主，后端只做 mock 或最�?API 替身。每个任务使�?checkbox 跟踪进度�?
**目标�?* 新增一个完整的“商家入驻审批”管理端业务案例，覆盖列表、筛选、详情抽屉、材料预览、审核弹窗、状态动作、审核时间线、权限控制和操作后刷新，形成典型企业后台审批流程�?
**前端研习重点�?*

- 审批类业务页面如何组�?entity、feature、page�?- 如何用配置驱动表格、共享状态组件、共�?workflow 组件组合出复杂页面�?- 如何处理“列�?+ 详情 + 操作弹窗 + 时间�?+ 材料预览”的中后台交互�?- 如何�?mock API 先稳定前端接口契约，后续替换真实后端�?
---

## 1. 范围

本计划实现设计书 Step 5：商家入驻审批工作流�?
包含�?
- 商家入驻 entity 类型�?mock API�?- 商家入驻 feature composable�?- 商家入驻列表页�?- 状态筛选、关键词搜索�?- 详情抽屉�?- 材料预览�?- 审核通过、驳回、要求补充材料�?- 审核时间线�?- 权限码配置和 dev mock 菜单入口�?
不包含：

- 不做真实文件上传�?- 不做 PDF 内嵌预览，只提供打开链接�?- 不做复杂审批流引擎�?- 不做后端数据库建表或 Prisma schema 扩展�?- 不引入重型文档预览库�?
## 2. 文件结构

### 新增 entity

- `apps/web-admin/src/entities/merchant-onboarding/model/types.ts`
  - 申请状态、动作、申请记录、材料、审核日志类型�?- `apps/web-admin/src/entities/merchant-onboarding/api/index.ts`
  - mock-backed API：列表、详情、审核动作�?- `apps/web-admin/src/entities/merchant-onboarding/index.ts`
  - 统一导出�?
### 新增 feature

- `apps/web-admin/src/features/merchant-onboarding/config/workflow.ts`
  - 状态标签配置、动作配置、状态筛选选项�?- `apps/web-admin/src/features/merchant-onboarding/model/useMerchantOnboarding.ts`
  - 页面状态、查询、详情、审核动作�?- `apps/web-admin/src/features/merchant-onboarding/model/__tests__/useMerchantOnboarding.test.ts`
  - composable 核心行为测试�?- `apps/web-admin/src/features/merchant-onboarding/ui/MerchantOnboardingPage.vue`
  - 页面主体组合组件�?- `apps/web-admin/src/features/merchant-onboarding/ui/MerchantApplicationDrawer.vue`
  - 详情抽屉�?- `apps/web-admin/src/features/merchant-onboarding/ui/MerchantReviewDialog.vue`
  - 审核弹窗�?- `apps/web-admin/src/features/merchant-onboarding/ui/MerchantMaterialList.vue`
  - 材料列表与预览�?- `apps/web-admin/src/features/merchant-onboarding/index.ts`
  - 统一导出�?
### 新增 page

- `apps/web-admin/src/pages/merchant-onboarding/index.vue`
  - 页面入口，渲�?`MerchantOnboardingPage`�?
### 修改

- `apps/web-admin/src/shared/config/access.ts`
  - 新增权限码�?- `apps/web-admin/src/entities/session/model/dev-auth.ts`
  - dev mock 菜单和权限补入口�?- `apps/web-admin/src/app/router/component-map.ts`
  - 如当前项目需要手动映射页面组件，则加�?`merchant-onboarding`�?- `apps/web-admin/src/shared/i18n/lang/zh-CN.ts`
  - 中文文案�?- `apps/web-admin/src/shared/i18n/lang/en.ts`
  - 英文文案�?
## 3. 类型设计

新增 `apps/web-admin/src/entities/merchant-onboarding/model/types.ts`�?
```ts
export type MerchantApplicationStatus
  = | 'PENDING'
    | 'UNDER_REVIEW'
    | 'APPROVED'
    | 'REJECTED'
    | 'SUPPLEMENT_REQUIRED'
    | 'CANCELED'

export type MerchantApplicationAction
  = | 'VIEW'
    | 'APPROVE'
    | 'REJECT'
    | 'REQUEST_SUPPLEMENT'

export type MerchantMaterialType = 'image' | 'pdf' | 'file'

export interface MerchantMaterial {
  id: string
  name: string
  type: MerchantMaterialType
  url: string
  description?: string
}

export interface MerchantApplication {
  id: string
  merchantName: string
  contactName: string
  contactPhone: string
  category: string
  city: string
  status: MerchantApplicationStatus
  submittedAt: string
  updatedAt: string
  availableActions: MerchantApplicationAction[]
  materials: MerchantMaterial[]
  remark?: string
}

export interface MerchantApplicationDetail extends MerchantApplication {
  businessLicenseNo: string
  address: string
  auditLogs: MerchantAuditLog[]
}

export interface MerchantAuditLog {
  id: string
  action: MerchantApplicationAction | 'SUBMIT'
  fromStatus?: MerchantApplicationStatus
  toStatus?: MerchantApplicationStatus
  actorName: string
  comment?: string
  createdAt: string
}

export interface MerchantApplicationQuery {
  keyword?: string
  status?: MerchantApplicationStatus | ''
  page: number
  pageSize: number
}

export interface MerchantApplicationListResult {
  items: MerchantApplication[]
  total: number
}

export interface ReviewMerchantApplicationPayload {
  action: Exclude<MerchantApplicationAction, 'VIEW'>
  comment: string
}
```

## 4. 权限设计

�?`apps/web-admin/src/shared/config/access.ts` 中新增：

```ts
MERCHANT_ONBOARDING_VIEW: 'merchant:onboarding:view',
MERCHANT_ONBOARDING_REVIEW: 'merchant:onboarding:review',
MERCHANT_ONBOARDING_APPROVE: 'merchant:onboarding:approve',
MERCHANT_ONBOARDING_REJECT: 'merchant:onboarding:reject',
```

建议规则�?
- 查看列表和详情：`MERCHANT_ONBOARDING_VIEW`
- 要求补充材料：`MERCHANT_ONBOARDING_REVIEW`
- 审核通过：`MERCHANT_ONBOARDING_APPROVE`
- 驳回：`MERCHANT_ONBOARDING_REJECT`

dev mock 中给超级管理员补齐全部权限�?
## 5. 任务

### Task 1：新�?entity 类型�?mock API

- [ ] 新增 `model/types.ts`�?- [ ] 新增 `api/index.ts`�?- [ ] mock API 包含�?  - `fetchMerchantApplications(query)`
  - `fetchMerchantApplicationDetail(id)`
  - `reviewMerchantApplication(id, payload)`
- [ ] mock 列表要覆盖不同状态：待审核、审核中、已通过、已驳回、需补充材料、已取消�?- [ ] mock 审核动作需要返回更新后的详情或简单成功结果�?- [ ] 新增 `index.ts` 统一导出�?
### Task 2：新�?workflow 配置

- [ ] 新增 `features/merchant-onboarding/config/workflow.ts`�?- [ ] 定义状态标签配置：
  - `PENDING` �?warning
  - `UNDER_REVIEW` �?primary
  - `APPROVED` �?success
  - `REJECTED` �?danger
  - `SUPPLEMENT_REQUIRED` �?warning
  - `CANCELED` �?info
- [ ] 定义动作配置，适配 `shared/workflow` �?`WorkflowActionConfig`�?  - `APPROVE`
  - `REJECT`
  - `REQUEST_SUPPLEMENT`
- [ ] 新增纯函数：
  - `getMerchantStatusConfig(status, t)`
  - `createMerchantActionConfigs(t)`
  - `toMerchantTimelineItems(logs, t)`
- [ ] �?workflow 配置写测试，确保状态映射和动作权限正确�?
### Task 3：实�?`useMerchantOnboarding`

- [ ] 新增 `model/useMerchantOnboarding.ts`�?- [ ] 状态：
  - `loading`
  - `detailLoading`
  - `reviewing`
  - `error`
  - `query`
  - `items`
  - `total`
  - `selectedApplication`
  - `detailVisible`
  - `reviewVisible`
  - `currentReviewAction`
- [ ] 方法�?  - `fetchList()`
  - `resetQuery()`
  - `openDetail(row)`
  - `openReview(action, row)`
  - `submitReview(payload)`
- [ ] 使用 `useSubmitGuard` 或本�?`reviewing` 防重复提交�?- [ ] 操作成功后刷新列表；如果详情抽屉打开，也刷新详情�?- [ ] 新增测试�?  - 首次加载列表成功�?  - 查询失败写入 error�?  - 打开详情会拉取详情�?  - 审核成功后刷新列表�?  - 重复提交会被保护�?
### Task 4：实现材料预览组�?
- [ ] 新增 `MerchantMaterialList.vue`�?- [ ] image 类型使用 `el-image`，启�?preview�?- [ ] pdf 类型展示 `el-link`，新窗口打开�?- [ ] file 类型展示 `el-link`，新窗口打开或下载�?- [ ] 空材料显�?`el-empty` 或简单空态�?- [ ] 不引入新依赖�?
### Task 5：实现详情抽�?
- [ ] 新增 `MerchantApplicationDrawer.vue`�?- [ ] 使用 `el-drawer`�?- [ ] 展示�?  - 商家基本信息�?  - 联系人信息�?  - 营业执照号�?  - 地址�?  - 当前状�?`StatusTag`�?  - 材料列表 `MerchantMaterialList`�?  - 审核时间�?`StateMachineTimeline`�?- [ ] loading 时用 `AdminStateView` �?Element Plus loading�?- [ ] 抽屉内可以提供审核动作入口，但第一版建议动作主要放在列表操作列，避免入口过多�?
### Task 6：实现审核弹�?
- [ ] 新增 `MerchantReviewDialog.vue`�?- [ ] 使用 `el-dialog` + `el-form`�?- [ ] props�?  - `action`
  - `application`
  - `submitting`
- [ ] 表单字段�?  - `comment`
- [ ] 校验�?  - 驳回和要求补充材料必须填写原因�?  - 审核通过可以选填备注�?- [ ] emits�?  - `submit(payload)`
- [ ] 提交按钮显示 loading，防重复点击�?
### Task 7：实现页面主�?
- [ ] 新增 `MerchantOnboardingPage.vue`�?- [ ] 使用 `AdminTablePage` 或现有页面布局�?- [ ] 搜索区包含：
  - 关键词：商家名称 / 联系�?/ 手机号�?  - 状态筛选�?- [ ] 表格使用 `ConfigDataTable`�?- [ ] 表格增强建议启用�?  - `preferencesKey: 'merchant.onboarding.table'`
  - `density: 'default'`
  - `exportable: true`
- [ ] 状态列使用 `StatusTag`�?- [ ] 操作列使用：
  - 查看详情按钮�?  - `StateMachineActions` 渲染审核动作�?- [ ] 页面外层使用 `AdminStateView` 处理 loading/error/empty�?- [ ] 接入 `MerchantApplicationDrawer` �?`MerchantReviewDialog`�?
### Task 8：新�?page、路由、菜单、权�?
- [ ] 新增 `apps/web-admin/src/pages/merchant-onboarding/index.vue`�?
```vue
<script setup lang="ts">
import { MerchantOnboardingPage } from '@/features/merchant-onboarding'
</script>

<template>
  <MerchantOnboardingPage />
</template>
```

- [ ] 检�?`apps/web-admin/src/app/router/component-map.ts` 是否需要手动加入页面映射�?- [ ] �?`entities/session/model/dev-auth.ts` 中加�?dev mock 菜单项�?- [ ] 菜单建议放在“商�?运营/订单”相关分组下，标题为“商家入驻审批”�?- [ ] 补齐权限码�?
### Task 9：补 i18n 文案

- [ ] 修改 `zh-CN.ts`，新增：
  - 页面标题�?  - 搜索字段�?  - 状态文案�?  - 动作文案�?  - 表格列名�?  - 审核弹窗文案�?  - 材料预览文案�?  - 时间线文案�?- [ ] 修改 `en.ts`，补对应英文�?
### Task 10：验�?
- [ ] 运行聚焦测试�?
```powershell
corepack pnpm --filter @elm-platform/web-admin exec vitest run src/features/merchant-onboarding/model/__tests__/useMerchantOnboarding.test.ts
```

- [ ] 运行 workflow 相关测试�?
```powershell
corepack pnpm --filter @elm-platform/web-admin exec vitest run src/shared/workflow/model/__tests__/permissions.test.ts src/features/merchant-onboarding/config/__tests__/workflow.test.ts
```

- [ ] 运行全量验证�?
```powershell
corepack pnpm --filter @elm-platform/web-admin run test:unit
corepack pnpm --filter @elm-platform/web-admin run type-check
corepack pnpm --filter @elm-platform/web-admin run lint
corepack pnpm --filter @elm-platform/web-admin run build
```

## 6. 验收标准

- 管理端菜单可以进入“商家入驻审批”�?- 列表能展示不同状态的申请记录�?- 可以按关键词和状态筛选�?- 可以打开详情抽屉查看基础信息、材料和审核时间线�?- 图片材料可以预览，PDF/file 可以打开链接�?- 有权限时展示审核通过、驳回、要求补充材料动作�?- 无权限时不展示对应动作�?- 审核弹窗有表单校验和提交 loading�?- 操作成功后列表刷新，状态变化可见�?- 页面使用已有 `AdminStateView`、`ConfigDataTable`、`shared/workflow`，而不是另写一套系统�?- 测试、类型检查、lint、build 通过�?
## 7. 前端研习复盘问题

实现完成后建议重点复盘：

1. 为什么商家入驻适合拆成 entity、feature、page 三层�?2. 列表页、详情抽屉、审核弹窗分别应该持有哪些状态？
3. `availableActions` 和前端权限码分别解决什么问题？
4. 审核弹窗为什么要区分“动作配置”和“提�?payload”？
5. 如果明天后端接入真实接口，哪些文件应该改，哪�?UI 文件不应该改�?
