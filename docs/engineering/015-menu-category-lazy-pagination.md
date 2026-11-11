# 015 — 菜单按分类懒加载与分页

> 2026-11-08；后端、web-user 和 uni-user 同步接入。旧全量菜单契约保留，新点菜页显式使用轻量模式。

## 功能清单

| 功能 | 实现位置 | 说明 |
|---|---|---|
| 轻量分类导航 | `apps/server/src/modules/elm/services/elm-food.service.ts` → `getMenuForApi` | `include_foods=false` 时查询分类与计数，不读取全部菜品 JSON |
| 分类内分页 | 同文件 → `getCategoryFoods` | 校验分类属于餐馆，按 `itemId` 升序，每次最多返回 50 条 |
| 查询参数校验 | `apps/server/src/modules/elm/dto/category-foods-query.dto.ts` | 拒绝非法餐馆 ID、负数/非整数 offset、越界 limit |
| 分类分页会话 | 两端 shop 下的 `composables/useCategoryFoods.js` | 每类独立 offset、错误与加载态；合并菜品、去重、隔离旧响应 |
| 首屏加载 | 两端 `useShopPageData.js` | 详情与分类并行请求，首分类第一页完成后再挂载连续商品流 |
| H5 按需触发 | `apps/web-user/src/views/shop/components/ShopMenu/ProductList.vue` | 观察分类页尾；可视区下方 160px 提前加载 |
| 小程序按需触发 | `apps/uni-user/src/pkg-shop/components/ShopMenu.vue` | 批量查询页尾位置；滚动时用缓存判断可见性，分页后重测锚点 |
| 分类切换与连续滚动 | 小程序 `ShopMenu.vue`、H5 `useMenuScroll.ts` | 点击未加载分类先取一页再定位；不向目标上方补载占位块，避免把目标挤下去 |
| 分类内错误重试 | 两端分类页尾 | 不清空旧菜品；按钮显式重试原 offset，不反复自动重试 |

## 1. 为什么不能只在前端隐藏菜品

原接口的 Prisma 查询包含所有分类的全部 `foods`。前端即使只展示一个分类，也已经下载了全量菜单。

现在轻量分支使用 `_count.foods`，不 `include.foods`。数据库不读取整店 `specfoods` 等大字段，也不序列化整店菜品。
分页保留完整单道菜数据，包含点餐所需的规格与 SKU；不以裁剪规格字段来换取表面上的体积下降。

本机真实数据：餐馆 1 的 73 类、1358 道菜，全量 JSON **1,317,801 字节**；分类 **9,558 字节**；首分类前 20 道菜 **21,914 字节**。
首屏菜单合计 **31,472 字节**，比全量少 **97.61%**。这是 JSON 响应体字节数，不含店铺详情、图片、HTTP 头，不代表页面耗时降低 97.61%。

## 2. API 契约

### 分类列表

```http
GET /api/shopping/v2/menu?restaurant_id=1&include_foods=false
```

返回分类数组，每项含原分类字段与 `food_count`，**不含 foods**。分页会话自行初始化 `foods: []`。

不传 `include_foods` 或传 `true` 仍返回原来的完整嵌套菜单；`/shopping/getcategory/:restaurantId` 也保留原契约。
前端 API 函数改名为 `getMenuCategories`，避免名字仍暗示它会返回完整菜单；改名前已清查调用方，只有两端点菜页。

### 分类菜品

```http
GET /api/shopping/v2/menu/9196/foods?restaurant_id=1&offset=0&limit=20
```

```json
{
  "items": [],
  "has_more": false,
  "next_offset": null
}
```

示例是空页的形状，实际有菜品时 `items` 保留原菜品响应字段。

- `restaurant_id`：必填正整数；分类不存在或不属于该店返回 404。
- `offset`：默认 0，整数且在 0～2147483647 范围内。
- `limit`：默认 20，整数且在 1～50 范围内；非法参数返回 400，不静默截断。
- 查询 `limit + 1` 条，额外一条只判断下一页是否存在，不返回给客户端。
- 有下一页时 `next_offset = offset + items.length`；末页为 `null`。
- `food_count` 不作为分页终止判据，避免计数与读取之间菜单变化导致误判。

## 3. 前端会话与触发规则

`useCategoryFoods` 不主动请求全部分类。页面初始化列表后，只主动加载第一类。

| 功能 | 实现位置 | 说明 |
|---|---|---|
| 加载第一页 | `loadCategoryFoods(categoryId)` | 未加载分类从 offset 0 开始 |
| 加载下一页 | 同函数 | 已加载且 `hasMore=true` 时使用服务端 `next_offset` |
| 分类点击 | 两端 `onCategoryClick` / `onCategorySelect` | 已加载分类只定位，不因点击重复推进页码 |
| 合并 | `useCategoryFoods` | 按 `item_id` 去重；offset 仍取服务端值，不能改成去重后的数组长度 |
| 重试 | `loadCategoryFoods(id, { retry: true })` | 失败后保留已有菜品，使用失败前的 offset |
| 换店/重载隔离 | `revision` + `resetMenu` | 清空分类和在途请求表；旧请求不能覆盖新结果或释放新请求锁 |

同一类共用一个在途 Promise，防止观察器、按钮和滚动重复请求同一页。
不同类互不阻塞。未加载占位块保留高度，让用户仍可连续滚动；分类页尾同时保留按钮作为手动加载入口。

### 数据保留与刷新时机

这是**页面实例内状态**，不是 Redis/HTTP/localStorage 菜单缓存。

- 切商品/评价 tab、返回仍存活的店铺页：复用当前菜单会话，不重复下载已经完成的页。
- 新页面实例、换店、整页重试/显式 `loadShopData()`：重取分类，从首分类重建会话。
- 分页失败：只重试该类当前页，不重新下载整个店铺。
- 页面销毁：使旧请求失效，不在已销毁页面回写数据。
- 不承诺后台编辑菜单后当前页面实时刷新；需要更新整店时调用 `loadShopData()`。

## 4. 滚动时容易改错的地方

1. **观察页尾而不是分类标题。** 标题仍可见时不代表第一页已读完；观察标题会不停加载下一页。
2. **首分类一页完成后再展示连续流。** 否则所有空分类很矮，首帧可能同时进入可视区，瞬间请求很多分类。
3. **不预取当前分类上方的占位块。** 点击远处分类后填充其上方会改变目标偏移；用户往回滚时高亮索引回退，再恢复这些类的加载。
4. **H5 的点击定位与反向高亮同用 92px。** 导航 50px + tab 42px，不能定位减 92px，判断却只加 8px；否则仍占据屏幕的前一类会抢高亮。
5. **小程序追加菜品必须重测锚点。** 图片尺寸固定只能避免图片引起的高度变化，不能避免分页追加引起的变化。
6. **保留小程序两拍 `scroll-into-view`。** 等菜品渲染后先清空，下一拍赋目标，防止连点同一类不滚。
7. **错误分类不自动循环重试。** 可视区回调可能反复触发，必须等用户主动点重试。

H5 使用 DOM `IntersectionObserver`；小程序使用 `uni.createSelectorQuery()` 与缓存，不直接照搬 DOM API。差异见 `uniapp-migration-diffs.md` §10.5。

### 4.1. 小程序点菜区的组件边界（2026-11-11）

`ShopMenu.vue` 收拢分类栏、商品流、分页页尾、滚动联动与对应样式；`shop.vue` 保留页面生命周期、店铺/购物车接入和结算。不是只把 JS 搬进另一个 composable。

| 功能 | 实现位置 | 说明 |
|---|---|---|
| 分类高亮共享 | `ShopMenu.vue` 的 `activeCategoryId` 模型 | 使用 `v-model:active-category-id` 回填页面现有状态，不创建另一份分类状态 |
| 分页任务 | 页面传入 `loadCategoryFoods` 函数 | 分类点击需要 await 首批菜品；普通通知事件拿不到父层任务的 Promise |
| 首屏与追加后测量 | `ShopMenu.vue` 的 `onMounted`、菜单/active watch | 首批菜单可能在组件挂载前已完成，必须主动测一次；切回点菜和追加分页后重测 |
| 查询归属 | `ShopMenu.vue` 的 `getCurrentInstance` 与 selector query | 查询范围跟商品节点一起迁入子组件，不再借用页面实例跨组件查找 |
| 可视区预取 | `ShopMenu.vue` 的 `onMenuScroll` | 更新模型后，当前帧直接传入新索引；不能等父层 prop 回传才解除向上预取限制 |
| 高度与 tab 隐藏 | `shop.vue` 的 `.menu-panel`、`.menu-panel__content` | 外框用 v-show 保留组件，宿主显式 height:100%；hidden 隐藏规则也留在外框 |
| 销毁隔离 | `ShopMenu.vue` 的 `onScopeDispose` | 清定时器并使旧查询、旧分类点击失效；分类加载及 nextTick 后都检查是否仍有效 |

微信构建产物已核对：页面 json 注册 `shop-menu`，分类/商品组件转由 `ShopMenu.json` 注册；页面 wxml 保留外框 hidden 与模型事件，wxss 保留宿主高度和隐藏规则。这只证明编译结果，不替代原生滚动验收。变更过程见 `docs/reports/uni-user/2026-11-11-商家点菜区组件拆分/engineering-report.md`（本地报告）。

## 5. 边界与验收

- 已同步菜单的读取得到优化；未同步店仍先等待 `ensureMenuSynced()` 的上游导入。预导菜单是解决这部分等待的独立手段。
- offset 分页假定一次点餐期间菜单相对稳定；并发删菜可能使后页前移并漏过条目，去重不能补回漏项。高频菜单编辑场景再考虑游标分页。
- 未加入虚拟列表：用户把所有分类都浏览完后，已加载节点仍会累计；本次解决的是首次全量读取/传输与初始渲染。
- 旧全量模式仍重，因此外部客户端要显式接入轻量模式才能受益。
- 新接口无需数据库迁移；复用现有餐馆、分类索引与菜品主键排序。
- 两端需配合后端发布；新前端连旧后端会因缺少分页路由显示加载失败，不会静默假装分页成功。

测试准入依据：`AI_TEST_POLICY.md` 的复杂异步状态分支。针对性测试覆盖分页边界、非法参数、分类归属、去重、失败重试、旧响应与销毁隔离。
H5 已用本机 Chrome + 本地真实后端验证首屏、续页、切 tab、失败重试和分类定位；菜单和详情非 mock。浏览器会话为隔离的本地导航占位会话，未验证登录/支付。
微信产物构建不等于原生滚动已验收，仍需微信开发者工具/真机检查：点击远类、回滚加载旧类、触底续页、切 tab、断网重试与连点同分类。

完整过程、可复现验收脚本及截图：`docs/reports/server/2026-11-08-菜单分类懒加载与分页/`（该目录是本地报告，不纳入 git）。
