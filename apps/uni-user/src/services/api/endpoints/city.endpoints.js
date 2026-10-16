// ⚠️ 与 apps/web-user/src/services/api/endpoints/city.endpoints.js 同源（逐行一致），
// 修改需同步两处。不抽共享包的原因见迁移方案议题 7。
// import { API_BASE_URL } from '@/config'

export const cityEndpoints = {
  cities: '/v1/cities',
  cityInfo: cityId => `/v1/cities/${cityId}`,
  reverseGeoCoding: '/geo/reverse-geocode',
  searchPois: '/v1/pois',
}
