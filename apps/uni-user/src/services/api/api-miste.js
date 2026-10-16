// ⚠️ 与 apps/web-user/src/services/api/api-miste.js 同源（逐行一致），修改需同步两处。
// 不抽共享包的原因见迁移方案议题 7。
// 纯端点封装，零端依赖。

import { get } from '../http/http'

import { foodEndpoints } from './endpoints/food.endpoints'
import { shopEndpoints } from './endpoints/shop.endpoints'

/** 食品分类列表 */
export const getFoodCategoryList = () => get(foodEndpoints.categoryList)

/** 获取商铺列表 */
export function getShopList(latitude, longitude, offset, limit) {
  return get(shopEndpoints.list, {
    latitude,
    longitude,
    offset,
    limit,
  }, { loading: false })
}
