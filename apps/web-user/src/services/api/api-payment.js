import axios from 'axios'

import { paymentEndpoints } from './endpoints/payment.endpoints'

export const PAY_API_UNAVAILABLE_MESSAGE
  = '本地支付服务未启动，请先运行 pnpm dev:pay，或在另一个终端运行 pnpm server:dev 后再重试。'

const paymentRequest = axios.create({
  baseURL: '/pay-api',
  timeout: 10000,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

paymentRequest.interceptors.response.use(
  response => response,
  error => Promise.reject(normalizePaymentError(error)),
)

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
    || (status === 500 && /proxy|ECONNREFUSED|127\.0\.0\.1:3001|pay-api/i.test(message))
  )
}

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

function unwrapResponse(response) {
  const data = response?.data ?? response

  if (data?.message && !data?.orderNo && !data?.status)
    throw new Error(data.message)

  return data
}

export async function createAlipayWapPayment(payload) {
  const response = await paymentRequest.post(paymentEndpoints.createAlipayWap, payload)
  return unwrapResponse(response)
}

export async function getAlipayPaymentStatus(orderNo, refresh = true) {
  const response = await paymentRequest.get(paymentEndpoints.alipayStatus(orderNo), {
    params: {
      refresh: refresh ? 1 : 0,
    },
  })

  return unwrapResponse(response)
}

export async function getUserPaymentOrders(userId, limit = 20) {
  const response = await paymentRequest.get(paymentEndpoints.orders, {
    params: {
      userId,
      limit,
    },
  })

  return unwrapResponse(response)
}
