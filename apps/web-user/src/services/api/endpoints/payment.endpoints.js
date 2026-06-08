export const paymentEndpoints = {
  createAlipayWap: '/payments/alipay/wap/create',
  resumeAlipayWap: '/payments/alipay/wap/resume',
  alipayStatus: orderNo => `/payments/alipay/status/${orderNo}`,
  requestRefund: orderNo => `/orders/${orderNo}/refund/request`,
  orders: '/orders',
}
