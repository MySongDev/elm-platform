import { useLoadingStore } from '@/stores/modules/store-loading'

import { getMeta } from './policies'

const DEFAULT_LOADING_TEXT = '加载中...'

let activeRequestCount = 0

function shouldUseGlobalLoading(config) {
  const meta = getMeta(config)
  return meta.loading !== false
}

export function startGlobalLoading(config) {
  const meta = getMeta(config)

  if (!shouldUseGlobalLoading(config) || meta.loadingStarted)
    return

  activeRequestCount += 1
  meta.loadingStarted = true

  if (activeRequestCount === 1) {
    useLoadingStore().start({
      text: meta.loadingText || DEFAULT_LOADING_TEXT,
      delay: meta.loadingDelay,
      minDuration: meta.loadingMinDuration,
    })
  }
}

export function finishGlobalLoading(config) {
  if (!config)
    return

  const meta = getMeta(config)

  if (!meta.loadingStarted)
    return

  activeRequestCount = Math.max(0, activeRequestCount - 1)
  meta.loadingStarted = false

  if (activeRequestCount === 0) {
    useLoadingStore().finish()
  }
}
