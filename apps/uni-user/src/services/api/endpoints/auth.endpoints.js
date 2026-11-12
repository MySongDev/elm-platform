// ⚠️ 与 apps/web-user/src/services/api/endpoints/auth.endpoints.js 同源（逐行一致），
// 修改需同步两处。不抽共享包的原因见迁移方案议题 7。
export const authEndpoints = {
  customerSmsSend: '/customer-auth/sms/send',
  customerPasswordLogin: '/customer-auth/login/password',
  customerPasswordReset: '/customer-auth/password/reset',
  customerSmsLogin: '/customer-auth/login/sms',
  customerRefresh: '/customer-auth/refresh',
  customerLogout: '/customer-auth/logout',
  customerProfile: '/customer-auth/profile',
  customerNickname: '/customer-auth/profile/nickname',
  customerAvatar: '/customer-avatar',
}
