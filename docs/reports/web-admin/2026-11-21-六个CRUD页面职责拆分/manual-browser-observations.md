# 手工浏览器验收记录

七个真实页面/编辑器共完成 **126 项手工浏览器检查，全部 PASS，页面脚本错误为 0**。六个本次迁移页面为角色、租户、食品、菜单、部门、餐厅；用户页面是已重构页面的关联回归验证。本子任务未修改生产代码、未新增自动化测试或依赖。

## 验证环境和边界

- Vue 3.5.35、Element Plus 2.14.1、Vite 8.0.16、仓库已有 Playwright 1.60.0。
- 临时入口加载真实 Vue 页面、编辑器、公共 `ConfigFormDialog`、Element Plus 校验和树组件；没有替换业务组件或公共表单组件。
- 页面挂载前替换共享 `request.get/post/patch/put/delete`；所有请求只读写内存 fixture 和调用日志，未连接后端。未知 GET 在内存抛错。
- 使用专用隐藏无头 Chrome、独立 `user-data-dir` 和调试端口 `9228`；未操作用户已有浏览器或服务。
- 专用 Vite 仅绑定 `127.0.0.1:5187`。AutoImport 设置 `dts:false`，避免覆盖源码生成声明。
- 子任务旧会话审批模式未更新，浏览器命令最后由主任务在普通审批模式下实际执行；下面结果来自主任务确认的退出状态，以及对应 JSON 观察文件。

## 最终结果

| 页面 | 最终检查数 | 退出状态 | 实际耗时 | 结果文件 |
| --- | ---: | --- | --- | --- |
| 角色 | 26 | exit 0 | 首段 10.01s 后轮询，总耗时未记录 | `browser-role-results.json` |
| 用户 | 14 | exit 0 | 7.01s | `browser-user-results.json` |
| 租户 | 19 | exit 0 | 8.90s | `browser-tenant-results.json` |
| 食品 | 14 | exit 0 | 6.95s | `browser-food-results.json` |
| 菜单 | 15 | exit 0 | 6.29s | `browser-menu-results.json` |
| 部门 | 16 | exit 0 | 6.38s | `browser-dept-results.json` |
| 餐厅 | 22 | exit 0 | 9.47s | `browser-restaurant-results.json` |
| 合计 | **126** | 全部成功 | 不计算审批等待和失败准备耗时 | 全部 `errors=[]` |

实际执行的最终命令：

```powershell
node apps/web-admin/__crud-smoke-browser.cjs apps/web-admin/__crud-smoke-role.js
node apps/web-admin/__crud-smoke-browser.cjs apps/web-admin/__crud-smoke-user.js
node apps/web-admin/__crud-smoke-browser.cjs apps/web-admin/__crud-smoke-tenant.js
node apps/web-admin/__crud-smoke-browser.cjs apps/web-admin/__crud-smoke-food.js
node apps/web-admin/__crud-smoke-browser.cjs apps/web-admin/__crud-smoke-tree.js menu
node apps/web-admin/__crud-smoke-browser.cjs apps/web-admin/__crud-smoke-tree.js dept
node apps/web-admin/__crud-smoke-browser.cjs apps/web-admin/__crud-smoke-restaurant.js
```

这些脚本是本次人工验收的可回放记录，没有纳入 Vitest、Jest、Playwright 测试配置。脚本执行时实际操作浏览器，表单保存通过真实公共弹窗校验后才进入业务保存方法。异步竞态通过独立编辑器的目标切换和内存 deferred 响应控制。

## 覆盖的行为

所有编辑器覆盖新增必填校验、保存失败保留草稿、失败后重试、保存中禁用字段与取消并阻止 Esc/遮罩关闭和重复保存、编辑取消不修改源行、重新打开恢复草稿、快速切换丢弃旧保存响应，以及保存成功但列表刷新失败时展示列表错误。

| 页面 | 特殊行为和实际证据 |
| --- | --- |
| 角色 | 按钮选项失败/重试；旧选项丢弃；权限面板初始勾选和展开重建后的未保存勾选恢复；页面权限保存保留按钮 `button:keep` 与未知权限 `unknown:keep`；20ms 进入/240ms 离场内容保留；面板加载和保存失败、保存中限制、旧树/保存丢弃；取消无写请求 |
| 用户 | 新增用户名/密码校验，编辑不挂载密码项；权限和店铺数组独立复制；清空 email/phone 提交 `null`，ALL 范围清空 tenantId 和 boundShopIds；选项失败重试与旧响应丢弃 |
| 租户 | 编码格式校验和编辑禁用；更新载荷不含 code；空可选联系字段保持 `undefined`；状态 prompt 取消无请求，确认传递 `SUSPEND` 与 reason；日志失败重试、租户切换和关闭重开时丢弃旧日志 |
| 食品 | 读取首个 specfood 的金额字段，保持单规格载荷；新增 item_id 为 0，更新身份取当前食品；源嵌套规格不受取消影响；确认删除使用 `/admin/commerce/foods/31` 中的 item_id 并刷新，取消删除无请求 |
| 菜单 | 搜索保留命中后代的祖先，完整源树不变；编辑父级选项保留非命中菜单，只排除自身；根节点原 parentId=null 不被新增预设替代；新增子菜单使用预设父级；载荷不带 id/children |
| 部门 | 保留完整树和祖先；仅排除当前部门；编辑根节点保留 null；新增子部门使用预设父级；清空父级为 null；载荷不带 id/children |
| 餐厅 | 创建 id=0/起送20/配送5默认值，编辑保留显式0；载荷排除 createdAt；空筛选反馈和清除恢复；列设置实际隐藏→localStorage→重挂恢复→重置；密度选择、CSV文件名、选择计数；批量删除取消、两请求并行且等全部结束后刷新，部分失败仍刷新 |

## 发现及纠正过程

1. 初次角色校验观察过早读取了 Element Plus 过渡中的错误 DOM。读取实际 FormInstance 字段确认 validateState=error，调整等待后两条必填错误显示、无写请求。没有修改生产校验。
2. 选项失败曾显示原始 key `crud.optionsLoadFailed`。主任务发现新增 i18n key 误放在 commerce 段并修正到 crud；角色最终验证重新执行通过。
3. 手工脚本最初使用“重试”，真实按钮为“重新加载”；修正定位后角色重试通过。
4. Element Plus 树的原生 checkbox 被隐藏，直接 `locator.check()` 超时；改为点击可见 `.el-checkbox` 标签并读取 checked，后续权限检查通过。
5. 用户脚本曾使用空格测试清空邮箱；已有 email 规则拒绝该值，未发更新请求。改为真实清空后的空字符串，最终空联系方式 `null` 载荷检查通过，没有改变校验规则。
6. 用户表格明确使用 `common.edit`，中文为“修改”；其他默认 CRUD 操作是“编辑”。更正用户脚本定位后，最后列表刷新失败检查通过。
7. 用户动态导入曾失败。诊断 reload 得到 `ERR_CONNECTION_REFUSED`，确认是专用 Vite 退出而非 SFC 缺陷。主任务重启同一专用配置后所有页面加载成功。
8. Chrome DevTools 既有 profile 冲突，以及 node_repl 的 localhost EACCES，促使使用独立 Chrome 和经审批的外部 Node 驱动。后续自动审批服务多次 HTTP400 `content-blocked`，明确为 review failure，命令未执行；没有绕过。用户切换普通审批后由主任务继续执行。

## 可回放资产和清理

完整 14 个临时文件已按原名复制到 `browser-harness/`，包括 html、TypeScript 入口、自定义 Vite 配置、驱动、脚本和诊断探针。回放时先复制到 `apps/web-admin/`，使用独立端口/profile，启动：

```powershell
pnpm --filter @elm-platform/web-admin exec vite --config __crud-smoke.config.mjs --host 127.0.0.1 --port 5187 --strictPort
```

驱动默认连接 `9228`，因此回放前必须启动自己的独立无头 Chrome。归档的 `__crud-smoke.pid` 只是本次 PID 证据，不能拿它停止未来的进程。建议按角色、用户、租户、食品、菜单、部门、餐厅顺序执行；各脚本共享专用 fixture 页面，不能并行。

清理实际执行：解析每个目标绝对路径，确认它位于仓库的 `apps/web-admin` 目录且名称以 `__crud-smoke` 开头；复制后通过 `Remove-Item -LiteralPath` 仅移除这 14 个文件。再次枚举应用目录无遗留临时文件，报告 harness 中保留全部 14 个副本。没有递归删除、没有操作其他源码。

主任务已通过 Ctrl+C 停止专用 Vite 会话 `37192`；核对 Chrome PID `10188` 的命令行包含端口 `9228` 和唯一 profile 后，经审批停止该进程。本子任务没有停止其他进程。

这里的 `errors=[]` 仅指浏览器 `pageerror`，不表示没有控制台警告。主任务停止服务时记录到临时 fixture 缺少 `i-ep-info-filled` 组件解析器的提示，以及已有 ConfigDataTable 的 Element Plus checkbox `label` 弃用提示。临时配置未加载正式 Vite Components resolver，缺失图标解析是 fixture 限制，不作为生产缺陷。

最终 lint、现有测试和 build 的结果由主任务工程报告记录，本文件不声称执行过这些检查。
