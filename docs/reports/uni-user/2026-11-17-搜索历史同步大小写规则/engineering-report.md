# 工程变更报告：小程序搜索历史同步大小写规则

> **项目**：elm-master / apps/uni-user
> **日期**：2026-11-17
> **变更类型**：功能同步与局部重构
> **执行方式**：AI 辅助（用户明确要求 uni-user 同步后执行）
> **验收状态**：✅ lint / type-check / 3 个定向测试通过；lint 有其他文件的 18 条警告

---

## 1. 变更概览

### 1.1 变更统计

| 指标 | 变更前 | 变更后 | 变化 |
|------|--------|--------|------|
| SearchHistory.js 行数（含空行） | 79 | 70 | -9（Git +7/-16） |
| toLowerCase 调用次数 | 4 | 0 | 改为原文精确匹配 |
| 搜索历史专用测试文件 / 用例数 | 0 / 0 | 1 / 3 | 新增 49 行测试文件 |
| 同时保存 Milk Tea / milk tea 的记录数 | 1 | 2 | 大小写版本分别保留 |
| 定向测试执行耗时 | 本次改前未执行 | 1.44 秒 | Vitest 3.2.4 真实输出，未做性能前后基准 |
| 本次变更文件数 | 0 | 4 | 2 新增、2 修改、0 删除（含报告与索引） |

### 1.2 文件变更清单

```
✅ 新增文件 (2)
apps/uni-user/src/utils/search/SearchHistory.test.js   # 小程序端 3 个行为测试
docs/reports/uni-user/2026-11-17-搜索历史同步大小写规则/engineering-report.md   # 本报告

✅ 修改文件 (2)
apps/uni-user/src/utils/search/SearchHistory.js   # 同步精确去重、精确删除及数组读取兜底
docs/reports/README.md   # 登记报告与增量更新计数

❌ 删除文件 (0)
```

---

## 2. 背景与动机

### 2.1 问题

web-user 已完成统一存储重构（ca59a97）及大小写共存规则调整（1e1db01），用户要求 uni-user 同步。小程序版本已使用 platform/storage，但新增和删除仍调用 toLowerCase，大小写不同的关键词会被合并或一起删除；文件头还错误描述 web-user 直接调用 localStorage，已与现状不符。

修改前执行 git status --short、git diff --stat。基线有用户的 3 个 uni-user 商家页文件（FoodItem.vue、ShopMenu.vue、shop.vue，合计 +23/-10）及 web-user SearchHistory.js 的 3 行解释注释（+3/-0）；本次未涉及这些修改。继续在先前已确认的 main 分支修改，后续按用户授权拆分本地提交，见 §7。

### 2.2 决策依据

1. 修改前 uni-user SearchHistory.js:9 已导入 platform/storage；platform/storage.ts:12、:29、:45 定义统一存储函数，底层使用 uni.*StorageSync。utils/storage.js 仅为其他已有调用方转发，业务代码直接使用 platform 入口是本端既有约定。
2. pages/search/SearchHome.vue:32 导入 4 个历史函数，:80 将 removeSearchItem 的返回值直接赋给页面历史数组，精确删除与新增的大小写身份规则必须一致。
3. 修改后 SearchHistory.js:21、:54 使用 item !== trimmedValue / item !== value；readHistory:8-12 保留 Array.isArray，统一处理空值与非数组，无需额外 falsy 分支。
4. vitest.config.ts:21-23 使用 node 环境及 src/**/*.{test,spec}.{js,ts}；新测试只替代 Node 不存在的 uni 存储接口，调用真实 platform/storage，业务断言与 web-user 一致。
5. 新测试依据 AI_TEST_POLICY.md 第 1 条独立工具函数准入场景：验证精确同词前移、大小写共存、10 条上限、精确删除与清空。没有新增框架、覆盖率要求或界面测试。
6. 阅读 007-uniapp-uni-user-constraints.md 的版本、独立测试配置与同源约定：保持本端 Vitest 3.2.4、Vite 5.2.8 和平台适配，不将 web-user 的运行时依赖直接搬入。

### 2.3 被否决的方案

| 方案 | 否决理由 |
|------|----------|
| 将 uni-user 的存储入口改为 web-user 浏览器模块 | 本端已通过 platform/storage 适配 uni 存储；浏览器 window.localStorage 不适合该运行环境。 |
| 只改新增历史 | 删除仍忽略大小写，用户删除一个版本时会同时丢失另一个。 |
| 完全删除去重 | 用户要求大小写版本共存；完全相同的词仍应前移复用，避免重复占用配额。 |
| 抽取共享包或改页面状态结构 | 本次只同步现有工具，现有接口和两端适配足够，无新架构需求。 |

---

## 3. 具体改动

### 3.1 apps/uni-user/src/utils/search/SearchHistory.js

保留 platform/storage 的 getStore/setStore/removeStore；readHistory 去掉冗余 falsy 分支并保留数组校验。两处 filter 改为直接字符串比较。文件头修正为实际同源与平台适配说明，删除过时的 web-user localStorage 描述，补与 H5 一致的大小写身份理由注释。

```js
// 改前
item => item.toLowerCase() !== trimmedValue.toLowerCase()
item => item.toLowerCase() !== value.toLowerCase()

// 改后
item => item !== trimmedValue
item => item !== value
```

trim、空值检查、最近优先、10 条上限、存储键、JSON 数组格式、异常处理及导出接口均保持。忽略注释/空行并将两端存储 import 归一化后，实际比对得到两端其余代码完全一致。

### 3.2 测试与工程文档

新增 SearchHistory.test.js 共 49 行、3 个测试。beforeEach 用内存 Map 替代 uni 存储接口，afterEach 恢复全局；不 mock platform/storage。用例验证 Milk Tea/milk tea 共存及精确同词前移、12 次搜索只保留最近 10 条、删除 apple 保留 Apple 以及清空。

复制工程模板并填充全部章节，索引登记本报告；uni-user 原索引目录数 24→25、文件数及篇数 28→29（按原索引增量更新）。报告与索引继续按现有忽略规则本地留档。

执行计划：检查本端平台入口及调用方 → 同步工具及注释 → 新增关键行为测试 → lint/type-check/定向测试 → 同源比对和审查 → 报告索引。修改与验证统计窗口为北京时间 20:34:15–20:36:23，共 128 秒，不含后续报告写入；未测量运行性能前后变化。

### 3.3 过程修正记录

uni-user 本就复用统一存储，无需修改 platform/storage 或转发模块。文件头的旧 web-user 实现与大小写描述已经过时，修正为本次实际实现事实。

lint 脚本默认 --fix，实际追加 --no-fix 使用只检查模式，防止触碰用户已有商家页修改。退出码 0、18 条警告来自未修改文件。定向测试发出 Vite CJS API 弃用提示，这是当前 uni-app/Vite 5 组合已有配置限制，本次没有更改 package.json 的模块类型或依赖版本。

完成前按 requesting-code-review 技能进行只读审查，未发现实际问题；确认平台入口、业务同步及测试全局恢复正确。

---

## 4. 验证结果

| 检查项 | 命令 | 结果 |
|--------|------|------|
| uni-user lint（只检查） | pnpm --filter @elm-platform/uni-user run lint --no-fix | 退出码 0；0 errors、18 条其他文件警告 |
| uni-user 类型检查 | pnpm --filter @elm-platform/uni-user run type-check | 退出码 0；vue-tsc --noEmit 通过 |
| 搜索历史定向测试 | pnpm --filter @elm-platform/uni-user exec vitest run src/utils/search/SearchHistory.test.js | Vitest 3.2.4；1 文件、3 测试通过；耗时 1.44 秒，另有 Vite CJS API 弃用提示 |
| 差异格式检查 | git -c safe.directory='D:/Desktop/笔记/项目/elm-master' diff --check | 退出码 0，无差异格式错误 |

> **说明**：验证命令必须为本次实际执行过的，不得臆造；如有文档与命令不符的勘误也记录于此。

---

## 5. 影响范围

| 模块 | 影响 | 说明 |
|------|------|------|
| 小程序搜索页 | 低 | 历史大小写版本分别保留并按原文删除 |
| platform/storage 与其他调用方 | 无 | 统一存储实现未修改 |
| 搜索历史测试 | 新增 | 独立 node 用例调用真实平台适配 |
| web-user | 无 | 只作为对照，现有 3 行用户注释保持 |
| 用户商家页改动 | 无 | 3 文件与基线一致 |
| 工程报告索引 | 低 | 登记本报告 |

---

## 6. 风险与注意事项

1. 大小写版本分别占用 10 条配额，符合需求；完全相同的词仍去重。
2. 原策略已合并的历史无法自动恢复；新搜索可独立保存大小写版本，原存储格式兼容，无批量迁移。
3. Node 测试替代了 uni SDK 存储接口，不代表微信开发者工具或真机验收；本次未执行小程序构建或真机操作。
4. 报告和索引原先被现有 .gitignore 忽略；后续按用户授权仅将本报告按具体路径强制纳入跟踪，索引继续留在本地，忽略规则未改变。

---

## 7. 后续事项（本次未做）

1. 本功能点无必需代码待办。未修改搜索页面、平台存储、依赖版本或共享包；现有商家页及 H5 注释仍保持未提交。未 push、创建 PR 或 merge。
2. 用户后续明确授权本地 commit。首次暂存的自动审批服务两次返回 AgentRouter HTTP 400 / content-blocked，Git 写入均未执行；当时提供了手动提交命令。用户再次要求重试后，审批通过，未绕过检查或禁用提交钩子。
3. 本地提交已按粒度拆分：`f788d3a`（`refactor(uni-user): 精简搜索历史读取与同步说明`）、`f4a90e8`（`feat(uni-user): 同步搜索历史大小写共存与精确删除`）；两笔源码提交均通过正常的 lint-staged / commitlint 钩子。工程报告单独提交，临时补丁已清理。

---

## 8. 回滚指南

先处理工作区未提交内容。仅撤回大小写规则与新增测试时执行 `git revert f4a90e8`；若还需撤回读取整理，再执行 `git revert f788d3a`。报告可保留并标记为已回滚。以下命令撤回本次两笔源码提交，不涉及已有商家页改动：

```bash
git revert f4a90e8
git revert f788d3a
pnpm --filter @elm-platform/uni-user run lint --no-fix
pnpm --filter @elm-platform/uni-user run type-check
```

---

*报告生成时间：2026-11-17*
*执行与报告：AI 辅助（用户明确要求后执行）*
