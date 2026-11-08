import type { CityRecord } from '../types/city.types'

/** 城市仍是内存数据（尚未建表），见 016 §3.1。 */
function createCity(
  id: number,
  name: string,
  abbr: string,
  areaCode: string,
  latitude: number,
  longitude: number,
  pinyin: string,
  sort: number,
): CityRecord {
  return {
    id,
    name,
    abbr,
    area_code: areaCode,
    sort,
    latitude,
    longitude,
    geohash: `${latitude},${longitude}`,
    is_map: true,
    pinyin,
  }
}

export const seedCities: CityRecord[] = [
  createCity(1, '上海', 'SH', '021', 31.23037, 121.473701, 'shanghai', 1),
  createCity(2, '北京', 'BJ', '010', 39.9042, 116.407396, 'beijing', 2),
  createCity(3, '杭州', 'HZ', '0571', 30.27415, 120.15515, 'hangzhou', 3),
  createCity(4, '深圳', 'SZ', '0755', 22.543099, 114.057868, 'shenzhen', 4),
  createCity(5, '广州', 'GZ', '020', 23.12911, 113.264385, 'guangzhou', 5),
  createCity(6, '南京', 'NJ', '025', 32.060255, 118.796877, 'nanjing', 6),
]
