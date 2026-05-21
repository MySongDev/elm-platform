import { createVNode, render } from 'vue'

import Alert from './alertTip.vue'

let activeAlert = null
let activeContainer = null
let lastAlertText = ''
let lastAlertAt = 0
const DUPLICATE_ALERT_INTERVAL = 1500

export function showAlert(text) {
  const normalizedText = String(text || '')
  const now = Date.now()

  if (activeAlert)
    return activeAlert

  if (normalizedText === lastAlertText && now - lastAlertAt < DUPLICATE_ALERT_INTERVAL)
    return Promise.resolve(false)

  lastAlertText = normalizedText
  lastAlertAt = now

  activeAlert = new Promise((resolve) => {
    const container = document.createElement('div')
    activeContainer = container
    document.body.appendChild(container)

    const destroy = () => {
      render(null, container)
      container.remove()
      activeAlert = null
      if (activeContainer === container)
        activeContainer = null
      resolve(true)
    }

    const vnode = createVNode(Alert, {
      alertText: normalizedText,
      onClose: destroy,
    })

    render(vnode, container)
  })

  return activeAlert
}
