// ⚠️ 与 apps/web-user/src/services/api/endpoints/shop.endpoints.js 同源（逐行一致），
// 修改需同步两处。不抽共享包的原因见迁移方案议题 7。
export const shopEndpoints = {
  list: 'shopping/restaurants',
  detail: shopId => `/shopping/restaurant/${shopId}`,
  menu: '/shopping/v2/menu',
  ratingTags: shopId => `/ugc/v2/restaurants/${shopId}/ratings/tags`,
  ratings: shopId => `/ugc/v2/restaurants/${shopId}/ratings`,
}
