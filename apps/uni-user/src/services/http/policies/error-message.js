// ⚠️ 与 apps/web-user/src/services/http/policies/error-message.js 同源，修改需同步两处语义。
// 不抽共享包的原因见迁移方案议题 7。
//
// ★ 本文件是议题 7 决策 2 的落地点：web-user 版 `:1` import 了 AlterTip 的 showAlert
// （命令式 document.createElement + appendChild 动态挂载 DOM），小程序端不能这样做。
// 改为 setAlertHandler() 注入回调 —— 与 http.js 现有的 setUnauthorizedHandler() 同模式
// （项目已有先例，不是新发明）。注入点在 main.ts。
//
// ★ 第二处差异（方案 F 节 / A7）：web-user 的 resolveUserMessage 读的是 axios 专属字段
// （error.response.status、error.code 的 'ECONNABORTED'/'ERR_NETWORK'/'ERR_CANCELED'）。
// uni-user 换成 platform/request.ts 的统一错误结构：
//   TransportError.status / TransportError.isNetworkError / CanceledError.isCanceled
// ⚠️ 这不是可选优化：若沿用 axios 字段，判定会**静默失效**（永远 undefined），
// 错误提示退化成不可读的默认文案 —— api-payment.js:36 的 axios.isAxiosError 就是这个坑。

import { CanceledError, TransportError } from '@/platform/request'

const HTTP_ERROR_ALERT_INTERVAL_MS = 1500

const lastAlertMap = new Map()

const HTTP_STATUS_MESSAGE_MAP = {
  401: '登录已过期，请重新登录',
  403: '权限不足，无法访问该资源',
  404: '资源不存在',
  429: '请求太频繁，请稍后再试',
}

/**
 * 注入式错误提示。默认空实现：未注入时静默丢弃，
 * 保证 policies 层在 main.ts 注入之前被调用也不会抛错。
 */
let alertHandler = () => {}

export function setAlertHandler(fn) {
  alertHandler = typeof fn === 'function' ? fn : () => {}
}

/**
 * 把传输层错误翻译成用户可读文案。
 *
 * 与 web-user 的映射关系（语义等价，判定依据换掉）：
 * | web-user（axios） | uni-user（transport） |
 * |---|---|
 * | `error.response.status` | `TransportError.status` |
 * | `code === 'ECONNABORTED'`（超时） | `TransportError.isTimeout` |
 * | `code === 'ERR_NETWORK'` | `TransportError.isNetworkError` |
 * | `code === 'ERR_CANCELED'` | `CanceledError.isCanceled` |
 */
export function resolveUserMessage(error) {
  // 主动取消不提示（对齐 web-user 的 ERR_CANCELED 返回 ''）
  if (error instanceof CanceledError || error?.isCanceled) {
    return ''
  }

  const status = error instanceof TransportError
    ? error.status
    : error?.response?.status

  if (HTTP_STATUS_MESSAGE_MAP[status]) {
    return HTTP_STATUS_MESSAGE_MAP[status]
  }

  if (typeof status === 'number' && status >= 500) {
    return '服务器繁忙，请稍后再试'
  }

  if (error?.isTimeout) {
    return '请求超时，请稍后再试'
  }

  if (error?.isNetworkError) {
    return '网络异常，请检查网络'
  }

  return error?.message || error?.name || '请求失败'
}

export function showHttpErrorAlert(message, status) {
  if (!message)
    return

  const key = String(status || 'network')
  const now = Date.now()
  const last = lastAlertMap.get(key) || 0

  // 节流：同一类错误 1.5 秒内只弹一次，避免并发请求刷屏
  if (now - last < HTTP_ERROR_ALERT_INTERVAL_MS)
    return

  lastAlertMap.set(key, now)
  alertHandler(message)
}
