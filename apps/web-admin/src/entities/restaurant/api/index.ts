/**
 * @file 餐厅 API
 * @domain entities/restaurant
 * @description 封装商家餐厅列表、创建、更新和删除的后端请求边界。
 */

import type { RestaurantItem, RestaurantPayload } from '../model'
import { adminEndpoints } from '@/shared/api/endpoints'
import request from '@/shared/api/request'

/**
 * @description 获取商家餐厅列表。
 * @returns 餐厅列表。
 */
export function getCommerceRestaurants() {
  return request.get<RestaurantItem[]>(adminEndpoints.commerce.restaurants)
}

/**
 * @description 有远端副作用：创建商家餐厅。
 * @param data 餐厅参数。
 * @returns 创建后的餐厅信息。
 */
export function createCommerceRestaurant(data: RestaurantPayload) {
  return request.post<RestaurantItem>(adminEndpoints.commerce.restaurants, data)
}

/**
 * @description 有远端副作用：更新商家餐厅。
 * @param id 餐厅 ID。
 * @param data 餐厅参数。
 * @returns 更新后的餐厅信息。
 */
export function updateCommerceRestaurant(id: number, data: RestaurantPayload) {
  return request.patch<RestaurantItem>(adminEndpoints.commerce.restaurantDetail(id), data)
}

/**
 * @description 有远端副作用：删除商家餐厅。
 * @param id 餐厅 ID。
 */
export function deleteCommerceRestaurant(id: number) {
  return request.delete<void>(adminEndpoints.commerce.restaurantDetail(id))
}
