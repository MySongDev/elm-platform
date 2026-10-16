// ⚠️ 与 apps/web-user/src/services/http/loading.js 同源，修改需同步两处。
// 不抽共享包的原因见迁移方案议题 7。
//
// 与 web-user 逐行一致：只负责「引用计数 + 是否启用」的判定，
// 遮罩的 delay/minDuration/防抖语义全部在 store-loading 里（同源复制）。
// 小程序端的遮罩副作用由 main.ts 注入 setLoadingVisibilityHandler 实现
// （uni.showLoading/hideLoading），store 本身保持端无关。

import { useLoadingStore } from '@/stores/modules/store-loading'

import { getMeta } from './policies/meta'

function shouldUseGlobalLoading(config) {
  const meta = getMeta(config)
  return meta.loading !== false
}

export function startGlobalLoading(config) {
  const meta = getMeta(config)

  if (!shouldUseGlobalLoading(config) || meta.loadingStarted)
    return

  meta.loadingStarted = true

  useLoadingStore().start({
    text: meta.loadingText,
    delay: meta.loadingDelay,
    minDuration: meta.loadingMinDuration,
  })
}

export function finishGlobalLoading(config) {
  if (!config)
    return

  const meta = getMeta(config)

  if (!meta.loadingStarted)
    return

  meta.loadingStarted = false
  useLoadingStore().finish()
}
