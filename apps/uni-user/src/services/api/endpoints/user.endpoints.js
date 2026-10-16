// ⚠️ 与 apps/web-user/src/services/api/endpoints/user.endpoints.js 同源（逐行一致），
// 修改需同步两处。不抽共享包的原因见迁移方案议题 7。
export const userEndpoints = {
  addresses: '/customer-addresses',
  addressDetail: id => `/customer-addresses/${id}`,
}
