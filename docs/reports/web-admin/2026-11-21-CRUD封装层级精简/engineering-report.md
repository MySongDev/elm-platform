# 工程变更报告：CRUD 封装层级精简

> **2026-11-23 提交状态**：源码已按用户指令提交为 441762d（职责拆分）与 d43e5e5（餐厅刷新修复）；历史正文中的未提交状态指当时的实施基线。报告与证据另作 docs 提交。

> **项目**：elm-master / apps/web-admin
> **日期**：2026-11-21
> **变更类型**：重构（含租户弹窗标题重复前缀修正）
> **执行方式**：用户确认方案与分支后实施
> **验收状态**：✅ 已通过 lint / type-check / build / 178 个既有测试；独立代码复查无待修正问题

---

## 1. 变更概览

### 1.1 变更统计

| 指标 | 变更前 | 变更后 | 变化 |
|------|--------|--------|------|
| 字段渲染实现文件数 | 10 | 1 | -9（映射文件 + 8 个薄组件） |
| 字段渲染实现总行数（含空行） | 226 | 115 | -111 |
| useUserManagement 行数 | 199 | 160 | -39 |
| useUserManagement 返回属性数 | 25（含 spread 展开与覆盖） | 20（显式声明） | -5 |
| ConfigFormDialog 行数 | 131 | 112 | -19 |
| 公共弹窗默认配置合并数 | 3 | 0 | -3 |
| 本次 26 个已跟踪文件总行数 | 1660 | 1515 | -145 |
| 既有单测文件 / 测试数 | 45 / 178 | 45 / 178 | 0 |
| 既有单测运行耗时 | 7.02 秒 | 6.41 秒 | -0.61 秒，单次运行波动，不作为性能收益 |
| Vite 打包阶段耗时 | 未执行基线构建 | 4.92 秒 | 仅记录本次实测 |

统计使用 `git diff --numstat -- apps/web-admin`，以及对各路径的 `git show HEAD:<path>` / `Get-Content` 行数。源码及应用文档、生成声明合计 26 个已跟踪文件（17 修改、9 删除），差异为 +258/-403。另新增设计、计划、报告 3 个本地文档，并修改报告索引 1 个；本次合计 **30 个文件（3 新增、18 修改、9 删除）**。本地 `docs/superpowers` 与 `docs/reports` 被仓库既有忽略规则排除，不在 Git diff 统计中。

### 1.2 文件变更清单

```text
✅ 新增文件 (3)
docs/superpowers/specs/2026-11-21-admin-crud-simplify-design.md  # 已确认方案、边界与验收
docs/superpowers/plans/2026-11-21-admin-crud-simplify.md        # 执行与验收清单
docs/reports/web-admin/2026-11-21-CRUD封装层级精简/engineering-report.md

✅ 修改文件 (18)
apps/web-admin/AGENTS.md                                    # 同步模块地图与用户校验归属
apps/web-admin/src/pages/commerce/food/ui/FoodFormDialog.vue # 直接传 title/rules
apps/web-admin/src/pages/commerce/restaurant/ui/RestaurantFormDialog.vue
apps/web-admin/src/pages/platform/tenant/ui/TenantFormDialog.vue
apps/web-admin/src/pages/system/dept/ui/DeptFormDialog.vue
apps/web-admin/src/pages/system/menu/ui/MenuFormDialog.vue
apps/web-admin/src/pages/system/role/ui/RoleFormDialog.vue
apps/web-admin/src/pages/system/user/config/fields.ts        # 表单字段工厂改用具名 options
apps/web-admin/src/pages/system/user/index.vue               # 移除 rules 透传
apps/web-admin/src/pages/system/user/model/useUserManagement.ts
apps/web-admin/src/pages/system/user/ui/UserFormDialog.vue   # 本地维护校验与标题
apps/web-admin/src/shared/config-crud/components/ConfigFormDialog/index.vue
apps/web-admin/src/shared/config-crud/index.ts               # 清理配置类型出口
apps/web-admin/src/shared/config-crud/model/form.ts          # 移除三组配置类型与默认值
apps/web-admin/src/shared/config-crud/model/useConfigCrud.ts # 保留流程，清理断言与描述
apps/web-admin/src/shared/ui/form/FieldRenderer/index.vue     # 直接渲染八种控件
apps/web-admin/src/typings/components.d.ts                   # 构建生成，删除八个声明
docs/reports/README.md                                      # 登记报告与更新分类计数

❌ 删除文件 (9)
apps/web-admin/src/shared/ui/form/FieldRenderer/renderer-map.ts
apps/web-admin/src/shared/ui/form/FieldRenderer/renderers/DateField.vue
apps/web-admin/src/shared/ui/form/FieldRenderer/renderers/DateRangeField.vue
apps/web-admin/src/shared/ui/form/FieldRenderer/renderers/InputField.vue
apps/web-admin/src/shared/ui/form/FieldRenderer/renderers/InputNumberField.vue
apps/web-admin/src/shared/ui/form/FieldRenderer/renderers/PasswordField.vue
apps/web-admin/src/shared/ui/form/FieldRenderer/renderers/RadioField.vue
apps/web-admin/src/shared/ui/form/FieldRenderer/renderers/SelectField.vue
apps/web-admin/src/shared/ui/form/FieldRenderer/renderers/TextareaField.vue
```

---

## 2. 背景与动机

### 2.1 问题

用户指出简单 CRUD 的阅读观感不佳：业务逻辑集中在大配置回调中，表单渲染又经过多层组件。原字段链路为 `UserFormDialog → ConfigFormDialog → FieldRenderer → InputField → el-input`，普通字段包装没有独立交互逻辑。用户表单校验在状态 composable 中，页面和弹窗需要转发 rules；公共弹窗将少量参数包装为 dialog/formOptions/action 三组对象并合并默认值。

任务开始记录的 HEAD 为 `115288b`；`git status --short` 仅有 `apps/web-user/src/views/order/composables/useUserOrders.js` 的一行用户注释改动，`git diff --stat` 为 1 文件、+1。该改动未修改、暂存或提交。用户授权新建 `codex/admin-crud-simplify` 本地分支，本次没有 commit、push、PR 或 merge。

### 2.2 决策依据

- `rg -n 'useConfigCrud|ConfigFormDialog' apps/web-admin/src/pages` 确认用户、角色、菜单、部门、食品、餐馆和租户共 7 个生产调用方；保留已有公共流程比复制到七个页面更合适。
- 原 `FieldRenderer/renderers/InputField.vue:11` 等控件只负责字段属性和值转发。新 `FieldRenderer/index.vue:20` 起直接渲染八种类型；独立复查逐一比较模板，去掉新增条件指令后与原控件模板一致。
- `ConfigFormDialog/index.vue:14` 直接定义组件参数；`index.vue:39` 继续处理条件字段，校验后才提交的顺序保持。
- `UserFormDialog.vue:30` 在一处装配字段、标题和规则；`useUserManagement.ts:138` 明确返回页面消费接口，移除原 spread 和删除函数覆盖。
- `fields.ts:93` 的工厂由五个位置参数改为 `t` 加具名 options，唯一调用方直接传 props。
- `useConfigCrud.ts:30` 明确说明 AbortController 只标记过期响应；`fetchList()` 不接收 signal，不能把它描述为网络请求取消。原文件注释还误称分页与注入 feedback，已修正为代码能够证明的行为。
- 本地构建输出版本：Vue 3.5.35、TypeScript 6.0.3、Vite 8.0.16；单测输出 Vitest 4.1.8。

### 2.3 被否决的方案

| 方案 | 否决理由 |
|------|----------|
| 全部复制回页面 | 七个页面将重复状态、确认、校验与保存后刷新；减少跳转的同时增加维护分叉 |
| 继续拆成更多 CRUD composable | 保存和刷新仍是紧密依赖的流程，额外拆分会增加跨文件阅读 |
| 新增插件化字段注册与动态组件层 | 当前只有八种简单内建控件，没有独立注册生命周期需求 |
| 加第五个 payload 泛型并迁移所有 CRUD 调用方 | 本次重点是阅读成本；暂不扩大到完整载荷类型契约改造，既有 payload any 保留 |
| 给纯展示与简单 CRUD 重构新增测试 | `AI_TEST_POLICY.md` 将此类改动列入默认不写测试场景；执行既有测试、类型检查与构建 |

---

## 3. 具体改动

### 3.1 字段渲染与公共弹窗

八种控件改成同一模板中的明确 `v-if / v-else-if` 分支，类型检查能够依据 `field.type` 检查对应属性；保留所有显式属性、默认值、选项循环及最后的 `v-bind="field.props ?? {}"` 覆盖顺序。删除映射文件与八个包装组件。独立复查确认编译后的分支 key 为 0…7，切换字段类型会更换控件实例。custom 字段仍没有内建控件，其既有使用方式未扩展。

公共弹窗保留字段循环、showWhen 条件显示、打开后清除校验、校验后 emit submit、按钮 loading 和滚动布局。由直接 props 承载标题、规则、宽度、标签宽度、销毁选项和按钮文案；默认宽度 620px、标签宽度 90px、destroyOnClose=false 与按钮翻译保持。删除不再使用的 ActionOptions/DialogOptions/FormOptions 及三组默认配置。

```vue
<!-- 改动前 -->
<ConfigFormDialog
  :dialog="{ title: t('user.username') }"
  :is-edit="isEdit"
  :form-options="{ rules }"
/>

<!-- 改动后：完整标题在业务表单中生成 -->
<ConfigFormDialog :title="title" :rules="rules" />
```

七个业务弹窗全部迁移。租户表单原先将完整“新增租户/编辑租户”再交给公共弹窗添加前缀，此次直接传完整标题，消除“新增新增租户/编辑编辑租户”。这项文案修正是本次唯一明确的显示差异。

### 3.2 用户管理状态、业务表单与文档

username/password/email 校验迁入 UserFormDialog，继续依赖当前 isEdit 与翻译。新增时显示并要求密码，编辑时不显示密码；`toUserPayload` 继续负责新增保留密码、编辑删除密码及联系字段/租户/店铺的归一化，未修改载荷逻辑。页面删除校验规则的解构与透传。

默认表单改为工厂直接创建，permissions 与 boundShopIds 每次均得到新数组，避免初次实例之间共享默认 boundShopIds。创建回调保留必要的既有载荷断言，更新与删除直接传 API 函数；getFormId 直接返回 `_userId`，未改变通用 CRUD 的真假值分支。返回值只包含页面需要的 20 个属性和操作，不再暴露 error/tableData/resetForm/fetchRows/rules。

通用 CRUD 保留全部流程，只去掉列表结果与更新 id 两处冗余断言，修正说明。应用 AGENTS 同步字段渲染与表单接口地图，明确用户校验归属。构建自动删除八个组件类型声明；源码、生成物一起保留在当前未提交 diff 中。

### 3.3 过程修正记录

1. 默认沙箱中 Git 创建分支及 pnpm realpath 受限制，按用户授权请求正常文件访问后执行成功。
2. lint 根据仓库格式重新展开规则对象，行数统计使用格式化后的真实文件，未以手写紧凑格式虚报缩减。
3. 构建之后的测试和独立 type-check 请求一度未执行：自动审批代理连续返回 HTTP 400 content-blocked；不是测试失败或命令被判不安全。向用户说明并请求恢复，审批通道恢复后重新运行，两项都通过。
4. 独立只读代码复查未发现 Critical / Important / Minor 待修正问题；复查没有修改测试或源码。

---

## 4. 验证结果

| 检查项 | 命令 | 结果 |
|--------|------|------|
| 基线类型检查 | `pnpm --filter @elm-platform/web-admin run type-check` | 退出码 0 |
| 基线既有单测 | `pnpm --filter @elm-platform/web-admin run test:unit` | 45 文件、178 测试通过；Node localStorage 提示未造成失败；耗时 7.02 秒 |
| 改动后 lint | `pnpm --filter @elm-platform/web-admin run lint` | 退出码 0；0 errors、28 warnings（既有 any、未使用变量等）；没有修改本次范围外的源码 |
| 改动后构建 | `pnpm --filter @elm-platform/web-admin run build` | vue-tsc 与 Vite 构建通过；2743 模块，Vite 阶段 4.92 秒；生成声明同步 |
| 改动后既有单测 | `pnpm --filter @elm-platform/web-admin run test:unit` | 45 文件、178 测试全部通过，耗时 6.41 秒；Node localStorage 提示未造成失败 |
| 生成声明后的类型检查 | `pnpm --filter @elm-platform/web-admin run type-check` | 退出码 0 |
| 差异检查 | `git diff --check` | 通过，无空白错误 |
| 残余引用检查 | 下方完整命令 | 无匹配；移除路径与配置类型无残留 |
| 独立代码复查 | 只读 diff 比较与内存模板编译 | 八种模板、分支 key、七个调用方、密码/条件字段/载荷契约无待修正问题 |

> **说明**：只记录本次实际执行结果。构建有 VueUse PURE 注释及插件耗时提示，但退出码为 0。没有浏览器交互验收，也没有新增、修改或删除测试；既有测试政策允许使用类型、构建和现有回归完成本次验证。

```bash
rg -n 'renderer-map|FieldRenderer/renderers|ActionOptions|DialogOptions|FormOptions|DEFAULT_FORM_OPTIONS|DEFAULT_DIALOG_OPTIONS|DEFAULT_ACTION_OPTIONS|:form-options=|:dialog=' apps/web-admin/src apps/web-admin/AGENTS.md
```

---

## 5. 影响范围

| 模块 | 影响 | 说明 |
|------|------|------|
| 共用 FieldRenderer | 中 | 搜索及编辑表单直接使用内建控件；逐项保留字段绑定与默认值 |
| 七个 CRUD 业务弹窗 | 中 | title/rules 接口同步迁移，统一校验与布局保留 |
| 用户管理 | 中 | 校验归属、默认表单创建、返回接口调整；API 载荷和自删除保护保留 |
| 租户管理 | 低 | 消除弹窗标题重复前缀 |
| 组件生成声明与应用地图 | 低 | 删除控件声明、更新模块说明 |
| web-user / 后端 / 数据库 | 无 | 未涉及；用户已有 web-user 改动保持原样 |

---

## 6. 风险与注意事项

1. 公共弹窗的旧分组 props 和配置类型已删除。当前七个生产调用方全部迁移，后续代码应直接传完整 title 与 rules，不能继续使用 dialog/formOptions/action。
2. 用户状态接口明确收窄，未来新增调用方如果需要原先透传的状态，应根据页面需求显式增加；不要恢复全量 spread。
3. 内建字段值模型与 CRUD payload 的既有 any 保留，因此类型检查不能证明所有业务字段值合法；本次没有夸大类型安全收益。
4. showWhen 仍只决定显示，隐藏字段的载荷清理由业务转换负责。用户 `toUserPayload` 的 ALL/TENANT/SHOP 归一化保持，不能因 UI 隐藏字段而删除这段转换。
5. 请求标记只阻止过期结果回写，不能中断网络请求。保存中取消弹窗、请求失败反馈及重复提交策略保持现状，本次没有调整这些行为。
6. 未执行浏览器端交互验收；已有单测、编译与逐项模板比较通过。

---

## 7. 后续事项（本次未做）

1. 更复杂的租户/店铺联动出现时，再决定是否让用户表单采用直接业务模板或字段插槽。本次已完成薄层压平，不增加新的组件体系。
2. 若以后要收紧创建/更新载荷类型，需统一评估七个 CRUD 调用方；本次保留原契约。
3. 本次改动留在 `codex/admin-crud-simplify` 未提交；commit/push/merge 需用户另行授权。

---

## 8. 回滚指南

当前仍为未提交改动，且任务开始时管理端工作区干净。先确认 `git diff -- apps/web-admin` 仍仅包含本报告列出的路径，再保存该差异并反向应用；不要夹带后续用户改动。下面命令仅为回滚说明，本次没有执行：

```bash
git diff --binary --output=admin-crud-simplify.patch -- apps/web-admin
git apply --reverse admin-crud-simplify.patch
pnpm --filter @elm-platform/web-admin run type-check
pnpm --filter @elm-platform/web-admin run test:unit
pnpm --filter @elm-platform/web-admin run build
```

这不会触及 web-user 的原有改动。设计、计划与报告属于本地留档；发生回滚后保留报告并补记回滚原因与验证结果。

---

*报告生成时间：2026-11-21*
*执行与报告：本次工程会话（用户授权）*
