// ⚠️ 与 apps/web-user/src/services/api/endpoints/payment.endpoints.js 同源（逐行一致），
// 修改需同步两处。不抽共享包的原因见迁移方案议题 7。
//
// ⚠️ 注意（议题 6）：createAlipayWap 在小程序端**不可用**（支付宝 WAP 靠
// window.location.href 跳转，小程序机制根本不可能）。小程序端走
// platform/payment.ts 的 L2 接缝，点支付返回「当前端暂不支持」。
// 这些端点保留是为了 H5/App 分支与 order 页的退款/状态查询（与渠道无关）。
export const paymentEndpoints = {
  createAlipayWap: '/payments/alipay/wap/create',
  resumeAlipayWap: '/payments/alipay/wap/resume',
  alipayStatus: orderNo => `/payments/alipay/status/${orderNo}`,
  requestRefund: orderNo => `/orders/${orderNo}/refund/request`,
  orders: '/orders',
}
