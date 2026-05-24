import type { RestaurantListQuery, RestaurantRecord } from '../types/elm.types'
import type { ElmStoreService } from './elm-store.service'
import { Injectable, NotFoundException } from '@nestjs/common'
import { createRestaurant } from '../factories/elm.factories'
import { nextNumberId, toNumberValue, toStringValue } from '../utils/elm-query'

@Injectable()
export class ElmRestaurantService {
  constructor(private readonly store: ElmStoreService) {}

  listRestaurants(query: RestaurantListQuery = {}) {
    const offset = toNumberValue(query.offset, 0)
    const limit = toNumberValue(query.limit, 20)
    const keyword = toStringValue(query.keyword).trim()
    const categoryId = toNumberValue(
      query.restaurant_category_id ?? query.restaurant_category_ids,
      0,
    )

    let list = [...this.store.restaurants]
    if (keyword) {
      list = list.filter(item => item.name.includes(keyword) || item.category.includes(keyword))
    }
    if (categoryId) {
      list = list.filter(item => item.category.includes(categoryId === 248 ? '鲜花' : ''))
    }

    return list.slice(offset, offset + limit)
  }

  searchRestaurants(keyword: string) {
    return this.listRestaurants({ keyword, offset: 0, limit: 20 })
  }

  countRestaurants() {
    return this.store.restaurants.length
  }

  getRestaurant(id: number) {
    const restaurant = this.store.restaurants.find(item => item.id === id)
    if (!restaurant)
      throw new NotFoundException('餐馆不存在')
    return restaurant
  }

  createRestaurant(data: Partial<RestaurantRecord>) {
    const id = nextNumberId(this.store.restaurants.map(item => item.id))
    const restaurant = createRestaurant({
      id,
      name: toStringValue(data.name, '新餐馆'),
      address: toStringValue(data.address, '上海市黄浦区'),
      latitude: toNumberValue(data.latitude, 31.22967),
      longitude: toNumberValue(data.longitude, 121.4762),
      phone: toStringValue(data.phone, '021-00000000'),
      category: toStringValue(data.category, '快餐便当/简餐'),
      image_path: toStringValue(data.image_path, 'shop/15c1513a00615.jpg'),
      rating: toNumberValue(data.rating, 4.5),
      recent_order_num: toNumberValue(data.recent_order_num, 0),
      distance: toStringValue(data.distance, '1.0公里'),
      order_lead_time: toStringValue(data.order_lead_time, '30分钟'),
      description: toStringValue(data.description, ''),
    })

    this.store.restaurants.unshift(restaurant)
    return restaurant
  }

  updateRestaurant(id: number, data: Partial<RestaurantRecord>) {
    const index = this.store.restaurants.findIndex(item => item.id === id)
    if (index < 0)
      throw new NotFoundException('餐馆不存在')

    const current = this.store.restaurants[index]
    const longitude = toNumberValue(data.longitude, current.longitude)
    const latitude = toNumberValue(data.latitude, current.latitude)
    const deliveryFee = toNumberValue(data.float_delivery_fee, current.float_delivery_fee)

    this.store.restaurants[index] = {
      ...current,
      ...data,
      id,
      longitude,
      latitude,
      location: [longitude, latitude],
      piecewise_agent_fee: {
        tips: `配送费约¥${deliveryFee}`,
      },
    }
    return this.store.restaurants[index]
  }

  deleteRestaurant(id: number) {
    const restaurantIndex = this.store.restaurants.findIndex(item => item.id === id)
    if (restaurantIndex >= 0) {
      this.store.restaurants.splice(restaurantIndex, 1)
    }

    return {
      status: 1,
      success: '删除餐馆成功',
    }
  }
}
