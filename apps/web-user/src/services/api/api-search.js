import { get } from '../http/http'

import { searchEndpoints } from './endpoints/search.endpoints'

/** 获取 search 页面搜索结果 */
export function searchRestaurant(geohash, keyword) {
  return get(searchEndpoints.restaurants, {
    geohash,
    keyword,
  })
}
