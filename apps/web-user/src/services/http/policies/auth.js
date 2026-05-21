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
