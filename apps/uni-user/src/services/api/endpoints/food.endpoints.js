// ⚠️ 与 apps/web-user/src/services/api/endpoints/food.endpoints.js 同源（逐行一致），
// 修改需同步两处。不抽共享包的原因见迁移方案议题 7。
export const foodEndpoints = {
  category: '/shopping/v2/restaurant/category',
  categoryList: 'v2/index_entry',
  deliveryModes: '/shopping/v1/restaurants/delivery_modes',
  activityAttributes: '/shopping/v1/restaurants/activity_attributes',
}
