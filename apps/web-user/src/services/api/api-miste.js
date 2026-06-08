import { get } from '../http/http'

import { foodEndpoints } from './endpoints/food.endpoints'
import { msiteEndpoints } from './endpoints/msite.endpoints'
import { shopEndpoints } from './endpoints/shop.endpoints'

/** 获取 msite 定位信息 */
export const getMsite = geohash => get(msiteEndpoints.pois, { geohash })

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
