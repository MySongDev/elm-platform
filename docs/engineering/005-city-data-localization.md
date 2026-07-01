# 城市数据本地化计划

> **范围：** `apps/web-user` 前端城市数据模块
> **目标：** 将饿了么 CDN 的 2252 条城市数据本地化，前端直接使用，消除外部依赖
> **数据量：** 2252 条城市记录，约 242 KB JSON
> **本次目标：** 编写计划文档和实施文档，不改动代码

---

## 1. 背景与现状

### 1.1 当前城市数据流向

```
用户打开城市选择页
       |
       ▼
前端调用 getGroupCity()
       |
       ▼
GET /v1/cities?type=group  -->  后端 elm-city.service.ts
       |                           |
       |                           --> memory store (seedCities胚)
       |                                |
       |                                --> seedCities (6 个硬编码城市)
       |
       ▼
  返回给用户
```

### 1.2 数据来源对比

| 来源 | 类型 | 记录数 | 字段 | 可读性 |
|------|------|--------|------|--------|
| 现有 `seedCities` | 内存常量 | 6 条 | id, name, abbr, area_code, sort, latitude, longitude, geohash, is_map, pinyin | 直接可见 |
| eleme CDN | 外部 JSON | 2252 条 | i(id), n(name), p(pinyin), x(lat), y(lng) | 需二次解释 |

### 1.3 关键发现

- **eleme CDN 数据不含：** abbr（简称）、area_code（区号）、sort（排序号）、geohash（地理哈希）、is_map
- **现有 6 个城市**在 eleme CDN 中都能找到（上海、北京、杭州、深圳、广州、南京）
- **数据融合方案：** 以 CDN 的 2252 个城市为主，补充缺失字段，保留现有 6 个城市的 `abbr` 和 `area_code`

---

## 2. 目标

### 2.1 功能目标

1. 替换现有 `seedCities`（6 条）为 `chinaCities`（2252 条）
2. 城市选择页支持按拼音首字母分组（A~Z）
3. 热门城市筛选功能正常
4. 定位城市功能正常

### 2.2 非功能目标

| 指标 | 目标值 |
|------|--------|
| 首屏加载时间 | 增加 < 50ms（代码文件被 Vite 预构建缓存） |
| 内存占用 | 增加 < 300KB（原始数据 + 转换后对象） |
| 可靠性 | 完全消除对外部 CDN 的依赖 |
| 构建产物 | gzip 后 < 50KB |

---

## 3. 数据转换设计

### 3.1 源数据字段映射

eleme CDN          -->  CityRecord (目标字段)
──────────────────────────────────────────
i (number)         -->  id
n (string)         -->  name
p (string)         -->  pinyin
x (number)         -->  latitude
y (number)         -->  longitude
(缺失)             -->  abbr    (从 name 截取前 2 字)
(缺失)             -->  area_code  (空字符串)
(缺失)             -->  sort    (按拼音首字母分配 A=1, B=2)
(缺失)             -->  geohash (从 lat/lng 计算)
(缺失)             -->  is_map  (true)

### 3.2 目标数据格式

```typescript
// apps/web-user/src/data/china-cities.ts
export interface CityRecord {
  id: number        // 城市ID
  name: string      // 城市名
  abbr: string     // 简称（如"上海"）
  area_code: string // 区号（如"021"）
  sort: number      // 排序号（A=1, B=2, Z=26）
  latitude: number  // 纬度
  longitude: number // 经度
  geohash: string   // 地理哈希
  is_map: boolean  // 是否显示地图（true）
  pinyin: string    // 全拼
}

export const chinaCities: CityRecord[] = [ /* 2252 条数据 */ ]
```

### 3.3 geohash 计算

```typescript
function encodeGeoHash(lat: number, lng: number): string {
  // 使用 simple-geohash 或内联简单实现
  return `${lat.toFixed(5)},${lng.toFixed(5)}`
}
```

---

## 4. 生成方案

### 方案：脚本自动生成 + 人工审核

```
1. 下载 JSON 文件
   curl -s "https://cube.elemecdn.com/0ab56e557c67533275767af1fda3629e.json"
   |
   ▼
2. 运行转换脚本 (scripts/generate-city-data.ts)
   - 解析源 JSON
   - 字段映射（i->id, n->name, x->lat, y->lng）
   - 补充缺失字段（abbr, area_code, sort, geohash）
   - 保留现有 6 个城市的 abbr 和 area_code
   |
   ▼
3. 输出 TypeScript 文件
   apps/web-user/src/data/china-cities.ts
   |
   ▼
4. 人工审核
   - 抽查几组数据
   - 确认拼音首字母分组正确
```

---

## 5. 影响范围

### 5.1 前端影响

| 文件 | 影响 | 修改内容 |
|------|------|----------|
| `apps/web-user/src/data/china-cities.ts` | 新增 | 2252 条城市数据 |
| `apps/web-user/src/views/city/city.vue` | 引用更新 | import 从 seedCities 改为 chinaCities |
| `apps/web-user/src/stores/modules/store-locations.js` | 可能引用 | 检查是否引用城市数据 |
| `apps/web-user/src/services/api/api-city.js` | 无影响 | 接口调用不变，后端数据来自内存 |

### 5.2 后端影响

| 文件 | 影响 | 说明 |
|------|------|------|
| `apps/server/src/modules/elm/services/elm-city.service.ts` | **无** | 后端内存店服务不受影响，前端发起请求时后端返回自身数据 |
| `apps/server/src/modules/elm/data/elm.seed.ts` | **无** | seedCities 不被前端使用 |

### 5.3 关键说明

```
前端的 getGroupCity() 调用的是后端 API：

GET /api/elm/v1/cities?type=group
  --> 后端 elm-city.service.ts
    --> 后端 ElmStoreService (内存数据)
      --> seedCities (6 条)

但前端页面（如 city.vue）可以直接使用本地常量：

import { chinaCities } from '@/data/china-cities'
// 不需要请求后端，前端直接分组展示
```

**建议：前端选择的城市数据直接来自本地文件，后端照样只提供 API 层数据。**

---

## 6. 验收标准

### 6.1 数据验收

```bash
# 文件大小 (< 250KB)
wc -c apps/web-user/src/data/china-cities.ts
# 期望：约 250,000 字节

# 记录数 (2252)
grep -c "id:" apps/web-user/src/data/china-cities.ts
# 期望：2252

# 唯一性检查
node -e "const d = require('./apps/web-user/src/data/china-cities').chinaCities; console.log('duplicate ids:', d.length - new Set(d.map(c=>c.id)).size)"
# 期望：0
```

### 6.2 功能验收

- [ ] 城市选择页 A~Z 字母索引导航正常
- [ ] 热门城市列表展示正常（前 N 个排序靠前的城市）
- [ ] GPS 定位城市匹配正确（按经纬度找最近城市）
- [ ] 搜索城市功能正常（按拼音或名称搜索）

---

## 7. 附录

### 7.1 关键文件索引

| 文件 | 作用 |
|------|------|
| `apps/web-user/src/views/city/city.vue` | 城市选择页 |
| `apps/web-user/src/services/api/api-city.js` | 城市 API 调用 |
| `apps/web-user/src/stores/modules/store-locations.js` | 位置状态管理 |
| `apps/web-user/src/router/modules/city.ts` | 城市路由 |
| `apps/server/src/modules/elm/services/elm-city.service.ts` | 后端城市服务 |

### 7.2 相关命令

```bash
# 生成城市数据
npx tsx scripts/generate-city-data.ts

# 构建 web-user
pnpm --filter @elm-platform/web-user run build

# 测试 city 路由
curl http://localhost:3000/api/elm/v1/cities?type=group
```

---

## 修订记录

| 日期 | 修订人 | 说明 |
|------|--------|------|
| 2026-07-01 | — gchar *  | 初始版本，基于 eleme CDN 的 2252 条城市数据 |

---

> 如需进入实施阶段，请确认。
