/**
 * 城市数据生成脚本
 * 将 eleme CDN 的城市 JSON 转换为本地 TypeScript 文件
 * 用法：npx tsx scripts/generate-city-data.ts
 */

/** 原始数据字段 */
interface ElemeCity {
  i: number // 城市ID
  n: string // 城市名
  p: string // 拼音
  x: number // 纬度
  y: number // 经度
}

/** 生成的数据字段 */
interface CityRecord {
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

// 现有6个城市的特殊信息
const SPECIAL_CITY_INFO: Record<string, {
  abbr: string
  area_code: string
}> = {
  上海: {
    abbr: 'SH',
    area_code: '021',
  },
  北京: {
    abbr: 'BJ',
    area_code: '010',
  },
  杭州: {
    abbr: 'HZ',
    area_code: '0571',
  },
  深圳: {
    abbr: 'SZ',
    area_code: '0755',
  },
  广州: {
    abbr: 'GZ',
    area_code: '020',
  },
  南京: {
    abbr: 'NJ',
    area_code: '025',
  },
}

// 拼音首字母到排序号的映射
function getSortFromPinyin(pinyin: string): number {
  const firstLetter = pinyin.charAt(0).toUpperCase()
  return firstLetter.charCodeAt(0) - 'A'.charCodeAt(0) + 1
}

// geohash 简化计算
function encodeGeoHash(lat: number, lng: number): string {
  return `${lat.toFixed(5)},${lng.toFixed(5)}`
}

// abbr 生成：取前两字，直辖市或新疆等特殊处理
function generateAbbr(name: string): string {
  if (name.length <= 2)
    return name
  // 对于"自治州"等较长的，取前两个字
  return name.slice(0, 2)
}

// 生成 TypeScript 文件内容
function generateTsFile(cities: CityRecord[]): string {
  const lines: string[] = []

  lines.push(`export interface CityRecord {`)
  lines.push(`  id: number`)
  lines.push(`  name: string`)
  lines.push(`  abbr: string`)
  lines.push(`  area_code: string`)
  lines.push(`  sort: number`)
  lines.push(`  latitude: number`)
  lines.push(`  longitude: number`)
  lines.push(`  geohash: string`)
  lines.push(`  is_map: boolean`)
  lines.push(`  pinyin: string`)
  lines.push(`}`)
  lines.push(``)
  lines.push(`export const chinaCities: CityRecord[] = [`)

  for (const city of cities) {
    lines.push(`  {`)
    lines.push(`    id: ${city.id},`)
    lines.push(`    name: '${city.name}',`)
    lines.push(`    abbr: '${city.abbr}',`)
    lines.push(`    area_code: '${city.area_code}',`)
    lines.push(`    sort: ${city.sort},`)
    lines.push(`    latitude: ${city.latitude},`)
    lines.push(`    longitude: ${city.longitude},`)
    lines.push(`    geohash: '${city.geohash}',`)
    lines.push(`    is_map: ${city.is_map},`)
    lines.push(`    pinyin: '${city.pinyin}',`)
    lines.push(`  },`)
  }

  lines.push(`]`)
  lines.push(``)
  lines.push(`// 按拼音首字母分组的城市映射`)
  lines.push(`export const citiesByLetter: Record<string, CityRecord[]> = {}`)
  lines.push(`for (const city of chinaCities) {`)
  lines.push(`  const letter = city.pinyin.charAt(0).toUpperCase()`)
  lines.push(`  if (!citiesByLetter[letter]) citiesByLetter[letter] = []`)
  lines.push(`  citiesByLetter[letter].push(city)`)
  lines.push(`}`)
  lines.push(``)
  lines.push(`// 热门城市（返回排序号靠前的 10 个）`)
  lines.push(`export const hotCities: CityRecord[] = chinaCities.slice(0, 10)`)

  return lines.join('\n')
}

async function main() {
  console.log('开始下载城市数据...')
  const response = await fetch('https://cube.elemecdn.com/0ab56e557c67533275767af1fda3629e.json')
  if (!response.ok)
    throw new Error(`下载失败: ${response.status} ${response.statusText}`)

  const rawData: ElemeCity[] = await response.json()
  console.log(`下载完成，共 ${rawData.length} 条城市数据`)

  const cities: CityRecord[] = rawData.map((item) => {
    const special = SPECIAL_CITY_INFO[item.n]
    return {
      id: item.i,
      name: item.n,
      abbr: special?.abbr || generateAbbr(item.n),
      area_code: special?.area_code || '',
      sort: getSortFromPinyin(item.p),
      latitude: item.x,
      longitude: item.y,
      geohash: encodeGeoHash(item.x, item.y),
      is_map: true,
      pinyin: item.p,
    }
  })

  // 去重检查
  const ids = cities.map(c => c.id)
  const uniqueIds = new Set(ids)
  if (uniqueIds.size !== cities.length)
    throw new Error(`发现重复ID: ${cities.length - uniqueIds.size} 个`)

  // 缺失字段检查
  const missing = cities.filter(c => !c.name || !c.pinyin || !c.latitude || !c.longitude)
  if (missing.length > 0)
    throw new Error(`发现 ${missing.length} 条记录缺失字段`)

  console.log(`数据验证通过: ${cities.length} 条城市记录`)

  const outputPath = 'apps/web-user/src/data/china-cities.ts'
  // eslint-disable-next-line ts/no-require-imports
  const fs = require('node:fs')
  // eslint-disable-next-line ts/no-require-imports
  const path = require('node:path')

  const dir = path.dirname(outputPath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  const tsContent = generateTsFile(cities)
  fs.writeFileSync(outputPath, tsContent, 'utf-8')

  console.log(`文件已生成: ${outputPath}`)
  console.log(`文件大小: ${(fs.statSync(outputPath).size / 1024).toFixed(1)} KB`)
  console.log(`记录数: ${cities.length}`)
}

main().catch((err) => {
  console.error('生成失败:', err)
  process.exit(1)
})
