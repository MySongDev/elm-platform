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
