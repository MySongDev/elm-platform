// ⚠️ 与 apps/web-user/src/services/api/api-shop.js 同源（逐行一致），
// 修改需同步两处。不抽共享包的原因见迁移方案议题 7。

import { get } from '../http/http'

import { shopEndpoints } from './endpoints/shop.endpoints'

/** 获取商铺详情 */
export const getShopDetails = shopid => get(shopEndpoints.detail(shopid), {})

/** 首屏分类导航：不下载全部菜品，数量仅用于展示，不用于判定分页结束。 */
export function getMenuCategories(restaurant_id) {
  return get(shopEndpoints.menu, {
    restaurant_id,
    include_foods: false,
  }, { loading: false })
}

/** 后续分页不遮住整个店铺；错误交给分类内的重试入口展示。 */
export function getCategoryFoods(restaurant_id, categoryId, offset = 0, limit = 20) {
  return get(shopEndpoints.categoryFoods(categoryId), {
    restaurant_id,
    offset,
    limit,
  }, {
    loading: false,
    meta: { silent: true },
  })
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
