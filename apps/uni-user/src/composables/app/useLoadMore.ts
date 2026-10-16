// ⚠️ 与 apps/web-user/src/composables/app/useLoadMore.ts 同源，修改需同步两处。
// 不抽共享包的原因见迁移方案议题 7。
//
// ★ 与 web-user 的唯一差异：catch 里的取消判定。
// web-user 判 `err instanceof DOMException && err.name === 'AbortError'`（浏览器语义）；
// 小程序端没有 DOMException，platform/request 抛的是自研 CanceledError。
// 改判 CanceledError / signal.aborted，语义等价（主动取消不当失败处理）。

import type { ShallowRef } from 'vue'
import { getCurrentInstance, onUnmounted, shallowRef } from 'vue'

import { CanceledError } from '@/platform/request'

interface LoadMoreResult<T = any> {
  list: T[]
  hasMore: boolean
}

interface LoadMoreOptions<T = any> {
  pageSize?: number
  immediate?: boolean
  dedupKey?: keyof T & string | null
  onError?: (err: unknown) => void
}

interface FetchFnParams {
  page: number
  pageSize: number
  signal: AbortSignal
}

interface UseLoadMoreReturn<T = any> {
  list: ShallowRef<T[]>
  loading: ShallowRef<boolean>
  finished: ShallowRef<boolean>
  error: ShallowRef<unknown>
  page: ShallowRef<number>
  loadMore: () => Promise<void>
  refresh: () => Promise<void>
  reset: () => void
  retry: () => Promise<void>
  ready: Promise<void>
}

/**
 * 通用触底加载更多（分页列表状态管理）
 *
 * 不绑定 UI 渲染，只管理分页状态。
 * 配合 useInfiniteScroll（scroll-view 的 @scrolltolower）或手动调用 loadMore() 使用。
 */
export function useLoadMore<T = any>(
  fetchFn: (params: FetchFnParams) => Promise<LoadMoreResult<T> | T[]>,
  options: LoadMoreOptions<T> = {},
): UseLoadMoreReturn<T> {
  const {
    pageSize = 20,
    immediate = true,
    dedupKey = 'id' as any,
    onError,
  } = options

  const list = shallowRef<T[]>([]) as ShallowRef<T[]>
  const loading = shallowRef(false)
  const finished = shallowRef(false)
  const error = shallowRef<unknown>(null)
  const page = shallowRef(0)

  let abortController: AbortController | null = null
  let resolveReady: (() => void) | null = null
  const ready = new Promise<void>((resolve) => {
    resolveReady = resolve
  })

  const seen = dedupKey ? new Set() : null

  function dedup(items: T[]): T[] {
    if (!seen || !dedupKey)
      return items
    return items.filter((item) => {
      const key = (item as any)[dedupKey]
      if (key == null || seen.has(key))
        return false
      seen.add(key)
      return true
    })
  }

  function abortPending() {
    if (abortController) {
      abortController.abort()
      abortController = null
    }
  }

  async function loadMore() {
    if (loading.value || finished.value)
      return

    abortPending()

    const controller = new AbortController()
    abortController = controller

    loading.value = true
    error.value = null

    try {
      const nextPage = page.value + 1
      const result = await fetchFn({
        page: nextPage,
        pageSize,
        signal: controller.signal,
      })

      if (controller.signal.aborted)
        return

      const items = Array.isArray(result) ? result : (result?.list ?? [])
      const hasMore = !Array.isArray(result) && result?.hasMore != null
        ? result.hasMore
        : items.length >= pageSize

      const newItems = dedup(items)
      list.value = [...list.value, ...newItems]

      page.value = nextPage
      finished.value = !hasMore || newItems.length === 0
    }
    catch (err) {
      // ⚠️ 小程序端无 DOMException；取消判定改判 CanceledError（platform/request 抛出）
      if (err instanceof CanceledError || controller.signal.aborted)
        return
      error.value = err
      onError?.(err)
    }
    finally {
      if (abortController === controller)
        abortController = null
      loading.value = false
      resolveReady?.()
    }
  }

  async function refresh() {
    reset()
    await loadMore()
  }

  async function retry() {
    error.value = null
    finished.value = false
    await loadMore()
  }

  function reset() {
    abortPending()
    list.value = []
    loading.value = false
    finished.value = false
    error.value = null
    page.value = 0
    seen?.clear()
  }

  if (getCurrentInstance()) {
    onUnmounted(abortPending)
  }

  if (immediate) {
    loadMore()
  }

  return {
    list,
    loading,
    finished,
    error,
    page,
    loadMore,
    refresh,
    reset,
    retry,
    ready,
  }
}
