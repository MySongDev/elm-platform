# 工程变更报告：搜索历史复用项目存储封装

> **项目**：elm-master / apps/web-user
> **日期**：2026-11-17
> **变更类型**：重构
> **执行方式**：AI 辅助（用户确认方案与当前分支后执行）
> **验收状态**：✅ lint、type-check、现有 3 个测试通过；lint 有 15 条其他文件警告

---

## 1. 变更概览

### 1.1 变更统计

| 指标 | 变更前 | 变更后 | 变化 |
|------|--------|--------|------|
| SearchHistory.js 行数（含空行） | 75 | 69 | -6 行（Git +8/-14） |
| 直接 localStorage 调用 | 4 | 0 | 委托给 storage.js |
| 显式 JSON.parse / JSON.stringify | 3 | 0 | 委托给 storage.js |
| 导出函数 / 搜索历史上限 | 4 / 10 条 | 4 / 10 条 | 无变化 |
| 本次改动文件数 | 0 | 3 | 1 新增、2 修改、0 删除（含报告与索引） |
| 现有定向测试执行耗时 | 本次改前未执行 | 1.72 秒 | Vitest 真实输出，未做性能前后基准 |

### 1.2 文件变更清单

```
✅ 新增文件 (1)
docs/reports/web-user/2026-11-17-搜索历史复用存储封装/engineering-report.md   # 本工程报告

✅ 修改文件 (2)
apps/web-user/src/utils/search/SearchHistory.js   # 存储读写委托给 storage.js
docs/reports/README.md   # 新报告登记与分类计数更新

❌ 删除文件 (0)
```

---

## 2. 背景与动机

### 2.1 问题

用户发现搜索历史模块重复实现存储读写，希望复用已有 storage.js。修改前 SearchHistory.js 共 75 行，其中有 4 次直接 localStorage 调用、1 次 JSON.parse、2 次 JSON.stringify；storage.js 已提供相应能力。关键词规范化、去重、最近优先、最多 10 条及单项删除仍是共享业务规则，值得保留。

修改前执行 git status --short、git diff --stat 收集基线。分支为 main，已有 3 个 uni-user 文件修改（FoodItem.vue、ShopMenu.vue、shop.vue），合计 +23/-10；SearchHistory.js 原本无未提交改动。本次没有涉及这些用户改动。

### 2.2 决策依据

1. storage.js:4、:16、:29 已定义 setStore/getStore/removeStore，覆盖数组序列化、读取解析与按键删除，无需重复实现。
2. storage.js:21-24 在解析失败时返回原内容。SearchHistory.js:5-8 保留 Array.isArray：空值、损坏 JSON、有效但非数组的 JSON 仍返回 []。
3. rg 确认 views/search/SearchHome.vue:10 和 views/city/city.vue:7 均导入 4 个历史函数。SearchHistory.js:11-31 的 trim、大小写无关去重、unshift 和 slice(0, 10) 是业务规则，保留接口避免两个页面重复维护。
4. SearchHistory.test.js:12-35 已有 3 个测试覆盖去重/排序、10 条上限、单项删除/清空。本次按 AI_TEST_POLICY.md 默认规则复用这些测试，不新增、修改或删除自动化测试。

### 2.3 被否决的方案

| 方案 | 否决理由 |
|------|----------|
| 删除 SearchHistory.js，让两个页面直接使用 storage.js | 通用存储不提供去重、排序与上限；保持体验仍需在页面维护这些规则，产生重复。 |
| 将搜索历史规则并入 storage.js | 通用存储会承担特定业务职责，扩大其他调用方的理解成本。 |
| 新建 store/composable 或可配置存储适配层 | 无新增共享响应式状态或存储后端需求，增加间接调用，收益不足。 |

---

## 3. 具体改动

### 3.1 apps/web-user/src/utils/search/SearchHistory.js

导入 getStore/removeStore/setStore；readHistory 移除原始读取与 JSON 解析，保留数组检查，并补一条说明 getStore 解析失败返回字符串的注释。两处写入改用 setStore，清空改用 removeStore。

```js
// 改前（两处写入之一）
localStorage.setItem(key, JSON.stringify(limitedItems))

// 改后
setStore(key, limitedItems)
```

trim、忽略空关键词、大小写无关去重、最近优先、10 条上限、返回数组均保持。保存/读取/删除单项的 try/catch 保留；clearAll 原本没有 catch，本次仍向外抛出删除异常。存储键 home_searchHistory、citySearchHis 和 JSON 数组格式兼容，无需迁移已有数据。

### 3.2 工程报告与 docs/reports/README.md

复制工程报告模板并填充全部章节；索引登记本报告，web-user 目录数 21→22、文件数 25→26、章节篇数 25→26（按原索引增量更新）。

执行计划为：单文件替换存储调用 → 现有测试及用户端 lint/type-check → 审查兼容性 → 报告与索引。代码修改与验证统计窗口为北京时间 19:23:45–19:25:23，耗时 98 秒（不含前序讨论、准备阅读及后续报告写入）。没有运行性能前后基准，不宣称搜索耗时改善。

### 3.3 过程修正记录

首次 Git 基线命令触发 dubious ownership（沙箱用户与仓库所有者不同），随后仅使用单条命令的 -c safe.directory 参数重新执行，未修改永久配置。

lint 脚本含 --fix；运行后复核 git status，除 SearchHistory.js 外未出现其他源码改动。15 条警告来自未修改的 StarRating.vue、useLoadMore.ts、useBackTop.ts、useFormValidator.ts、useStateContainer.ts，未顺带修复。

按 requesting-code-review 技能执行只读子代理审查：检查单文件 diff、storage.js、两个调用方及现有测试，未发现实际问题。非法 JSON、非数组和存储异常的兼容性由代码审查确认，不声称现有 3 个测试覆盖了全部异常场景。

---

## 4. 验证结果

| 检查项 | 命令 | 结果 |
|--------|------|------|
| 用户端 lint | pnpm --filter @elm-platform/web-user run lint | 退出码 0；0 errors、15 warnings，均来自未修改文件 |
| 用户端类型检查 | pnpm --filter @elm-platform/web-user run type-check | 退出码 0，vue-tsc --noEmit 通过 |
| 现有搜索历史测试 | pnpm --filter @elm-platform/web-user exec vitest run src/utils/search/SearchHistory.test.js | Vitest 4.1.8；1 文件、3 测试通过；耗时 1.72 秒 |
| 差异格式检查 | git -c safe.directory='D:/Desktop/笔记/项目/elm-master' diff --check | 退出码 0，无差异格式错误 |
| 文档跟踪状态 | git -c safe.directory='D:/Desktop/笔记/项目/elm-master' check-ignore docs/reports/README.md docs/reports/web-user/2026-11-17-搜索历史复用存储封装/engineering-report.md | 两个文档路径均被现有规则忽略 |

> **说明**：验证命令必须为本次实际执行过的，不得臆造；如有文档与命令不符的勘误也记录于此。

---

## 5. 影响范围

| 模块 | 影响 | 说明 |
|------|------|------|
| 商家搜索 / 城市搜索 | 低 | 原有 4 个历史函数复用存储；接口、业务规则与存储键兼容 |
| 通用 storage.js 及其他调用方 | 无 | 文件及语义未修改 |
| 工程报告索引 | 低 | 登记一份 web-user 报告 |
| 已有 uni-user 改动 | 无 | 不涉及其 3 个用户修改文件 |

---

## 6. 风险与注意事项

1. getStore 可能返回字符串、null 或其他 JSON 值；保留数组检查。数组成员仍按原约定是字符串，本次未扩大脏数据治理范围。
2. 依赖浏览器 window.localStorage，符合两个 SPA 调用方及现有 happy-dom 测试环境；未新增 SSR 支持，存储异常处理保持原语义。
3. 15 条其他文件的 lint 警告仍存在，退出码 0 不等于全仓无警告。
4. 报告与索引原先均被现有 .gitignore 忽略。用户后续授权 commit 后，仅将本会话的两个新报告按具体路径强制纳入跟踪，索引继续留在本地；忽略规则未修改。

---

## 7. 后续事项（本次未做）

1. 本功能点无必需待办。未新建 store/composable、未变更通用存储异常策略、未修改两个页面、未新增测试；现有测试与 lint/type-check 可验证此次调用替换。
2. 用户后续明确授权本地 commit：存储重构已提交为 `ca59a97`（`refactor(user): 搜索历史复用统一存储工具`），大小写行为另见 `1e1db01`。两个源码提交均通过正常的 lint-staged / commitlint 钩子；工程报告单独提交。未 push、创建 PR 或 merge。

---

## 8. 回滚指南

以下 restore 命令是提交前的原始回滚记录，已提交后不再适用。若回滚整个本会话的源码改动，应先处理工作区未提交内容，再依次执行 `git revert 1e1db01`、`git revert ca59a97`；报告与索引可保留为回滚记录并更新验收状态。

```bash
git -c safe.directory='D:/Desktop/笔记/项目/elm-master' restore --source=HEAD --worktree -- apps/web-user/src/utils/search/SearchHistory.js
pnpm --filter @elm-platform/web-user exec vitest run src/utils/search/SearchHistory.test.js
pnpm --filter @elm-platform/web-user run type-check
```

---

*报告生成时间：2026-11-17*
*执行与报告：AI 辅助（用户已确认后执行）*
