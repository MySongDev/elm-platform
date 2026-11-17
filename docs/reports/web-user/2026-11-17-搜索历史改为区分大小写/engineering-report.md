# 工程变更报告：搜索历史改为区分大小写

> **项目**：elm-master / apps/web-user
> **日期**：2026-11-17
> **变更类型**：功能行为调整
> **执行方式**：AI 辅助（用户明确要求后，在已确认的当前分支执行）
> **验收状态**：✅ lint / type-check / 3 测试通过；lint 有其他文件的 15 条警告

---

## 1. 变更概览

### 1.1 变更统计

| 指标 | 变更前 | 变更后 | 变化 |
|------|--------|--------|------|
| SearchHistory.js 行数 | 69 | 67 | -2（本次 +4/-6，不含前次存储重构） |
| SearchHistory.test.js 行数 | 37 | 39 | +2（+6/-4） |
| 大小写转换调用数 | 4 | 0 | 新增及删除均用原文比较 |
| 同时搜索 Milk Tea / milk tea 后的记录数 | 1 | 2 | 大小写版本独立保留 |
| 测试文件 / 用例数 | 1 / 3 | 1 / 3 | 修改 2 个现有用例，无新增用例 |
| 本次改动文件数 | 0 | 4 | 1 新增、3 修改、0 删除（含报告与索引） |
| 定向测试耗时 | 本次改前未执行 | 1.36 秒 | Vitest 4.1.8 真实输出，未做性能基准 |

### 1.2 文件变更清单

```
✅ 新增文件 (1)
docs/reports/web-user/2026-11-17-搜索历史改为区分大小写/engineering-report.md   # 本报告

✅ 修改文件 (3)
apps/web-user/src/utils/search/SearchHistory.js   # 新增与删除改为区分大小写
apps/web-user/src/utils/search/SearchHistory.test.js   # 更新两个既有用例
docs/reports/README.md   # 登记报告、更新计数

❌ 删除文件 (0)
```

---

## 2. 背景与动机

### 2.1 问题

原实现比较关键词前调用 toLowerCase，导致 Milk Tea 与 milk tea 被视为同一条历史。用户明确要求取消此行为，允许大写与小写版本共同存在。

修改前已执行 git status --short 和 git diff --stat。基线包含 3 个既有 uni-user 修改（+23/-10）及本会话前次 SearchHistory.js 存储重构（+8/-14）；本次保留这些修改。当前分支继续使用先前用户确认的 main，不 commit。前次任务的历史报告见 ../2026-11-17-搜索历史复用存储封装/engineering-report.md，本报告记录后续规则变更。

### 2.2 决策依据

1. 修改前 setSearchHistory 和 removeSearchItem 的两个 filter 均做大小写转换；只改新增会导致用户删除一个版本时另一个版本也消失，两处应采用相同的精确匹配规则。
2. 修改后 SearchHistory.js:18 使用 item !== trimmedValue，:51 使用 item !== value。新增仍先 trim，完全相同的词去重并前移；大小写不同的版本共存。
3. SearchHistory.test.js:12-18 验证 Milk Tea/milk tea 共存，重复输入带首尾空格的 Milk Tea 后仅精确同词前移；:29-37 验证删除 apple 后 Apple 保留及全部清空；原 10 条上限用例保留。
4. 测试调整符合 AI_TEST_POLICY.md 第 1 条独立工具函数场景，以及维护因本次行为变更失效的既有测试的要求；只修改原有两个用例，无额外测试文件或脚手架。

### 2.3 被否决的方案

| 方案 | 否决理由 |
|------|----------|
| 只修改新增历史的比较 | 删除仍会合并大小写版本，不能独立删除展示的记录。 |
| 完全删除去重 | 用户要求的是大小写版本共存；完全相同的词仍应复用并前移，避免重复占用 10 条配额。 |
| 扩展存储 schema 或引入配置选项 | 原字符串数组即可支持精确匹配，增加配置没有当前需求依据。 |

---

## 3. 具体改动

### 3.1 SearchHistory.js

新增历史与删除单项改为直接比较字符串，补两条短注释解释大小写分别保留和按展示原文删除的理由。

```js
// 修改前
const items = readHistory(key).filter(
  item => item.toLowerCase() !== trimmedValue.toLowerCase(),
)
const newItems = readHistory(key).filter(
  item => item.toLowerCase() !== value.toLowerCase(),
)

// 修改后
const items = readHistory(key).filter(item => item !== trimmedValue)
const newItems = readHistory(key).filter(item => item !== value)
```

trim、空值检查、最近优先、10 条上限、storage.js 复用、存储键及异常处理保持原实现。

### 3.2 SearchHistory.test.js 与工程文档

原第 1 个用例改为精确去重，追加 ' Milk Tea ' 输入，期望 ['Milk Tea', 'milk tea', 'noodles']；原第 3 个用例追加 'Apple'，删除 'apple' 后期望 ['banana', 'Apple']。测试总数保持 3。

复制工程报告模板并填充全部章节，索引登记本报告；web-user 原索引目录数 22→23、文件数与篇数 26→27。

执行步骤：替换两处比较及注释 → 调整相关现有用例 → lint/type-check/定向测试 → 只读代码审查 → 报告与索引。修改和验证统计窗口为北京时间 20:04:17–20:05:35，共 78 秒，不含之后报告写入；未测量搜索性能前后变化。

### 3.3 过程修正记录

无验证失败。lint 脚本含 --fix，复核状态未出现其他源码修改；15 条警告仍来自未修改的 StarRating.vue、useLoadMore.ts、useBackTop.ts、useFormValidator.ts、useStateContainer.ts。

按 requesting-code-review 技能进行只读子代理审查，未发现实际问题，确认新增/删除策略一致、测试符合新需求、10 条上限保持。Git 命令继续使用单次 -c safe.directory 参数，未修改永久配置。

---

## 4. 验证结果

| 检查项 | 命令 | 结果 |
|--------|------|------|
| 用户端 lint | pnpm --filter @elm-platform/web-user run lint | 退出码 0；0 errors、15 条其他文件警告 |
| 用户端类型检查 | pnpm --filter @elm-platform/web-user run type-check | 退出码 0，vue-tsc --noEmit 通过 |
| 搜索历史测试 | pnpm --filter @elm-platform/web-user exec vitest run src/utils/search/SearchHistory.test.js | Vitest 4.1.8；1 文件、3 测试通过，耗时 1.36 秒 |
| 差异格式检查 | git -c safe.directory='D:/Desktop/笔记/项目/elm-master' diff --check | 退出码 0，无差异格式错误 |

> **说明**：验证命令必须为本次实际执行过的，不得臆造；如有文档与命令不符的勘误也记录于此。

---

## 5. 影响范围

| 模块 | 影响 | 说明 |
|------|------|------|
| 商家搜索 / 城市搜索 | 低 | 两个使用搜索历史工具的页面均按大小写分别保留、删除 |
| 通用 storage.js | 无 | 实现与格式不变 |
| 搜索历史测试 | 低 | 两个用例适配新规则 |
| 工程报告索引 | 低 | 增加本报告 |
| 既有 uni-user 修改 | 无 | 本次未涉及 |

---

## 6. 风险与注意事项

1. 大小写版本分别占用 10 条历史配额，符合此次需求；完全相同的词仍去重。
2. 旧策略已经合并的记录无法自动恢复；新搜索产生的大小写版本可独立保留。沿用原 JSON 字符串数组格式，不执行批量迁移。
3. 报告与索引原先受现有 .gitignore 忽略。用户后续授权 commit 后，仅将本会话的两个新报告按具体路径强制纳入跟踪，索引继续留在本地；忽略规则未修改。
4. 存储重构与大小写行为已拆成两笔本地提交，回滚本次规则可单独撤销 `1e1db01`，保留先前存储重构。

---

## 7. 后续事项（本次未做）

1. 本功能点无必需待办。未新增测试用例，仅更新 2 个既有用例。
2. 用户后续明确授权本地 commit：大小写行为提交为 `1e1db01`（`feat(user): 搜索历史按大小写分别保留和删除`），前置存储重构为 `ca59a97`。源码提交均通过正常的 lint-staged / commitlint 钩子。提交前再次实际执行 `pnpm --filter @elm-platform/web-user exec vitest run src/utils/search/SearchHistory.test.js`，3 个测试通过，耗时 1.21 秒。
3. 两个工程报告单独提交。用户后加的 3 行 SearchHistory.js 解释注释及 3 个既有 uni-user 文件改动保持未提交；未 push、创建 PR 或 merge。

---

## 8. 回滚指南

仅回滚本次规则：先处理工作区未提交内容，再执行 `git revert 1e1db01`，保留此前 storage.js 复用改动。也可按 §3.1 的“修改前”代码反向修改两处比较，并恢复两个测试的旧输入、期望与名称。随后执行：

```bash
pnpm --filter @elm-platform/web-user exec vitest run src/utils/search/SearchHistory.test.js
pnpm --filter @elm-platform/web-user run type-check
```

---

*报告生成时间：2026-11-17*
*执行与报告：AI 辅助（用户明确要求后执行）*
