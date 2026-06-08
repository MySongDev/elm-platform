# 兴趣驱动学习池

## 1. 这个文档是干什么的

这个文档不是严格学习计划，也不是打卡表。

它是一个“兴趣货架”：

```text
有兴趣时，从这里捞一个主题；
没兴趣时，不强迫自己；
每次只留下一个最小产物；
允许中断，但要方便下次回来。
```

适合当前状态：

```text
对很多东西会有阶段性兴趣；
容易三分钟热度；
不喜欢长期硬扛；
但又不想完全停在原地；
希望慢慢有一点积累。
```

核心目标不是“每天都很自律”，而是：

> 每次有兴趣时，都能把兴趣转化成一点沉淀。

---

## 2. 当前学习原则

### 2.1 不消灭三分钟热度

三分钟热度不是完全的缺点。

它说明：

```text
容易被新东西点燃；
愿意探索不同方向；
适合建立广度；
遇到感兴趣的问题时，也能主动深入。
```

真正要避免的是：

```text
热度过去后什么都没留下。
```

所以每次兴趣来了，只要求留下一个小产物。

---

### 2.2 不做重型计划

不采用这种方式：

```text
每天必须学习 2 小时；
必须按课程从第一章学到最后一章；
必须连续打卡 100 天；
必须系统学完整个前端工程化。
```

更适合采用：

```text
今天对什么感兴趣，就学什么；
只开一个小坑；
只解决一个小问题；
只留下一个小产物。
```

---

### 2.3 主线稳定，主题自由

主线可以稳定：

```text
围绕 Elm 项目，收集工程化、架构、Vue、Node、AI 协作知识。
```

但主题不需要固定顺序。

今天对 `.npmrc` 感兴趣，就研究 `.npmrc`。

明天对 Element Plus 感兴趣，就看 Element Plus。

后天对 AI 协作感兴趣，就整理 AI 协作方法。

重点是：

> 兴趣可以游牧，但沉淀要回到同一个知识库。

---

## 3. 每次学习的最小流程

每次只做 3 件事：

```text
1. 搞清楚它是什么。
2. 搞清楚它解决什么问题。
3. 留下一个最小产物。
```

例如：

```text
主题：.nvmrc
是什么：Node.js 版本声明文件。
解决什么：统一项目 Node 版本。
最小产物：docs/learning/npmrc-nvmrc-engineering-notes.md。
```

不要求一次学透。

如果兴趣还在，再继续深入。

如果兴趣没了，就先停。

---

## 4. 最小产物类型

每次学习只需要留下三种产物之一。

### 4.1 学习笔记

适合概念类、对比类、方法论类主题。

例如：

```text
docs/learning/npm-vs-pnpm.md
docs/learning/npmrc-nvmrc-engineering-notes.md
docs/learning/project-learning-transfer-framework.md
```

### 4.2 项目小改动

适合工程化类、配置类、项目治理类主题。

例如：

```text
添加 .nvmrc
补 packageManager
整理 README
新增 markdownlint 配置
补充 docs/learning 文档
```

### 4.3 问题清单

适合兴趣不够继续深入，但又不想完全丢掉的问题。

例如：

```md
## 我还没搞懂的问题

1. pnpm 的 store 默认在哪里？
2. strictPeerDependencies 默认值是什么？
3. monorepo 共享包什么时候该抽？
```

哪怕只留下问题清单，也算有沉淀。

---

## 5. 兴趣主题池

### 5.1 工程化池

- `.npmrc`
- `.nvmrc`
- Corepack
- `packageManager`
- `engines`
- pnpm workspace
- `pnpm-workspace.yaml`
- `pnpm-lock.yaml`
- markdownlint
- `.editorconfig`
- `.gitattributes`
- ESLint flat config
- Stylelint
- Prettier
- lint-staged
- Husky
- commitlint
- GitHub Actions
- Docker
- 环境变量治理
- 依赖升级策略
- 依赖安全扫描

---

### 5.2 Vue / 前端池

- Vue 3 响应式
- Vue Router 动态路由
- Pinia 状态管理
- Element Plus 组件设计
- Vant 移动端组件
- HTTP 请求治理
- 组件分层
- composable 设计
- 表单校验
- 权限路由
- loading / error / empty 状态治理
- 图片加载策略
- 骨架屏
- 虚拟列表
- 性能指标
- CSS 工程化

---

### 5.3 后端协作池

- NestJS Module
- NestJS Controller / Service 分层
- DTO 和参数校验
- Prisma schema
- 数据库迁移
- PostgreSQL 基础设计
- Redis 缓存
- JWT 鉴权
- RBAC 权限模型
- Swagger / OpenAPI
- 接口契约
- 日志系统
- 错误处理
- 限流
- 健康检查

---

### 5.4 架构思考池

- 什么情况下应该抽象
- 什么情况下不应该抽象
- Monorepo 什么时候拆 shared package
- HTTP 层和 service 层职责边界
- 权限应该做到菜单级、按钮级还是接口级
- 缓存应该放前端、后端还是 Redis
- 动态路由协议如何设计
- API 类型是否应该自动生成
- 技术债如何判断
- 如何写一页小 RFC

---

### 5.5 AI 协作池

- 如何让 AI 查官方文档
- 如何验证 AI 输出
- 如何避免 AI 配置堆砌
- 如何让 AI 帮我写学习笔记
- 如何让 AI 帮我做项目复盘
- 如何区分官方行为和经验建议
- 如何用 AI 学源码
- 如何用 AI 梳理工程化工具链
- 如何用 AI 做代码审查

---

## 6. 每周一个小问题

每周只选一个当下有兴趣的问题。

不要求宏大。

不要求系统。

不要求连续。

只要求最后留下一个东西。

模板：

```md
## 本周小问题

### 问题

这里写一个小问题。

### 我为什么对它感兴趣

这里写触发兴趣的原因。

### 我想搞懂的 3 件事

1. 
2. 
3. 

### 最小产物

- [ ] 学习笔记
- [ ] 项目小改动
- [ ] 问题清单

### 完成标准

能用自己的话解释这个问题，或者在项目里留下一个小改动。

### 下次可以继续研究

- 
- 
- 
```

---

## 7. 已沉淀的学习笔记

当前已经沉淀：

```text
docs/learning/ai-era-breadth-depth.md
docs/learning/project-learning-transfer-framework.md
docs/learning/npmrc-nvmrc-engineering-notes.md
docs/learning/npm-vs-pnpm.md
```

后续新增学习笔记时，可以继续补到这里。

---

## 8. 低成本重启机制

如果中断了，不需要自责。

回来时只做三步：

```text
1. 打开这个文件。
2. 从兴趣主题池里选一个现在看着顺眼的主题。
3. 用“每周一个小问题”模板开一个小坑。
```

不要问：

```text
我之前为什么没坚持？
```

只问：

```text
我现在对哪个问题还有一点点兴趣？
```

---

## 9. 不适合当前状态的做法

暂时不推荐：

```text
制定全年学习计划。
每天强制打卡。
同时开很多大坑。
买很多课程但不沉淀。
用焦虑逼自己学习。
一上来就要求系统掌握完整技术栈。
```

当前更适合：

```text
小问题。
小产物。
小复盘。
低压力。
可中断。
可回来。
```

---

## 10. 一句话总结

> 不靠焦虑驱动自己，而是靠好奇心、小成果和可见积累慢慢往前走。

最终目标不是变成一个每天自律 10 小时的人，而是变成：

```text
每次有兴趣时，都能把兴趣变成一点积累的人。
```
