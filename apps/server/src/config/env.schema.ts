import { z } from 'zod'

const optionalEmptyString = z.literal('').transform(() => undefined)

const optionalString = z.union([z.string().trim().min(1), optionalEmptyString]).optional()

const portSchema = z.coerce.number().int().min(1).max(65535)

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  APP_PORT: portSchema.default(3000),
  APP_PREFIX: z.string().trim().min(1).default('api'),

  DATABASE_URL: z.string().trim().min(1, 'DATABASE_URL is required'),

  REDIS_HOST: z.string().trim().min(1).default('localhost'),
  REDIS_PORT: portSchema.default(6379),
  REDIS_PASSWORD: optionalString,
  REDIS_DB: z.coerce.number().int().min(0).default(0),
  REDIS_TLS: z.enum(['true', 'false']).default('false').transform(value => value === 'true'),

  CUSTOMER_LOGIN_AUTO_REGISTER: z
    .enum(['true', 'false'])
    .default('true')
    .transform(value => value === 'true'),

  SMS_PROVIDER: z.enum(['mock']).default('mock'),
  SMS_MOCK_CODE: optionalString,
  SMS_CODE_TTL_SECONDS: z.coerce.number().int().positive().default(300),
  SMS_COOLDOWN_SECONDS: z.coerce.number().int().positive().default(60),
  SMS_DAILY_LIMIT: z.coerce.number().int().positive().default(10),

  ALIPAY_GATEWAY: z.url().default('https://openapi-sandbox.dl.alipaydev.com/gateway.do'),
  ALIPAY_APP_ID: z.string().default(''),
  ALIPAY_PRIVATE_KEY: z.string().default(''),
  ALIPAY_PUBLIC_KEY: z.string().default(''),
  ALIPAY_SELLER_ID: z.string().default(''),
  ALIPAY_NOTIFY_URL: z.url().default('http://127.0.0.1:3000/api/payments/alipay/notify'),
  ALIPAY_RETURN_URL: z.url().default('http://127.0.0.1:5173/#/payment/result'),
})

export type EnvConfig = z.infer<typeof envSchema>

export function validateEnv(config: Record<string, unknown>) {
  const result = envSchema.safeParse(config)

  if (result.success)
    return result.data

  const formatted = result.error.issues
    .map(issue => `${issue.path.join('.')}: ${issue.message}`)
    .join('\n')

  throw new Error(`Environment validation failed:\n${formatted}`)
}
