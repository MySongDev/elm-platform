/**
 * @file 订单 API
 * @domain entities/order
 * @description 封装商家订单列表和订单更新的后端请求边界。
 */

import type { OrderItem } from '../model'
import { adminEndpoints } from '@/shared/api/endpoints'
import request from '@/shared/api/request'

/**
 * @description 获取商家订单列表。
 * @returns 订单列表。
 */
export function getCommerceOrders() {
  return request.get<OrderItem[]>(adminEndpoints.commerce.orders)
}

/**
 * @description 有远端副作用：更新商家订单。
 * @param id 订单 ID。
 * @param data 订单更新参数。
 * @returns 更新后的订单信息。
 */
export function updateCommerceOrder(id: number, data: Partial<OrderItem>) {
  return request.patch<OrderItem>(adminEndpoints.commerce.orderDetail(id), data)
}
