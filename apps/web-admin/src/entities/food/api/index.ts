/**
 * @file 食品 API
 * @domain entities/food
 * @description 封装商家食品列表、创建、更新和删除的后端请求边界。
 */

import type { FoodItem, FoodPayload } from '../model'
import { adminEndpoints } from '@/shared/api/endpoints'
import request from '@/shared/api/request'

/**
 * @description 获取商家食品列表。
 * @returns 食品列表。
 */
export function getCommerceFoods() {
  return request.get<FoodItem[]>(adminEndpoints.commerce.foods)
}

/**
 * @description 有远端副作用：创建商家食品。
 * @param data 食品参数。
 * @returns 创建后的食品信息。
 */
export function createCommerceFood(data: FoodPayload) {
  return request.post<FoodItem>(adminEndpoints.commerce.foods, data)
}

/**
 * @description 有远端副作用：更新商家食品。
 * @param id 食品 ID。
 * @param data 食品参数。
 * @returns 更新后的食品信息。
 */
export function updateCommerceFood(id: number, data: FoodPayload) {
  return request.patch<FoodItem>(adminEndpoints.commerce.foodDetail(id), data)
}

/**
 * @description 有远端副作用：删除商家食品。
 * @param id 食品 ID。
 */
export function deleteCommerceFood(id: number) {
  return request.delete<void>(adminEndpoints.commerce.foodDetail(id))
}
