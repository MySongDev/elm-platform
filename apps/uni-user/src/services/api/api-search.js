// ⚠️ 与 apps/web-user/src/services/api/api-search.js 同源（逐行一致），修改需同步两处。
// 不抽共享包的原因见迁移方案议题 7。

import { get } from '../http/http'

import { searchEndpoints } from './endpoints/search.endpoints'

/** 获取 search 页面搜索结果 */
export function searchRestaurant(geohash, keyword) {
  return get(searchEndpoints.restaurants, {
    geohash,
    keyword,
  })
}
