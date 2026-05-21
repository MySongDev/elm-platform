export default () => ({
  // 应用配置
  app: {
    port: parseInt(process.env.APP_PORT || '3000', 10),
    prefix: process.env.APP_PREFIX || 'api',
  },

  // 数据库配置
  database: {
    url: process.env.DATABASE_URL,
  },

  // Redis 配置
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },
});
