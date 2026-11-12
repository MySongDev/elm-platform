function trimMultiline(value = '') {
  return String(value).replace(/\\n/g, '\n').trim()
}

export default () => ({
  // 应用配置
  app: {
    port: Number.parseInt(process.env.APP_PORT || '3000', 10),
    prefix: process.env.APP_PREFIX || 'api',
  },

  elmApi: {
    baseUrl: process.env.ELM_API_BASE_URL || 'https://elm.cangdu.org',
    timeoutMs: Number(process.env.ELM_API_TIMEOUT_MS || '8000'),
    imageTimeoutMs: Number(process.env.ELM_IMAGE_TIMEOUT_MS || '15000'),
  },

  // Elm 图片本地化（011）：图片资产目录。
  // 单独一个对象（不复用 elmApi），避免牵动只校验上游 URL / 超时的既有配置测试。
  // 相对路径以 apps/server 工作目录解析；生产推荐指向持久卷的绝对路径。
  elmImages: {
    directory: process.env.ELM_IMAGE_DIR || 'uploads/elm-images',
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
    tls: process.env.REDIS_TLS === 'true',
    commandTimeoutMs: Number.parseInt(process.env.REDIS_COMMAND_TIMEOUT_MS || '5000', 10),
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

  // 默认关闭，缺少商户凭证时不能走模拟成功分支。
  wechatPay: {
    enabled: process.env.WECHAT_PAY_ENABLED === 'true',
    appId: process.env.WECHAT_APP_ID || '',
    appSecret: process.env.WECHAT_APP_SECRET || '',
    mchId: process.env.WECHAT_PAY_MCH_ID || '',
    serialNo: process.env.WECHAT_PAY_SERIAL_NO || '',
    privateKey: trimMultiline(process.env.WECHAT_PAY_PRIVATE_KEY),
    publicKeyId: process.env.WECHAT_PAY_PUBLIC_KEY_ID || '',
    publicKey: trimMultiline(process.env.WECHAT_PAY_PUBLIC_KEY),
    apiV3Key: process.env.WECHAT_PAY_API_V3_KEY || '',
    notifyUrl: process.env.WECHAT_PAY_NOTIFY_URL || '',
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
