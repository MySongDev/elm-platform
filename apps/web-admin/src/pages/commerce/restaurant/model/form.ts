/**
 * @file 餐厅编辑草稿与载荷转换
 * @domain pages/commerce/restaurant
 * @description 创建独立餐厅草稿，明确创建和更新接口的可编辑字段。
 */

import type { RestaurantItem, RestaurantPayload } from './types'

export interface RestaurantFormState {
  name: string
  address: string
  phone: string
  category: string
  image_path: string
  rating: number
  recent_order_num: number
  float_minimum_order_amount: number
  float_delivery_fee: number
  distance: string
  order_lead_time: string
  description: string
}

/** 只复制可编辑字段，取消编辑不能改动列表行，也不能把 createdAt 带回接口。 */
export function createRestaurantForm(restaurant: RestaurantItem | null = null): RestaurantFormState {
  return {
    name: restaurant?.name ?? '',
    address: restaurant?.address ?? '',
    phone: restaurant?.phone ?? '',
    category: restaurant?.category ?? '',
    image_path: restaurant?.image_path ?? '',
    rating: restaurant?.rating ?? 0,
    recent_order_num: restaurant?.recent_order_num ?? 0,
    float_minimum_order_amount: restaurant?.float_minimum_order_amount ?? 20,
    float_delivery_fee: restaurant?.float_delivery_fee ?? 5,
    distance: restaurant?.distance ?? '',
    order_lead_time: restaurant?.order_lead_time ?? '',
    description: restaurant?.description ?? '',
  }
}

/** 保留原载荷中的 id；身份来自选中的餐厅，不能让草稿决定更新哪一行。 */
export function toRestaurantPayload(form: RestaurantFormState, restaurant: RestaurantItem | null): RestaurantPayload {
  return {
    id: restaurant?.id ?? 0,
    name: form.name,
    address: form.address,
    phone: form.phone,
    category: form.category,
    image_path: form.image_path,
    rating: form.rating,
    recent_order_num: form.recent_order_num,
    float_minimum_order_amount: form.float_minimum_order_amount,
    float_delivery_fee: form.float_delivery_fee,
    distance: form.distance,
    order_lead_time: form.order_lead_time,
    description: form.description,
  }
}
