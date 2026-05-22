import type { Ref } from 'vue'
import { nextTick, onScopeDispose, ref, toValue, watchEffect } from 'vue'

interface UseMenuScrollOptions {
  scrollRoot: Ref<HTMLElement | null> | (() => HTMLElement | null)
  onActiveChange?: (id: string) => void
}

interface UseMenuScrollReturn {
  scrollToCategory: (id: string) => void
}

export function useMenuScroll(options: UseMenuScrollOptions): UseMenuScrollReturn {
  const isProgramScrolling = ref(false)
  let ticking = false

  function getRoot(): HTMLElement | null {
    return toValue(options.scrollRoot)
  }

  function getCategoryElement(id: string): HTMLElement | null {
    return getRoot()?.querySelector(`[data-category-id="${id}"]`) ?? null
  }

  function calculateScrollTarget(root: HTMLElement, categoryElement: Element): number {
    const rootRect = root.getBoundingClientRect()
    const elRect = categoryElement.getBoundingClientRect()

    const relativeTop = elRect.top - rootRect.top + root.scrollTop

    const stickyHeight = 92

    const target = relativeTop - stickyHeight

    const maxScroll = root.scrollHeight - root.clientHeight
    return Math.max(0, Math.min(target, maxScroll))
  }

  function scrollToCategory(id: string) {
    const root = getRoot()
    const dom = getCategoryElement(id)
    if (!root || !dom)
      return

    options.onActiveChange?.(id)

    isProgramScrolling.value = true

    root.scrollTop = calculateScrollTarget(root, dom)

    requestAnimationFrame(() => {
      isProgramScrolling.value = false
    })
  }

  function detectActiveCategory(root: HTMLElement) {
    if (isProgramScrolling.value)
      return

    const anchors = root.querySelectorAll('[data-category-id]')
    if (!anchors.length)
      return

    if (root.scrollTop + root.clientHeight >= root.scrollHeight - 10) {
      const lastId = (Array.from(anchors).at(-1) as HTMLElement | undefined)?.dataset.categoryId
      if (lastId)
        options.onActiveChange?.(lastId)
      return
    }

    const containerRect = root.getBoundingClientRect()
    const thresholdY = containerRect.top + 8

    let lo = 0
    let hi = anchors.length - 1
    let result = 0

    while (lo <= hi) {
      const mid = (lo + hi) >> 1
      const rect = anchors[mid].getBoundingClientRect()

      if (rect.top <= thresholdY) {
        result = mid
        lo = mid + 1
      }
      else {
        hi = mid - 1
      }
    }

    const activeId = (anchors[result] as HTMLElement)?.dataset.categoryId
    if (activeId)
      options.onActiveChange?.(activeId)
  }

  let cleanup: (() => void) | null = null

  watchEffect((onCleanup) => {
    const root = getRoot()
    if (!root)
      return

    const onScroll = () => {
      if (isProgramScrolling.value)
        return
      if (ticking)
        return

      ticking = true
      requestAnimationFrame(() => {
        detectActiveCategory(root)
        ticking = false
      })
    }

    root.addEventListener('scroll', onScroll, { passive: true })

    nextTick(() => detectActiveCategory(root))

    cleanup = () => {
      root.removeEventListener('scroll', onScroll)
    }

    onCleanup(cleanup)
  })

  onScopeDispose(() => {
    cleanup?.()
  })

  return { scrollToCategory }
}
