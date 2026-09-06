# 城市数据本地化实施计划书

> **范围：** `apps/web-user` 前端城市数据模块
> **目标：** 将饿了么 CDN 的 2252 条城市数据生成为前端本地 TypeScript 文件
> **数据量：** 2252 条城市记录，约 242 KB JSON
> **预计用时：** 30 分钟

---

## 1. 阶段一：生成数据文件（5 分钟）

### 1.1 编写转换脚本

**文件：** `scripts/generate-city-data.ts`

**脚本功能：**
1. 下载 eleme CDN 的 JSON 数据
2. 解析 2252 条城市记录
3. 字段映射（i->id, n->name, p->pinyin, x->latitude, y->longitude）
4. 补充缺失字段（abbr, area_code, sort, geohash, is_map）
5. 输出为 TypeScript 文件 `apps/web-user/src/data/china-cities.ts`

### 1.2 关键转换规则

```typescript
// 源数据结构
interface ElemeCity {
  i: number   // 城市ID
  n: string   // 城市名
  p: string   // 拼音
  x: number   // 纬度
  y: number   // 经度
}

// 目标数据结构
interface CityRecord {
  id: number        // i
  name: string      // n玄
  abbr: string     // name 前两字
  area_code: string // 空字符串
  sort: number      // 拼音首字母 A=1, B=2...
  latitude: number // x
  longitude: number// y
  geohash: string   // `${lat},${lng}`
  is_map: boolean  // true
  pinyin: string    // p
}
```

### 1.3 不保留现有 6 个城市的信息

| 城市名 | abbr | area_code | 来源 |
|--------|------|-----------|------|
| 上海 | SH | 021 | 现有 seedCities |
| 北京 | BJ | 010 | 现有 seedCities |
| 杭州 | HZ | 0571 | 现有 seedCities |
| 深圳 | SZ | 0755 | 现有 seedCities |
| 广州 | GZ | 020 | 现有 seedCities |
| 南京 | NJ | 025 | 现有 seedCities |

---

## 2. 阶段二：生成并验证数据（10 分钟）

### 2.1 运行脚本

```bash
npx tsx scripts/generate-city-data.ts
```

### 2.2 验证输出

```bash
# 检查文件生成
ls -lh apps/web-user/src/data/china-cities.ts

# 检查记录数
grep -c "id:" apps/web-user/src/data/china-cities.ts
# 期望：2252

# 检查文件大小
wc -c apps/web-user/src/data/china-cities.ts
# 期望：约 250,000 字节
```

### 2.3 数据完整性检查

```bash
# 无重复 ID
node -e "const d=require('./apps/web-user/src/data/china-cities').chinaCities; console.log('unique ids:', new Set(d.map(c=>c.id)).size)"
# 期望：2252

# 无缺失字段
node -e "const d=require('./apps/web-user/src/data/china-cities').chinaCities; console.log('missing fields:', d.filter(c=>!c.name||!c.pinyin).length)"
# 期望：0
```

---

## 3. 阶段三：前端接入（10 分钟）

### 3.1 创建数据文件

文件：`apps/web-user/src/data/china-cities.ts`

接口和常量已在前一阶段生成，只需确保导出正确：

```typescript
export interface CityRecord {
  id: number
  name: string
  abbr: string
  area_code: string
  sort: number
  latitude: number
  longitude: number
  geohash: string
  is_map: boolean
  pinyin: string
}

export const chinaCities: CityRecord[] = [ /* 2252 条 */ ]

// 按拼音首字母分组
export const citiesByLetter: Record<string, CityRecord[]> = /* 分组结果 */

// 热门城市（排序靠前的）
export const hotCities: CityRecord[] = /* 前 10 个 */
```

### 3.2 修改城市选择页

文件：`apps/web-user/src/views/city/city.vue`

修改内容：
- 从 `elm` API 获取改为直接导入 `chinaCities`
- 使用本地 `citiesByLetter` 分组展示
- 保持原有 UI 不变

```typescript
// 原有方式（请求后端）
// import { getGroupCity } from '@/services/api'
// getGroupCity()

// 新方式（直接使用本地数据）
import { chinaCities, citiesByLetter } from '@/data/china-cities'
```

### 3.3 修改影响文件

| 文件 | 修改内容 |
|------|----------|
| `city.vue` | import 来源从 API 改为 `china-cities.ts` |
| `store-locations.js` | 如有引用，调整为本地数据 |

---

## 4. 阶段四：测试验证（5 分钟）

### 4.1 本地开发测试

```bash
# 启动 web-user 开发服务器
pnpm dev:user
```

打开 `http://localhost:5173`，测试：
- [ ] 城市选择页打开正常
- [ ] A~Z 字母索引导航正常
- [ ] 热门城市列表展示正常
- [ ] GPS 定位后能正确匹配城市

### 4.2 构建测试

```bash
# 构建确认
pnpm --filter @elm-platform/web-user run build

# 构建产物检查
grep -c "chinaCities" dist/assets/*.js
# 期望：能找到引用
```

---

## 5. 阶段五：提交（5 分钟）

### 5.1 Git 提交

```bash
git add apps/web-user/src/data/ apps/web-user/src/views/city/ scripts/generate-city-data.ts
git commit -m "feat(web-user): localize city data from eleme CDN (2252 cities)"
```

### 5.2 最终确认

```bash
git log --oneline -1
git status
```

---

## 6. 回滚方案

如出现问题，回滚步骤：

```bash
# 1. 恢复 city.vue 的 API 调用方式
git checkout -- apps/web-user/src/views/city/city.vue

# 2. 删除本地数据文件
rm apps/web-user/src/data/china-cities.ts

# 3. 重新启动开发服务器
pnpm dev:user
```

---

## 7. 关键检查点

| 检查点 | 通过标准 |
|--------|----------|
| 数据文件大小 | < 300KB |
| 城市记录数 | 2252 条 |
| 无重复 ID | new Set(cities.map(c => c.id)).size === 2252 |
| 无缺失字段 | 每条记录都有 name, pinyin, latitude, longitude |
| A~Z 分组 | 每个字母组至少有一个城市（Q, X, Z 等） |
| 构建通过 | pnpm build 无错误 |
| 页面正常 | city.vue 能正常展示城市列表 |

---

## 8. 时间线

| 阶段 | 预估时间 | 累计时间 |
|------|----------|----------|
| 阶段一：编写脚本 | 5 分钟 | 5 分钟 |
| 阶段二：生成数据 | 5 分钟 | 10 分钟 |
| 阶段三：前端接入 | 10  | 20 分钟 |
| 阶段四：测试验证 | 5 分钟 | 25 分钟 |
| 阶段五：提交 | 5 分钟 | 30 分钟 |

---

## 9. 风险与缓解

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| CDN 数据格式变更 | 中 | 高 | 脚本有异常处理，失败时报错 |
| 文件过大影响构建 | 低 | 低 | gzip 后约 50KB，无影响 |
| 拼音首字母分组异常 | 低 | 中 | 脚本中检查每个字母组非空 |
| 页面加载变慢 | 低 | 中 | Vite 预构建缓存，实际无感知 |

---

## 修订记录

| 日期 | 修订人 | 说明 |
|------|--------|------|
| 2026-07-01 | — | 初始版本，计划在 30 分钟内完成 |

---

> 确定开始实施？请先确认采用此方案后，我将按阶段执行。
