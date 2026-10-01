import type { CityRecord } from '../types/elm.types'
import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../../prisma/prisma.service'
import { toCategoryEntryResponse } from '../assemblers/elm.assemblers'
import { createRestaurantCategory } from '../factories/elm.factories'
import { parseGeoHash } from '../utils/elm-query'
import { ElmStoreService } from './elm-store.service'

@Injectable()
export class ElmCityService {
  constructor(
    private readonly store: ElmStoreService,
    private readonly prisma: PrismaService,
  ) {}

  getCities(type: string) {
    if (type === 'guess') {
      return this.store.cities[0]
    }

    if (type === 'hot') {
      return this.store.cities.slice(0, 4)
    }

    return this.store.cities.reduce<Record<string, CityRecord[]>>((groups, city) => {
      const key = city.pinyin.charAt(0).toUpperCase()
      groups[key] = groups[key] || []
      groups[key].push(city)
      return groups
    }, {})
  }

  getCity(id: number) {
    const city = this.store.cities.find(item => item.id === id)
    if (!city)
      throw new NotFoundException('城市不存在')
    return city
  }

  searchPois(cityId: number, keyword: string) {
    const city = this.store.cities.find(item => item.id === cityId) || this.store.cities[0]
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

  /**
   * `/v2/index_entry`：首页分类入口，16 条。
   *
   * 原来是 8 条硬编码的本地数据，且**没有任何调用方**（控制器一直转发上游）。
   * 现在改为读 `category_entries` 表（由 elm:import 从上游导入），本地硬编码版本已删除。
   *
   * ⚠️ 必须显式 `orderBy: sortOrder`：数据库不保证 findMany 的返回顺序，
   * 而排序信息在上游是靠数组下标表达的，漏了这句首页分类会随机排列。
   */
  async listCategoryEntries() {
    const rows = await this.prisma.categoryEntry.findMany({
      orderBy: { sortOrder: 'asc' },
    })
    return rows.map(toCategoryEntryResponse)
  }

  getRestaurantCategories() {
    return [
      createRestaurantCategory(248, '鲜花蛋糕', ['全部鲜花蛋糕', '鲜花', '蛋糕', '面包']),
      createRestaurantCategory(1, '快餐便当', ['全部快餐便当', '简餐', '汉堡', '炸鸡']),
      createRestaurantCategory(2, '轻食简餐', ['全部轻食简餐', '沙拉', '健身餐', '果汁']),
      createRestaurantCategory(3, '夜宵', ['全部夜宵', '烧烤', '炸串', '小龙虾']),
    ]
  }

  getDeliveryModes() {
    return [
      {
        color: '57A9FF',
        id: 1,
        is_solid: true,
        text: '蜂鸟专送',
        __v: 0,
      },
    ]
  }

  getActivityAttributes() {
    return [
      {
        description: '可使用在线支付',
        icon_color: 'FF4E00',
        icon_name: '付',
        id: 3,
        name: '在线支付',
        ranking_weight: 2,
        __v: 0,
      },
      {
        description: '该商家支持开发票',
        icon_color: '999999',
        icon_name: '票',
        id: 4,
        name: '开发票',
        ranking_weight: 3,
        __v: 0,
      },
      {
        description: '新店开业优惠',
        icon_color: '70BC46',
        icon_name: '新',
        id: 5,
        name: '新店',
        ranking_weight: 4,
        __v: 0,
      },
    ]
  }
}
