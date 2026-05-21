import { get } from '../http/http'

import { foodEndpoints } from './endpoints/food.endpoints'

/** 获取 food 页面的 category 种类列表 */
export function getFoodCategory(latitude, longitude) {
  return get(foodEndpoints.category, { latitude, longitude })
}

/** 获取 food 页面的配送方式 */
export function getFoodDelivery(latitude, longitude) {
  return get(foodEndpoints.deliveryModes, { latitude, longitude, kw: '' })
}

/** 获取 food 页面的商家属性活动列表 */
export function getFoodActivity(latitude, longitude) {
  return get(foodEndpoints.activityAttributes, { latitude, longitude, kw: '' })
}
