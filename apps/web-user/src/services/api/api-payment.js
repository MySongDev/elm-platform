import axios from 'axios'

import { get, post } from '@/services/http/http'

import { paymentEndpoints } from './endpoints/payment.endpoints'

export const PAY_API_UNAVAILABLE_MESSAGE
  = 'Payment backend service is unavailable. Please run pnpm --filter @elm-platform/server run dev and retry.'

// 支付请求统一走全局 request 实例，仅关掉两项全局副作用：
// - loading:false —— 支付有自己的按钮态/页面态（continuingOrderNo 等），不叠全局遮罩
// - meta.silent:true —— 跳过全局错误弹窗，错误由各调用方 catch 后自行提示，避免双重弹窗
// Token 注入、401 刷新、withCredentials 等由全局 request 统一处理，无需在此重复。
const PAYMENT_REQUEST_OPTIONS = {
  loading: false,
  meta: { silent: true },
}

function getResponseMessage(error) {
  const data = error?.response?.data

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

function isPayApiUnavailable(error) {
  if (!axios.isAxiosError(error))
    return false

  if (!error.response)
    return true

  const status = error.response.status
  const message = getResponseMessage(error)

  return (
    [502, 503, 504].includes(status)
    || (status === 500 && /proxy|ECONNREFUSED|localhost:3000|127\.0\.0\.1:3000|pay-api/i.test(message))
  )
}

// 把全局 request 抛出的原始 axios error 规整为支付语义的错误：
// - 后端不可用 → 友好的开发提示；
// - 其余情况 → 用后端返回的 message 覆盖 axios 默认的 "Request failed with status code xxx"，
//   让调用方 catch 里的 err.message 直接可读。
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

// 全局 request 拦截器已返回 response.data，这里拿到的就是后端裸载荷。
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

export function createAlipayWapPayment(payload) {
  return paymentPost(paymentEndpoints.createAlipayWap, payload)
}

export function resumeAlipayWapPayment(payload) {
  return paymentPost(paymentEndpoints.resumeAlipayWap, payload)
}

export function requestOrderRefund({ orderNo, reason }) {
  return paymentPost(paymentEndpoints.requestRefund(orderNo), { reason })
}

export function getAlipayPaymentStatus(orderNo, refresh = true) {
  return paymentGet(paymentEndpoints.alipayStatus(orderNo), {
    refresh: refresh ? 1 : 0,
  })
}

export function getUserPaymentOrders(limit = 20) {
  return paymentGet(paymentEndpoints.orders, { limit })
}
