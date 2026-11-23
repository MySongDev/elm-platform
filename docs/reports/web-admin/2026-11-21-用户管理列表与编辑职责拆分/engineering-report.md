# 工程变更报告：用户管理列表与编辑职责拆分

> **2026-11-23 提交状态**：源码已按用户指令提交为 441762d（职责拆分）与 d43e5e5（餐厅刷新修复）；历史正文中的未提交状态指当时的实施基线。报告与证据另作 docs 提交。

> **项目**：elm-master / apps/web-admin
> **日期**：2026-11-21
> **变更类型**：重构（含编辑转新增时提前校验问题修正）
> **执行方式**：用户确认具体演变方案后实施
> **验收状态**：✅ lint / type-check / build / 45 文件、178 测试 / 浏览器 smoke / 独立复查通过

---

## 1. 变更概览

### 1.1 变更统计

本轮基线为上一轮“CRUD 封装层级精简”完成后的工作区，而非 HEAD；涉及文件原文和行数保存在同目录 `baseline.json`。16 个应用路径按新增/删除分别计数，包含测试和配置，统计不夹带上一轮其他页面及 web-user 改动。

| 指标 | 变更前 | 变更后 | 变化 |
|------|--------|--------|------|
| 本轮应用文件数（按存续路径） | 12 | 13 | +1（新增测试环境文件） |
| 本轮应用文件总行数（含空行） | 2302 | 2496 | +194 |
| 用户页入口行数 | 101 | 92 | -9 |
| 用户字段配置行数 | 202 | 91 | -111，只保留搜索与表格 |
| 状态与转换模块行数 | 213（useUserManagement + payload） | 180（useUserList + form） | -33 |
| 用户编辑器行数 | 77 | 358 | +281，直接字段模板与编辑生命周期在同处 |
| 页面向编辑器的绑定/事件数 | 8 | 3 | visible / user / saved |
| 用户页对 useConfigCrud 的依赖 | 1 | 0 | 列表与编辑器各自管理状态 |
| 公共配置表单生产调用方 | 7 | 6 + 1 插槽用户编辑器 | 六个页面继续原字段配置 |
| 页面初始化业务请求数（代码计数） | 4 | 1 | 三组选项移到打开编辑器时加载 |
| 单测文件 / 场景 | 45 / 178 | 45 / 178 | 只迁移原有七个回归 |
| 全量单测耗时 | 6.41 秒（上一轮最终实测） | 7.21 秒（本轮最终实测） | 单次运行波动，不作为性能结论 |
| Vite 打包阶段耗时 | 4.92 秒（上一轮） | 4.31 秒（本轮最终） | 仅记录实测，不作为性能结论 |

新增行数主要来自显式表单模板、选项重试、会话保护和清楚的错误反馈。本次收益是职责与数据流可读，并非总行数缩减。应用代码及配置合计 16 路径（4 新增、9 修改、3 删除）；加本地设计/计划/报告/基线四个新增文档与报告索引，共 **21 文件（8 新增、10 修改、3 删除）**。docs 本地留档受既有忽略规则影响，不在 Git diff 中。

### 1.2 文件变更清单

```text
✅ 新增文件 (8)
apps/web-admin/src/pages/system/user/model/useUserList.ts       # 查询、排序、过滤、加载错误、删除
apps/web-admin/src/pages/system/user/model/form.ts              # 独立草稿与创建/更新载荷
apps/web-admin/src/pages/system/user/ui/__tests__/UserFormDialog.test.ts
apps/web-admin/src/pages/system/user/ui/__tests__/client-node.ts # 13 行 node 客户端编译环境，无新依赖
docs/superpowers/specs/2026-11-21-user-list-editor-design.md
docs/superpowers/plans/2026-11-21-user-list-editor.md
docs/reports/web-admin/2026-11-21-用户管理列表与编辑职责拆分/baseline.json
docs/reports/web-admin/2026-11-21-用户管理列表与编辑职责拆分/engineering-report.md

✅ 修改文件 (10)
apps/web-admin/AGENTS.md                                      # 职责地图与密码规则决策
apps/web-admin/src/pages/system/user/index.vue                 # 连接列表与编辑目标，绑定错误/空状态
apps/web-admin/src/pages/system/user/ui/UserTable.vue           # 纠正页面域头注释，表格行为保持
apps/web-admin/src/pages/system/user/ui/UserFormDialog.vue      # 本地草稿、选项、保存和直接模板
apps/web-admin/src/pages/system/user/config/fields.ts           # 删除用户编辑字段工厂
apps/web-admin/src/shared/config-crud/components/ConfigFormDialog/index.vue
apps/web-admin/src/shared/i18n/lang/zh-CN.ts                    # 用户字段、选项/保存错误提示
apps/web-admin/src/shared/i18n/lang/en.ts                       # 对应英文文案
apps/web-admin/vitest.config.ts                               # 两组 include 独立，保留原 src/mock 匹配
docs/reports/README.md                                        # 登记本轮报告

❌ 删除文件 (3)
apps/web-admin/src/pages/system/user/model/useUserManagement.ts
apps/web-admin/src/pages/system/user/model/payload.ts
apps/web-admin/src/pages/system/user/model/__tests__/useUserManagement.test.ts
```

---

## 2. 背景与动机

### 2.1 问题

上一轮已压平简单控件包装，但用户状态仍由 useUserManagement 经 useConfigCrud 聚合：列表、编辑草稿、身份、保存、选项都交给页面转发。用户确认从零设计的“列表 + 独立编辑器 + 纯转换”拆分，并进一步批准结合现有 pages/entities/shared 分层实施。

开始执行了 `git status --short`、`git diff --stat` 和分支检查，当前为 `codex/admin-crud-simplify`，HEAD 仍是 `115288b`，包含上一轮授权的未提交改动及 `apps/web-user/src/views/order/composables/useUserOrders.js` 一行用户注释。本轮没有 commit、push、PR、merge 或 stash。

### 2.2 决策依据

- 现有 `entities/user/api/index.ts:15` 已提供无分页参数的全量列表 API，创建/更新参数也已在实体中明确；直接沿用，不复制一个页面 user.api 或 user.types。
- 新 `model/useUserList.ts` 完整管理列表逻辑；`index.vue` 保留 `defineOptions({ name: 'UserList' })` 与路由入口，公共权限、搜索、表格能力继续使用。
- `model/form.ts:23` 每次创建独立草稿，数组复制避免取消时仍改变列表行；`:50` / `:60` 分别返回 CreateUserParams / UpdateUserParams，移除 `_userId` 与联合载荷断言。
- `UserFormDialog.vue:86` 加载选项，`:120` 在打开/切换用户时回填，`:132` 执行保存。页面只传选中用户与 visible，监听 saved 刷新。
- `ConfigFormDialog/index.vue:92` 默认插槽提供业务字段；fields 默认空数组，无插槽时继续配置渲染。`:56` 防止校验/保存/禁用状态重复提交，保存期间禁止用户关闭或修改。
- 当前 Vitest 4.1.8 的 node 默认 SSR 编译不能客户端挂载 Vue SFC。自定义环境的 viteEnvironment 及 inline projects 使用官方支持的配置，参考 [测试环境](https://vitest.dev/guide/environment.html)、[测试组](https://vitest.dev/guide/projects.html)。实际本地解析器只匹配环境注释的单词名称，不能用相对文件路径注释代替项目配置。
- 浏览器复现“编辑转新增一打开即报必填”：本地 Element Plus `form.vue_vue_type_script_setup_true_lang.mjs` 的 rules watch（flush post）会触发 validate；校验只遍历注册 fields，`form-item` 卸载会 removeField。密码项已有 `v-if="!isEdit"`，其规则无需随模式改变，固定 required 后新增/编辑均经浏览器验证。

### 2.3 被否决的方案

| 方案 | 否决理由 |
|------|----------|
| 新建另一套 entities/API 或修改整个目录体系 | 用户 API、请求类型和 HTTP 已具备清楚边界；功能职责拆分足以满足目标 |
| 将编辑器再拆成多个 composable/控件包装 | 当前保存、草稿和选项共同服务同一编辑生命周期，完整过程放在一个业务文件更容易读 |
| 用户页直接使用另一种弹窗布局 | 通过现有公共弹窗默认插槽保留样式、校验和按钮约定，不增加一套视觉/交互体系 |
| 顺带新增后端分页、租户过滤或后端接口 | 当前 API 仍为全量列表，本轮是职责演变；新增数据能力需独立规划 |
| 新增 happy-dom / Vue Test Utils 依赖 | 为迁移三个已存在的保存回归，13 行环境和小型内存挂载器即可沿用 node；不引入额外依赖 |
| 用动态 password.required 控制编辑模式 | 字段已按模式挂载，动态规则导致新建时提前校验；模式判断放在字段显示处即可 |

---

## 3. 具体改动

### 3.1 列表、草稿与编辑器

useUserList 从通用 CRUD 依赖中独立出来：保持管理员优先与 ID 排序、用户名/角色/状态的本地筛选。请求版本保护阻止旧响应回写并清掉新请求 loading；加载错误交给 AdminTablePage 的既有状态组件。删除保留权限入口、自删除警告、确认和刷新，确认/删除过程中防重复；失败沿用 HTTP 反馈，保留列表。

form.ts 将表单身份移出草稿，身份由页面选中用户提供。默认/回填统一为 createUserForm，权限和店铺数组独立复制；创建保留密码、空联系方式使用 undefined，更新不含密码、空联系方式使用 null。ALL 时 tenantId=null、非 SHOP 时 boundShopIds=[] 的转换保持。

用户编辑器直接渲染 10 个字段，显示条件与校验在同处。权限、租户、店铺选项打开时加载：部分失败显示重试提示，重试只更新成功数组，新会话才清空数组；未就绪时禁用保存但允许取消。保存失败保留填写内容；成功关闭并 emit saved，刷新错误由列表自己处理。会话版本阻止旧选项/保存反馈影响新弹窗。

```vue
<!-- 改动后页面与编辑器的接口 -->
<UserFormDialog
  v-model:visible="dialogVisible"
  :user="editingUser"
  @saved="fetchUsers"
/>
```

公共弹窗增加字段默认插槽、可选 fields、submitDisabled 和校验/保存保护；六个其他业务表单继续 schema fallback。保留 620px 宽度、90px 标签宽度、滚动布局和按钮翻译。i18n 补齐原硬编码的数据范围、租户、店铺标签与错误提示。

### 3.2 既有回归迁移与模块文档

原七个场景迁到 UserFormDialog.test.ts：四个纯转换场景及三个真实业务编辑器保存场景，原有密码、空值、修剪、编辑转新增以及 API 参数断言均保留。挂载器通过公共弹窗 model/submit 契约驱动编辑器，没有暴露私有方法或断言源码字符串。

仅该文件使用 client-node 环境，运行时仍是 node；其余 44 个文件继续默认 SSR 编译。Vitest 原 src/mock 匹配模式移入 unit 项目，避免 extends 合并导致重复发现。测试总数与文件数均保持。AGENTS 同步职责和公共插槽，并记录密码规则的完整前提、两种模式与动态规则的后果。

构建重新生成组件声明；与本轮基线相比，声明没有额外差异，上一轮八个控件删除声明仍保留在当前工作区。

### 3.3 过程修正记录

1. 初次内存挂载使用默认 node SSR 编译，三个保存场景在 setup 阶段因缺少 SSR context 失败；纯转换和原 CRUD 测试通过。查本地 Vitest/Vue 插件与官方文档定位环境边界，使用客户端编译解决，没有改业务代码迁就错误测试环境。
2. 相对环境路径控制注释未被当前 Vitest 解析器识别；改为 inline project 指定环境。builtinEnvironments 使用当前 `vitest/runtime` 出口，清除 deprecated import。
3. 根 include 被 extends 合并，首轮全量检查重复跑成 89 文件/349 场景，虽全通过仍不算正确验收；将 include 分到两个项目，后续确认 45 文件/178 场景。
4. 独立复查发现权限 filterable 遗漏与失败重试清空成功选项，两项已修正并复查通过。
5. 浏览器发现动态密码规则导致编辑转新增提前显示错误；查看已安装 Element Plus 的字段注册与 rules watch 实现，固定密码必填规则，编辑时密码项不挂载。实际浏览器确认编辑仍可保存，新建不提前报错。
6. 自动审批代理一度返回 HTTP 400 content-blocked，验证命令未执行；明确告知用户，实际切换普通审批后继续。此类请求故障未记成代码测试失败。
7. 临时 Vite 新依赖优化导致浏览器初次夹具挂载重载，依赖稳定后再验证。测试在隔离浏览器上下文使用受控 HTTP 假数据，结束恢复客户端方法、卸载夹具并停止服务；没有创建或更新真实后端用户。

---

## 4. 验证结果

| 检查项 | 命令或工具 | 真实结果 |
|--------|------------|----------|
| 最终 lint | `pnpm --filter @elm-platform/web-admin run lint` | 退出码 0，0 errors、28 个既有 warnings |
| 独立类型检查 | `pnpm --filter @elm-platform/web-admin run type-check` | 退出码 0；最后密码规则修正后 build 再次运行 vue-tsc 通过 |
| 迁移场景定位验证 | `pnpm --filter @elm-platform/web-admin exec vitest run src/pages/system/user/ui/__tests__/UserFormDialog.test.ts` | 环境修正后 7/7 通过 |
| 全量回归 | `pnpm --filter @elm-platform/web-admin run test:unit` | 最终 45 文件、178 测试全部通过，7.21 秒；未新增场景 |
| 最终构建 | `pnpm --filter @elm-platform/web-admin run build` | vue-tsc 与 Vite 成功，2743 模块，Vite 4.31 秒 |
| 差异检查 | `git diff --check` | 通过 |
| 旧入口检查 | 下方 rg 命令 | 无旧入口/转换函数/字段工厂引用 |
| 独立复查 | 两轮只读代码复查 | 两个 Minor 修正后无必须修改项，最终密码规则与测试范围也通过复核 |
| 浏览器 smoke | 本地 Vite + Chrome DevTools 隔离上下文 | 新增密码必填；编辑隐藏密码并保存；取消不改原用户名/权限；清空联系方式提交 null；失败保留草稿、重试成功；配置 fallback 字段与必填校验正常；编辑转新增不提前显示错误 |
| 临时服务清理 | 浏览器夹具 cleanup、Vite Ctrl-C、5177 端口检查 | 恢复受控 HTTP 方法并卸载夹具，5177 无监听 |

```bash
rg -n 'useUserManagement|toUserPayload|createUserFormFields|\./payload|model/payload' apps/web-admin/src/pages/system/user
```

> **说明**：保留 Node localStorage、VueUse PURE 注释和插件耗时的既有提示；退出码均为 0。浏览器使用假数据验证 UI 和请求载荷，不代表真实租户权限或后端集成测试。测试变更是旧入口删除后的必要迁移，遵守 AI_TEST_POLICY，不新增布局/实现细节测试，不新增依赖。

---

## 5. 影响范围

| 模块 | 影响 | 说明 |
|------|------|------|
| 用户管理 | 中 | 状态归属、草稿类型与组件契约演变，功能字段保留 |
| 共用表单弹窗 | 中 | 新增插槽、禁用提交和忙碌保护，六页配置方式继续兼容 |
| 管理端测试 | 低 | 七个场景迁移，只有一个文件改编译环境，范围/数量保持 |
| 用户 i18n | 低 | 补齐用户字段与失败提示，现有翻译键保持 |
| 用户实体 / 共享 HTTP / 权限 / 路由 | 低 | 直接复用，未修改 API 或路由契约 |
| 后端 / 数据库 / web-user | 无 | 未修改；用户的 web-user 注释及上一阶段工作保留 |

---

## 6. 风险与注意事项

1. 保存和校验期间公共弹窗阻止重复点击、取消与修改，这是明确的交互保护变化；选项加载期间只禁用提交，仍允许取消。
2. 用户编辑器接收 user/visible 并发 saved；后续调用方不能再从 useUserManagement 获取草稿或 saving。
3. 密码项只在新增挂载，规则始终必填。不能恢复动态 required，否则会重现刚打开就报错；完整推导在应用 AGENTS。
4. 会话版本只阻止过期响应和反馈，不取消已发出的 HTTP。已成功的远端保存不能因关闭/切换而撤销。
5. current full-list/local-filter 行为保持；店铺选项仍来自原餐馆端点，没有新增按租户筛选能力。
6. 浏览器未覆盖真实服务的所有权限与部分选项失败组合；这部分使用代码复核和已有 HTTP 策略保证边界，报告不宣称完整后端集成验收。

---

## 7. 后续事项（本次未做）

1. 用户批准后再 commit / push / merge；当前仅保留本地 `codex/admin-crud-simplify` 工作区改动。
2. 后端分页、按租户筛选店铺属于独立数据能力规划。
3. 若更多编辑器需要 DOM/组件集成测试，再统一评估测试环境；本轮没有引入 DOM 依赖或通用新框架。

---

## 8. 回滚指南

本轮与上一轮都未提交，不能直接 restore 到 HEAD。先审阅本轮路径是否出现后续用户改动，按 `baseline.json` 恢复前一阶段内容，再删除本轮四个新增应用文件；保留报告并补记回滚原因。以下命令仅为说明，本次未执行：

```powershell
$userSplitRoot = (Resolve-Path -LiteralPath 'D:\Desktop\笔记\项目\elm-master').Path
$userSplitSnapshotPath = Join-Path $userSplitRoot 'docs/reports/web-admin/2026-11-21-用户管理列表与编辑职责拆分/baseline.json'
$userSplitSnapshot = Get-Content -LiteralPath $userSplitSnapshotPath -Raw | ConvertFrom-Json
foreach ($userSplitItem in $userSplitSnapshot) {
  $userSplitTarget = [IO.Path]::GetFullPath((Join-Path $userSplitRoot $userSplitItem.path))
  if (!$userSplitTarget.StartsWith($userSplitRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) { throw '回滚目标超出仓库' }
  New-Item -ItemType Directory -Force -Path (Split-Path $userSplitTarget) | Out-Null
  [IO.File]::WriteAllText($userSplitTarget, $userSplitItem.content, [Text.UTF8Encoding]::new($false))
}
$userSplitNewPaths = @(
  'apps/web-admin/src/pages/system/user/model/form.ts',
  'apps/web-admin/src/pages/system/user/model/useUserList.ts',
  'apps/web-admin/src/pages/system/user/ui/__tests__/UserFormDialog.test.ts',
  'apps/web-admin/src/pages/system/user/ui/__tests__/client-node.ts'
)
foreach ($userSplitNewPath in $userSplitNewPaths) {
  $userSplitTarget = [IO.Path]::GetFullPath((Join-Path $userSplitRoot $userSplitNewPath))
  if (!$userSplitTarget.StartsWith($userSplitRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) { throw '回滚目标超出仓库' }
  Remove-Item -LiteralPath $userSplitTarget
}
pnpm --filter @elm-platform/web-admin run type-check
pnpm --filter @elm-platform/web-admin run test:unit
pnpm --filter @elm-platform/web-admin run build
```

范围仅为本轮应用路径，不改 web-user，也不撤销上一轮其他页面的优化。

---

*报告生成时间：2026-11-21*
*执行与报告：本次工程会话（用户授权）*
