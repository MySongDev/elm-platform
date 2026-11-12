import { createDecipheriv, createPrivateKey, createPublicKey, randomBytes, sign, verify } from 'node:crypto'
import { BadGatewayException, BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

const MAX_AMOUNT_MINOR = 2_147_483_647
const TRADE_STATES = ['SUCCESS', 'REFUND', 'NOTPAY', 'CLOSED', 'REVOKED', 'USERPAYING', 'PAYERROR'] as const

type SignatureHeaders = Record<string, string | string[] | undefined>

export interface WechatTransaction {
  appid: string
  mchid: string
  out_trade_no: string
  transaction_id?: string
  trade_state: typeof TRADE_STATES[number]
  success_time?: string
  // 查询未支付订单时微信允许不返回金额；业务层不能把缺省值当成零元或已支付。
  amount?: {
    total: number
    currency: string
    payer_total?: number
  }
}

export interface WechatPaymentParams {
  timeStamp: string
  nonceStr: string
  package: string
  signType: 'RSA'
  paySign: string
}

/** 只负责微信协议；订单归属、商户/金额比对和状态写入仍由业务层负责。 */
@Injectable()
export class WechatPayService {
  constructor(private readonly config: ConfigService) {}

  assertConfigured(): void {
    const required = ['appId', 'appSecret', 'mchId', 'serialNo', 'privateKey', 'publicKeyId', 'publicKey', 'apiV3Key', 'notifyUrl']
    if (this.config.get<boolean>('wechatPay.enabled') !== true || required.some(key => !this.value(key).trim())) {
      throw new ServiceUnavailableException('微信支付尚未配置，请完成商户配置后重试')
    }
    try {
      const notifyUrl = new URL(this.value('notifyUrl'))
      const privateKey = createPrivateKey(this.value('privateKey'))
      const publicKey = createPublicKey(this.value('publicKey'))
      if (Buffer.byteLength(this.value('apiV3Key')) !== 32
        || notifyUrl.protocol !== 'https:' || notifyUrl.username || notifyUrl.password || notifyUrl.hash
        || this.value('notifyUrl').length > 255
        || !/^\d{1,32}$/.test(this.value('mchId'))
        || !/^[a-f\d]+$/i.test(this.value('serialNo'))
        || !/^PUB_KEY_ID_\d+$/.test(this.value('publicKeyId'))
        || !isText(this.value('appId'), 32)
        || privateKey.asymmetricKeyType !== 'rsa' || privateKey.asymmetricKeyDetails?.modulusLength !== 2048
        || publicKey.asymmetricKeyType !== 'rsa' || publicKey.asymmetricKeyDetails?.modulusLength !== 2048) {
        throw new Error('配置无效')
      }
    }
    catch {
      // 不附带底层 PEM/URL 异常，避免错误体或日志暴露配置内容。
      throw new ServiceUnavailableException('微信支付配置无效，请检查商户凭证与通知地址')
    }
  }

  getIdentity(): {
    appId: string
    mchId: string
  } {
    this.assertConfigured()
    return {
      appId: this.value('appId'),
      mchId: this.value('mchId'),
    }
  }

  /** code 只在服务端换 openid；不返回、不保存 session_key，也不替换项目已有登录。 */
  async exchangeOpenId(code: string): Promise<string> {
    this.assertConfigured()
    if (!isText(code))
      throw new BadRequestException('微信登录凭证不能为空')
    const params = new URLSearchParams({
      appid: this.value('appId'),
      secret: this.value('appSecret'),
      js_code: code,
      grant_type: 'authorization_code',
    })
    try {
      const response = await fetch(`https://api.weixin.qq.com/sns/jscode2session?${params}`, {
        redirect: 'error',
        signal: AbortSignal.timeout(8000),
      })
      if (!response.ok)
        throw new BadGatewayException('获取微信支付身份失败，请稍后重试')
      const data = asRecord(await response.json())
      if (data.errcode === 40029 || data.errcode === 40226)
        throw new BadRequestException('微信登录凭证无效，请重新发起支付')
      if ((data.errcode !== undefined && data.errcode !== 0) || !isText(data.openid, 128))
        throw new BadGatewayException('获取微信支付身份失败，请稍后重试')
      return data.openid
    }
    catch (error) {
      if (error instanceof BadRequestException || error instanceof BadGatewayException)
        throw error
      // 原始请求 URL 含 AppSecret，不能把底层异常带进日志或 HTTP 错误体。
      throw new BadGatewayException('获取微信支付身份失败，请稍后重试')
    }
  }

  /** total 只接收整数分，不在协议层四舍五入，否则调用方传错元单位时会悄悄少收钱。 */
  async createJsapiPayment(order: {
    orderNo: string
    subject: string
    total: number
  }, openId: string): Promise<WechatPaymentParams> {
    this.assertConfigured()
    assertOrderNo(order.orderNo)
    if (!isAmount(order.total) || !isText(order.subject, 127) || !isText(openId, 128))
      throw new BadRequestException('微信支付金额、商品描述或支付身份无效')
    const result = await this.api('POST', '/v3/pay/transactions/jsapi', {
      appid: this.value('appId'),
      mchid: this.value('mchId'),
      description: order.subject,
      out_trade_no: order.orderNo,
      notify_url: this.value('notifyUrl'),
      amount: {
        total: order.total,
        currency: 'CNY',
      },
      payer: {
        openid: openId,
      },
    })
    if (!isText(result.prepay_id, 64))
      throw new BadGatewayException('微信未返回有效预支付单，请稍后重试')

    const timeStamp = String(Math.floor(Date.now() / 1000))
    const nonceStr = randomBytes(16).toString('hex')
    const packageValue = `prepay_id=${result.prepay_id}`
    return {
      timeStamp,
      nonceStr,
      package: packageValue,
      signType: 'RSA',
      paySign: this.sign(`${this.value('appId')}\n${timeStamp}\n${nonceStr}\n${packageValue}\n`),
    }
  }

  async queryTrade(orderNo: string): Promise<WechatTransaction | null> {
    this.assertConfigured()
    assertOrderNo(orderNo)
    try {
      const data = await this.api('GET', `/v3/pay/transactions/out-trade-no/${encodeURIComponent(orderNo)}?mchid=${encodeURIComponent(this.value('mchId'))}`)
      return parseTransaction(data)
    }
    catch (error) {
      // 未下微信预支付单时确实可能不存在；只有已验签的 404 才允许走这个正常分支。
      if (error instanceof WechatOrderNotFoundError)
        return null
      if (error instanceof BadGatewayException || error instanceof ServiceUnavailableException)
        throw error
      throw new BadGatewayException('微信返回的交易数据无效，请稍后查询订单状态')
    }
  }

  /** 必须验原始字节再解密；JSON.stringify(body) 会改变签名原文，不能代替 rawBody。 */
  decodeNotification(headers: SignatureHeaders, rawBody: Buffer): WechatTransaction {
    this.assertConfigured()
    if (!Buffer.isBuffer(rawBody) || rawBody.length === 0)
      throw new BadRequestException('微信支付通知原文缺失')
    this.verifyMessage(headers, rawBody)
    try {
      const notification = asRecord(JSON.parse(rawBody.toString('utf8')))
      const resource = asRecord(notification.resource)
      if (notification.event_type !== 'TRANSACTION.SUCCESS' || notification.resource_type !== 'encrypt-resource'
        || resource.algorithm !== 'AEAD_AES_256_GCM' || resource.original_type !== 'transaction'
        || !isText(resource.nonce) || Buffer.byteLength(resource.nonce) !== 12
        || (resource.associated_data !== undefined && typeof resource.associated_data !== 'string')) {
        throw new Error('通知类型错误')
      }
      const ciphertext = decodeBase64(resource.ciphertext)
      if (ciphertext.length <= 16)
        throw new Error('密文无效')
      const decipher = createDecipheriv('aes-256-gcm', Buffer.from(this.value('apiV3Key')), Buffer.from(resource.nonce), {
        authTagLength: 16,
      })
      decipher.setAuthTag(ciphertext.subarray(-16))
      decipher.setAAD(Buffer.from(resource.associated_data ?? ''))
      const plaintext = Buffer.concat([decipher.update(ciphertext.subarray(0, -16)), decipher.final()])
      const transaction = parseTransaction(asRecord(JSON.parse(plaintext.toString('utf8'))))
      if (transaction.trade_state !== 'SUCCESS')
        throw new Error('交易状态与通知类型不符')
      return transaction
    }
    catch {
      throw new BadRequestException('微信支付通知解密或交易数据校验失败')
    }
  }

  private value(key: string): string {
    const value = this.config.get<unknown>(`wechatPay.${key}`, '')
    return typeof value === 'string' ? value : ''
  }

  private sign(message: string): string {
    return sign('RSA-SHA256', Buffer.from(message), this.value('privateKey')).toString('base64')
  }

  private verifyMessage(headers: SignatureHeaders, body: Buffer): void {
    try {
      const timestamp = readHeader(headers, 'wechatpay-timestamp')
      const nonce = readHeader(headers, 'wechatpay-nonce')
      const signature = readHeader(headers, 'wechatpay-signature')
      const serial = readHeader(headers, 'wechatpay-serial')
      if (!/^\d+$/.test(timestamp) || !Number.isSafeInteger(Number(timestamp))
        || !isText(nonce, 32) || serial !== this.value('publicKeyId')) {
        throw new Error('签名头无效')
      }
      // 本服务仅接受前后五分钟的报文；这不是订单幂等，重发通知仍须由业务层去重。
      if (Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp)) > 300)
        throw new Error('签名已过期')
      const message = Buffer.concat([Buffer.from(`${timestamp}\n${nonce}\n`), body, Buffer.from('\n')])
      if (!verify('RSA-SHA256', message, this.value('publicKey'), decodeBase64(signature)))
        throw new Error('验签失败')
    }
    catch {
      throw new BadRequestException('微信支付签名头无效、已过期或验签失败')
    }
  }

  private async api(method: 'GET' | 'POST', path: string, payload?: unknown): Promise<Record<string, unknown>> {
    this.assertConfigured()
    const body = payload === undefined ? '' : JSON.stringify(payload)
    const timestamp = String(Math.floor(Date.now() / 1000))
    const nonce = randomBytes(16).toString('hex')
    const signature = this.sign(`${method}\n${path}\n${timestamp}\n${nonce}\n${body}\n`)
    const authorization = `WECHATPAY2-SHA256-RSA2048 mchid="${this.value('mchId')}",nonce_str="${nonce}",timestamp="${timestamp}",serial_no="${this.value('serialNo')}",signature="${signature}"`
    try {
      const response = await fetch(`https://api.mch.weixin.qq.com${path}`, {
        method,
        headers: {
          'Authorization': authorization,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Wechatpay-Serial': this.value('publicKeyId'),
        },
        body: body || undefined,
        redirect: 'error',
        signal: AbortSignal.timeout(8000),
      })
      const text = await response.text()
      const headers = Object.fromEntries(response.headers.entries())
      if (!response.ok) {
        // 官方示例不要求所有错误响应带签名。缺签名时只报失败，不能据它认定订单不存在。
        if (headers['wechatpay-signature'] === undefined)
          throw new BadGatewayException('微信支付请求失败，请稍后查询订单状态')
        this.verifyMessage(headers, Buffer.from(text))
        const data = asRecord(JSON.parse(text))
        if (method === 'GET' && response.status === 404 && data.code === 'ORDER_NOT_EXIST')
          throw new WechatOrderNotFoundError()
        throw new BadGatewayException('微信支付请求失败，请稍后查询订单状态')
      }
      this.verifyMessage(headers, Buffer.from(text))
      return asRecord(JSON.parse(text))
    }
    catch (error) {
      if (error instanceof WechatOrderNotFoundError || error instanceof BadGatewayException)
        throw error
      throw new BadGatewayException('微信支付通信或验签失败，请稍后查询订单状态')
    }
  }
}

class WechatOrderNotFoundError extends Error {}

function isText(value: unknown, maxLength = Number.MAX_SAFE_INTEGER): value is string {
  return typeof value === 'string' && value.trim().length > 0 && Array.from(value).length <= maxLength && !/[\r\n\0]/.test(value)
}

function isAmount(value: unknown, allowZero = false): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= (allowZero ? 0 : 1) && value <= MAX_AMOUNT_MINOR
}

function assertOrderNo(orderNo: string): void {
  if (!isText(orderNo, 32) || !/^[\w|*\-]{6,32}$/.test(orderNo))
    throw new BadRequestException('微信支付订单号无效')
}

function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    throw new Error('数据不是对象')
  return value as Record<string, unknown>
}

function readHeader(headers: SignatureHeaders, name: string): string {
  const entries = Object.entries(headers).filter(([key]) => key.toLowerCase() === name)
  if (entries.length !== 1 || typeof entries[0][1] !== 'string' || !entries[0][1])
    throw new Error('签名头缺失或重复')
  return entries[0][1]
}

function decodeBase64(value: unknown): Buffer {
  if (typeof value !== 'string' || !value || value.length % 4 !== 0 || !/^[a-z\d+/]+={0,2}$/i.test(value))
    throw new Error('Base64 无效')
  const decoded = Buffer.from(value, 'base64')
  if (decoded.toString('base64') !== value)
    throw new Error('Base64 无效')
  return decoded
}

/** 签名只证明来源；此处还要校验运行时类型，不能把缺金额的 SUCCESS 交给订单业务。 */
function parseTransaction(data: Record<string, unknown>): WechatTransaction {
  if (!isText(data.appid, 32) || !isText(data.mchid, 32) || !isText(data.out_trade_no, 32)
    || !TRADE_STATES.includes(data.trade_state as WechatTransaction['trade_state'])) {
    throw new Error('交易字段无效')
  }
  if (data.amount !== undefined) {
    const amount = asRecord(data.amount)
    if (!isAmount(amount.total) || amount.currency !== 'CNY'
      || (amount.payer_total !== undefined && (!isAmount(amount.payer_total, true) || amount.payer_total > amount.total))) {
      throw new Error('交易金额无效')
    }
  }
  if ((data.transaction_id !== undefined && !isText(data.transaction_id, 32))
    || (data.success_time !== undefined && (!isText(data.success_time, 64)
      || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(data.success_time)
      || !Number.isFinite(Date.parse(data.success_time))))
    || (data.trade_state === 'SUCCESS' && (data.amount === undefined || data.transaction_id === undefined || data.success_time === undefined))) {
    throw new Error('支付成功字段缺失或无效')
  }
  return data as unknown as WechatTransaction
}
