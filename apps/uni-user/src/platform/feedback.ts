/**
 * 平台适配收口层 —— 反馈（toast / dialog / loading）
 *
 * 替代 Vant 的函数式 API（`showToast` × 2、`showDialog` × 1，迁移方案「UI 库选型」）
 * 与自研的 `AlterTip`/`ConfirmDialog`/`GlobalLoading`（三者都是命令式动态挂载 DOM，
 * 小程序端不能 `document.body.appendChild`，迁移方案 ③ 节）。
 *
 * ⚠️ GlobalLoading 的挂载点消失问题（方案 E 节）：
 * 它原先挂在 App.vue 的 template 里做全局单例，但 uni-app 的 App.vue **不能有 template**
 * → 采用方案推荐的第 2 选择：用 uni.showLoading 原生 API 替代。
 */

export interface ToastOptions {
  /** 显示时长（毫秒）。⚠️ 微信小程序上限约 10000 */
  duration?: number
  /**
   * 图标。小程序端只认 'success' | 'error' | 'loading' | 'none'，
   * 业务提示一律用 'none'（纯文字），因为小程序的 success 图标样式不可定制。
   */
  icon?: 'success' | 'error' | 'loading' | 'none'
}

/**
 * 轻提示。
 * 这是 `policies/error-message.js` 解耦后的注入目标（方案议题 7 决策 2）：
 * main.ts 里 `setAlertHandler(message => showToast(message))`，
 * 让 policies 层保持端无关，不直接写 uni.*。
 */
export function showToast(title: string, options: ToastOptions = {}): void {
  if (!title) {
    return
  }

  uni.showToast({
    title,
    icon: options.icon ?? 'none',
    duration: options.duration ?? 2000,
    // 允许与 loading 并存：请求失败时可能正好有 loading 遮罩
    mask: false,
  })
}

export interface ConfirmOptions {
  title?: string
  content: string
  confirmText?: string
  cancelText?: string
}

/**
 * 确认弹窗。
 * @returns true = 用户点了确认；false = 点了取消或关闭
 *
 * ⚠️ 用 Promise 包装回调式 API，让调用方能 await（对齐 Vant showDialog 的用法）。
 * ⚠️ uni.showModal 的 cancel 与「点遮罩关闭」都走 cancel 分支，无法区分 —— 业务上不需要区分。
 */
export function showConfirm(options: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    uni.showModal({
      title: options.title ?? '提示',
      content: options.content,
      confirmText: options.confirmText ?? '确定',
      cancelText: options.cancelText ?? '取消',
      success: result => resolve(Boolean(result.confirm)),
      // 弹窗自身失败（极少见）时按「未确认」处理，绝不 resolve(true)
      // —— 那会让「确认删除」这类危险操作在异常时误执行
      fail: () => resolve(false),
    })
  })
}

export interface AlertOptions {
  title?: string
  content: string
  confirmText?: string
}

/** 只有「知道了」的弹窗。替代 web-user 的 AlterTip */
export function showAlert(options: AlertOptions): Promise<void> {
  return new Promise((resolve) => {
    uni.showModal({
      title: options.title ?? '提示',
      content: options.content,
      confirmText: options.confirmText ?? '知道了',
      showCancel: false,
      success: () => resolve(),
      fail: () => resolve(),
    })
  })
}

/**
 * 全局 loading。
 *
 * ⚠️ 用引用计数而非布尔标志：policies 层可能并发发多个请求
 * （web-user 的 `services/http/loading.js` 就是这个模式），
 * 第一个请求 showLoading、最后一个 hideLoading，中间的不能提前关。
 */
let loadingCount = 0

export function showLoading(title = '加载中...'): void {
  loadingCount += 1

  // 已经显示时不重复调用：小程序端重复 showLoading 会重置动画，造成闪烁
  if (loadingCount === 1) {
    uni.showLoading({
      title,
      mask: true,
    })
  }
}

export function hideLoading(): void {
  if (loadingCount === 0) {
    return
  }

  loadingCount -= 1

  if (loadingCount === 0) {
    uni.hideLoading()
  }
}

/** 强制关闭 loading 并清零计数（页面卸载、异常兜底时用） */
export function resetLoading(): void {
  if (loadingCount > 0) {
    uni.hideLoading()
  }
  loadingCount = 0
}

/** 供测试读取当前计数 */
export function getLoadingCount(): number {
  return loadingCount
}

/** 导航栏 loading（替代作废的 NProgress，方案 E 节） */
export function showNavigationBarLoading(): void {
  uni.showNavigationBarLoading()
}

export function hideNavigationBarLoading(): void {
  uni.hideNavigationBarLoading()
}
