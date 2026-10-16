// ⚠️ 与 apps/web-user/src/stores/modules/store-loading.js 同源，修改需同步两处。
// 不抽共享包的原因见迁移方案议题 7。
//
// ★ 与 web-user 的唯一差异：新增 setLoadingVisibilityHandler 注入点。
// web-user 的遮罩由 GlobalLoading 组件读 store.visible/text 渲染；
// 小程序端 App.vue 不能有 template，全局挂载点消失（迁移方案 E 节），
// 遮罩改用 uni.showLoading —— 但 uni 调用不能写进 store（否则 store 不再端无关，
// 双修时要改两处平台代码）。所以用注入回调把「visible 变化」通知出去，
// main.ts 注入 uni 实现。与 setAlertHandler / setUnauthorizedHandler 同模式。
//
// 定时器语义（与 web-user 完全一致，勿改）：
// - delay（默认 220ms）：快请求在 delay 内结束则一次都不弹遮罩，避免闪烁
// - minDuration（默认 300ms）：遮罩至少显示这么久，避免一闪而过
// - hideTimer：finish 后延迟隐藏；期间若 start 再次调用则**取消隐藏**，
//   避免「刚藏又显示」的抖动

import { defineStore } from 'pinia'

let showTimer = null
let hideTimer = null
let shownAt = 0

/** 注入式遮罩副作用。默认空实现，保证注入前调用不抛错 */
let visibilityHandler = () => {}

export function setLoadingVisibilityHandler(fn) {
  visibilityHandler = typeof fn === 'function' ? fn : () => {}
}

export const useLoadingStore = defineStore('loading', {
  state: () => ({
    pendingCount: 0,
    visible: false,
    text: '加载中...',
    delay: 220,
    minDuration: 300,
  }),

  getters: {
    isLoading: state => state.visible,
    isPending: state => state.pendingCount > 0,
  },

  actions: {
    start(options = {}) {
      const {
        text = '加载中...',
        delay = this.delay,
        minDuration = this.minDuration,
      } = typeof options === 'string' ? { text: options } : options

      this.text = text
      this.delay = delay
      this.minDuration = minDuration
      this.pendingCount += 1

      if (hideTimer) {
        clearTimeout(hideTimer)
        hideTimer = null
      }

      if (this.visible || showTimer)
        return

      showTimer = setTimeout(() => {
        showTimer = null
        if (this.pendingCount > 0) {
          this.visible = true
          shownAt = Date.now()
          visibilityHandler(true, this.text)
        }
      }, delay)
    },

    finish() {
      if (this.pendingCount > 0)
        this.pendingCount -= 1

      if (this.pendingCount > 0)
        return

      if (showTimer) {
        clearTimeout(showTimer)
        showTimer = null
      }

      if (!this.visible)
        return

      const elapsed = Date.now() - shownAt
      const remain = Math.max(this.minDuration - elapsed, 0)

      hideTimer = setTimeout(() => {
        hideTimer = null
        this.visible = false
        visibilityHandler(false)
      }, remain)
    },

    show(text = '加载中...') {
      this.start({
        text,
        delay: 0,
      })
    },

    hide() {
      this.finish()
    },

    reset() {
      if (showTimer)
        clearTimeout(showTimer)
      if (hideTimer)
        clearTimeout(hideTimer)

      showTimer = null
      hideTimer = null
      shownAt = 0
      this.pendingCount = 0
      if (this.visible) {
        this.visible = false
        visibilityHandler(false)
      }
      this.text = '加载中...'
    },
  },
})
