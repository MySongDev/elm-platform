import path from 'node:path'
import { fileURLToPath } from 'node:url'

import dotenv from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

dotenv.config({ path: path.join(rootDir, '.env.alipay') })
dotenv.config()

function trimMultiline(value = '') {
  return String(value).replace(/\\n/g, '\n').trim()
}

export const config = {
  port: Number(process.env.ALIPAY_SERVER_PORT || 3001),
  clientAppUrl: process.env.ALIPAY_CLIENT_APP_URL || 'http://127.0.0.1:5173',
  gateway: process.env.ALIPAY_GATEWAY || 'https://openapi-sandbox.dl.alipaydev.com/gateway.do',
  appId: process.env.ALIPAY_APP_ID || '',
  privateKey: trimMultiline(process.env.ALIPAY_PRIVATE_KEY),
  alipayPublicKey: trimMultiline(process.env.ALIPAY_PUBLIC_KEY),
  notifyPath: process.env.ALIPAY_NOTIFY_PATH || '/api/payments/alipay/notify',
  sellerId: process.env.ALIPAY_SELLER_ID || '',
}

export function getNotifyUrl() {
  return process.env.ALIPAY_NOTIFY_URL || `http://127.0.0.1:${config.port}${config.notifyPath}`
}

export function hasAlipayConfig() {
  return Boolean(config.appId && config.privateKey && config.alipayPublicKey)
}
