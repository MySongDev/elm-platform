# 工程变更报告：六个 CRUD 页面按列表与编辑职责拆分

> **2026-11-23 提交状态**：源码已按用户指令提交为 441762d（职责拆分）与 d43e5e5（餐厅刷新修复）；历史正文中的未提交状态指当时的实施基线。报告与证据另作 docs 提交。

> **项目**：elm-master / apps/web-admin
> **日期**：2026-11-22
> **变更类型**：重构；附带修正餐厅部分批量删除后列表不刷新
> **执行方式**：AI 辅助，按用户批准的实施计划执行；后半程按用户要求先修改再集中验证
> **验收状态**：✅ lint / type-check / 178 测试 / build / 126 浏览器检查通过

---

## 1. 变更概览

### 1.1 变更统计

| 指标 | 变更前 | 变更后 | 变化 |
|------|--------|--------|------|
| 六页生产源码文件/行数（不含测试） | 40 / 3648 | 46 / 4746 | 按职责增加文件，直接字段模板增加行数 |
| 六页全部源码/测试文件/行数 | 43 / 4068 | 52 / 5508 | +9 文件 / +1440 行 |
| useConfigCrud 生产调用方 | 6 | 0 | -6 |
| 测试文件/用例 | 45 / 178 | 47 / 178 | 场景数保持，迁移为业务入口 |
| lint 错误/既有警告 | 0 / 28（上轮实际结果） | 0 / 26 | 没有新增警告 |
| 本轮源码、测试及配置路径 | — | 53（新增17、修改25、删除11） | +3303 / -2282 行，按阶段快照比较 |
| 实施至验收统计耗时 | — | 56.9 分钟 | 含审批故障、浏览器脚本定位修正，非纯编码耗时 |

### 1.2 文件变更清单

```
新增 17
apps/web-admin/src/pages/commerce/food/model/__tests__/useFoodList.test.ts
apps/web-admin/src/pages/commerce/food/model/form.ts
apps/web-admin/src/pages/commerce/food/model/useFoodList.ts
apps/web-admin/src/pages/commerce/restaurant/model/form.ts
apps/web-admin/src/pages/commerce/restaurant/model/useRestaurantList.ts
apps/web-admin/src/pages/platform/tenant/model/form.ts
apps/web-admin/src/pages/platform/tenant/model/useTenantList.ts
apps/web-admin/src/pages/platform/tenant/ui/__tests__/TenantFormDialog.test.ts
apps/web-admin/src/pages/system/dept/model/form.ts
apps/web-admin/src/pages/system/dept/model/useDeptList.ts
apps/web-admin/src/pages/system/menu/model/form.ts
apps/web-admin/src/pages/system/menu/model/useMenuList.ts
apps/web-admin/src/pages/system/menu/ui/__tests__/MenuFormDialog.test.ts
apps/web-admin/src/pages/system/role/model/__tests__/useRolePermissions.test.ts
apps/web-admin/src/pages/system/role/model/form.ts
apps/web-admin/src/pages/system/role/model/useRoleList.ts
apps/web-admin/src/pages/system/role/model/useRolePermissions.ts

修改 25
apps/web-admin/AGENTS.md
apps/web-admin/src/pages/commerce/food/config/fields.ts
apps/web-admin/src/pages/commerce/food/index.vue
apps/web-admin/src/pages/commerce/food/ui/FoodFormDialog.vue
apps/web-admin/src/pages/commerce/restaurant/config/fields.ts
apps/web-admin/src/pages/commerce/restaurant/index.vue
apps/web-admin/src/pages/commerce/restaurant/ui/RestaurantFormDialog.vue
apps/web-admin/src/pages/platform/tenant/config/fields.ts
apps/web-admin/src/pages/platform/tenant/index.vue
apps/web-admin/src/pages/platform/tenant/ui/TenantActionLogDialog.vue
apps/web-admin/src/pages/platform/tenant/ui/TenantFormDialog.vue
apps/web-admin/src/pages/system/dept/config/fields.ts
apps/web-admin/src/pages/system/dept/index.vue
apps/web-admin/src/pages/system/dept/ui/DeptFormDialog.vue
apps/web-admin/src/pages/system/menu/config/fields.ts
apps/web-admin/src/pages/system/menu/index.vue
apps/web-admin/src/pages/system/menu/ui/MenuFormDialog.vue
apps/web-admin/src/pages/system/role/config/fields.ts
apps/web-admin/src/pages/system/role/index.vue
apps/web-admin/src/pages/system/role/ui/RoleFormDialog.vue
apps/web-admin/src/pages/system/role/ui/RolePermissionPanel.vue
apps/web-admin/src/shared/config-crud/index.ts
apps/web-admin/src/shared/i18n/lang/en.ts
apps/web-admin/src/shared/i18n/lang/zh-CN.ts
apps/web-admin/vitest.config.ts

删除 11
apps/web-admin/src/pages/commerce/food/model/useFoodManagement.ts
apps/web-admin/src/pages/commerce/restaurant/model/useRestaurantManagement.ts
apps/web-admin/src/pages/platform/tenant/model/payload.ts
apps/web-admin/src/pages/platform/tenant/model/useTenantManagement.ts
apps/web-admin/src/pages/system/dept/model/useDeptManagement.ts
apps/web-admin/src/pages/system/menu/model/useMenuManagement.ts
apps/web-admin/src/pages/system/role/model/__tests__/useRoleManagement.test.ts
apps/web-admin/src/pages/system/role/model/useRoleManagement.ts
apps/web-admin/src/shared/config-crud/model/__tests__/useConfigCrud.test.ts
apps/web-admin/src/shared/config-crud/model/useConfigCrud.ts
apps/web-admin/src/shared/config-crud/model/useConfigCrud.types.ts
```

---

## 2. 背景与动机

### 2.1 问题

用户认为大 composable 与多层转接让简单业务难读。前两轮已精简公共组件并拆分用户管理；本轮将剩余租户、角色、食品、菜单、部门、餐厅统一到相同职责边界。沿用 codex/admin-crud-simplify、HEAD 115288b，未提交。开始时工作区已有 33 个跟踪路径 +643/-1039，不能算成本轮变更。stage-baseline.json 保存了 70 个现有文件的原始字节；本报告只统计与该工作区基线的差异。报告目录沿用 2026-11-21 批准的计划命名，源码实施与验收日期为 2026-11-22。

### 2.2 决策依据

列表只处理加载、筛选、删除/状态操作；业务编辑器拥有草稿、选项、校验、保存；纯 form.ts 明确回填和请求转换；index.vue 用编辑对象、visible 和 saved 连接。共享层保留实际复用的 UI。证据：

- pages/platform/tenant/model/form.ts:32、:45 明确创建包含 code、更新排除 code，空可选字段仍为 undefined；旧快照的 useTenantManagement.ts:37 为满足通用接口提供空删除函数。
- pages/system/role/model/form.ts:26、:36 复制权限；useRolePermissions.ts 使用既有 permission-tree 合并，保留非菜单权限及 20ms/240ms 时序。
- pages/commerce/food/model/form.ts:24、:42 集中首规格回填与单规格载荷，身份来自 item_id。
- pages/system/menu/ui/MenuFormDialog.vue:36、pages/system/dept/ui/DeptFormDialog.vue:39 使用原始完整树，排除自身，保持已有父级范围。
- 餐厅旧快照 useRestaurantManagement.ts:113 的 Promise.all 首失败后不进入 :115 刷新；新 useRestaurantList.ts:111 改为 allSettled，全部请求结束再刷新，全部成功才提示。
- 最终 rg -n 搜索 useConfigCrud / 六个旧 Management / 专属泛型类型在 apps/web-admin/src 与应用 AGENTS 中无结果。工具实际版本：pnpm 11.25.0、Vitest 4.1.8、Vite 8.0.16；构建依赖 Vue 3.5.35、VueUse 14.3.0。

### 2.3 被否决的方案

| 方案 | 否决理由 |
|------|----------|
| 只重命名 useXxxManagement 继续调用公共 CRUD | 不能改变状态归属及阅读入口 |
| 新建通用编辑器/接收回调的 composable | 会重建同一种间接调用负担 |
| 为所有页面补相同数量的表格包装组件 | 已有公共表格/业务表格足够，薄转发没有收益 |
| 同时改后端分页、树后代禁选、权限规则或多规格编辑 | 混入业务变化，增加验证范围，用户未要求 |

---

## 3. 具体改动

### 3.1 六个页面的职责与契约

新增每页 model/useXxxList.ts 与 model/form.ts；删除对应 Management。业务弹窗接收业务对象与 visible，成功 emit saved；保存失败保留草稿，列表刷新错误独立展示。每次打开创建独立草稿；列表和编辑异步请求具有版本与销毁保护；公共弹窗负责校验与忙碌保护。字段直接写在业务弹窗默认插槽，搜索/表格保留静态配置。

| 页面 | 修改前生产文件/行数 | 修改后生产文件/行数 |
|---|---:|---:|
| role | 8 / 1078 | 10 / 1368 |
| tenant | 8 / 670 | 8 / 830 |
| food | 6 / 487 | 7 / 614 |
| menu | 5 / 446 | 6 / 607 |
| dept | 7 / 457 | 8 / 632 |
| restaurant | 6 / 510 | 7 / 695 |

总行数增加主要来自显式字段模板、失败反馈和独立边界。本次验收标准是状态归属清楚、业务入口容易定位，不承诺总代码缩短。角色权限独立 useRolePermissions；租户状态操作在列表、日志加载在日志组件；食品保持首规格；菜单/部门传完整树与初始父级；餐厅列表管理单条与批量删除。接口、路由组件名称、权限码、全量请求/客户端过滤/表格分页保持原样。

### 3.2 公共清理、回归场景迁移与开发约定

删除 shared/config-crud/model/useConfigCrud.ts、useConfigCrud.types.ts 及旧测试出口；公共 ConfigDataTable、ConfigFormDialog、CrudActionColumn 与有效展示类型保留。AGENTS 改为推荐列表/编辑器/纯转换，业务表单不强制 schema。公共错误文案放入 crud 分组。

| 原场景 | 新入口 | 最终结果 |
|---|---|---|
| 保存成功反馈、创建/更新成功文案（2） | tenant/ui/__tests__/TenantFormDialog.test.ts | 2 通过 |
| 取消删除、加载错误重试、全量请求不传分页（3） | food/model/__tests__/useFoodList.test.ts | 3 通过 |
| 带父级新增、编辑转新增默认重置（2） | menu/ui/__tests__/MenuFormDialog.test.ts | 2 通过 |
| 四个既有权限面板/合并场景 | role/model/__tests__/useRolePermissions.test.ts | 4 通过 |

测试准入依据是既有入口迁移不能丢失回归，以及复杂权限、状态转换已有用例；未为简单 CRUD 新增额外用例/依赖。沿用已有 effectScope 与内存渲染器；Vitest 用明确的编辑器 include/exclude 扩展现有 client-node 环境，没有重复运行。

### 3.3 过程修正记录

1. 用户中途要求先完成修改再集中验证，因此后半程菜单/部门/餐厅不再逐页执行检查；独立文件边界下并行实施，主代理最后统一校验。
2. 非唯一 saveSuccess/deleteSuccess 上下文令公共 i18n 文案误落 commerce；浏览器显示原 key 后定位，改到 crud，中英文同步。
3. 迁移列表测试不需要确认框成功默认值。Element Plus 的 MessageBoxData 声明使随手填的 string/object mock 都不合类型，去掉该无用默认值，取消场景仍明确配置 reject。随后 type-check、全部测试及包含类型检查的 build 通过。
4. 浏览器脚本先因审批 HTTP400、服务退出、隐藏 checkbox 原生节点定位、common.edit 为“修改”而非“编辑”、空格邮箱触发现有格式校验等中断。记录了真实失败及前序通过项，修正临时脚本/服务后逐项重跑。没有把这些执行问题当生产代码故障。
5. 餐厅部分删除失败导致列表不刷新是源码确认的原有问题；有限修正为所有请求结束后刷新，没有引入逐项反馈或原子操作假设。

---

## 4. 验证结果

| 检查项 | 命令 | 结果 |
|--------|------|------|
| lint | pnpm --filter @elm-platform/web-admin run lint | exit 0，0 errors / 26 existing warnings，9.70s |
| 类型检查 | pnpm --filter @elm-platform/web-admin run type-check | exit 0，6.46s |
| 单元测试 | pnpm --filter @elm-platform/web-admin run test:unit | exit 0，47 文件 / 178 测试，Vitest 6.74s |
| 生产构建 | pnpm --filter @elm-platform/web-admin run build | exit 0，包含 vue-tsc，Vite 4.21s |
| 差异 | git diff --check | 无输出，通过 |
| 浏览器 | manual-browser-observations.md 中的七页 node 命令 | 126 PASS / 0 FAIL / 0 pageerrors |
| 独立审查 | 逐页规格后代码质量复查；剩余三页最终集中复查 | 所有页面 SPEC / QUALITY PASS |

> **说明**：验证命令必须为本次实际执行过的，不得臆造；如有文档与命令不符的勘误也记录于此。

---

## 5. 影响范围

| 模块 | 影响 | 说明 |
|------|------|------|
| 六页列表及编辑器 | 中 | 状态归属、失败反馈、组件接口改变，业务请求与主要交互保留 |
| shared/config-crud | 中 | 通用状态入口删除，已有 UI 出口保留 |
| 用户管理 | 低 | 不修改本轮用户生产代码，14 项浏览器回归通过 |
| 后端/API/路由 | 无 | 不修改端点、schema、路由名称或权限码 |
| web-user 用户已有改动 | 无 | useUserOrders.js 与阶段快照字节/哈希一致 |

---

## 6. 风险与注意事项

1. 本次浏览器使用独立模拟接口，不验证真实数据库/后端授权；没有对真实用户或租户数据做写入。
2. 菜单/部门仍只排除自身，食品仍编辑首规格，均是有意保留的既有边界。
3. 批量删除不是原子操作；部分失败后刷新准确列表，失败提示仍由共享 HTTP 提供。
4. lint 26 条既有警告、Node localStorage 实验警告、VueUse PURE annotation 与插件耗时构建提示保留，构建 exit 0。临时 fixture 缺少真实 Vite 的 icon resolver，曾出现图标解析 warning；不等同于生产构建失败。
5. docs/reports 被 Git 忽略，报告/快照只在当前机器；需共享时用户另行授权纳入版本控制。源码改动未提交，勿用 HEAD 覆盖本轮及上两轮工作。

---

## 7. 后续事项（本次未做）

1. 没有阻碍本轮验收的待办。真实后端集成、服务端分页、多规格编辑、父级后代禁选属于另行确认的需求。
2. 本地 Git 提交、推送、PR、合并、tag 等待用户明确指令。
3. 14 个临时文件已在应用目录清除，专用 Vite/Chrome 已停止；浏览器证据和原名 harness 留在报告目录。

---

## 8. 回滚指南

```bash
# 在仓库根先预览；脚本核对最终哈希，遇到后续修改会拒绝覆盖
python docs/reports/web-admin/2026-11-21-六个CRUD页面职责拆分/rollback-stage.py
# 确认仅恢复本轮源码/配置后执行
python docs/reports/web-admin/2026-11-21-六个CRUD页面职责拆分/rollback-stage.py --apply
pnpm --filter @elm-platform/web-admin run type-check
pnpm --filter @elm-platform/web-admin run test:unit
```

---

*报告生成时间：2026-11-22*
*执行与报告：Codex（用户批准实施，保持未提交）*

回滚脚本的预览命令已实际执行，识别53个路径且验收哈希全部匹配；没有运行 --apply。该脚本只恢复本轮源码/配置，保留历史未提交的用户管理/共享组件改动和报告证据。
