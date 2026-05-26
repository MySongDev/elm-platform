import AlipaySdk from 'alipay-sdk'

import { config, getNotifyUrl, hasAlipayConfig } from '../config.js'

let sdkInstance = null

function createSdk() {
  if (!hasAlipayConfig()) {
    throw new Error('支付宝配置缺失，请先填写 .env.alipay 中的 appId / privateKey / alipayPublicKey')
  }

  return new AlipaySdk({
    appId: config.appId,
    keyType: 'PKCS1',
    privateKey: config.privateKey,
    alipayPublicKey: config.alipayPublicKey,
    gateway: config.gateway,
    signType: 'RSA2',
    charset: 'utf-8',
    timeout: 5000,
    camelcase: true,
  })
}

export function getAlipaySdk() {
  if (!sdkInstance)
    sdkInstance = createSdk()

  return sdkInstance
}

export async function createWapPayForm(order) {
  const alipaySdk = getAlipaySdk()

  console.log('[alipay:wap] bizContent:', JSON.stringify({
    out_trade_no: order.orderNo,
    total_amount: order.payableAmount.toFixed(2),
    subject: order.subject,
    product_code: 'QUICK_WAP_WAY',
  }))

  const payUrl = alipaySdk.pageExec('alipay.trade.wap.pay', {
    method: 'GET',
    notifyUrl: getNotifyUrl(),
    returnUrl: `${config.clientAppUrl}/#/payment/result?orderNo=${order.orderNo}`,
    bizContent: {
      out_trade_no: order.orderNo,
      total_amount: order.payableAmount.toFixed(2),
      subject: order.subject,
      product_code: 'QUICK_WAP_WAY',
      quit_url: `${config.clientAppUrl}/#/order?orderNo=${order.orderNo}`,
    },
  })

  return payUrl
}

export async function queryTrade(orderNo) {
  const alipaySdk = getAlipaySdk()
  const response = await alipaySdk.exec('alipay.trade.query', {
    bizContent: {
      out_trade_no: orderNo,
    },
  })

  return response?.alipay_trade_query_response || response
}

export async function verifyNotifySignature(params) {
  const alipaySdk = getAlipaySdk()
  return alipaySdk.checkNotifySign(params)
}
