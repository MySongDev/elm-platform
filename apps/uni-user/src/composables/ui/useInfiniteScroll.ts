import type { Ref } from 'vue'
import { ref } from 'vue'

/**
 * 无限滚动（小程序版）。
 *
 * ⚠️ 与 apps/web-user/src/composables/ui/useIntersectionObserver.ts **机制完全不同**：
 * web-user 用 IntersectionObserver 观察哨兵元素 + rootMargin 提前触发；
 * 小程序端**没有可用于任意元素的 IntersectionObserver**（⑦ 节），
 * 改用 scroll-view 的原生 `@scrolltolower` 事件 —— 更可靠（平台自己算触底），
 * 但**失去 rootMargin 提前量**（触底才触发，不是提前 threshold 像素）。
 *
 * 提前量的补偿：scroll-view 的 `lower-threshold` 属性（距底部多少 px 触发），
 * 语义上等价于 rootMargin 的 bottom 分量 → 由调用方在模板上设置。
 *
 * 用法（scroll-view 模式）：
 * ```vue
 * <scroll-view scroll-y :lower-threshold="threshold" @scrolltolower="onReachBottom">
 * ```
 * ```ts
 * const { onReachBottom } = useInfiniteScroll({ loading, finished, callback })
 * ```
 *
 * 页面级滚动模式（onReachBottom 生命周期）由页面自己接，本 composable 只负责
 * 「loading/finished 守卫 + 回调」这层端无关逻辑。
 */
export interface UseInfiniteScrollOptions {
  callback: () => void
  loading: Ref<boolean>
  finished: Ref<boolean>
  /**
   * 触底后的冷却（毫秒）。⚠️ scrolltolower 在手指持续滑动时可能连续触发，
   * web-user 靠 IntersectionObserver 的 isIntersecting 边沿天然去重，这里要自己加。
   */
  cooldown?: number
}

export function useInfiniteScroll({
  callback,
  loading,
  finished,
  cooldown = 300,
}: UseInfiniteScrollOptions) {
  const lastTriggerAt = ref(0)

  function onReachBottom() {
    const now = Date.now()

    if (loading.value || finished.value)
      return

    if (now - lastTriggerAt.value < cooldown)
      return

    lastTriggerAt.value = now
    callback()
  }

  return { onReachBottom }
}
