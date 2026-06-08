# Report Template Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将项目修改报告模板拆分为“工程变更报告”和“学习复盘报告”，并规定实际报告按“一个改动一个文件夹”的方式保存。

**Architecture:** 项目内 `docs/report-templates/` 保存用户可见、可版本化的模板与使用指南；Claude 记忆目录只保存入口规则和模板位置，方便后续自动调用。实际报告统一保存到 `docs/reports/<YYYY-MM-DD-change-name>/`，每个改动目录下根据需要放置 `engineering-change-report.md` 和 `learning-review-report.md`。

**Tech Stack:** Markdown 文档、Claude Code memory、项目 docs 目录。

---

## File Structure

- Create: `docs/report-templates/report-template-guide.md`
  - 负责说明模板选择规则、报告保存规则、多个改动拆分规则。
- Create: `docs/report-templates/engineering-change-report-template.md`
  - 负责工程视角模板：背景、目标、修改内容、影响范围、验证、风险和回滚。
- Create: `docs/report-templates/learning-review-report-template.md`
  - 负责学习复盘模板：问题现象、产生原因、为什么这样改、解决了什么、修改前后对比、学习要点。
- Modify: `C:\Users\Song MIngwang\.claude\projects\D--Desktop-------elm-master\memory\report-template.md`
  - 改为 Claude 自动调用入口，链接项目模板并记录“一改动一文件夹”的规则。
- Modify: `C:\Users\Song MIngwang\.claude\projects\D--Desktop-------elm-master\memory\MEMORY.md`
  - 更新索引说明，使其指向拆分后的模板体系。

---

### Task 1: 创建项目内报告模板指南

**Files:**
- Create: `docs/report-templates/report-template-guide.md`

- [ ] **Step 1: 创建模板总入口文档**

写入内容：

```markdown
# 项目修改报告模板指南

本指南用于决定什么时候写报告、使用哪种报告模板，以及报告应该保存到哪里。

## 核心原则

报告不只是记录“改了什么”，还必须说明：

- 为什么要这样修改
- 问题或需求是怎么产生的
- 这样修改解决了什么问题
- 修改带来了哪些影响
- 如何验证修改确实有效

## 模板分类

项目修改报告拆分为两类模板：

| 模板 | 文件 | 关注点 |
|---|---|---|
| 工程变更报告 | `engineering-change-report-template.md` | 工程背景、影响范围、验证、风险、回滚 |
| 学习复盘报告 | `learning-review-report-template.md` | 问题原因、为什么这样改、解决了什么、学习要点 |

## 什么时候使用工程变更报告

以下情况优先使用工程变更报告：

- 修改架构、模块边界、目录结构
- 修改 ESLint、TypeScript、Vite、Jest、Vitest、CI 等工程配置
- 修改 Prisma schema、认证授权、接口契约等影响面较大的内容
- 重构复杂逻辑或跨多个模块迁移
- 需要明确记录影响范围、风险和回滚方式

## 什么时候使用学习复盘报告

以下情况优先使用学习复盘报告：

- 修复非显而易见的 bug
- 排查过程值得记录
- 出现新的报错、踩坑或配置误解
- 需要解释“为什么这样改，而不是那样改”
- 需要沉淀知识点、判断依据和预防措施

## 什么时候两个报告都写

重要修改建议同时写两份报告：

- `engineering-change-report.md`：给未来维护项目时快速了解影响范围
- `learning-review-report.md`：给未来学习复盘时理解原因和取舍

如果某次改动很小，只适合其中一种报告，可以只创建对应报告。

## 报告保存规则

实际报告统一保存到：

```text
docs/reports/<YYYY-MM-DD-改动简短描述>/
```

每一个改动主题单独一个文件夹。默认文件结构：

```text
docs/reports/2026-06-06-example-change/
├─ engineering-change-report.md
└─ learning-review-report.md
```

## 多个改动的拆分规则

如果一次任务包含多个独立改动，不要混写在同一个报告文件夹里，应拆成多个改动文件夹：

```text
docs/reports/
├─ 2026-06-06-change-a/
│  ├─ engineering-change-report.md
│  └─ learning-review-report.md
├─ 2026-06-06-change-b/
│  ├─ engineering-change-report.md
│  └─ learning-review-report.md
```

判断标准：

1. 单一主目标，多项附属修改：放入同一个改动文件夹。
2. 多个独立目标：拆成多个改动文件夹。
3. 大型跨模块改动：可以先创建一个总览改动文件夹，再为独立子改动创建子文件夹或单独报告目录。

## 命名规则

- 改动文件夹使用 `YYYY-MM-DD-kebab-case-description`
- 报告文件使用英文固定名：
  - `engineering-change-report.md`
  - `learning-review-report.md`
- 报告正文标题使用中文。
```

- [ ] **Step 2: 检查文档是否清楚表达“一改动一文件夹”**

确认文档明确包含：

```text
每一个改动主题单独一个文件夹。
```

---

### Task 2: 创建工程变更报告模板

**Files:**
- Create: `docs/report-templates/engineering-change-report-template.md`

- [ ] **Step 1: 写入工程变更模板**

写入内容：

```markdown
---
date: YYYY-MM-DD
type: 工程变更
tech: [相关技术标签]
change: YYYY-MM-DD-change-name
---

# 工程变更报告：一句话概括本次改动

## 变更背景

- 本次改动发生在什么项目阶段？
- 为什么现在需要做这个改动？
- 它和之前的工作、问题或规划有什么关系？

## 变更目标

- 本次改动希望解决什么工程问题？
- 修改完成后，项目应该达到什么状态？
- 哪些内容不属于本次改动范围？

## 修改方案

说明为什么采用当前方案，而不是其他方案。

| 方案 | 是否采用 | 原因 |
|---|---|---|
| 当前方案 | 是 | 说明为什么它最适合当前项目 |
| 备选方案 A | 否 | 说明放弃原因 |
| 备选方案 B | 否 | 说明放弃原因 |

## 修改内容

### 1. `path/to/file` — 做了什么

```diff
- 删除或替换的关键内容
+ 新增或调整的关键内容
```

说明：

- 为什么需要改这个文件？
- 这个修改解决了什么问题？
- 是否影响其他模块？

### 2. `path/to/another-file` — 做了什么

- 说明关键变化。
- 大量重复或机械性改动可以文字概括，不必粘贴完整 diff。

## 涉及文件清单

| 文件 | 操作 | 说明 |
|---|---|---|
| `path/to/file` | 新增 / 修改 / 删除 | 简述原因 |

## 影响范围

| 范围 | 是否影响 | 说明 |
|---|---|---|
| 后端接口 | 是 / 否 | 说明影响 |
| 管理端页面 | 是 / 否 | 说明影响 |
| 用户端页面 | 是 / 否 | 说明影响 |
| 数据库 / Prisma | 是 / 否 | 说明影响 |
| 测试 | 是 / 否 | 说明影响 |
| 构建 / 部署 | 是 / 否 | 说明影响 |
| 文档 | 是 / 否 | 说明影响 |

## 验证结果

| 验证项 | 命令 / 方式 | 结果 | 说明 |
|---|---|---|---|
| 单元测试 | `pnpm --filter xxx run test` | 通过 / 失败 / 未运行 | 说明原因 |
| 类型检查 | `pnpm --filter xxx run type-check` | 通过 / 失败 / 未运行 | 说明原因 |
| 构建 | `pnpm build` | 通过 / 失败 / 未运行 | 说明原因 |
| 手动验证 | 描述验证路径 | 通过 / 失败 / 未运行 | 说明原因 |

## 风险与回滚

- 潜在风险：
- 兼容性影响：
- 回滚方式：

## 后续事项

- 需要继续跟进的内容
- 暂未处理但需要记录的限制
- 后续建议

---

**修改日期**：YYYY/MM/DD  
**分支**：`当前分支名称`
```

- [ ] **Step 2: 检查模板是否覆盖工程视角重点**

确认模板明确包含：

- 变更背景
- 修改方案取舍
- 影响范围
- 验证结果
- 风险与回滚

---

### Task 3: 创建学习复盘报告模板

**Files:**
- Create: `docs/report-templates/learning-review-report-template.md`

- [ ] **Step 1: 写入学习复盘模板**

写入内容：

```markdown
---
date: YYYY-MM-DD
type: 学习复盘
tech: [相关技术标签]
change: YYYY-MM-DD-change-name
---

# 学习复盘报告：一句话概括本次问题或改动

## 问题现象 / 需求来源

- 最初看到的报错、异常表现或需求是什么？
- 在什么场景下触发？
- 影响了哪些功能或开发流程？

## 问题产生原因

重点解释“为什么会出现这个问题”。

- 直接原因：代码、配置、依赖或使用方式哪里不正确？
- 深层原因：为什么之前会这样设计或遗漏？
- 触发条件：什么情况下会暴露这个问题？

## 为什么要这样修改

重点解释“为什么采用当前修改方式”。

- 当前方案的判断依据是什么？
- 它为什么适合当前项目？
- 有没有其他方案？为什么没有采用？

| 方案 | 是否采用 | 原因 |
|---|---|---|
| 当前方案 | 是 | 说明采用原因 |
| 备选方案 A | 否 | 说明放弃原因 |
| 备选方案 B | 否 | 说明放弃原因 |

## 这样修改解决了什么问题

- 修改后具体解决了哪些问题？
- 修改前后的行为有什么变化？
- 是否减少了后续维护成本或误用风险？

## 修改前后对比

### 修改前

```ts
// 展示问题相关的关键代码或配置
```

说明修改前的问题：

- 问题点 1
- 问题点 2

### 修改后

```ts
// 展示修复后的关键代码或配置
```

说明修改后的效果：

- 改善点 1
- 改善点 2

## 涉及文件

| 文件 | 作用 | 为什么涉及它 |
|---|---|---|
| `path/to/file` | 文件职责 | 说明原因 |

## 验证方式

| 验证项 | 命令 / 方式 | 结果 | 说明 |
|---|---|---|---|
| 复现问题 | 描述复现步骤 | 成功 / 失败 / 未运行 | 说明原因 |
| 验证修复 | 描述验证步骤 | 通过 / 失败 / 未运行 | 说明原因 |
| 自动化测试 | `pnpm --filter xxx run test` | 通过 / 失败 / 未运行 | 说明原因 |

## 学习要点

1. **知识点 A** — 解释它是什么、为什么重要、在本项目哪里会用到。
2. **知识点 B** — 解释它是什么、为什么重要、在本项目哪里会用到。

## 以后如何避免

- 编码或配置时应该注意什么？
- 是否需要增加测试、lint 规则、文档或约定？
- 遇到类似问题时应该如何排查？

## 关联报告

- 工程变更报告：`./engineering-change-report.md`

---

**复盘日期**：YYYY/MM/DD  
**分支**：`当前分支名称`
```

- [ ] **Step 2: 检查模板是否覆盖用户核心诉求**

确认模板明确包含以下标题：

- 问题产生原因
- 为什么要这样修改
- 这样修改解决了什么问题

---

### Task 4: 更新 Claude 记忆入口

**Files:**
- Modify: `C:\Users\Song MIngwang\.claude\projects\D--Desktop-------elm-master\memory\report-template.md`
- Modify: `C:\Users\Song MIngwang\.claude\projects\D--Desktop-------elm-master\memory\MEMORY.md`

- [ ] **Step 1: 替换 `report-template.md` 内容**

写入内容：

```markdown
---
name: report-template
description: 项目修改报告模板入口；报告按一个改动一个文件夹保存，并拆分工程变更报告与学习复盘报告
metadata:
  type: reference
---

项目修改报告模板已拆分为项目内可见模板：

- 工程变更报告模板：`docs/report-templates/engineering-change-report-template.md`
- 学习复盘报告模板：`docs/report-templates/learning-review-report-template.md`
- 使用指南：`docs/report-templates/report-template-guide.md`

## 核心要求

写项目修改报告时，不能只记录“改了什么”，必须说明：

- 为什么要这样修改
- 问题或需求是怎么产生的
- 这样修改解决了什么问题
- 修改带来的影响、风险和验证结果

## 保存规则

实际报告统一保存到：

`docs/reports/<YYYY-MM-DD-改动简短描述>/`

每一个改动主题单独一个文件夹。默认文件结构：

```text
docs/reports/2026-06-06-example-change/
├─ engineering-change-report.md
└─ learning-review-report.md
```

如果一次任务包含多个独立改动，应拆成多个改动文件夹，每个文件夹下分别放对应的工程变更报告和学习复盘报告。

## 使用规则

- 工程配置、架构调整、跨模块影响较大的修改：优先写工程变更报告。
- Bug 排查、踩坑、知识沉淀：优先写学习复盘报告。
- 重要修改：建议同一个改动文件夹下同时写两份报告。
- 小型 typo、格式化、删除未使用导入等简单修改，不需要写报告。

关联记忆：[[user-ai-assisted-learning]]
```

- [ ] **Step 2: 更新 `MEMORY.md` 索引行**

将原索引：

```markdown
- [项目修改报告模板](report-template.md) — 每次重要修改后写报告的标准格式和工作流。
```

替换为：

```markdown
- [项目修改报告模板](report-template.md) — 项目报告按一个改动一个文件夹保存，并拆分工程变更报告与学习复盘报告。
```

---

### Task 5: 验证文档结构

**Files:**
- Verify: `docs/report-templates/report-template-guide.md`
- Verify: `docs/report-templates/engineering-change-report-template.md`
- Verify: `docs/report-templates/learning-review-report-template.md`
- Verify: `C:\Users\Song MIngwang\.claude\projects\D--Desktop-------elm-master\memory\report-template.md`
- Verify: `C:\Users\Song MIngwang\.claude\projects\D--Desktop-------elm-master\memory\MEMORY.md`

- [ ] **Step 1: 检查文件是否存在**

确认以下文件已创建或更新：

```text
docs/report-templates/report-template-guide.md
docs/report-templates/engineering-change-report-template.md
docs/report-templates/learning-review-report-template.md
C:\Users\Song MIngwang\.claude\projects\D--Desktop-------elm-master\memory\report-template.md
C:\Users\Song MIngwang\.claude\projects\D--Desktop-------elm-master\memory\MEMORY.md
```

- [ ] **Step 2: 检查关键词是否存在**

确认文档包含这些关键句或标题：

```text
每一个改动主题单独一个文件夹
为什么要这样修改
问题产生原因
这样修改解决了什么问题
风险与回滚
```

- [ ] **Step 3: 不运行代码测试**

本次只修改 Markdown 文档和 Claude 记忆，不涉及代码逻辑。验证方式是检查文档内容和路径规则，不需要运行 `pnpm test` 或 `pnpm build`。

---

## Self-Review

- Spec coverage: 覆盖了模板拆分、项目内模板位置、Claude 记忆入口、一个改动一个文件夹、多个独立改动拆分、重点解释原因和解决效果。
- Placeholder scan: 本计划没有使用 TBD、TODO、implement later 等占位表达。
- Type consistency: 文件名、路径和报告命名在各任务中保持一致。
