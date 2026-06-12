import axios from 'axios'

import { getStore } from '@/utils/storage/storage'
import { paymentEndpoints } from './endpoints/payment.endpoints'

export const PAY_API_UNAVAILABLE_MESSAGE
  = 'Payment backend service is unavailable. Please run pnpm --filter @elm-platform/server run dev and retry.'

const paymentRequest = axios.create({
  baseURL: '/pay-api',
  timeout: 10000,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

paymentRequest.interceptors.request.use((config) => {
  const token = getStore('customer_token')
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
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
    || (status === 500 && /proxy|ECONNREFUSED|localhost:3000|127\.0\.0\.1:3000|pay-api/i.test(message))
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

export async function resumeAlipayWapPayment(payload) {
  const response = await paymentRequest.post(paymentEndpoints.resumeAlipayWap, payload)
  return unwrapResponse(response)
}

export async function requestOrderRefund({ orderNo, reason }) {
  const response = await paymentRequest.post(paymentEndpoints.requestRefund(orderNo), {
    reason,
  })
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

export async function getUserPaymentOrders(limit = 20) {
  const response = await paymentRequest.get(paymentEndpoints.orders, {
    params: {
      limit,
    },
  })

  return unwrapResponse(response)
}
