function trimMultiline(value = '') {
  return String(value).replace(/\\n/g, '\n').trim()
}

export default () => ({
  // 应用配置
  app: {
    port: Number.parseInt(process.env.APP_PORT || '3000', 10),
    prefix: process.env.APP_PREFIX || 'api',
  },

  // 数据库配置
  database: {
    url: process.env.DATABASE_URL,
  },

  // Redis 配置
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number.parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: Number.parseInt(process.env.REDIS_DB || '0', 10),
  },

  auth: {
    customerLoginAutoRegister: process.env.CUSTOMER_LOGIN_AUTO_REGISTER !== 'false',
  },

  sms: {
    provider: process.env.SMS_PROVIDER || 'mock',
    mockCode: process.env.SMS_MOCK_CODE || undefined,
    codeTtlSeconds: Number.parseInt(process.env.SMS_CODE_TTL_SECONDS || '300', 10),
    cooldownSeconds: Number.parseInt(process.env.SMS_COOLDOWN_SECONDS || '60', 10),
    dailyLimit: Number.parseInt(process.env.SMS_DAILY_LIMIT || '10', 10),
  },

  alipay: {
    gateway: process.env.ALIPAY_GATEWAY || 'https://openapi-sandbox.dl.alipaydev.com/gateway.do',
    appId: process.env.ALIPAY_APP_ID || '',
    privateKey: trimMultiline(process.env.ALIPAY_PRIVATE_KEY),
    alipayPublicKey: trimMultiline(process.env.ALIPAY_PUBLIC_KEY),
    notifyUrl: process.env.ALIPAY_NOTIFY_URL || 'http://127.0.0.1:3000/api/payments/alipay/notify',
    returnUrl: process.env.ALIPAY_RETURN_URL || 'http://127.0.0.1:5173/#/payment/result',
    sellerId: process.env.ALIPAY_SELLER_ID || '',
  },
})
