# 商家数据本地化实施计划书

> **范围：** `apps/server` 的 elm 兼容层
> **前置：** 先读 `008-merchant-data-localization.md`（背景、实测数据、方案选型、开放问题）
> **状态：** ✅ **阶段 1–4 已实施完成**（2026-09-30），并顺带完成了阶段 5 的菜单按需导入
> **实施记录与计划偏差：** 见文末 §实施记录

---

## 阶段总览

| 阶段 | 产物 | 依赖 | 状态 |
|------|------|------|------|
| 0 | 前置检查结论 | — | ✅ |
| 1 | 4 张表 + 迁移文件 | — | ✅ 已应用 |
| 2 | 导入器（商家 + 首页分类） | 阶段 1 | ✅ 4295 行 + 16 条 |
| 3 | 装配层（DB 行 → 上游形状） | 阶段 1 | ✅ |
| 4 | 3 个控制器改读库 | 阶段 2、3 | ✅ 四个接口断上游 |
| 5 | 菜单（预导 + 懒加载兜底） | 阶段 4 | ✅ 全量预导 4293 家 / 80s / 0 失败 |
| 6 | 租户衔接 | 决策 8.1 | ⏸ 按 8.1 决策（平台自营）暂缓 |
| 7 | 测试与验收 | 阶段 4 | ✅ 全量比对 4295 家零差异 |

阶段 1–5 完成后，**四个上游接口全部断掉**，且**菜单也已全量预导** —— 上游不可达时 8 个接口全部正常。运行期除「图片字节」（008 §3.2 非目标）与「逆地理编码」（有兜底）外无外部依赖。

---

## 阶段 0：前置检查

### 0.1 环境与基线

```bash
pnpm install

# 数据库可连通（本机需 PG 在跑，docker-compose 起）
pnpm --filter @elm-platform/server run prisma:migrate
# 期望：Already in sync, no schema change

# 记录改造前的基线，后面验收要对比
pnpm --filter @elm-platform/server run test 2>&1 | tail -5
```

⚠️ **本机直跑全量 jest 会 OOM**，需按既有规避命令执行（见 `docs/reports/server/` 后端测试基线记录）。

### 0.2 记录改造前行为

改造前先把上游的响应存下来，作为阶段 4 的 diff 基准：

```bash
mkdir -p .tmp-probe/baseline
for id in 1 3269 13286; do
  curl -s "https://elm.cangdu.org/shopping/restaurant/$id" -o ".tmp-probe/baseline/shop-$id.json"
  curl -s "https://elm.cangdu.org/shopping/v2/menu?restaurant_id=$id" -o ".tmp-probe/baseline/menu-$id.json"
done
curl -s "https://elm.cangdu.org/v2/index_entry" -o .tmp-probe/baseline/index_entry.json
curl -s "https://elm.cangdu.org/shopping/restaurants?latitude=31.22967&longitude=121.4762&offset=0&limit=20" \
  -o .tmp-probe/baseline/shops-p1.json
```

`.tmp-probe/` 已在 git 中未跟踪，勿提交。

### 0.3 待决策项确认

实施前必须先有结论（见 `008` 第 8 节）：

- [ ] 8.1 导入商家的 `tenantId` 归属方案
- [ ] 8.2 `distance` 字段处理方式
- [ ] 8.4 表命名确认（`food_categories`）
- [ ] 8.5 导入脚本的落点与执行方式

---

## 阶段 1：建表与迁移

### 1.1 追加模型

在 `apps/server/prisma/schema.prisma` 末尾追加 `008` 第 5 节的四个模型，并给 `Tenant` 补反向关系：

```prisma
model Tenant {
  // ...既有字段不动
  users      User[]
  orders     PaymentOrder[]
  orderLogs  OrderActionLog[]
  actionLogs TenantActionLog[]
  restaurants Restaurant[]   // ★ 新增，缺了 Prisma 校验不过
}
```

**这一步解决什么**：让 `restaurants.tenant_id` 有合法的外键目标。
**它不能解决什么**：Prisma 不会因为你写了关系就自动给导入数据赋租户——归属仍需 8.1 的决策。
**何时已足够**：只要 `tenantId` 允许为 `null`（平台自营假设），关系就够用。

### 1.2 生成迁移

```bash
pnpm --filter @elm-platform/server run prisma:migrate
# 交互中输入迁移名：add_merchant_tables
pnpm --filter @elm-platform/server run prisma:generate
```

预期产物：`prisma/migrations/<时间戳>_add_merchant_tables/migration.sql`

### 1.3 验证表结构

```bash
pnpm --filter @elm-platform/server run prisma:studio
# 或
psql "$DATABASE_URL" -c '\d restaurants'
```

- [ ] 4 张表存在
- [ ] `restaurants.id` 是 `integer` 主键且**无** `DEFAULT nextval`（上游 id 是我们自己给的）
- [ ] `foods.specfoods` 是 `jsonb`
- [ ] `restaurants.opening_hours` 是 `text[]`

**注意事项：**

- `Int @id` 不带 `@default(autoincrement())` —— 若误写成 `@default(autoincrement())`，Postgres 会建序列，插入上游 id 时序列与数据不同步，后续新增商家会撞 id。
- `location Float[]`、`openingHours String[]` 依赖 Postgres 标量数组。Prisma 7 + `adapter-pg` 支持，但 `prisma migrate` 生成的是 `double precision[]`，与 `Float[]` 一致，无需手改。
- `Json` 默认值必须写成 `@default("[]")`（字符串形式），写成 `@default([])` 会在 generate 时报错。

**回滚：**

```bash
# 开发环境
pnpm --filter @elm-platform/server exec prisma migrate resolve --rolled-back <迁移名>
# 或直接删表（新表无外部依赖，安全）
psql "$DATABASE_URL" -c 'DROP TABLE IF EXISTS foods, food_categories, restaurants, category_entries CASCADE;'
```

新表无数据、无外部引用，回滚不丢数据（对照 `docs/database/migration-checklist.md` 的「回滚」节）。

---

## 阶段 2：导入器

### 2.1 落点

新建 `apps/server/src/modules/elm/scripts/import-upstream.ts`，以独立命令执行（**不进 `prisma/seed.ts`**——7 MB 数据会让每次 seed 变慢，理由见 `008` §8.5）：

```json
// apps/server/package.json
{
  "scripts": {
    "elm:import": "ts-node src/modules/elm/scripts/import-upstream.ts"
  }
}
```

### 2.2 抓取商家：分页循环

```ts
// 上游列表实测 4298 家；offset 递增直到返回空数组。
// ⚠️ latitude/longitude 必须传（缺了上游返回 {"status":0,"type":"ERROR_PARAMS"}），
//    但实测其取值被完全忽略——北京坐标与广州坐标的响应逐字节相同。
const PAGE_SIZE = 200
const REQUIRED_BUT_IGNORED_COORDS = { latitude: 31.22967, longitude: 121.4762 }

for (let offset = 0; ; offset += PAGE_SIZE) {
  const page = await upstream.get<unknown[]>('/shopping/restaurants', {
    ...REQUIRED_BUT_IGNORED_COORDS,
    offset,
    limit: PAGE_SIZE,
  })
  if (!Array.isArray(page) || page.length === 0)
    break
  await upsertRestaurants(page)
}
```

**这段解决了什么**：用上游真实存在的"坐标必传但被忽略"行为，安全地做全量分页抓取。
**它不能解决什么**：如果上游某天真的开始按坐标过滤，这段会静默只导入"附近"的商家——需要靠导入后的行数校验兜底（见 2.5）。
**为什么不用 `limit=1000`**：实测可行（1.7 MB），但单次 payload 过大，失败重试成本高，200 更稳。

### 2.3 upsert 幂等写入

```ts
async function upsertRestaurants(rows: any[]) {
  await prisma.$transaction(
    rows.map(row => prisma.restaurant.upsert({
      where: { id: row.id },
      create: toRestaurantRow(row),
      update: { ...toRestaurantRow(row), syncedAt: new Date() },
    })),
  )
}
```

**这段解决了什么**：`upsert` 让导入可重复执行，中断后重跑不会产生重复行，也不会丢已有改动。
**它不能解决什么**：`update` 会覆盖管理端在本地改过的字段。若将来管理端可编辑，需改成"仅当 `source='upstream'` 且本地未修改时覆盖"。
**何时已足够**：当前管理端尚未接真表，无本地改动可覆盖。

### 2.4 字段映射：`toRestaurantRow`

映射的核心是**嵌套结构整体进 JSON 列**，标量进列：

| 上游字段 | 落库位置 |
|----------|----------|
| `supports` / `activities` / `delivery_mode` / `piecewise_agent_fee` / `license` / `identification` | 对应 `Json` 列，原样存 |
| `location` / `opening_hours` | `Float[]` / `String[]` |
| 其余标量 | 同名标量列（`@map` 到 snake_case） |
| `__v` | **丢弃**（决策见 `008` §8.3） |
| `distance` | 按 `008` §8.2 的决策处理 |
| `tenantId` | 按 `008` §8.1 的决策处理；不写入时留 `null` |

`syncedAt` 每行写 `new Date()`。

### 2.5 首页分类

16 条，一次抓完，**必须显式写 `sortOrder`**：

```ts
const entries = await upstream.get<any[]>('/v2/index_entry')
await prisma.$transaction(
  entries.map((entry, index) => prisma.categoryEntry.upsert({
    where: { id: entry.id },
    create: { ...toCategoryEntryRow(entry), sortOrder: index },
    update: { ...toCategoryEntryRow(entry), sortOrder: index },
  })),
)
```

**这段解决了什么**：把"上游靠数组下标表达的排序"固化成可 `ORDER BY` 的列。
**它不能解决什么**：数据库不保证 `findMany` 的返回顺序，所以读取端**必须**显式 `orderBy: { sortOrder: 'asc' }`，漏写就会随机排列。
**为什么不在读取时排序**：读取端排序需要一份"顺序来源"，而 `id` 顺序与上游数组顺序无关（实测 id 为 `20, 10, 15, 225, 403297, ...`）。

### 2.6 执行与校验

```bash
pnpm --filter @elm-platform/server run elm:import
```

校验：

```bash
psql "$DATABASE_URL" -c 'SELECT count(*) FROM restaurants;'        # 期望 4298
psql "$DATABASE_URL" -c 'SELECT count(*) FROM category_entries;'   # 期望 16
psql "$DATABASE_URL" -c 'SELECT id, name FROM restaurants ORDER BY id LIMIT 3;'
# 期望第 1 行 name = 效果演示
```

行数不等于 4298 时**不要继续**，先查明是否触发了 2.2 的坐标过滤假设。

---

## 阶段 3：装配层

### 3.1 为什么必须有这一层

Prisma 的 `@map` 只改**数据库列名**，不改 **Prisma 字段名**：

```prisma
recentOrderNum Int @map("recent_order_num")
```

```ts
const row = await prisma.restaurant.findUnique({ where: { id: 1 } })
row.recentOrderNum   // ← Prisma 返回的是驼峰
```

而上游响应要求 `recent_order_num`。所以 `{ ...row }` 直接返回会**把所有下划线字段全写错**——这是本次改造最容易翻车的地方，且类型检查抓不到（响应类型是 `rawResponse` 直出的 `unknown`）。

### 3.2 显式逐字段装配

```ts
// apps/server/src/modules/elm/assemblers/restaurant.assembler.ts
export function toRestaurantResponse(row: RestaurantRow) {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    latitude: row.latitude,
    longitude: row.longitude,
    location: row.location,
    phone: row.phone,
    category: row.category,
    supports: row.supports,
    status: row.status,
    recent_order_num: row.recentOrderNum,   // ★ 驼峰 → 下划线
    rating_count: row.ratingCount,
    rating: row.rating,
    promotion_info: row.promotionInfo,
    piecewise_agent_fee: row.piecewiseAgentFee,
    opening_hours: row.openingHours,
    license: row.license,
    is_new: row.isNew,
    is_premium: row.isPremium,
    image_path: row.imagePath,
    identification: row.identification,
    float_minimum_order_amount: row.floatMinimumOrderAmount,
    float_delivery_fee: row.floatDeliveryFee,
    distance: /* 见 008 §8.2 决策 */ row.distance,
    order_lead_time: row.orderLeadTime,
    description: row.description,
    delivery_mode: row.deliveryMode,
    activities: row.activities,
    // 刻意不返回 __v
  }
}
```

**这段解决了什么**：把驼峰行还原成上游的下划线契约，字段一对一，可逐行核对。
**它不能解决什么**：类型系统抓不到"漏了一个字段"——`toRestaurantResponse` 的返回值是推断类型，少写一个字段不会报错。
**兜底手段**：用 `008` 阶段 0.2 存下的 baseline JSON 做逐字段 diff（见阶段 7.2），这是唯一可靠的漏字段检测。
**为什么不用 snake_case 命名 Prisma 字段**：可行（Prisma 允许），但会与仓库既有的 `User`/`Tenant`/`PaymentOrder` 全驼峰约定冲突。代价是装配层多写一遍，换来的是模型风格统一。

菜品的装配同构，但按 `008` §2.5 的决策，**上行 6 个字段整块不返回**：

```ts
// 上游菜品还有 is_essential / is_featured / attrs / display_times / pinyin_name /
// server_utc —— 实测为恒定空值（唯一的 server_utc 是上游 dump 记账时间戳）且
// 全仓库零消费者，故不入库、不出参。详细依据见 008 §2.5。
// ⚠️ 不要"为了完整"把它们加回来：不加是决策，加了是冗余。
```

**这段解决了什么**：避免把 5 个常量空值和一个无人读的 2019 年时间戳搬进表、再搬回响应。
**它不能解决什么**：响应因此不再与上游逐字节一致。这属于 §8.3 声明偏离清单里的第 3–8 项，**必须靠阶段 7.2 的 diff 放行清单来管理**，否则会误报。
**边界条件**：`specfoods[]` 内部也有 `is_essential` 和 `pinyin_name`，它们随 `specfoods` 整体进 Json 列**自动保留**，不需要也不应该单独处理。

⚠️ **同名陷阱**：`attrs`（空数组，已删）与 `attributes`（菜品标签，前端在用）是两个不同字段，改动时勿连带删除。

---

## 阶段 4：接口改造

### 4.1 商家列表

**改造前**（`elm-restaurant-public.controller.ts:18-22`）：

```ts
@Get('shopping/restaurants')
@ApiOperation({ summary: '获取商铺列表' })
async getRestaurants(@Query() query: Record<string, unknown>) {
  return rawResponse(await this.upstream.get('/shopping/restaurants', query))
}
```

**改造后**：

```ts
@Get('shopping/restaurants')
@ApiOperation({ summary: '获取商铺列表' })
getRestaurants(@Query() query: Record<string, unknown>) {
  return rawResponse(this.restaurantService.listForApi(query))
}
```

`listForApi` 的实现落点是已存在的 `ElmRestaurantService`（它已有租户 scope 逻辑，能复用）：

```ts
async listForApi(query: Record<string, unknown>) {
  const offset = toNumberValue(query.offset, 0)
  const limit = toNumberValue(query.limit, 20)
  const rows = await this.prisma.restaurant.findMany({
    orderBy: { id: 'asc' },   // ★ 复刻上游的 id 升序（实测）
    skip: offset,
    take: limit,
  })
  return rows.map(toRestaurantResponse)
}
```

**这段解决了什么**：本地化后列表不需要任何地理计算——实测上游忽略坐标、`distance` 恒为常量、排序是纯 id 升序，所以一句 `orderBy: { id: 'asc' }` 即等价。
**它不能解决什么**：`latitude`/`longitude` 缺失时的行为。上游会返回 `{"status":0,"type":"ERROR_PARAMS","message":"latitude参数错误"}`，本地实现默认不会。这是**有意的偏离**——它同时修掉了游客模式下商家列表空白的历史问题。若要求严格兼容，需显式补上这个校验。
**边界条件**：`offset`/`limit` 来自 query 字符串，必须经 `toNumberValue` 归一，否则 Prisma 会因 `take: "20"` 抛类型错误。

### 4.2 商家详情

```ts
// 改造后：列表项与详情字段完全一致（实测差集为空），同一装配函数复用
async getByIdForApi(shopId: number) {
  const row = await this.prisma.restaurant.findUnique({ where: { id: shopId } })
  if (!row)
    throw new NotFoundException('餐馆不存在')
  return toRestaurantResponse(row)
}
```

⚠️ **行为变化（实测，与直觉相反）**：上游对不存在的 shopId 返回的是 **HTTP 200 + 空 body（0 字节）**，不是 404：

```bash
curl -s -o d.json -w "http=%{http_code} bytes=%{size_download}\n" \
  "https://elm.cangdu.org/shopping/restaurant/999999"
# → http=200 bytes=0
```

于是**当前**的代理路径是：`response.json()` 解析空字符串 → `SyntaxError: Unexpected end of JSON input` → 被 `elm-upstream.service.ts:57` 的 catch 捕获 → 抛 `BadGatewayException`。**也就是说现在请求一个不存在的商家，客户端拿到的是 502 Bad Gateway**，而不是 404 —— 语义是错的，会误导前端把"商家不存在"当成"网关故障"。

本地化后改为 `NotFoundException`（404）是**有意的行为修正**。附带影响：前端若有"502 就重试"的逻辑，改后会变成不重试——需确认前端对该接口的错误处理分支。

另注：`shopId=0` 时上游返回 `{"status":0,"type":"ERROR_PARAMS","message":"餐馆ID参数错误"}` + HTTP 200，即错误对象被当作正常响应透传。本地化后同样变为 404。这两处偏离需与 `008` §8.3 的"宽松行为是否复刻"一并确认。

### 4.3 商家菜单

```ts
// 改造后
@Get('shopping/v2/menu')
async getMenu(@Query('restaurant_id', ParseIntPipe) restaurantId: number) {
  return rawResponse(await this.foodService.getMenuForApi(restaurantId))
}
```

```ts
async getMenuForApi(restaurantId: number) {
  const categories = await this.prisma.foodCategory.findMany({
    where: { restaurantId },
    orderBy: { id: 'asc' },
    include: { foods: { orderBy: { itemId: 'asc' } } },
  })
  return categories.map(cat => ({
    id: cat.id,
    restaurant_id: cat.restaurantId,
    name: cat.name,
    description: cat.description,
    type: cat.type,
    icon_url: cat.iconUrl,
    is_selected: cat.isSelected,
    foods: cat.foods.map(toFoodResponse),
  }))
}
```

**这段解决了什么**：一次 `include` 查询拿到分类与菜品，避免 N+1。
**它不能解决什么**：大菜单的体积（单店 1.5 MB / 1358 菜品）不影响正确性，但影响响应时间；若首屏慢，需在装配层做分页或按分类懒加载（属后续优化，不在本次）。
**边界条件**：上游对不存在的 `restaurant_id` 返回 `[]` + 200（实测 `999999`），本地 `findMany` 天然返回 `[]`，行为一致，无需特判。

### 4.4 首页分类

```ts
@Get('v2/index_entry')
async getIndexEntry() {
  return rawResponse(await this.cityService.listCategoryEntries())
}
```

```ts
async listCategoryEntries() {
  const rows = await this.prisma.categoryEntry.findMany({
    orderBy: { sortOrder: 'asc' },   // ★ 必须显式排序，见阶段 2.5
  })
  return rows.map(toCategoryEntryResponse)
}
```

### 4.5 顺带收敛

同一批表落地后，这些仍读内存的接口一并改掉（否则会形成第四源）：

- `shopping/restaurants/count` → `prisma.restaurant.count()`（现在返回 3，与列表的 4298 自相矛盾）
- `v4/restaurants`（关键字搜索）→ `where: { name: { contains: keyword } }`
- `shopping/v2/foods`、`shopping/v2/foods/count` → 查 `foods` 表
- `shopping/getcategory/:restaurantId` → 与 4.3 共读同表（实测二者返回同构数据）

### 4.6 下线 seed 商家

`data/elm.seed.ts` 里的 3 家 `seedRestaurants` / 5 个 `seedFoods` 被 4298 家真数据取代，必须处理，否则 `ElmStoreService` 成为第四数据源：

- [ ] `service` 中不再引用 `store.restaurants` / `store.foods`
- [ ] `resolveTenantIdByShopId`（`order-draft.factory.ts:172`）改为查 `restaurants` 表
- [ ] 确认 `seedCities`（城市）与 `seedOrders` 是否仍被使用，只删除确定无引用的部分

⚠️ 删除前务必 `grep` 引用方——`seedRestaurants` 目前被 `order-draft.factory.ts` 直接 import，是下单链路的租户解析入口。

---

## 阶段 5：菜单按需导入

商家的菜单最终采用「**全量预导 + 按需懒加载兜底**」两条路（初版计划只写了懒加载，依据的体积估算错了 —— 见 008 §2.8）：

```bash
# 全量预导：实测 4295 家里仅 149 家有菜单，合计约 2 MB，耗时约 80 秒
pnpm --filter @elm-platform/server run elm:import -- --with-menus
```

懒加载保留为兜底（上游将来新增店铺时自愈），首次访问时回源并落库：

```ts
async getMenuForApi(restaurantId: number) {
  const cached = await this.prisma.foodCategory.count({ where: { restaurantId } })
  if (cached === 0)
    await this.importMenu(restaurantId)   // 回源 → 落库
  return this.readMenuFromDb(restaurantId)
}
```

**这段解决了什么**：用"本地为空即回源"实现懒加载，避免一次性导入巨量数据。
**它不能解决什么**：**无法区分"上游这家店真的没有菜单"与"还没导入"**。实测 `13286` 号店上游就是 `[]`，本地缓存后依然为 0，于是每次请求都会回源一次。
**下一层方案**：给 `restaurants` 加一列 `menuSyncedAt`，用它而不是"分类数是否为 0"做判断：

```prisma
menuSyncedAt DateTime? @map("menu_synced_at")
```

这样"已同步但没菜单"与"未同步"就能区分。**建议在阶段 5 实施时直接采用这个方案**，否则首家空菜单商店会成为永久回源热点。

---

## 阶段 6：租户衔接（依赖 8.1 决策）

若决策为"管理端手工指派"，落点是已存在的商家入驻模块。当前 `merchant-onboarding.service.ts:74` 的审批事务**只改状态 + 写日志，不创建租户也不创建店铺**：

```ts
// 现状：审批通过后什么都不产生
await tx.merchantApplication.updateMany({ where: { id, status: currentStatus }, data: { status: nextStatus } })
await tx.merchantApplicationActionLog.create({ /* ... */ })
await tx.operationLog.create({ /* ... */ })
```

审批通过时创建 `Restaurant` 行并绑定租户，是最自然的挂载点（`merchantApplication` 已有 `merchantName`/`contactPhone`/`address`/`businessCategory` 四个字段可直接映射）。但这属于**独立改动**，建议单开一份文档，不并入本次。

---

## 阶段 7：测试与验收

### 7.1 既有测试（必须改）

`apps/server/src/modules/elm/tests/controllers/elm-upstream-public.controller.spec.ts` 有 4 个用例断言 `upstream.get` 被调用：

```ts
expect(upstream.get).toHaveBeenCalledWith('/v2/index_entry')          // :25
expect(upstream.get).toHaveBeenCalledWith('/shopping/restaurants', query)  // :59
expect(upstream.get).toHaveBeenCalledWith('/shopping/restaurant/42')  // :89
expect(upstream.get).toHaveBeenCalledWith('/shopping/v2/menu', {...}) // :115
```

改为 mock `PrismaService` 并断言"返回的响应形状"而非"调用了谁"——后者是实现的镜像，前者才是契约。

这属于 `AI_TEST_POLICY.md` 中"行为变更导致既有测试失效"的必要场景，与实现同批修改。

### 7.2 保真验收（本次的核心关口）

```bash
# 对同一 id 分别取本地与上游，逐字段 diff
node -e "
const fs=require('fs');
const a=JSON.parse(fs.readFileSync('.tmp-probe/baseline/shop-3269.json','utf8'));
const b=JSON.parse(fs.readFileSync('.tmp-probe/local-shop-3269.json','utf8'));
const u=new Set([...Object.keys(a),...Object.keys(b)]);
for(const k of u) if(JSON.stringify(a[k])!==JSON.stringify(b[k])) console.log('DIFF',k);
"
```

放行清单 = **`008` §8.3 的 8 项声明偏离 + §8.2 决策产生的 `distance`**。除此之外不应有任何 `DIFF`。**必须覆盖至少 10 家店，含菜单为空的店。**

⚠️ diff 全绿不代表通过——必须核对每个放行项都能在 §8.3/§8.2 找到依据。清单外的 `DIFF` 说明装配层漏了字段（类型系统抓不到，见阶段 3.2）。

### 7.3 断上游验证

把 `ELM_API_BASE_URL` 指向无效地址后重启，验证首页列表、详情、菜单、分类四项全部正常——这是"消除外部依赖"唯一的真实验证方式。

### 7.4 迁移检查清单（对照 `docs/database/migration-checklist.md`）

| 检查项 | 结论 |
|--------|------|
| 是否锁大表 / 长时间阻塞读写 | 否，新建空表 |
| 是否需要分批回填 | 是，导入器按 200/批 |
| 是否需要先上线兼容代码再迁移 | 否，新表无外部引用 |
| 当前已部署应用能否兼容新 schema | 能，新增表不影响既有查询 |
| 是否可回滚 / 回滚是否丢数据 | 可，`DROP TABLE`，无存量数据 |
| 是否新增索引 | 是，均为新表索引 |
| 索引是否适合规模 | 4298 行，`tenant_id`/`name`/`restaurant_id` 常规 B-tree 足够 |
| 是否需要更新 seed | 是，seed 商家下线（阶段 4.6） |
| 是否需要更新契约测试或前端 fixture | 否，这 4 个接口无 OpenAPI response schema，无 api-drift |

---

## 注意事项汇总（易踩坑）

| # | 坑 | 后果 | 位置 |
|---|----|------|------|
| 1 | 抓取时不传 `latitude`/`longitude` | 上游返回 `ERROR_PARAMS`，导入 0 行 | 阶段 2.2 |
| 2 | Prisma `@map` 只改列名不改字段名 | 返回的 key 全是驼峰，前端读到 `undefined` | 阶段 3.1 |
| 3 | `Int @id` 误加 `@default(autoincrement())` | 序列与上游 id 不同步，新增商家撞 id | 阶段 1.3 |
| 4 | `category_entries` 漏写 `sortOrder` 或不排序 | 首页分类顺序随机 | 阶段 2.5 / 4.4 |
| 5 | 把已决策删除的 6 个字段"补"回来 | 冗余，且违背 `008` §2.5 的实测依据 | 阶段 3.2 |
| 5b | 删 `attrs` 时连带删掉 `attributes` | 菜品标签丢失，前端渲染异常 | 阶段 3.2 |
| 6 | 菜单懒加载用"分类数为 0"判断 | 空菜单商店永久回源 | 阶段 5 |
| 7 | 表名 `menu_categories` | 与后台权限 `menus` 表语义混淆 | `008` §8.4 |
| 8 | 删 seed 前不 grep | `order-draft.factory.ts` 直接引用 `seedRestaurants` | 阶段 4.6 |
| 9 | 直接 `{ ...row }` 当响应 | 所有下划线字段全错，且类型检查抓不到 | 阶段 3.2 |

---

## 实施记录（2026-09-30）

阶段 1–5 已完成。以下是**与本文计划不一致的地方**，以及实施期才发现的问题。

### 计划偏差

| # | 偏差 | 原因 |
|---|------|------|
| 1 | **阶段 5（菜单按需导入）并入本批** | 阶段 4 若把 `/shopping/v2/menu` 切到空表，菜单接口会返回 `[]`，比继续用上游**更差**。二者必须同一批落地。为此在 `restaurants` 上加了 `menu_synced_at` |
| 2 | 阶段 6（租户衔接）暂缓 | 按 008 §8.1 决策采用"平台自营"，该阶段本就依赖租户归属决策 |
| 3 | 装配层拆成**两个**函数 | `/shopping/*` 必须与上游逐字段一致（不能多本地键），而管理端 `RestaurantItem` 把 `createdAt` 声明为必填 → `toRestaurantResponse` / `toLocalRestaurantResponse` 分开 |
| 4 | 顺带收敛范围扩大 | 管理端 CRUD（`ElmRestaurantService`/`ElmFoodService` 的增删改）也必须一并改数据库，否则管理端读内存、用户端读库，反而多一个数据源 |

### 实施期发现（计划里没预料到）

| # | 发现 | 影响 / 处置 |
|---|------|------------|
| 1 | **`TenantResourceFilter.shopId` 是对象不是标量** | 在 SHOP 作用域下它是 `{ in: string[] }`，按标量 `Number()` 归一化会得到 `NaN` → 空数组 → **SHOP 账号一条数据都看不到（静默失效）**。被新写的租户作用域测试抓到，抽出 `toShopIdList()` 修掉 |
| 2 | **Postgres `jsonb` 会重排对象的键** | 逐字节 diff 会让 `license`/`supports`/`identification` 全部假阳性。保真比对必须用**顺序无关的深比较**（008 §9.2） |
| 3 | **上游 id 不是唯一键** | 4298 条只有 4295 个唯一 id（`4979` 出现 3 次、`20937` 出现 2 次，且同 id 的两条是**不同商家**）。upsert 收敛后丢 3 条变体；导入器显式告警（008 §2.7） |
| 4 | **上游详情与列表的值并不一致** | 初版文档写的"逐字段一致"只比对过字段名。逐值比对发现详情返回 `order_lead_time: ""`、`distance: ""`。本地化后详情读同一行 → 值级偏离（008 §2.2、§8.3） |
| 5 | **21 条经纬度写反** | `latitude` 出现 113.13 这种不可能值，地址文字可反证。导入时归一化修正，`location` 一并重算（008 §2.6） |
| 6 | **`eslint --fix` 会挪动副作用导入** | 把 `import 'reflect-metadata'` / `import 'dotenv/config'` 排到末尾，会让 `AppModule` 先求值 → 副作用来不及生效。已加 `/* eslint-disable perfectionist/sort-imports */` 并写明原因 |

### 验证结果

见 008 §9.4。摘要：**全量 4295 家逐字段比对，清单外差异 0 家**（仅 21 家命中已登记的坐标修正）；38 suites / 526 tests 全绿；**上游不可达时 8 个接口全部正常**（商家数据的上游依赖已消除；图片字节与逆地理编码不在地图内，见 008 §9.4）。

### 菜单体积的两次错估（教训）

计划里"菜单全量约上 GB、不可行 → 只能按需"这个前提**是错的**，且错了两次：

| 版本 | 估算 | 错因 |
|------|------|------|
| 初版计划 | 约上 GB | 用**单店最大值**（1.5 MB）当平均值 × 4295 |
| 实施期抽样 | 约 31 MB | 抽样 200 家里恰好含那个 1.43 MB 的离群点，样本总量被它独占 —— 抽中就 31 MB，抽不中就 <1 MB |
| **预导后实测** | **约 2 MB** | 149 家有菜单 / 308 分类 / 1934 菜品 |

代价是设计上多绕了一圈（先只做懒加载，后来才补全量预导）。教训：**稀疏 + 长尾分布不能用离群点主导的样本外推**；这次的真值只花一次预导的时间就拿到了。详见 008 §2.8。

---

## 修订记录

| 日期 | 说明 |
|------|------|
| 2026-09-30 | 初始版本。基于 `008` 的实测结论编排 7 个阶段；标注 4 项待决策与 9 个坑位 |
| 2026-09-30 | **实施后补记**：阶段 1–5 完成；新增「实施记录」记录 4 项计划偏差与 6 个实施期发现 |
| 2026-10-01 | **补记菜单全量预导**：`elm:import -- --with-menus` 已实现并执行（4293 家 / 80s / 0 失败），上游依赖彻底消除；修正"上 GB"错误估算并记录两次错估的教训 |
