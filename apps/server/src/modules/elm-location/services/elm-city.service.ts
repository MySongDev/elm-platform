import type { CityRecord } from '../types/city.types'
import { Injectable, NotFoundException } from '@nestjs/common'
import { parseGeoHash } from '../../../common/utils/query-values'
import { seedCities } from '../data/city.seed'

@Injectable()
export class ElmCityService {
  private readonly cities: CityRecord[] = [...seedCities]

  getCities(type: string) {
    if (type === 'guess') {
      return this.cities[0]
    }

    if (type === 'hot') {
      return this.cities.slice(0, 4)
    }

    return this.cities.reduce<Record<string, CityRecord[]>>((groups, city) => {
      const key = city.pinyin.charAt(0).toUpperCase()
      groups[key] = groups[key] || []
      groups[key].push(city)
      return groups
    }, {})
  }

  getCity(id: number) {
    const city = this.cities.find(item => item.id === id)
    if (!city)
      throw new NotFoundException('城市不存在')
    return city
  }

  searchPois(cityId: number, keyword: string) {
    const city = this.cities.find(item => item.id === cityId) || this.cities[0]
    const safeKeyword = keyword || city.name

    return Array.from({ length: 6 }, (_, index) => {
      const latitude = Number((city.latitude + index * 0.006).toFixed(5))
      const longitude = Number((city.longitude + index * 0.006).toFixed(5))
      return {
        name: `${safeKeyword}${index === 0 ? '' : index + 1}号店`,
        address: `${city.name}市中心商圈 ${index + 1} 号`,
        latitude,
        longitude,
        geohash: `${latitude},${longitude}`,
      }
    })
  }

  async getPoi(geohash?: string, latitude?: number, longitude?: number) {
    const [lat, lng] = parseGeoHash(geohash, latitude, longitude)

    try {
      const url = `https://h5.ele.me/restapi/bgs/poi/reverse_geo_coding?latitude=${lat}&longitude=${lng}`
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0',
          'Referer': 'https://h5.ele.me/',
        },
      })

      if (!response.ok) {
        throw new Error(`elm API responded with status: ${response.status}`)
      }

      const data = await response.json()
      return data
    }
    catch {
      // 降级到模拟数据
      return {
        address: '上海市黄浦区西藏中路',
        city: '上海市',
        geohash: `${lat},${lng}`,
        latitude: String(lat),
        longitude: String(lng),
        name: '黄浦区上海人民广场',
      }
    }
  }
}
