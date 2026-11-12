import { createCipheriv, generateKeyPairSync, sign, verify } from 'node:crypto'
import { BadGatewayException, BadRequestException, ServiceUnavailableException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { WechatPayService } from './wechat-pay.service'

const NOW = 1_794_441_600_000
const ORDER_NO = 'ELMWX202611120001'
const API_V3_KEY = '0123456789abcdef0123456789abcdef'

let merchantPrivateKey: string
let merchantPublicKey: string
let platformPrivateKey: string
let platformPublicKey: string

/** 资金协议的回归测试只用进程内生成的 RSA/AES 数据；fetch 必须由本地替身接管。 */
describe('wechatPayService 协议边界', () => {
  let service: WechatPayService
  let settings: Record<string, unknown>
  let fetchMock: jest.SpyInstance<ReturnType<typeof fetch>, Parameters<typeof fetch>>

  beforeAll(() => {
    const merchant = makeKeys()
    const platform = makeKeys()
    merchantPrivateKey = merchant.privateKey
    merchantPublicKey = merchant.publicKey
    platformPrivateKey = platform.privateKey
    platformPublicKey = platform.publicKey
  })

  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(NOW)
    settings = {
      enabled: true,
      appId: 'wx-test-app',
      appSecret: 'only-local-app-secret',
      mchId: '1900000001',
      serialNo: 'AABB1122',
      privateKey: merchantPrivateKey,
      publicKeyId: 'PUB_KEY_ID_3000000001',
      publicKey: platformPublicKey,
      apiV3Key: API_V3_KEY,
      notifyUrl: 'https://example.com/api/payments/wechat/notify',
    }
    service = new WechatPayService(new ConfigService({
      wechatPay: settings,
    }))
    fetchMock = jest.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('测试没有登记 fetch 应答'))
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it.each([false, undefined, 'true'])('开关 %s 不发网络请求，也不伪造可用身份', async (enabled) => {
    settings.enabled = enabled
    expect(() => service.getIdentity()).toThrow(ServiceUnavailableException)
    await expect(service.exchangeOpenId('test-code')).rejects.toBeInstanceOf(ServiceUnavailableException)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it.each(['appId', 'appSecret', 'mchId', 'serialNo', 'privateKey', 'publicKeyId', 'publicKey', 'apiV3Key', 'notifyUrl'])('缺少 %s 时拒绝调用', (key) => {
    settings[key] = ''
    expect(() => service.assertConfigured()).toThrow(ServiceUnavailableException)
  })

  it.each([
    ['apiV3Key', '密'.repeat(32)],
    ['notifyUrl', 'http://example.com/notify'],
    ['notifyUrl', 'https://'],
    ['notifyUrl', 'https://secret@example.com/notify'],
    ['privateKey', 'not-a-private-key'],
    ['publicKey', 'not-a-public-key'],
    ['serialNo', 'serial\nheader'],
    ['publicKeyId', 'not-a-public-key-id'],
  ])('无效配置 %s 只返回脱敏错误', (key, value) => {
    settings[key] = value
    expect(() => service.assertConfigured()).toThrow('微信支付配置无效，请检查商户凭证与通知地址')
  })

  it('code2session 按官方查询字段请求，只返回 openid', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({
      openid: 'local-open-id',
      session_key: 'must-not-return',
      unionid: 'unused',
    })))
    await expect(service.exchangeOpenId('code +/&')).resolves.toBe('local-open-id')
    const [input, options] = fetchMock.mock.calls[0]
    const url = new URL(String(input))
    expect(url.origin + url.pathname).toBe('https://api.weixin.qq.com/sns/jscode2session')
    expect(Object.fromEntries(url.searchParams)).toEqual({
      appid: settings.appId,
      secret: settings.appSecret,
      js_code: 'code +/&',
      grant_type: 'authorization_code',
    })
    expect(options?.redirect).toBe('error')
  })

  it.each([40029, 40226])('code2session 用户凭证错误 %s 返回400', async (errcode) => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({
      errcode,
      errmsg: '不能透传上游详情',
    })))
    await expect(service.exchangeOpenId('test-code')).rejects.toBeInstanceOf(BadRequestException)
  })

  it.each([
    { errcode: -1 },
    { errcode: 45011 },
    {
      errcode: '0',
      openid: 'local-open-id',
    },
    { openid: 123 },
    null,
  ])('code2session 系统错误或畸形响应不能当成身份', async (data) => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify(data)))
    await expect(service.exchangeOpenId('test-code')).rejects.toBeInstanceOf(BadGatewayException)
  })

  it('通信错误不暴露请求 URL、AppSecret 或底层错误', async () => {
    fetchMock.mockRejectedValue(new Error(`https://api.weixin.qq.com/?secret=${settings.appSecret}`))
    const failure = await service.exchangeOpenId('test-code').then(
      () => { throw new Error('不应返回成功身份') },
      error => error as BadGatewayException,
    )
    expect(failure).toBeInstanceOf(BadGatewayException)
    expect(JSON.stringify(failure)).not.toContain(settings.appSecret)
    expect(failure.message).not.toContain('https://')
  })

  it.each(['short', `${ORDER_NO}\n`, `${ORDER_NO}\r`, '订单编号不合法'])('无效订单号 %s 在调用微信前拒绝', async (orderNo) => {
    await expect(service.queryTrade(orderNo)).rejects.toBeInstanceOf(BadRequestException)
    await expect(service.createJsapiPayment({
      orderNo,
      subject: '餐品',
      total: 100,
    }, 'local-open-id')).rejects.toBeInstanceOf(BadRequestException)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it.each([0, -1, 1.01, Number.NaN, Number.POSITIVE_INFINITY, 2_147_483_648, Number.MAX_SAFE_INTEGER, '100'])('拒绝非协议整数分 %s，不发下单请求', async (total) => {
    await expect(service.createJsapiPayment({
      orderNo: ORDER_NO,
      subject: '餐品',
      total: total as number,
    }, 'local-open-id')).rejects.toBeInstanceOf(BadRequestException)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it.each([1, 2_147_483_647])('整数分 %s 原样发出，请求签名与小程序签名均可独立验真', async (total) => {
    fetchMock.mockResolvedValue(signedResponse({
      prepay_id: 'wx-local-prepay',
    }))
    const params = await service.createJsapiPayment({
      orderNo: ORDER_NO,
      subject: '餐品',
      total,
    }, 'local-open-id')
    const [input, options] = fetchMock.mock.calls[0]
    expect(String(input)).toBe('https://api.mch.weixin.qq.com/v3/pay/transactions/jsapi')
    expect(JSON.parse(String(options?.body))).toMatchObject({
      out_trade_no: ORDER_NO,
      amount: {
        total,
        currency: 'CNY',
      },
      payer: {
        openid: 'local-open-id',
      },
    })
    verifyRequest(options!, '/v3/pay/transactions/jsapi')
    expect(params.signType).toBe('RSA')
    expect(params.package).toBe('prepay_id=wx-local-prepay')
    expect(params.nonceStr).toHaveLength(32)
    expect(params.timeStamp).toBe(String(NOW / 1000))
    expect(verify('RSA-SHA256', Buffer.from(`wx-test-app\n${params.timeStamp}\n${params.nonceStr}\n${params.package}\n`), merchantPublicKey, Buffer.from(params.paySign, 'base64'))).toBe(true)
  })

  it.each([{}, { prepay_id: 1 }, { prepay_id: 'bad\nprepay' }])('已验签但无有效prepay_id仍拒绝调起', async (data) => {
    fetchMock.mockResolvedValue(signedResponse(data))
    await expect(service.createJsapiPayment({
      orderNo: ORDER_NO,
      subject: '餐品',
      total: 100,
    }, 'local-open-id')).rejects.toBeInstanceOf(BadGatewayException)
  })

  it('查单签名覆盖编码后的完整 path/query 与 GET 空正文', async () => {
    fetchMock.mockResolvedValue(signedResponse(transaction()))
    await expect(service.queryTrade(ORDER_NO)).resolves.toMatchObject(transaction())
    const [, options] = fetchMock.mock.calls[0]
    expect(options?.body).toBeUndefined()
    verifyRequest(options!, `/v3/pay/transactions/out-trade-no/${ORDER_NO}?mchid=1900000001`)
  })

  it('合法未支付交易可不含金额，不能伪装成SUCCESS', async () => {
    const unpaid = {
      appid: 'wx-test-app',
      mchid: '1900000001',
      out_trade_no: ORDER_NO,
      trade_state: 'NOTPAY',
    }
    fetchMock.mockResolvedValue(signedResponse(unpaid))
    await expect(service.queryTrade(ORDER_NO)).resolves.toEqual(unpaid)
    fetchMock.mockResolvedValue(signedResponse({
      ...unpaid,
      trade_state: 'SUCCESS',
    }))
    await expect(service.queryTrade(ORDER_NO)).rejects.toBeInstanceOf(BadGatewayException)
  })

  it('只有有效签名的404 ORDER_NOT_EXIST可以返回null', async () => {
    fetchMock.mockResolvedValue(signedResponse({
      code: 'ORDER_NOT_EXIST',
    }, 404))
    await expect(service.queryTrade(ORDER_NO)).resolves.toBeNull()
  })

  it.each([404, 500])('官方可能没有签名的错误HTTP%s只能报失败', async (status) => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({
      code: 'ORDER_NOT_EXIST',
      message: '敏感上游详情',
    }), {
      status,
    }))
    await expect(service.queryTrade(ORDER_NO)).rejects.toThrow('微信支付请求失败，请稍后查询订单状态')
  })

  it.each([
    ['wechatpay-serial', 'PUB_KEY_ID_999999'],
    ['wechatpay-timestamp', String(NOW / 1000 - 301)],
    ['wechatpay-timestamp', String(NOW / 1000 + 301)],
    ['wechatpay-timestamp', '9007199254740993'],
    ['wechatpay-timestamp', '1.5'],
    ['wechatpay-nonce', ''],
    ['wechatpay-signature', 'WECHATPAY/SIGNTEST/not-base64'],
  ])('响应头%s无效时拒绝可信查单', async (name, value) => {
    const response = signedResponse(transaction())
    response.headers.set(name, value)
    fetchMock.mockResolvedValue(response)
    await expect(service.queryTrade(ORDER_NO)).rejects.toBeInstanceOf(BadGatewayException)
  })

  it('正文篡改、缺签名、错误私钥签名都不能获得交易', async () => {
    const body = JSON.stringify(transaction())
    fetchMock.mockResolvedValue(new Response(body.replace('100', '200'), {
      headers: signatureHeaders(Buffer.from(body)),
    }))
    await expect(service.queryTrade(ORDER_NO)).rejects.toBeInstanceOf(BadGatewayException)
    fetchMock.mockResolvedValue(new Response(body))
    await expect(service.queryTrade(ORDER_NO)).rejects.toBeInstanceOf(BadGatewayException)
    fetchMock.mockResolvedValue(new Response(body, {
      headers: signatureHeaders(Buffer.from(body), merchantPrivateKey),
    }))
    await expect(service.queryTrade(ORDER_NO)).rejects.toBeInstanceOf(BadGatewayException)
  })

  it.each(['exchange', 'query'] as const)('%s的8秒超时由signal终止，返回脱敏502', async (operation) => {
    const controller = new AbortController()
    const timeout = jest.spyOn(AbortSignal, 'timeout').mockImplementation(() => {
      queueMicrotask(() => controller.abort(new Error('本地超时替身')))
      return controller.signal
    })
    fetchMock.mockImplementation(async (_input, options) => new Promise<Response>((_resolve, reject) => {
      options!.signal!.addEventListener('abort', () => reject(options!.signal!.reason), {
        once: true,
      })
    }))
    const result = operation === 'exchange' ? service.exchangeOpenId('test-code') : service.queryTrade(ORDER_NO)
    await expect(result).rejects.toBeInstanceOf(BadGatewayException)
    expect(timeout).toHaveBeenCalledWith(8000)
  })

  it('通知验原始字节，再使用AAD和末尾16字节认证标签解密', () => {
    const rawBody = notification(transaction())
    expect(service.decodeNotification(signatureHeaders(rawBody), rawBody)).toEqual(transaction())
    const reformatted = Buffer.from(JSON.stringify(JSON.parse(rawBody.toString())))
    expect(() => service.decodeNotification(signatureHeaders(rawBody), reformatted)).toThrow(BadRequestException)
  })

  it('不含associated_data的通知按空AAD解密，支持HTTP头大小写', () => {
    const rawBody = notification(transaction(), null)
    const headers = Object.fromEntries(Object.entries(signatureHeaders(rawBody)).map(([key, value]) => [key.toUpperCase(), value]))
    expect(service.decodeNotification(headers, rawBody)).toEqual(transaction())
  })

  it('通知缺原文、重复签名头或过期时间都不被接受', () => {
    const rawBody = notification(transaction())
    const headers = signatureHeaders(rawBody)
    expect(() => service.decodeNotification(headers, undefined as unknown as Buffer)).toThrow(BadRequestException)
    expect(() => service.decodeNotification({
      ...headers,
      'Wechatpay-Serial': headers['wechatpay-serial'],
    }, rawBody)).toThrow(BadRequestException)
    expect(() => service.decodeNotification({
      ...headers,
      'wechatpay-timestamp': String(NOW / 1000 - 301),
    }, rawBody)).toThrow(BadRequestException)
  })

  it.each(['tag', 'aad', 'nonce', 'algorithm', 'ciphertext', 'event'])('签名有效但通知%s损坏不能解密成功', (field) => {
    const data = JSON.parse(notification(transaction()).toString())
    if (field === 'tag') {
      const bytes = Buffer.from(data.resource.ciphertext, 'base64')
      bytes[bytes.length - 1] ^= 1
      data.resource.ciphertext = bytes.toString('base64')
    }
    if (field === 'aad')
      data.resource.associated_data = 'wrong-aad'
    if (field === 'nonce')
      data.resource.nonce = 12
    if (field === 'algorithm')
      data.resource.algorithm = 'AES'
    if (field === 'ciphertext')
      data.resource.ciphertext = 'not-valid-base64'
    if (field === 'event')
      data.event_type = 'OTHER.EVENT'
    const rawBody = Buffer.from(JSON.stringify(data))
    expect(() => service.decodeNotification(signatureHeaders(rawBody), rawBody)).toThrow(BadRequestException)
  })

  it.each([
    { trade_state: 'NOTPAY' },
    { trade_state: 'UNKNOWN' },
    { transaction_id: undefined },
    { success_time: 'not-time' },
    { amount: undefined },
    {
      amount: {
        total: '100',
        currency: 'CNY',
      },
    },
    {
      amount: {
        total: 100,
        currency: 'USD',
      },
    },
    {
      amount: {
        total: 100,
        currency: 'CNY',
        payer_total: 101,
      },
    },
  ])('有效签名与AES密文也不能绕过成功交易数据校验', (override) => {
    const rawBody = notification({
      ...transaction(),
      ...override,
    })
    expect(() => service.decodeNotification(signatureHeaders(rawBody), rawBody)).toThrow(BadRequestException)
  })
})

function makeKeys(): {
  privateKey: string
  publicKey: string
} {
  return generateKeyPairSync('rsa', {
    modulusLength: 2048,
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
  })
}

function transaction() {
  return {
    appid: 'wx-test-app',
    mchid: '1900000001',
    out_trade_no: ORDER_NO,
    transaction_id: '420000-local-transaction',
    trade_state: 'SUCCESS',
    success_time: '2026-11-12T12:00:00+08:00',
    amount: {
      total: 100,
      currency: 'CNY',
      payer_total: 100,
    },
  }
}

function signatureHeaders(body: Buffer, key = platformPrivateKey): Record<string, string> {
  const timestamp = String(NOW / 1000)
  const nonce = 'local-response-nonce'
  return {
    'wechatpay-timestamp': timestamp,
    'wechatpay-nonce': nonce,
    'wechatpay-serial': 'PUB_KEY_ID_3000000001',
    'wechatpay-signature': sign('RSA-SHA256', Buffer.concat([Buffer.from(`${timestamp}\n${nonce}\n`), body, Buffer.from('\n')]), key).toString('base64'),
  }
}

function signedResponse(data: unknown, status = 200): Response {
  const body = Buffer.from(JSON.stringify(data))
  return new Response(body.toString(), {
    status,
    headers: signatureHeaders(body),
  })
}

function verifyRequest(options: RequestInit, path: string): void {
  const headers = new Headers(options.headers)
  const authorization = headers.get('authorization')!
  const fields = Object.fromEntries(Array.from(authorization.matchAll(/(\w+)="([^"]+)"/g), match => [match[1], match[2]]))
  expect(authorization.startsWith('WECHATPAY2-SHA256-RSA2048 ')).toBe(true)
  expect(fields.mchid).toBe('1900000001')
  expect(fields.serial_no).toBe('AABB1122')
  expect(headers.get('wechatpay-serial')).toBe('PUB_KEY_ID_3000000001')
  const message = `${options.method}\n${path}\n${fields.timestamp}\n${fields.nonce_str}\n${options.body ?? ''}\n`
  expect(verify('RSA-SHA256', Buffer.from(message), merchantPublicKey, Buffer.from(fields.signature, 'base64'))).toBe(true)
}

function notification(data: unknown, associatedData: string | null = 'transaction'): Buffer {
  const nonce = '0123456789ab'
  const cipher = createCipheriv('aes-256-gcm', Buffer.from(API_V3_KEY), Buffer.from(nonce))
  cipher.setAAD(Buffer.from(associatedData ?? ''))
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(data)), cipher.final(), cipher.getAuthTag()]).toString('base64')
  return Buffer.from(JSON.stringify({
    event_type: 'TRANSACTION.SUCCESS',
    resource_type: 'encrypt-resource',
    resource: {
      algorithm: 'AEAD_AES_256_GCM',
      original_type: 'transaction',
      ciphertext,
      nonce,
      ...(associatedData === null ? {} : { associated_data: associatedData }),
    },
  }, null, 2))
}
