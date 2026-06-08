import { get } from '../http/http'

import { shopEndpoints } from './endpoints/shop.endpoints'

/** 获取商铺详情 */
export const getShopDetails = shopid => get(shopEndpoints.detail(shopid), {})

/** 获取菜单列表 */
export function getFoodMenu(restaurant_id) {
  return get(shopEndpoints.menu, { restaurant_id })
}

/** 获取评价分类列表 */
export const getShopReviewFilters = restaurant_id => get(shopEndpoints.ratingTags(restaurant_id), {}, { loading: false })

/** 获取评价信息 */
export function getShopRatings(restaurant_id, offset, limit) {
  return get(shopEndpoints.ratings(restaurant_id), {
    offset,
    limit,
  }, { loading: false })
}
