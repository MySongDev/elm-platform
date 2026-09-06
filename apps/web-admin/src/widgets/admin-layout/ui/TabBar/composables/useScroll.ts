import type { Ref } from 'vue'
import { nextTick, ref } from 'vue'

/** 滚动边界容差（px）：消化亚像素误差，避免左右箭头状态抖动 */
const SCROLL_EDGE_GAP = 1

/** 点击左右箭头时的最小滚动距离（px） */
const MIN_SCROLL_DISTANCE = 220

/** 单次滚动距离 = max(最小值, 容器可视宽度 × 该比例) */
const SCROLL_DISTANCE_RATIO = 0.6

/**
 * TabBar 横向滚动能力（方案 A：DOM 所有权在视图层）。
 *
 * - 不在 composable 内创建 template ref
 * - 由调用方传入已绑定模板的 DOM ref
 * - 本模块只负责滚动状态、行为与监听器生命周期
 */
export function useScrollManager(
  scrollContainerRef: Ref<HTMLElement | null | undefined>,
  tabTrackRef: Ref<HTMLElement | null | undefined>,
) {
  const canScrollLeft = ref(false)
  const canScrollRight = ref(false)
  const isOverflow = ref(false)
  let resizeObserver: ResizeObserver | undefined

  function updateScrollState() {
    const el = scrollContainerRef.value
    if (!el)
      return
    const maxScrollLeft = getMaxScrollLeft(el)
    isOverflow.value = maxScrollLeft > SCROLL_EDGE_GAP
    canScrollLeft.value = el.scrollLeft > SCROLL_EDGE_GAP
    canScrollRight.value = el.scrollLeft < maxScrollLeft - SCROLL_EDGE_GAP
  }

  function getMaxScrollLeft(el: HTMLElement) {
    return Math.max(0, el.scrollWidth - el.clientWidth)
  }

  /**
   * 仅调整横向容器 scrollLeft，把 child 滚入可视区。
   * 不用 element.scrollIntoView，避免带动页面/祖先容器纵向滚动。
   */
  function scrollChildIntoContainer(container: HTMLElement, child: HTMLElement) {
    const containerRect = container.getBoundingClientRect()
    const childRect = child.getBoundingClientRect()

    // 相对容器可视区的溢出量：负值=左侧被挡住，正值=右侧溢出
    const overflowLeft = childRect.left - containerRect.left
    const overflowRight = childRect.right - containerRect.right

    let nextLeft = container.scrollLeft
    if (overflowLeft < -SCROLL_EDGE_GAP)
      nextLeft += overflowLeft
    else if (overflowRight > SCROLL_EDGE_GAP)
      nextLeft += overflowRight
    else
      return

    const maxScrollLeft = getMaxScrollLeft(container)
    nextLeft = Math.max(0, Math.min(nextLeft, maxScrollLeft))

    if (Math.abs(nextLeft - container.scrollLeft) <= SCROLL_EDGE_GAP)
      return

    container.scrollTo({
      left: nextLeft,
      behavior: 'smooth',
    })
  }

  function scroll(direction: 'left' | 'right') {
    const el = scrollContainerRef.value
    if (!el)
      return
    const distance = Math.max(MIN_SCROLL_DISTANCE, Math.floor(el.clientWidth * SCROLL_DISTANCE_RATIO))
    el.scrollBy({
      left: direction === 'left' ? -distance : distance,
      behavior: 'smooth',
    })
  }

  function handleWheel(e: WheelEvent) {
    const el = scrollContainerRef.value
    if (!el || !isOverflow.value)
      return

    e.preventDefault()
    const offset = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
    el.scrollBy({
      left: offset,
      behavior: 'auto',
    })
  }

  function scrollActiveIntoView(selector = '.tab-item.is-active') {
    nextTick(() => {
      const container = scrollContainerRef.value
      const activeEl = container?.querySelector(selector)
      if (!container || !(activeEl instanceof HTMLElement))
        return

      scrollChildIntoContainer(container, activeEl)
      updateScrollState()
    })
  }

  function setupScrollListeners() {
    // DOM 关联在调用方完成（useTemplateRef + 模板 ref）；这里只挂监听。
    scrollContainerRef.value?.addEventListener('scroll', updateScrollState, {
      passive: true,
    })
    window.addEventListener('resize', updateScrollState)

    if (window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => updateScrollState())
      if (scrollContainerRef.value)
        resizeObserver.observe(scrollContainerRef.value)
      if (tabTrackRef.value)
        resizeObserver.observe(tabTrackRef.value)
    }

    nextTick(updateScrollState)
  }

  function cleanupScrollListeners() {
    scrollContainerRef.value?.removeEventListener('scroll', updateScrollState)
    window.removeEventListener('resize', updateScrollState)
    resizeObserver?.disconnect()
    resizeObserver = undefined
  }

  return {
    canScrollLeft,
    canScrollRight,
    isOverflow,
    scroll,
    handleWheel,
    updateScrollState,
    scrollActiveIntoView,
    setupScrollListeners,
    cleanupScrollListeners,
  }
}
