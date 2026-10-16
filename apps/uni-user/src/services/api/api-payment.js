// ⚠️ 与 apps/web-user/src/services/api/api-payment.js 同源，修改需同步两处**语义**。
// 不抽共享包的原因见迁移方案议题 7。
//
// ★★ 本文件是议题 6 决策 1（L2 接缝）+ A7 的落地点：清掉 axios 依赖。
// web-user 的 `:36` 是 `if (!axios.isAxiosError(error)) return false` ——
// 换 uni.request 后这个判定**永远为 false**，导致 isPayApiUnavailable 永远 false，
// 「后端不可用」的友好提示彻底失效，**且不报错**（静默降级成不可读的默认消息）。
// 这是迁移必踩的最危险的坑之一：测试时容易误判为「后端有问题」。
//
// 修法（方案 F 节建议）：transport 层定义统一错误结构（status/data/isNetworkError），
// 本文件改为基于它判定，而不是基于 axios 类型。
// :55-67 的 normalizePaymentError 与 :71-76 的 unwrapResponse 语义**完整保留**，只换判定依据。

import { TransportError } from '@/platform/request'
import { get, post } from '@/services/http/http'

import { paymentEndpoints } from './endpoints/payment.endpoints'

export const PAY_API_UNAVAILABLE_MESSAGE
  = 'Payment backend service is unavailable. Please run pnpm --filter @elm-platform/server run dev and retry.'

// 支付请求统一走全局 request 实例，仅关掉两项全局副作用（与 web-user 一致，端无关）：
// - loading:false —— 支付有自己的按钮态/页面态（continuingOrderNo 等），不叠全局遮罩
// - meta.silent:true —— 跳过全局错误弹窗，错误由各调用方 catch 后自行提示，避免双重弹窗
const PAYMENT_REQUEST_OPTIONS = {
  loading: false,
  meta: { silent: true },
}

/**
 * 取错误文案。
 * ⚠️ 与 web-user 的差异：web-user 读 `error.response.data`（axios 结构）；
 * 这里读 TransportError.data（transport 统一结构）。语义相同：后端信封里的 message。
 */
function getResponseMessage(error) {
  const data = error instanceof TransportError ? error.data : error?.response?.data

  if (typeof data === 'string')
    return data

  return data?.message || error?.message || ''
}

function createPayApiUnavailableError(error) {
  const normalizedError = new Error(PAY_API_UNAVAILABLE_MESSAGE)
  normalizedError.code = 'PAY_API_UNAVAILABLE'
  normalizedError.cause = error
  return normalizedError
}

/**
 * 判定「后端根本没起来」vs「后端返回了业务错误」。
 *
 * ⚠️ 判定依据从 axios 类型换成 transport 统一结构：
 * | web-user（axios） | uni-user（transport） |
 * |---|---|
 * | `axios.isAxiosError(error)` | `error instanceof TransportError` |
 * | `!error.response`（无响应=连不上） | `error.isNetworkError` |
 * | `error.response.status` | `error.status` |
 *
 * 语义：502/503/504 或 500+代理特征文案 → 后端不可用（开发期友好提示）；
 * 网络层直接失败（DNS/连接拒绝/域名校验）→ 也视为不可用。
 */
function isPayApiUnavailable(error) {
  if (!(error instanceof TransportError))
    return false

  // 网络层失败 = 后端根本没响应（对应 axios 的 !error.response）
  if (error.isNetworkError || error.isTimeout)
    return true

  const status = error.status
  const message = getResponseMessage(error)

  return (
    [502, 503, 504].includes(status)
    || (status === 500 && /proxy|ECONNREFUSED|localhost:3000|127\.0\.0\.1:3000|pay-api/i.test(message))
  )
}

// 把全局 request 抛出的错误规整为支付语义的错误（语义与 web-user 一致）：
// - 后端不可用 → 友好的开发提示；
// - 其余情况 → 用后端返回的 message 覆盖默认文案，让调用方 catch 里的 err.message 直接可读。
function normalizePaymentError(error) {
  if (isPayApiUnavailable(error))
    return createPayApiUnavailableError(error)

  const message = getResponseMessage(error)
  if (!message || message === error?.message)
    return error

  const normalizedError = new Error(message)
  normalizedError.code = error?.code
  normalizedError.cause = error
  return normalizedError
}

// 全局 request 已返回解包后的载荷，这里拿到的就是后端裸载荷。
// 若后端返回的是纯错误信封（有 message 但没有业务字段），转成异常抛出。
function unwrapResponse(data) {
  if (data?.message && !data?.orderNo && !data?.status)
    throw new Error(data.message)

  return data
}

async function paymentPost(url, payload) {
  try {
    const data = await post(url, payload, PAYMENT_REQUEST_OPTIONS)
    return unwrapResponse(data)
  }
  catch (error) {
    throw normalizePaymentError(error)
  }
}

async function paymentGet(url, params) {
  try {
    const data = await get(url, params, PAYMENT_REQUEST_OPTIONS)
    return unwrapResponse(data)
  }
  catch (error) {
    throw normalizePaymentError(error)
  }
}

/**
 * 建单 + 生成支付宝 WAP 支付链接（一体）。
 * ⚠️ 小程序端**不要调这个**：支付宝 WAP 靠 window.location.href 跳转，
 * 小程序机制根本不可能。小程序端走 platform/payment.ts 的 requestPayment()。
 * 保留它是为了 H5/App 分支（议题 6 决策 1 的 L2 接缝）。
 */
export function createAlipayWapPayment(payload) {
  return paymentPost(paymentEndpoints.createAlipayWap, payload)
}

export function resumeAlipayWapPayment(payload) {
  return paymentPost(paymentEndpoints.resumeAlipayWap, payload)
}

/** 申请退款。与支付渠道无关，小程序端可正常调用 */
export function requestOrderRefund({ orderNo, reason }) {
  return paymentPost(paymentEndpoints.requestRefund(orderNo), { reason })
}

/** 查支付状态。与渠道无关（后端按 orderNo 查），小程序端可正常调用 */
export function getAlipayPaymentStatus(orderNo, refresh = true) {
  return paymentGet(paymentEndpoints.alipayStatus(orderNo), {
    refresh: refresh ? 1 : 0,
  })
}

/** 订单列表。与渠道无关，小程序端 order 页的数据来源 */
export function getUserPaymentOrders(limit = 20) {
  return paymentGet(paymentEndpoints.orders, { limit })
}
