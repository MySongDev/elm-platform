# web-admin FSD 层级收敛计划书

> **范围：** `apps/web-admin/src` 的目录分层
> **前置阅读：** 本计划基于一次完整的静态调研（各层体量、跨层引用矩阵、实体复用度），数据为 2026-10-03 实测
> **状态：** ⏸ 未实施
> **相关文档：** `docs/refactor/config-crud-simplification/`（同一区域的上一次简化重构，已完成，可直接参照其 plan/implementation/report 三段式）
> **实施步骤：** 见同目录 `02-implementation.md`（含 `defineOptions` 前置规则与逐步操作清单）

---

## 背景

web-admin 自称采用 FSD（Feature-Sliced Design）六层：`app / entities / features / pages / widgets / shared`（另有一个不在 FSD 定义内的 `layouts`）。实测八层共 **287 个生产文件 / 17538 行**。

逐层核对后的结论不是"FSD 整体过度设计"，而是：**约 60% 的层级划分在真承重（shared 基础设施 + 6 个真共享实体），约 40% 是空转的仪式**。具体病灶有两个：

1. **`features/` 与 `pages/` 是 1:1 绑定**——9 个 feature 恰好各被 1 个 page 消费，7 个 page 退化成 9–13 行的直通壳，真正实现在 `features/*/ui/*ManagementPage.vue` 里。FSD 中 feature 的语义是"可被多个 page 复用的业务能力"，这里没有一个兑现。
2. **同一件事有两套摆法**——`order` 走 `features/order-management/{config,model,ui}`；`monitor/online` 直接把逻辑写在 `pages/monitor/online/index.vue` 并内嵌 `config/`；`account` 走 `pages/account/{config,model,components}`。新增页面时得先判断"这算不算复杂到要开 feature"，而这个判断没有标准。

本次收敛的目标是**消掉空转的两层、统一到一个已有形态**，而不是引入外来架构。

---

## 当前结构（收敛前）

```
src/
├── app/          18 文件 /  699 行    路由、守卫、providers、指令
├── entities/     65 文件 / 1723 行    14 个领域实体
├── features/     65 文件 / 5295 行    9 个业务切片
├── pages/        42 文件 / 2459 行    22 个路由页面
├── widgets/      40 文件 / 3156 行    仅 1 个 widget：admin-layout
├── shared/       56 文件 / 4199 行    基础设施
├── layouts/       1 文件 /    7 行    仅 index.vue，渲染 AdminLayout
└── typings/                          类型声明（自动生成 + 全局）
```

**跨层引用矩阵**（`@/` 别名 import 次数，测试已剔除，2026-10-03 实测）：

| SRC \ TGT | app | entities | features | pages | widgets | shared |
|---|---|---|---|---|---|---|
| **app** | 1 | 6 | 0 | 0 | 0 | 15 |
| **entities** | 0 | 5 | **0** | **0** | **0** | 42 |
| **features** | 0 | 58 | 0 | **0** | **0** | 78 |
| **pages** | 0 | 29 | 9 | 0 | 0 | 61 |
| **widgets** | 0 | 17 | 0 | 0 | 3 | 9 |
| **shared** | 0 | 0 | 0 | 0 | 0 | 12 |

**零条向上违规**（别名与相对路径两个维度）。层级纪律是守住的——这一点决定了本次收敛是"简化"而非"救火"。

---

## 评估结论（逐层）

| 层 | 文件/行数 | 判定 | 依据 |
|---|---|---|---|
| `app` | 18 / 699 | ✅ 必要 | 路由/守卫/providers，无可替代 |
| `entities` | 65 / 1723 | ⚠️ **部分** | 6 个真共享（session 29 处引用跨 5 层、user/tenant/system-menu/permission 各 11、tab 8）；**8 个单消费**（order/role/department/food/restaurant/notification/log/monitor） |
| `features` | 65 / 5295 | ❌ **空转** | 9 个 feature **全部只被 1 个 page 引用**，无跨页复用 |
| `pages` | 42 / 2459 | ⚠️ **部分** | 9 个 page 引用 features，其中 **7 个是 9–13 行直通壳**（`order` 62 行、`dashboard` 86 行是编排页，不算壳） |
| `widgets` | 40 / 3156 | ❌ **层多余** | 仅 1 个 widget，且**只被 `layouts/index.vue` 一个文件引用** |
| `shared` | 56 / 4199 | ✅ **承重墙** | `config-crud` 946 行 / **39 个消费文件**，横跨全部 7 个 feature + pages/monitor；`ui` 1055 行 / 31 消费者；`lib` 292 行 / 36 消费者 |
| `layouts` | 1 / 7 | ⚠️ 层多余 | 单文件成层，内容只是 `import AdminLayout from '@/widgets/...'` |

**写法说明**：评估结论表刻意采用"逐项敢说哪块不是过度"的口径（例如 `shared/ui/form` 这种判定为设计合理的模块要明确写 ❌ 不是过度设计），避免整份文档变成一边倒的批判。

---

## 收敛目标

| 维度 | 收敛前 | 收敛后 |
|---|---|---|
| 顶层目录数 | 8（含 typings） | **5**（app / entities / pages / shared / typings） |
| `features/` 层 | 9 个 feature / 65 文件 | **消失**，下沉进 `pages/*/` |
| `widgets/` 层 | 40 文件 | **消失**，并入 `layouts/admin-layout/` |
| 单消费 entity | 8 个 | 6 个下沉（`log`、`notification` 因消费者在别处不下沉） |
| **必须改的 import** | — | **77 处**（43 外部 + 27 页内相对 + 7 `defineOptions`，明细见 `02-implementation.md`） |
| **数据库改动** | — | **0** |
| 业务代码行为 | — | **不变**（纯目录移动 + import 路径调整） |

---

## 收敛方向

### 决策 1：`pages/*/index.vue` 的直通壳 —— 删壳（方案 B）

**证据**：7 个真壳的实际内容（以 `pages/system/user/index.vue` 为例，9 行）：

```vue
<script setup lang="ts">
import { UserManagementPage } from '@/features/user-management'
</script>
<template><UserManagementPage /></template>
```

真正实现在 `features/user-management/ui/UserManagementPage.vue`（74–155 行）。

| 选项 | 做法 | 结果 |
|---|---|---|
| A 保留壳 | `index.vue`(9 行) → `ui/UserManagementPage.vue` | 两层；路由接入点稳定 |
| **B 删壳** | `index.vue` 直接承载实现 | 一层；少一跳 |

**落实 B**。理由：少一次跳转（打开页面跳 3 个文件 → 2 个）；与既有形态一致（`pages/account/settings.vue`、`pages/monitor/online/index.vue` 本就是页面主文件即实现）。

> ⚠️ **成本修正**：本节初版的"11 处 import 改动"只统计了**外部消费方**，漏掉了删壳后组件**内部**需要改写的相对引用（27 处）与 `defineOptions` 的 name 调整（7 处）。删壳的实际改动量约为初版估计的 3 倍。完整理由与取舍见 `02-implementation.md` §0。

**⚠️ 关键澄清（曾被误判）**：删壳**不需要改数据库**。

```ts
// permission.ts:37,52 —— 路由解析链
const pageModules = import.meta.glob('/src/pages/**/index.vue')
const mod = pageModules[`/src/pages/${key}/index.vue`]   // key = 后端菜单的 component 字段
```

`Menu.component` 的值（如 `system/user`）映射到 `pages/system/user/index.vue`。**只要该文件存在**（无论内容 9 行还是 100 行），glob 就能命中。改内容不影响解析。真正需要改数据库的只有"把页面移出 `pages/`"这一种情况，本次不做。

**例外**：`features/dashboard` 结构不同（无 `ui/`，页面实体已在 `pages/dashboard/index.vue`，feature 内只有 `api/`+`model/`+`lib/`）。它的处理是"把这三个目录搬进 `pages/dashboard/`"。

---

### 决策 2：单消费 entity 下沉 —— 下沉 6 个

**证据**（消费方数量，2026-10-03 实测）：

| 真共享（**不下沉**） | 消费方 | | 候选下沉 | 消费方 | 判定 |
|---|---|---|---|---|---|
| session | 29（跨 5 层） | | order | 8 | ✅ 下沉 |
| user | 11 | | role | 7 | ✅ 下沉 |
| tenant | 11 | | department | 5 | ✅ 下沉 |
| system-menu | 11 | | food | 4 | ✅ 下沉 |
| permission | 11 | | restaurant | 4 | ✅ 下沉 |
| tab | 8（app+widgets） | | monitor | 3 | ✅ 下沉 |
| | | | **log** | 9（跨 3 个 page） | ❌ **不下沉** |
| | | | **notification** | 4（全在 widgets） | ❌ **不下沉** |

**两处例外必须说明**：

- **`log`**：消费方是 `pages/monitor/logs/{login,operation,system}` **三个页面**，不是单页私有，而是 monitor 子域共享。下沉目标不明确，保持原位。
- **`notification`**：消费方全在 `widgets/admin-layout/ui/TopNavigation/`（布局层），**没有对应页面可下沉**。

**目标位置**：`pages/<对应页>/model/`（如 `entities/order` → `pages/commerce/order/model/`）。

**成本**：31 处 import 改动（order 8 / role 7 / department 5 / food 4 / restaurant 4 / monitor 3）+ 6 个目录移动。

**依赖安全性**：全仓仅一条 entity→entity 依赖（`entities/session → entities/user`，5 处），两者都不下沉，**下沉不会打断任何依赖链**。6 个候选 entity 之间零互相引用。

**时机**：作为**第二批**，与决策 1 解耦。

---

### 决策 3：`shared/config-crud` 调用方式 —— 完全不变

**证据**（实测，结论明确）：

```
useConfigCrud 共 7 个调用点，全部在 features/*/model/use*Management.ts
  → 全部传回调函数（fetchList / createItem / updateItem / deleteItem / toForm / toPayload …）
  → 没有一个传 config/fields.ts
```

`fields.ts` 的消费方**全是同 feature 的 UI 组件，且用相对路径**：

```ts
// features/user-management/ui/UserTable.vue:12
import { createUserTableColumns } from '../config/fields'
```

**结论**：整个 feature 目录一起搬，相对路径不用改；`useConfigCrud` 是纯黑盒，与目录结构零耦合。**这条决定了本次收敛是纯 `mv`，不是重构。**

---

### 决策 4：eslint 分层边界规则 —— 改写并提升为 error

**现状实测**（`eslint.config.mjs` 共 226 行，5 个 FSD 边界块，全部 `'warn'`）：

| 规则块 | 行号 | 实际状态 |
|---|---|---|
| 全局（`@/views/**`、`@/features/*/pages/**`） | L103-119 | **两条 pattern 都是死规则**——`src/views/` 与 `features/*/pages/` 均不存在 |
| shared | L120-138 | 有效 |
| entities | L139-156 | 有效 |
| features | L157-173 | 有效 |
| widgets | L174-189 | 有效 |
| **pages** | — | **没有规则块**（跨 page 引用零约束） |

外加三个"看起来有约束其实没有"的事实：

- 全部 `'warn'`，且 `lint` 脚本是 `eslint . --fix --cache`（**无 `--max-warnings 0`**），CI 不会因 warning 失败；
- 规则注释引用的 `docs/architecture/import-boundaries.md` **不存在**；
- 注释引用的 `pnpm lint:boundaries` 脚本**不存在**（全仓仅注释里提过）。

**结论**：这套规则从未真正生效过——40% 是死规则、全是警告级、引用的文档和脚本都是幻觉。**web-admin 现在的零违规是人守的，不是工具守的。**

**落实方案**：

```js
// 1) 删除整块失效的规则
//    - L103-119 全局块（两条 pattern 均为死规则）
//    - L157-173 features 块（features/ 消失后无文件命中）
//    - L174-189 widgets 块（widgets/ 消失后无文件命中）

// 2) 改写 shared / entities 两块：从 group 中移除 '@/features/**'、'@/widgets/**'
//    shared:   ['@/app/**', '@/entities/**', '@/pages/**']
//    entities: ['@/app/**', '@/pages/**']

// 3) 新增 pages 块，约束跨页引用内部子目录
{
  files: ['apps/web-admin/src/pages/**/*.{js,ts,tsx,vue}'],
  rules: {
    'no-restricted-imports': ['error', {
      patterns: [{
        group: [
          '@/pages/*/model',  '@/pages/*/model/**',
          '@/pages/*/config', '@/pages/*/config/**',
          '@/pages/*/ui',     '@/pages/*/ui/**',
        ],
        message: '禁止跨 page 引用内部 model/config/ui；页面内部请用相对路径。',
      }],
    }],
  },
}
```

**⚠️ 能力边界（必须知道）**：`no-restricted-imports` 只匹配**模块说明符字符串**，因此上面的约束只覆盖 `@/pages/...` 别名形式。若用**相对路径**跨页引用（`../../other-page/model/x`），该规则**抓不到**——需要 `eslint-plugin-boundaries`（当前项目未引入）。所以配套约定是：**页面内部一律用相对路径，跨页才走 `@/pages/...`**。

**为什么提升为 error**：实测零违规，说明现状守得住；提升为 error 可以把纪律固化下来，而不是继续依赖人的自觉。

---

### 决策 5：`widgets` 并入 `layouts/admin-layout/`

**证据**：

```
widgets/          = 40 文件 / 3156 行，只有一个 admin-layout
layouts/index.vue = 7 行，内容只是 import AdminLayout 并渲染
@/widgets 全仓共 4 处 = 外部 1 处（layouts/index.vue:2）+ 内部自引 3 处
widgets 依赖      = entities/tab(9) + entities/notification(5) + entities/session(5) + shared(9)
```

**三个方案的实测成本**：

| 方案 | 改动处数 | 结果 |
|---|---|---|
| **a** `widgets/*` → `layouts/admin-layout/` | **4** | widgets 层消失，layouts 变 41 文件 |
| b 提升 `AdminLayout.vue` 为 `layouts/index.vue` | 3 | 结构变浅但语义模糊 |
| c 删 `layouts/`、改 `permission.ts:33` 指向 widgets | **1** | layouts 层消失，但 widgets 层保留 |

**落实 a**。虽然方案 c 只改 1 处，但它**保留了 `widgets` 层、删掉了 `layouts` 层**——与"减少顶层目录"的方向相反，且把一个应用外壳叫 "widget" 语义很差。多改 3 处换语义正确，值得。

**实现细节**：4 处改动 = `layouts/index.vue:2`（外部引用）+ 3 处 widget 内部自引：

```
widgets/admin-layout/ui/Sidebar/components/collapse/SidebarFooterCollapse.vue:2
widgets/admin-layout/ui/Sidebar/components/menu/SidebarMenu.vue:4
widgets/admin-layout/ui/TopNavigation/HeaderSidebarToggle/index.vue:2
```

其余 widgets 内部引用全用相对路径，随目录整体迁移不受影响。

**注**：`widgets/admin-layout` 对 `entities/tab`、`entities/notification` 的依赖（14 处）**不用改**——这两个 entity 留在 `entities/`（见决策 2）。

---

### 决策 6：迁移顺序与每步验收

**验收基准**（沿用 `config-crud-simplification/02-implementation.md` 的口径，并补上一条它没有的）：

```bash
pnpm --filter @elm-platform/web-admin run type-check   # 必须通过
pnpm --filter @elm-platform/web-admin run test:unit    # 必须全绿（45 files / 178 tests）
pnpm --filter @elm-platform/web-admin run build        # 必须通过
pnpm --filter @elm-platform/web-admin exec eslint mock --no-cache   # 确认未引入新告警
```

**第 5 条不能省 —— 路由冒烟**：

```bash
pnpm --filter @elm-platform/web-admin exec vite --mode mock --port 5199
# 逐个打开 22 个页面，确认不出现 404
```

**为什么不能省**：路由靠 `import.meta.glob` **构建时静态分析**，解析失败会静默 `return NotFound`（`permission.ts:63`）——**type-check 和单测都发现不了**，只有真打开页面才知道。`nested/*` 那 5 个深层路径是重灾区。

> ⚠️ **端口坑（实操教训）**：vite 默认端口 5173 常被本地其他 dev server 占用并自动顺延（实测 5173–5175 全被占）。**必须用 `--port` 固定端口**，否则会对别的服务发请求拿到误导性响应。

**迁移顺序**：

| 步 | 内容 | 验收 |
|---|---|---|
| 0 | **前置**：处理当前工作区（见下节），开新分支 | `git status` 干净 |
| 1 | **样板**：只做 `order-management` 下沉（结构最标准：config/model/ui 齐全 + 页面 62 行编排） | 上述 4 项 + 冒烟 |
| 2 | 批量：其余 8 个 feature 下沉 | 同上 |
| 3 | 6 个单消费 entity 下沉 | 同上 |
| 4 | `widgets` → `layouts/admin-layout/` | 同上 |
| 5 | eslint 规则改写 + 提升 error | `pnpm lint` 零 error |

---

## 受影响范围

### 必须改的 import（77 处，实测）

**A. 外部消费方（43 处）**

| 迁移项 | 处数 | 位置 |
|---|---|---|
| `order`（编排页） | **5** | `pages/commerce/order/index.vue` 的桶导入拆成 5 个具体路径 |
| `dashboard`（编排页） | **2** | `pages/dashboard/index.vue:8`（桶）+ `:20`（深层动态 import，易漏） |
| 测试文件 | **1** | `app/router/__tests__/dynamic-routes.test.ts:5` |
| `widgets/` → `layouts/admin-layout/` | **4** | `layouts/index.vue:2` + 3 处内部自引 |
| 6 个 entity 下沉 | **31** | order 8 / role 7 / department 5 / food 4 / restaurant 4 / monitor 3 |

> 注：7 个直通壳原本各有 1 处 `@/features/*` 导入，删壳时随 `index.vue` 被 `mv` 覆盖而消失，**不计入改动**。

**B. 组件内部相对引用（27 处）—— 初版遗漏，补充于此**

删壳时把 `features/*/ui/*ManagementPage.vue` 提为 `pages/*/index.vue`，该文件**内部**的相对 import 会因位置变化而全部失效：

| 原路径 | 搬到页面根后 | 每页处数 |
|---|---|---|
| `../config/fields` | `./config/fields` | 1 |
| `../model/use*Management` | `./model/use*Management` | 1 |
| `./XxxTable.vue` / `./XxxFormDialog.vue` 等 | `./ui/XxxTable.vue` | 2–3 |

7 个直通壳合计 **27 处**（逐页：`platform/tenant` 5、`system/{user,role,menu,dept}` 各 4、`commerce/{food,restaurant}` 各 3）。

此外还有 **7 处 `defineOptions`** 需要改写——这是删壳的**配套动作**（不是可选），漏做会静默破坏 keep-alive 缓存。规则见 `02-implementation.md` §1 规则 1。

> 📌 A（43）+ B（27）+ `defineOptions`（7）= **77 处**。**分步明细、操作命令与验收方式见 `02-implementation.md`。**

### 不受影响（`@/` 绝对路径与目录内相对路径在移动后不变）

| 关系 | 次数 | 说明 |
|---|---|---|
| features → entities | 58 | 绝对路径，不变 |
| features → shared | 78 | 绝对路径，不变 |
| pages → entities | 29 | 绝对路径，不变 |
| feature 内部相对引用（`../config/fields`） | 多处 | 随目录整体迁移 |
| entity 内部相对引用（`../model`、`../api`） | 多处 | 同上 |

---

## 不动的部分

- **`shared/` 全部内容**——`config-crud`(946 行/39 消费者)、`ui`(1055/31)、`lib`(292/36)、`i18n`(1225/17) 是这套架构真正的承重墙，本次一行不改。
- **6 个真共享 entity**：`session`、`user`、`tenant`、`system-menu`、`permission`、`tab`。
- **`entities/log`、`entities/notification`**——消费者分别跨 3 个 page 和位于布局层，没有明确的下沉目标。
- **动态路由机制**：`permission.ts` 的 `import.meta.glob('/src/pages/**/index.vue')` 与 `Menu.component` 的映射关系。
- **数据库**：`Menu.component` 的 20 条记录（`seed.ts`）+ fallback + mock 全部不动。
- **两个后端校验**：`admin-menu-protocol.spec.ts`（递归收集 `pages/**/index.vue` 校验）只依赖文件存在性，下沉不影响。
- **`pages/account/`、`pages/monitor/*`**——它们已经是目标形态（页面内共置 `config/`+`model/`+`components/`），本次是让其余页面统一到它们，不是改造它们。

---

## 前置条件

**当前工作区很脏，必须先处理**：

```
M  .github/（4 个）CLAUDE.md AGENTS.md package.json pnpm-lock.yaml
M  apps/server/src/main.ts（已 staged）
M  apps/web-user/（11 个：http 层、api、endpoints …）
?? apps/uni-user/                       整个新 app，未跟踪
?? docs/engineering/007~010
?? RESUME*.md、.tmp-probe/
```

在这么多未提交改动之上再叠一次 287 文件的目录重构，出问题会无法定位是哪个改动引起的。**先提交或 stash，再开干净分支。**

---

## 风险与注意事项

1. **`features/dashboard` 是结构异类**（用 `components/` 而非 `ui/`，无 `config/`，页面实体已在 `pages/dashboard/index.vue`）。它不适用"下沉"的通用做法，需单独处理：只搬 `api/`+`model/`+`lib/`。

2. **`pages/dashboard/index.vue:20` 有一处深层动态 import**：

   ```ts
   loader: () => import('@/features/dashboard/components/OrderTrendChart.vue')
   ```

   这是 11 处待改 import 里唯一一处指向 feature **内部文件**（而非桶导出）的，容易漏。

3. **`entities/log` 跨 3 个 page**。若未来决定下沉，目标是 `pages/monitor/logs/model/` 而非某个单页——但这需要先确认这 3 个页面是否共享同一份类型。

4. **页面目录会变大**。`pages/system/user/` 下沉后约 10 个文件。作为对照：web-user 的 `views/shop/` 是 20 个文件——所以这个体量在项目内是可接受的。

5. **eslint 规则的相对路径盲区**（见决策 4）。若将来出现用相对路径跨页引用的情况，现有规则抓不到，需要引入 `eslint-plugin-boundaries`。

6. **`typings/` 是自动生成的**（`auto-imports.d.ts`、`components.d.ts`），不参与本次收敛，但要确认它不在任何 lint 边界规则的 files 匹配里。

---

## 附：本次收敛"不做什么"

- **不推翻 FSD 思想**。分层本身（领域实体 / 业务能力 / 页面装配 / 基础设施）对这个规模的后台系统是需要的——`shared` 与 6 个真共享实体的存在就是证据。
- **不改造成 web-user 的目录结构**。web-user 是 To C 消费者 app（10 个页面、无动态菜单、无 CRUD 矩阵），它的简单来自问题域小，不是因为分层方式更优。把管理后台的复杂度塞进它的目录结构，复杂度只会从"目录"转移到"大文件 + 人肉记忆"。
- **不动数据库契约**。`pages/<key>/index.vue` 与 `Menu.component` 的映射是后端驱动的挂载点，本次收敛发生在 `pages/<page>/` **内部**。
