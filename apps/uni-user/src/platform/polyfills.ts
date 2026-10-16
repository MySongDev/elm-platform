/**
 * 平台运行时垫片 —— 补齐小程序缺失的 Web API。
 *
 * ★ AbortController / AbortSignal
 * 微信小程序运行时**不提供**这两个全局对象，uni-app 也不注入
 * （实测：编译产物 common/vendor.js 里 0 处 AbortController）。
 * 微信自己的请求取消是 `RequestTask.abort()`，不是 Web 标准的 AbortController。
 *
 * 但本项目的取消语义**刻意与 web-user 对齐**，全部建立在 `new AbortController()`
 * + `signal` 之上（useLoadMore.ts、services/http/request.js 去重、platform/request.ts）。
 * 缺失后果是一条静默失效链：
 *   useLoadMore.loadMore() 在调用 fetchFn **之前**就执行 `new AbortController()`
 *   → 抛 ReferenceError → async 函数整体 reject（immediate 调用无 .catch，静默）
 *   → fetchFn（如 msite 的 getShopList）根本不发出请求 → 列表恒空、无报错。
 * 这正是「msite 打开只有 /v2/index_entry 在请求、getShopList 不发」的根因。
 *
 * 只实现代码里实际用到的最小子集：
 *   controller.signal / controller.abort()
 *   signal.aborted / addEventListener('abort') / removeEventListener('abort')
 * 带 typeof 守卫：真机或新版基础库若已原生支持，则不覆盖。
 *
 * ⚠️ 与 platform/image.ts 的 `new URL()` 改字符串处理是同一类防御
 * （Web API 在小程序端不可依赖）。
 */

type AbortListener = () => void

// 用 Record 视图访问全局：既绕开「小程序端无此全局」，也绕开 DOM lib 里
// AbortController/AbortSignal 的严格构造器类型（本垫片只实现最小子集，不求类型全等）。
const globalScope = globalThis as unknown as Record<string, unknown>

if (typeof globalScope.AbortController === 'undefined') {
  class PolyfillAbortSignal {
    aborted = false
    reason: unknown = undefined
    onabort: AbortListener | null = null
    private listeners = new Set<AbortListener>()

    addEventListener(type: string, listener: AbortListener): void {
      if (type === 'abort')
        this.listeners.add(listener)
    }

    removeEventListener(type: string, listener: AbortListener): void {
      if (type === 'abort')
        this.listeners.delete(listener)
    }

    // 供 controller.abort() 内部调用（一次性；重复 abort 不再派发）
    _fire(reason?: unknown): void {
      if (this.aborted)
        return
      this.aborted = true
      this.reason = reason
      this.onabort?.()
      for (const listener of this.listeners)
        listener()
      this.listeners.clear()
    }
  }

  class PolyfillAbortController {
    readonly signal = new PolyfillAbortSignal()

    abort(reason?: unknown): void {
      this.signal._fire(reason)
    }
  }

  ;(globalScope).AbortController = PolyfillAbortController
  ;(globalScope).AbortSignal = PolyfillAbortSignal
}
