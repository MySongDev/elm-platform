export const paymentEndpoints = {
  createAlipayWap: '/payments/alipay/wap/create',
  alipayStatus: orderNo => `/payments/alipay/status/${orderNo}`,
  orders: '/orders',
}
