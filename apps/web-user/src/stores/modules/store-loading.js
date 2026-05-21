import { defineStore } from 'pinia'

let showTimer = null
let hideTimer = null
let shownAt = 0

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
      }, remain)
    },

    show(text = '加载中...') {
      this.start({ text, delay: 0 })
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
      this.visible = false
      this.text = '加载中...'
    },
  },
})
