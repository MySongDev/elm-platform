# 商家数据本地化计划书

> **范围：** `apps/server` 的 elm 兼容层（上游数据 → 本地数据库）
> **目标：** 把上游 `elm.cangdu.org` 的商家/菜单/首页分类数据落进本地数据库，接口出参形状保持兼容（除 §8.3 声明的 8 项刻意偏离），消除用户端浏览路径上的外部依赖
> **数据量：** 商家 4298 家（约 7 MB）、首页分类 16 条、菜单按需（单店最大 1.5 MB）
> **本次目标：** 只产出计划书与实施计划书，**不改动代码**
> **关联文档：** 实施步骤见 `009-merchant-data-localization-plan.md`

---

## 1. 背景与现状

### 1.1 只有四个接口真的打到上游

全仓库 `upstream.get` 的调用点共 4 处，全部集中在 elm 兼容层：

| 接口 | 调用位置 | 用途 |
|------|----------|------|
| `GET /shopping/restaurants` | `controllers/elm-restaurant-public.controller.ts:21` | 商家列表（首页） |
| `GET /shopping/restaurant/:shopId` | `controllers/elm-restaurant-public.controller.ts:60` | 商家详情 |
| `GET /shopping/v2/menu` | `controllers/elm-food-public.controller.ts:19` | 商家菜单 |
| `GET /v2/index_entry` | `controllers/elm-location.controller.ts:72` | 首页分类入口 |

其余全部 elm 接口（`getcategory`、`v2/foods`、`v2/foods/count`、`v4/restaurants`、`ugc/.../ratings` 等）读的是**进程内存**：

```ts
// apps/server/src/modules/elm/services/elm-store.service.ts:11
@Injectable()
export class ElmStoreService {
  // 临时内存数据源：后续接 Prisma/数据库时，优先替换这里，领域服务尽量不动。
  readonly cities = [...seedCities]
  readonly restaurants = [...seedRestaurants]
  readonly menuCategories = [...seedMenuCategories]
  readonly foods = [...seedFoods]
  readonly orders = [...seedOrders]
}
```

`seedRestaurants` 只有 3 家、`seedFoods` 只有 5 个（`data/elm.seed.ts`）。

### 1.2 一个好消息：本地类型本来就是照上游抄的

`types/elm.types.ts` 里的 `RestaurantRecord` / `FoodRecord` / `MenuCategoryRecord` **字段名与上游逐一对齐**（`piecewise_agent_fee`、`specfoods`、`supports`、`activities`、`delivery_mode` 都是上游的原生写法）。这意味着"存进库再吐出来"能自然保形，**不需要写字段翻译层**——这正是本次改造的主要可行性来源。

### 1.3 商家数据的三个来源

| 入口 | 数据来自 | 存储 |
|------|----------|------|
| 用户端浏览商家 | 上游 `elm.cangdu.org` | 无 |
| 管理端管商家 | `ElmStoreService` 内存数组 | 无表 |
| 下单落库 | Prisma `payment_order` | 真库 |

`Prisma schema` 里**没有** `Restaurant` / `Food` / `City` 任何一张表（现有模型：`User`、`Tenant`、`MerchantApplication`、`Order` 系列、`PaymentOrder` 等）。这个分裂是半成品诊断中记录的"致命伤"，本计划书正是它的收敛路径。

---

## 2. 上游数据实测（2026-09-30）

### 2.1 探测方式

全部结论均来自对上游的直接请求，命令可复现：

```bash
# 商家总数
curl -s "https://elm.cangdu.org/shopping/restaurants/count"
# → {"status":1,"count":4298}

# 商家列表（分页）
curl -s "https://elm.cangdu.org/shopping/restaurants?latitude=31.22967&longitude=121.4762&offset=0&limit=100"
# → 100 条，170 KB

# 单店菜单
curl -s "https://elm.cangdu.org/shopping/v2/menu?restaurant_id=1"
# → 73 个分类、1358 个菜品，1.5 MB

# 首页分类
curl -s "https://elm.cangdu.org/v2/index_entry"
# → 16 条，10 KB
```

### 2.2 规模与结论

| 接口 | 实测规模 | 对本地化的结论 |
|------|----------|----------------|
| `/shopping/restaurants/count` | **4298** 条（唯一 id 4295 个） | 全量导入可行，但 id 不是唯一键（见 2.7） |
| `/shopping/restaurants` | 单条约 1.7 KB，全量约 **7 MB** | 一次性全量导入 |
| `/shopping/restaurant/:id` | 字段名集合与列表项一致（29 个），**但值不完全一致**（见下） | 一张表吃两个接口，详情不单独存 |
| `/shopping/v2/menu` | **极度稀疏**：4295 家里仅 **149 家**（3.5%）有菜单；合计 **308 分类 / 1934 菜品 / 约 1.6 MB** | **一次性全量预导**（见 2.8） |
| `/v2/index_entry` | 16 条 | 一次性导入 |

⚠️ **对"详情 vs 列表"的更正（2026-09-30 实施期发现）**：初版这里写的是"逐字段一致"，但那只比对过**字段名集合**。逐值比对后，同一个 id 在上游列表与详情里有两个字段的值不同：

| 字段 | 列表 | 详情 |
|------|------|------|
| `order_lead_time` | `"40分钟"` | `""` |
| `distance` | `"10公里"` | `""` |

即上游**详情接口本身返回空串**（比列表更"残缺"）。本地化后详情从同一行读，所以它会返回列表风格的值（`"40分钟"`），而不是上游详情的 `""`。这是一处**值级偏离**，已登记进 §8.3。

### 2.3 三个反直觉发现（直接决定改造成本）

**发现一：坐标参数"必须传、但完全被忽略"。**

用北京坐标、广州坐标、不传坐标各请求一次，结果：

```bash
curl -s ".../shopping/restaurants?latitude=39.9042&longitude=116.4074&offset=0&limit=50" -o bj.json
curl -s ".../shopping/restaurants?latitude=23.12911&longitude=113.264385&offset=0&limit=50" -o gz.json
# bj.json 与 gz.json 逐字节完全相同 → true
```

- 全部 4298 条里 `distance` 的取值**只有一个**：`"10公里"`（上游硬编码常量）
- 排序是**全中国混在一起的 id 升序**（第 1 条广州、第 3 条北京）
- 不传坐标 → `{"status":0,"type":"ERROR_PARAMS","message":"latitude参数错误"}`

**这条发现的意义**：本地化列表接口**不需要复刻任何地理计算**，就是一句 `ORDER BY id LIMIT/OFFSET`。原本担心的"haversine 距离 + 排序复刻"整块工作不存在。同时它解释了历史 bug——游客模式下拿不到坐标导致商家列表空白（见 `docs/engineering/uniapp-migration-diffs.md`）。

**发现二：`/shopping/v2/menu` 与 `/shopping/getcategory/:restaurantId` 返回同一个东西。** 前者来自上游，后者来自本地 `foodService.getFoodMenus()`，两者都是"分类数组 + 每类内嵌 `foods`"。本地化后二者共读同一批表，属于天然的收敛点。

**发现三：id 全局唯一。** 实测两个店铺的分类 id 交集为 0、菜品 `item_id` 交集为 0（上游是 Mongo dump，id 取自全局序列）。所以**可以直接用上游 id 作为主键**，不需要复合键。

### 2.4 字段对账：本地类型 vs 上游真实响应

这是"数据不变"能否成立的硬约束。逐字段比对结果：

| 实体 | 上游字段数 | 本地类型缺失（装配时会丢） | 本地类型多出 |
|------|-----------|---------------------------|-------------|
| restaurant | 29 | `__v` | `tenantId`、`tenantCode`、`createdAt` |
| menu category | 8 | `__v` | `foods` |
| food | 24 | `__v`、`is_essential`、`server_utc`、`attrs`、`display_times`、`pinyin_name`、`is_featured` | `tenantId`、`tenantCode`、`createdAt` |

结论：

- **商家侧几乎完美对齐**：本地 `RestaurantRecord` 只缺 `__v`（Mongoose 内部版本键，前端不读）。
- **本地多出的 `tenantId`/`tenantCode`/`createdAt`** 是本地扩展字段（`factories/elm.factories.ts` 注入），上游没有——落库时它们本来就有归处。
- **菜品侧多出的 6 个字段，实测无意义，决定不入库**（详见 2.5）。

### 2.5 菜品 6 个字段的取舍：删除

`FoodRecord` 未声明的 6 个上游字段，实测取值分布（抽样 2 家店共 1548 个菜品）：

| 字段 | 上游真实取值 | 本该有的含义 | 全仓库消费者 |
|------|-------------|-------------|-------------|
| `is_essential` | 恒 `false`（1548/1548） | 是否必点 | 0（仅 `specfoods` 层声明） |
| `is_featured` | 恒 `0`（全部） | 是否招牌 | 0 |
| `attrs` | 恒 `[]`（全部） | 属性列表 | 0 |
| `display_times` | 恒 `[]`（全部） | 展示时段 | 0 |
| `pinyin_name` | 恒 `""`（全部） | 拼音名（搜索用） | 0（仅 `specfoods` 层声明） |
| `server_utc` | **有真数据**，如 `2019-12-22T12:14:57.129Z` | Mongo 文档写入时间 | 0 |

**判断依据：**

1. **5 个是恒定空值**：`false` / `0` / `[]` / `[]` / `""`。存进库等于存了个常量，零信息量。
2. **`server_utc` 是上游 Mongo dump 的记账时间**（2019 年），不是业务意义上的"菜品创建时间"，且无人读取。
3. **零消费者**：全仓库检索 `apps/web-user`、`apps/uni-user`、`apps/web-admin`、`apps/server`，这 6 个字段无任何读取点（`attrs` 的 3 处命中是 Vue 的 `$attrs` 与 svg 配置，与菜品无关）。
4. **无间接消费**：没有任何代码对 food 对象做 `Object.keys` / `Object.entries` 遍历。前端实际读取的字段只有 `name`、`image_path`、`specfoods`（及其 `price`/`sku_id`/`sold_out`/`specs_name`）、`item_id`、`_id`、`month_sales`、`rating`。

**结论：6 个字段全部不入库、不出参。**

⚠️ **两个易踩的坑：**

- **`attrs` ≠ `attributes`**。这是两个不同字段：`attrs` 是空数组（删除），`attributes` 是菜品标签（`icon_color`/`icon_name`，前端在用，**必须保留**）。名字极像，改动时勿连带删除。
- **`specfoods[]` 内部也有 `is_essential` 和 `pinyin_name`**。这两个在本地类型里是存在的，且会随 `specfoods` 整体进 Json 列**自动保留**——不需要为它们做任何处理，也不要因为"删掉菜品级同名字段"而误删。

**代价**：响应不再与上游逐字节一致，`008` §8.3 的"声明偏离清单"因此从 2 项（商家级与菜品级的 `__v`）增至 8 项。因无人消费，对两端前端均无影响；但保真验收的 diff 必须按该清单放行，否则会误报。

### 2.6 坐标数据质量（实施期补测）

坐标存在且真实 —— 全量 4298 条中 `latitude`/`longitude` **缺失 0 条**、坐标为 0 的 **0 条**，抽样核对与地址文字吻合（id=1 广州越秀区 → 23.12/113.26 ✓）。但有三个质量问题：

| # | 问题 | 规模 | 处理 |
|---|------|------|------|
| 1 | **经纬度写反** | **21 条** | 导入时归一化修正（见下） |
| 2 | `location` 与 `latitude`/`longitude` 对不上 | **114 条**（其中 99 条差值 ≥0.01 度，最大 **17.8 度**≈1900km） | **原样保留**：前端不读 `location`，重算反而制造无谓偏离 |
| 3 | 多家共用同一坐标 | **1639 条 / 408 组**（最大一组 60 家） | 合理（商场/美食城同址），仅在"按距离排序"时需定并列的次级键 |

**问题 1 的证据与修正规则**：这 21 条的 `latitude` 出现 `113.13` 这种物理上不可能的值，且 `location` 同序反转。地址文字能反证原值错误 —— id=11949 地址是"湖南省岳阳市岳阳楼区"，而岳阳在 29.36°N / 113.13°E，正好是两个给定值的交换。故导入时执行：

```ts
// 修正上游写反的经纬度（21 条），location 必须一并重算否则自相矛盾
const swapped = Math.abs(rawLatitude) > 90 && Math.abs(rawLongitude) <= 90
```

这是**修正**而非偏离 —— 不修的话这 21 家算出的距离会是一千多公里。修正前 21 条 `latitude > 90`，修正后 0 条。

**问题 2 的判定依据**：`location` 与 `latitude`/`longitude` 冲突时**两个方向都有**，不存在一致的赢家：

| id | latitude/longitude | location | 地址 | 谁对 |
|----|-------------------|----------|------|------|
| 3283 | 39.35, 116.56（北京） | [113.16, 23.46]（广东） | 广东省深圳市南山区 | `location` |
| 3284 | 30.56, 114.21（武汉） | [108.35, 22.83]（南宁） | 湖北省武汉市汉阳区 | `latitude/longitude` |

所以两个字段都不能作为"真相源"去覆盖另一个；又因为两端前端都不读 `location`，保留原值是最省事且最不引入新偏离的选择。**距离计算统一用 `latitude`/`longitude`**：0 缺失，且修正后 4298/4298 都在中国经纬度范围内。

### 2.7 上游的 id 不是唯一键

实测上游返回 **4298 条但只有 4295 个唯一 id**：

| id | 出现次数 | 两条内容 |
|----|---------|---------|
| 4979 | 3 | `ytt1111`(评分4.4/月售680) vs `ytt`(评分5/月售186) |
| 20937 | 2 | `喜茶plus` 的两组不同经营数据 |

**同 id 的两条是不同商家**（连评分和月售都不同），即上游数据里存在 id 冲突。重复出现在**同一页内**，所以不是分页副作用。

**处理**：按 id upsert 收敛，**后写入的那条胜出**，3 条变体丢失（4298 → 4295）。导入器会**显式告警**，把这种静默数据丢失变成可见的：

```
WARN 上游返回 4298 条但只有 4295 个唯一 id，3 条重复行会被 upsert 覆盖（上游 id 并非唯一键）
```

**影响可接受**：4295 分之 3 条，且是上游数据本身的缺陷（正常业务系统里 id 就该是主键）。但**必须记录**，否则将来有人把本地行数当"上游商家总数"时会以为丢数据。

### 2.8 菜单体积的两次错估与最终实测

这一节记录一个**方法论教训**，因为错误结论一度写进了本文并影响了设计决策。

**第一次错估（初版文档）**："全量约上 GB，不可行" —— 依据是**单店最大值**（商家 1 = 1.5 MB / 1358 菜品），乘上 4295 家。这个算法把"最大的那家"当成了平均值。

**第二次错估（实施期）**："约 31 MB" —— 抽样 200 家等距取 id，样本合计 1.43 MB，线性外推 ×21.5 得 31 MB。仍然错，因为**样本里恰好含商家 1 那个 1.43 MB 的离群点**，样本总量被它独占，外推结果完全由"是否抽中这个离群点"决定 —— 抽中就 31 MB，抽不中就 <1 MB。用这种高方差统计量做外推是不可靠的。

**最终实测（预导完成后直接查库，唯一可靠）**：

```sql
-- 有菜单的商家：149 / 4295 = 3.5%
SELECT count(DISTINCT restaurant_id) FROM food_categories;
-- 合计 308 个分类、1934 个菜品
SELECT count(*) FROM food_categories;  SELECT count(*) FROM foods;
-- 菜品 JSON 逻辑体积 1.6 MB；落盘 foods 2.1 MB + food_categories 120 KB
```

| 项 | 实测 |
|----|------|
| 有菜单的商家 | **149 家（3.5%）**，其余 4146 家上游返回 `[]` |
| 合计规模 | 308 分类 / 1934 菜品 / **逻辑约 1.6 MB**（落盘约 2.2 MB） |
| 单店最大 | 商家 1：73 分类 / 1358 菜品 —— **它一家占全部菜品的 70%** |
| 全量预导耗时 | 4293 家 / **约 80 秒** / **0 失败** |

**结论修正**：全量预导只要 **约 2 MB、80 秒**，所以**没有理由保留"菜单依赖上游"这条残留依赖**。设计由此从"只能按需"改为"**全量预导 + 按需懒加载兜底**"：

```bash
pnpm --filter @elm-platform/server run elm:import -- --with-menus
```

懒加载（`ElmFoodService.ensureMenuSynced`）保留为兜底 —— 上游将来新增店铺时仍能自愈。两者按 `menu_synced_at IS NULL` 协作，可重复执行、可中断续跑。

**教训**：估算"稀疏 + 长尾"分布的数据总量时，**离群点主导的样本不能做线性外推**。要么先跑一遍拿到真值，要么用分位数而非均值。这里的真值只花了一次预导的时间就拿到了。

---

## 3. 目标与非目标

### 3.1 目标

1. 上述 4 个接口的数据来源从上游改为本地数据库
2. 接口出参形状与上游保持兼容（前端零改动）
3. 商家/菜品首次拥有真库表，管理端 CRUD 与下单链路可指向同一张表
4. 数据可离线获得（导入一次后不再依赖上游可用性）

### 3.2 非目标（明确排除，避免范围蔓延）

| 项 | 原因 |
|----|------|
| **图片字节本地化** | 独立决策。`GET /api/img/*` 已是长期契约（`elm-image-proxy.service.ts:16-45`），实现可后续替换，前端零改动。见 `007` 约束文档议题 2 决策 3 |
| 短信/支付等其它 mock 通道 | 与本次无关 |
| 上游其它接口（`v1/cities`、`geo/reverse-geocode`） | 已在本地内存实现，不依赖上游 |
| 补齐 4298 家商家的菜单 | 体积不可行（见 2.2），菜单走按需 |
| 商家入驻审批 → 建店铺 | 相邻缺口（见 8.1），属独立决策，本次只留接口 |

---

## 4. 方案选型

### 4.1 候选方案

| | **A. 原始 JSON 快照表** | **B. 结构化真表**（选定） | **C. 先 A 后 B** |
|---|---|---|---|
| 表结构 | `elm_upstream_snapshot(path, query_hash, payload Json, fetched_at)` 一张通吃 | `restaurants` / `food_categories` / `foods` / `category_entries` | 两者先后 |
| 代码改动 | 1 表 + 1 服务 + 4 处调用各 1 行 | 4 表 + 迁移 + 导入器 + 3 个控制器 + 装配层 | 两次迁移 |
| 保真度 | 逐字节 | 需装配（`__v`、`distance` 两个例外） | — |
| 能否收敛三源 | ❌ payload 里没有租户归属 | ✅ 管理端可改、订单可引用、shopId 可映射租户 | 最终 ✅ |
| 本质 | DB 版响应缓存 | 真本地库 | 缓存 + 迁移 |

### 4.2 选定 B 的理由

- **只有 B 能修掉根因**：`resolveTenantIdByShopId`（`modules/order/order-draft.factory.ts:172`）现在在内存 seed 里按 shopId 找租户。上游 shop id `1` 是"效果演示"（广州），内存 seed id `1` 是"鲜花蛋糕旗舰店"——**id 撞车会把订单静默记到错误租户名下**，比 `tenantId=null` 更危险。快照表解决不了这个问题（payload 里没有租户信息）。
- **保真成本低**：字段对账显示商家侧只差一个 `__v`；菜品侧多出的 6 个字段实测为空值且无消费者，已决定删除（见 §2.5）。装配层是逐字段搬运，不是语义映射。
- **本地化顺带免费**：2.3 发现一证明列表接口不需要任何地理逻辑，B 方案的主要风险点自行消失。
- **A 的"逐字节保真"是伪优势**：它的保真来自"缓存了整个响应"，代价是永远只是一份快照——数据不可查、不可改、不可关联，将来仍要重做一遍。

### 4.3 边界条件

- **`distance` 字段**：它是上游按请求临时生成的展示值（实测恒为 `"10公里"`），**不是商家固有属性**。三种处理方式见 8.2，需单独决策。
- **8 项刻意不入库不出参**：商家级 `__v`；菜品级 `__v` + `is_essential`、`is_featured`、`attrs`、`display_times`、`pinyin_name`、`server_utc`。统一清单见 §8.3，理由是"上游恒为空值 + 全仓库零消费者"（见 §2.5）。所以"数据不变"的准确表述是：**除这 8 项声明例外，逐字段一致**。
- **不存在的 id**：上游对 `restaurant_id=999999` 返回 `[]` + HTTP 200（不是 404）。本地化后需决定是否复刻这个宽松行为。
- **上游可用性**：导入完成后，运行时不再依赖上游。但导入脚本本身需要上游可达。

---

## 5. 数据模型设计

四张表，命名与现有模型保持一致（PascalCase 模型 + snake_case 复数表名 + `@map`）。

```prisma
/// 商家主表：上游全量导入（4298 家）+ 管理端 CRUD + 下单引用的唯一真相源。
model Restaurant {
  id       Int    @id                 // 直接沿用上游 id（实测全局唯一）
  name     String
  address  String
  latitude  Float
  longitude Float
  location  Float[]                   // [lng, lat]，上游原样
  phone     String?
  category  String
  status    Int      @default(1)

  recentOrderNum Int    @map("recent_order_num")
  ratingCount    Int    @map("rating_count")
  rating         Float
  promotionInfo  String? @map("promotion_info")
  openingHours   String[] @map("opening_hours")

  isNew     Boolean @map("is_new")
  isPremium Boolean @map("is_premium")
  imagePath String  @map("image_path")

  floatMinimumOrderAmount Float  @map("float_minimum_order_amount")
  floatDeliveryFee        Float  @map("float_delivery_fee")
  orderLeadTime           String? @map("order_lead_time")
  description             String?

  // 嵌套结构：上游原样 JSON，装配时原样吐回
  supports          Json  @default("[]")
  activities        Json  @default("[]")
  deliveryMode      Json? @map("delivery_mode")
  piecewiseAgentFee Json? @map("piecewise_agent_fee")
  license           Json?
  identification    Json?

  // 本地扩展（上游没有）
  tenantId Int?     @map("tenant_id")
  source   String   @default("upstream")
  syncedAt DateTime @map("synced_at")

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt      @map("updated_at")

  tenant     Tenant?        @relation(fields: [tenantId], references: [id], onDelete: SetNull)
  categories FoodCategory[]
  foods      Food[]

  @@index([tenantId])
  @@index([name])
  @@map("restaurants")
}
```

```prisma
/// 菜品分类。刻意不叫 MenuCategory —— 见 8.4 命名冲突说明。
model FoodCategory {
  id           Int     @id                    // 上游分类 id（全局唯一）
  restaurantId Int     @map("restaurant_id")
  name         String
  description  String?
  type         Int
  iconUrl      String  @default("") @map("icon_url")
  isSelected   Boolean @default(false) @map("is_selected")
  syncedAt     DateTime @map("synced_at")

  restaurant Restaurant @relation(fields: [restaurantId], references: [id], onDelete: Cascade)
  foods      Food[]

  @@index([restaurantId])
  @@map("food_categories")
}
```

```prisma
/// 菜品。item_id 与 _id 都来自上游，前者作主键，后者装配回响应时需要。
model Food {
  itemId       Int    @id              @map("item_id")
  mongoId      String @map("_id")      // 上游 Mongo ObjectId，保真需要
  categoryId   Int    @map("category_id")
  restaurantId Int    @map("restaurant_id")
  name         String
  imagePath    String @map("image_path")
  description  String?
  tips         String?
  monthSales   Int    @map("month_sales")
  satisfyRate  Int    @map("satisfy_rate")
  satisfyCount Int    @map("satisfy_count")
  ratingCount  Int    @map("rating_count")
  rating       Float

  // 注意：上游菜品还有 is_essential / is_featured / attrs / display_times /
  // pinyin_name / server_utc 六个字段，实测为恒定空值且全仓库无消费者，
  // 按 2.5 的决策整块不入库 —— 不要为了"看起来完整"把它们加回来。
  activity       Json?
  attributes     Json @default("[]")
  specifications Json @default("[]")
  specfoods      Json @default("[]")

  tenantId Int?     @map("tenant_id")
  syncedAt DateTime @map("synced_at")

  category   FoodCategory @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  restaurant Restaurant   @relation(fields: [restaurantId], references: [id], onDelete: Cascade)

  @@index([restaurantId])
  @@index([categoryId])
  @@map("foods")
}
```

```prisma
/// 首页分类入口（/v2/index_entry），16 条全量。
model CategoryEntry {
  id          Int     @id
  title       String
  description String?
  isInServing Boolean @map("is_in_serving")
  link        String?
  imageUrl    String? @map("image_url")
  iconUrl     String? @map("icon_url")
  titleColor  String? @map("title_color")
  sortOrder   Int     @map("sort_order")   // 保住上游数组顺序
  syncedAt    DateTime @map("synced_at")

  @@map("category_entries")
}
```

**注意事项：**

- `Tenant` 模型需要补一条反向关系 `restaurants Restaurant[]`，否则 Prisma 校验不过。
- `location Float[]` 与 `openingHours String[]` 用了 Postgres 标量数组，Prisma 7 + `adapter-pg` 支持。
- `Json` 字段的默认值写法是 `@default("[]")`（字符串形式的 JSON 字面量），写 `@default([])` 会报错。
- `sortOrder` 这类"上游靠数组下标表达的隐含顺序"必须显式建列——数据库不保证 `findMany` 的返回顺序，漏了它 `/v2/index_entry` 的排列会随机。

---

## 6. 接口改造映射

| 接口 | 现在 | 改造后 |
|------|------|--------|
| `GET /shopping/restaurants` | `upstream.get('/shopping/restaurants', query)` | 查 `restaurants`，`ORDER BY id` + offset/limit 切片 |
| `GET /shopping/restaurant/:shopId` | `upstream.get('/shopping/restaurant/'+shopId)` | 查 `restaurants` 单条（与列表项同源，见 2.2） |
| `GET /shopping/v2/menu` | `upstream.get('/shopping/v2/menu', {restaurant_id})` | 查 `food_categories` + `foods`，按上游形状装配 |
| `GET /v2/index_entry` | `upstream.get('/v2/index_entry')` | 查 `category_entries`，按 `sortOrder` 排序 |

顺带收敛（同一批表，改读即可）：

| 接口 | 现状 | 说明 |
|------|------|------|
| `GET /shopping/restaurants/count` | 返回内存 seed 的 **3**（与列表的 4298 自相矛盾） | 改为 `restaurants` 表 count |
| `GET /shopping/getcategory/:restaurantId` | 内存 `menuCategories` | 与 `/shopping/v2/menu` 同源（见 2.3 发现二） |
| `GET /v4/restaurants` | 内存关键字搜索 | 改为查表搜索 |
| `GET /shopping/v2/foods`、`/v2/foods/count` | 内存 `foods` | 改为查 `foods` 表 |
| `ElmStoreService` | 内存数组 | 逐步退化为纯 seed 数据（城市等），或整体删除 |

---

## 7. 影响范围

| 文件 | 影响 | 说明 |
|------|------|------|
| `apps/server/prisma/schema.prisma` | 新增 4 模型 + `Tenant` 反向关系 | 迁移文件随行 |
| `apps/server/src/modules/elm/services/elm-upstream.service.ts` | 保留 | 导入器复用它抓取，运行时不再用 |
| `apps/server/src/modules/elm/controllers/elm-restaurant-public.controller.ts` | 改 2 处 | 列表、详情 |
| `apps/server/src/modules/elm/controllers/elm-food-public.controller.ts` | 改 1 处 | 菜单 |
| `apps/server/src/modules/elm/controllers/elm-location.controller.ts` | 改 1 处 | 首页分类 |
| `apps/server/src/modules/elm/services/elm-restaurant.service.ts` | 改造 | 内存 → Prisma，保留租户 scope 逻辑 |
| `apps/server/src/modules/elm/services/elm-food.service.ts` | 改造 | 同上 |
| `apps/server/src/modules/elm/services/*.ts` | 新增 | 装配层（DB 行 → 上游形状） |
| `apps/server/src/modules/elm/data/elm.seed.ts` | 保留/逐步下线 | 3 家 seed 商家被 4298 家真数据覆盖 |
| `apps/server/src/modules/order/order-draft.factory.ts:172` | 改 | `resolveTenantIdByShopId` 改为查 `restaurants` |
| `apps/server/src/modules/elm/tests/controllers/elm-upstream-public.controller.spec.ts` | **必须改** | 4 个用例断言 `upstream.get` 被调用（:25/:59/:89/:115），改读库后全部失效 |

**契约影响：零。** 这 4 个接口在 `packages/api-types/openapi.json` 里**没有任何 response schema**（`rawResponse` 直出），不存在 `api-drift` 风险。

---

## 8. 开放问题（需决策后才能进入实施）

### 8.1 导入的 4298 家商家归属哪个租户？

上游商家没有租户概念，但本项目的 `TenantContext` / `TenantAccessService` 是全链路强约束（`ElmRestaurantService.scopeRestaurants` 按 `tenantId`/`tenantCode` 过滤，`shop_operator` 用户 `boundShopIds: ['1']`）。候选：

| 方案 | 做法 | 代价 |
|------|------|------|
| ① 全部 `tenantId = null`（平台自营） | 导入时留空 | `dataScope: TENANT` 的用户看不到任何商家 |
| ② 建一个"上游演示"租户，全量挂它 | seed 里加一个 tenant，导入时统一赋 id | 语义上是假的，但立刻可用 |
| ③ 按 `category` 规则分配 | 如"快餐便当"→`fast-food` | 规则脆弱，纯猜测 |
| ④ 导入时不赋值，管理端手工指派 | 加管理端指派入口 | 工作量最大，但语义正确 |

> ✅ **已决策：采用 ①（平台自营），并把管道完整保留。**
>
> 理由：现在不做多租户，但"将来补上"的成本必须保持很低。而管道**已经全部存在**——
> `elm-admin.controller.ts` 每个方法已经在传 `tenantContext.fromRequestUser(req.user)`，
> `TenantAccessService.buildResourceWhere` 已经实现 `ALL`/`TENANT`/`SHOP` 三级过滤，
> `PaymentOrder.tenantId` 是 `Int?`。所以"不做"= **只不填数据、不拆管道**。
>
> 现有后果（明确且可接受）：所有商家 `tenantId` 为 null；`tenant_admin` / `shop_operator`
> 登录后看到空列表；平台管理员 `admin`（`dataScope: ALL`）不受影响，看全部。
>
> **将来补三件事，都是小改动**：① 加管理端"指派租户"入口；② 查询已有 `where` 条件，填值即生效；
> ③ 入驻闭环（审批通过 → 建商家并绑租户）。

**相邻缺口（需一并知道）**：`merchant-onboarding.service.ts:74` 的审批事务**只改 `merchantApplication.status` 与写日志，不创建租户也不创建店铺**。也就是说"审批通过"目前不产生任何实际商家。若要做 ④，这里正是天然的挂载点（审批通过 → 建 `Restaurant` 行并绑定租户）。

### 8.2 `distance` 字段怎么处理？

| 方案 | 结果 | 评价 |
|------|------|------|
| ① 存上游原值 `"10公里"` | 逐字节保真 | 语义是假的（商家其实在 1200 km 外），且前端会显示错误的距离 |
| ② 读取时按请求坐标实算 | 语义正确 | 前端看到的列表/距离会与上游不同（是改进，但不再是"数据不变"） |
| ③ 不返回该字段 | — | 前端有渲染该字段的逻辑，会显示 undefined |

> ✅ **已决策：采用 ②，但只算"展示值"、不改排序。**
>
> 关键区分是**算展示值**与**按距离排序**，两者成本差约 200 倍：
>
> | | 成本（实测） | 是否需地理索引 |
> |---|---|---|
> | 只算**本页 20 行**（采用） | **0.005 ms/请求** | 否 |
> | 全量 4295 行算+排序 | 1.13 ms/请求（10 万家店时约 26 ms） | 是（矩形预筛或 PostGIS） |
>
> 采用前者：SQL 仍是 `ORDER BY id`（复刻上游），只对 `LIMIT` 之后的那一页算 haversine。
> 既让距离显示变真实，又不改变"用户看到哪些商家"。后者会**改变产品行为**（变成只推荐附近商家），
> 属功能变更而非优化，本次不做。
>
> ⚠️ 一处未覆盖：`/shopping/restaurant/:id` 拿不到调用方坐标（前端该请求不带经纬度），
> 故详情的 `distance` 退回上游常量 `"10公里"`。这是**与改动前完全一致**的行为（非回归），
> 要修需前端在详情请求上补传坐标。

### 8.3 声明偏离清单（保真验收的放行依据）

以下字段**故意**不以与上游相同的值/形态出现在本地响应里。前 8 项依据见 §2.5（上游恒为空值 + 全仓库零消费者）：

| # | 实体 | 字段 | 上游取值 | 依据 |
|---|------|------|----------|------|
| 1 | restaurant | `__v` | Mongoose 版本键 | 内部记账字段 |
| 2 | food | `__v` | 同上 | 同上 |
| 3 | food | `is_essential` | 恒 `false` | 常量 |
| 4 | food | `is_featured` | 恒 `0` | 常量 |
| 5 | food | `attrs` | 恒 `[]` | 常量（≠ `attributes`） |
| 6 | food | `display_times` | 恒 `[]` | 常量 |
| 7 | food | `pinyin_name` | 恒 `""` | 常量 |
| 8 | food | `server_utc` | 有真数据（2019 年时间戳） | 上游 dump 记账时间，无消费者 |

追加 3 项（实施期发现，依据见 §2.6 / §2.2 更正）：

| # | 位置 | 字段 | 偏离 | 依据 |
|---|------|------|------|------|
| 9 | 全局 | `distance` | 不再恒为 `"10公里"`，按请求坐标实算 | §8.2 决策② |
| 10 | **仅详情** | `order_lead_time` | 返回 `"40分钟"`（列表值）而非上游详情的 `""` | 上游详情本身残缺，见 §2.2 |
| 11 | **仅详情** | `distance` | 返回 `"10公里"` 而非上游详情的 `""` | 同 §8.2 |
| 12 | 21 条 | `latitude`/`longitude`/`location` | 经纬度写反已修正 | §2.6 问题 1（修正非偏离） |

**验收时必须按此清单放行**，否则 §9.2 的逐字段 diff 会把这些误报为不一致。实际全量验收只命中第 12 项（21 条），第 9–11 项在"本地列表 vs 上游列表"的比对里不出现 —— 详见 §9.4。

**如果将来要回退第 1–8 项**：`server_utc` 是唯一有真数据的，加回一节列即可；其余 5 个直接返回常量字面量即可（不需要存库）。

**错误响应的处理**：上游的处理方式不一致，且都反直觉，实测如下：

| 请求 | 上游响应 | 当前后端行为 | 本地化后 |
|------|----------|-------------|---------|
| `/shopping/restaurant/999999` | HTTP 200 + **空 body（0 字节）** | `response.json()` 解析空串抛错 → 被 catch → **502 Bad Gateway** | 建议 404 |
| `/shopping/restaurant/0` | HTTP 200 + `{"status":0,"type":"ERROR_PARAMS",...}` | 错误对象被当正常响应透传 | 建议 404 |
| `/shopping/v2/menu?restaurant_id=999999` | HTTP 200 + `[]` | 原样透传 | `[]`（天然一致） |

也就是说**现在请求一个不存在的商家，客户端拿到的是 502**，语义上把"商家不存在"报成了"网关故障"。本地化会把前两者修正为 404——这是改进，但属于对上游的刻意偏离，需确认前端没有依赖 502 的错误分支（如自动重试）。菜单接口则天然一致，无需特判。

### 8.4 表命名：`food_categories` 还是 `menu_categories`？

仓库里已有 `Menu` 模型（`schema.prisma:256` → `menus`），是**后台权限菜单**。若新建 `menu_categories`，读者极易误认为它是权限菜单的层级结构。故本方案刻意命名为 `food_categories`，与代码里的 `MenuCategoryRecord` / `store.menuCategories` 存在命名出入——这是有意的，已在 schema 与代码注释里同步说明。

> ✅ **已落地**：表名 `food_categories`，模型 `FoodCategory`。

### 8.5 其他待确认项

- ~~菜单按需导入时，若上游该店返回 `[]`，是否要缓存这个"空"结果？~~ → ✅ **已做**：用 `restaurants.menu_synced_at` 区分"未同步"与"已同步但无菜单"。实测空菜单店第二次请求 0.008s（首次 0.199s）。
- ~~导入脚本放 `prisma/seed.ts` 还是独立命令？~~ → ✅ **独立命令** `pnpm --filter @elm-platform/server run elm:import`（seed 是高频操作，不该背上 7 MB 数据与"上游可达"这个外部依赖）。
- ~~`elm.seed.ts` 里的 3 家商家是删除还是改为写库？~~ → ✅ **删除**：`seedRestaurants`/`seedMenuCategories`/`seedFoods` 连同只服务它们的三个工厂函数（`createRestaurant`/`createFood`/`createEntry`）一并移除，避免成为与数据库并存的第四份数据源。`seedCities`/`seedOrders` 仍在（尚未建表）。

---

## 9. 验收标准

### 9.1 数据验收

```bash
# 商家数应为 4295（上游返回 4298 条，按 id 收敛后 4295 —— 上游 id 非唯一键，见 2.7）
curl -s "http://localhost:3000/api/shopping/restaurants/count"

# 列表应返回 20 条且 id 升序
curl -s "http://localhost:3000/api/shopping/restaurants?latitude=31.22967&longitude=121.4762&offset=0&limit=20"

# 详情字段数应为 28（上游 29 减去不入库的 __v）
curl -s "http://localhost:3000/api/shopping/restaurant/1"
```

### 9.2 保真验收

对同一 id 分别请求**本地**与**上游**，逐字段 diff。**放行清单 = §8.3 的 12 项**，其余应完全一致。

⚠️ 两个必须注意的方法论陷阱（实施期踩过）：

1. **比对对象要选对**：本地详情读的是"列表那一行"，所以要与**上游列表项**比，而不是上游详情 —— 上游详情的 `order_lead_time`/`distance` 是空串（§2.2），比错了会得到一片假差异。
2. **必须用顺序无关的深比较**：Postgres `jsonb` **会重排对象的键**，而 `JSON.stringify` 对键序敏感。直接逐字节比较会让 `license`/`supports`/`identification` 等嵌套对象全部假阳性。

```js
// 顺序无关的深比较（jsonb 会重排键，逐字节比较必然假阳）
const norm = v => Array.isArray(v) ? v.map(norm)
  : (v && typeof v === 'object')
    ? Object.keys(v).sort().reduce((a, k) => (a[k] = norm(v[k]), a), {})
    : v
const eq = (a, b) => JSON.stringify(norm(a)) === JSON.stringify(norm(b))
```

⚠️ 该 diff 通过 ≠ 保真成立，必须确认放行的每一项都在 §8.3 里有据可查。若出现清单外的 DIFF，说明装配层漏了一个字段（见 `009` 阶段 3.2 的警告：类型系统抓不到漏字段）。

### 9.4 实施结果（2026-09-30，已执行）

| 验收项 | 结果 |
|--------|------|
| 全量逐字段比对（4295 家，本地列表 vs 上游列表） | **清单外差异 0 家**；仅 21 家命中 §8.3 第 12 项（坐标修正） |
| 无丢失 | 上游唯一 id 4295 == 本地行数 4295 |
| 菜单按需导入 | 商家 1：首次 7.34s（73 类 / 1358 菜品 / 1.32 MB），二次 **0.04s**，两次响应一致 |
| 空菜单缓存 | 商家 13286：首次 0.199s → 二次 0.008s（不重复回源） |
| **菜单全量预导** | 4293 家 / **约 80 秒** / **0 失败**；结果：149 家有菜单，308 分类 / 1934 菜品 |
| 首页分类顺序 | 16 条，顺序 = 上游数组序（`20,10,15,225,403297,92,1,65,...`） |
| 不存在的商家 | 详情/菜单均返回 **404**（修正了原先的 502 语义错误） |
| **断上游验证（预导后）** | 上游不可达时，**列表/详情/分类/计数/菜单/搜索 8 个接口全部 200** —— 包括此前会 502 的、从未访问过的商家菜单 |
| 测试 | 38 suites / 526 tests 全绿；`tsc --noEmit` 通过；eslint 0 error |

✅ **商家数据的上游依赖已完全消除**。菜单最终采用「**全量预导 + 按需懒加载兜底**」：预导后所有接口离线上可用（实测菜单响应 0.008–0.06s）；懒加载保留作兜底，供上游将来新增店铺时自愈。体积依据见 §2.8（**约 2 MB，非初版估的"上 GB"**）。

⚠️ **更正一处过强的措辞**：此处曾写作"上游依赖已完全消除"，但那只覆盖**商家数据**。仍有两处运行期外部依赖，都不在本次范围：

| 依赖 | 位置 | 影响 | 状态 |
|------|------|------|------|
| **图片字节** | `elm-image-proxy.service.ts` 仍把 `elm.cangdu.org` / `fuss10.elemecdn.com` 的图片流式转发 | 上游不可用时图片裂 → 前端退到 `DEFAULT_RESTAURANT_IMAGE` 占位图 | 008 §3.2 列为**非目标**；但 `007` 议题 2 决策 3 曾写"与商家建真库表一起做"，**需确认是否并入** |
| **逆地理编码** | `elm-city.service.ts:61` 调 `h5.ele.me/restapi/bgs/poi/reverse_geo_coding` | 有 try/catch 兜底，失败时返回模拟地址，不阻断 | 不属于本次 4 个接口，不在地图内 |

`upstream.get` 现在仅出现在 `elm-upstream-import.service.ts`（3 处），即**只有你主动执行 `elm:import` 时才访问上游**，运行时不再依赖。

### 9.3 功能验收

- [ ] 首页商家列表正常渲染，滚动分页正常
- [ ] 商家详情页正常打开
- [ ] 商家菜单页正常渲染（分类锚点、加购正常）
- [ ] 首页分类入口图标正常（16 个）
- [ ] 断开上游（改 `ELM_API_BASE_URL` 指向无效地址）后，以上四项仍正常
- [ ] `pnpm --filter @elm-platform/server run test` 全绿

---

## 10. 风险

| 风险 | 影响 | 缓解 |
|------|------|------|
| 装配层漏字段（类型系统抓不到） | 前端读到 `undefined`，静默降级 | 以 §9.2 的逐字段 diff 作为卡的关口 |
| 把 §8.3 已决策删除的字段"补"回来 | 冗余，违背 §2.5 的实测依据 | 装配层与表结构都留注释说明 |
| 大菜单写入超时（单店 1.5 MB / 1358 菜品） | 导入失败或前端首屏慢 | 分批 `createMany` + 事务分段；装配层分页 |
| 既有 spec 断言上游调用 | 测试红 | 与实现同批修改（属必要场景，符合 AI_TEST_POLICY） |
| 租户归属未定就动手 | 越改越乱 | 8.1 先决策 |
| `elm.seed.ts` 与新表并存造成第四源 | 分裂加剧 | 实施时同步下线 seed 商家 |

---

## 11. 已知遗留（不阻塞交付，但需知道）

### 11.1 管理端列表只能看到前 100 条 —— 本地化的连带影响

`elm-admin.controller.ts` 的两处硬编码：

```ts
return this.restaurantService.listRestaurants({ limit: 100 }, context)  // 4295 家里的前 100
return this.foodService.listFoods({ limit: 100 }, context)              // 1934 个菜品里的前 100
```

而且这两个方法**不接收 `@Query()`**，所以前端既不能翻页也不能搜索（前端也没有分页组件）。

**为什么现在才暴露**：改造前管理端读的是内存 seed，只有 3 家商家 / 5 个菜品，`limit: 100` 等于"全部"；换成真库后数据变成 4295 / 1934，于是**管理端从"看全部"退化成"看 1/43"**。

这不是本地化的实现错误（数据是对的），而是**数据量增长放大了既有的接口缺陷**。修法很小：控制器接 `@Query()` 透传 `offset`/`limit`/`keyword`（服务层已支持这三个参数），前端补分页。建议单开一批做，不并入本次。

### 11.2 运行期仍存在的外部依赖

见 §9.4 的对照表：**图片字节**（`/api/img/*` 代理转发，离线时前端退到占位图）与**逆地理编码**（有 try/catch 兜底）。前者是 `007` 议题 2 决策 3 曾计划"与商家建真库表一起做"的项，需确认是否现在补。

### 11.3 详情接口的 `distance` 退回常量

上游详情请求不带经纬度，本地算不出距离，故返回 `"10公里"`。与改动前行为一致（非回归），要修需前端在详情请求上补传坐标。

### 11.4 阶段 6（租户衔接）未做

按 §8.1 决策（平台自营）暂缓。三件后续事项：管理端"指派租户"入口、查询条件填值、入驻审批 → 建商家并绑租户。

---

## 修订记录

| 日期 | 说明 |
|------|------|
| 2026-09-30 | 初始版本。基于对上游的实测（4298 家 / 坐标被忽略 / 字段对账）与方案 A/B/C 选型，选定 B 方案 |
| 2026-09-30 | **实施后修订**：① 更正 §2.2 的"详情与列表逐字段一致"（实际有 2 个字段值不同）；② 新增 §2.6 坐标数据质量、§2.7 上游 id 非唯一键；③ §8.1/§8.2/§8.4/§8.5 标记决策已落地；④ §8.3 偏离清单由 8 项扩到 12 项；⑤ 新增 §9.4 实施结果 |
| 2026-10-01 | 菜单改为**全量预导 + 懒加载兜底**（新增 `elm:import -- --with-menus`），上游依赖消除；新增 §2.8 记录体积被错估两次的教训；更正 §9.4 "上游依赖已完全消除"的过强措辞；新增 §11 已知遗留（管理端列表 100 条上限等 4 项） |
