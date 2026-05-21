import { showAlert } from '@/components/common/AlterTip/index'

const HTTP_ERROR_ALERT_INTERVAL_MS = 1500

const lastAlertMap = new Map()

const HTTP_STATUS_MESSAGE_MAP = {
  401: '登录已过期，请重新登录',
  403: '权限不足，无法访问该资源',
  404: '资源不存在',
  429: '请求太频繁，请稍后再试',
}

export function resolveUserMessage(error) {
  const status = error?.response?.status
  const code = error?.code

  if (HTTP_STATUS_MESSAGE_MAP[status]) {
    return HTTP_STATUS_MESSAGE_MAP[status]
  }

  if (typeof status === 'number' && status >= 500) {
    return '服务器繁忙，请稍后再试'
  }

  if (code === 'ECONNABORTED') {
    return '请求超时，请稍后再试'
  }

  if (code === 'ERR_NETWORK') {
    return '网络异常，请检查网络'
  }

  if (code === 'ERR_CANCELED') {
    return ''
  }

  return error?.message || error?.name || '请求失败'
}

export function showHttpErrorAlert(message, status) {
  if (!message)
    return

  const key = String(status || 'network')
  const now = Date.now()
  const last = lastAlertMap.get(key) || 0

  if (now - last < HTTP_ERROR_ALERT_INTERVAL_MS)
    return

  lastAlertMap.set(key, now)
  showAlert(message)
}
