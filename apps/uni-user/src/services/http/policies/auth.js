// ⚠️ 与 apps/web-user/src/services/http/policies/auth.js 同源（逐行一致），
// 修改需同步两处。不抽共享包的原因见迁移方案议题 7。

import { resolveUserMessage } from './error-message'

let unauthorizedHandler = null
let isHandlingUnauthorized = false

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler
}

export function handleUnauthorized(error) {
  if (isHandlingUnauthorized)
    return

  isHandlingUnauthorized = true

  const message = resolveUserMessage(error)

  if (typeof unauthorizedHandler === 'function') {
    unauthorizedHandler({
      error,
      message,
    })
  }

  setTimeout(() => {
    isHandlingUnauthorized = false
  }, 1000)
}
