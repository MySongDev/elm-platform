import type { Ref } from 'vue'
import { nextTick, ref } from 'vue'

const SCROLL_EDGE_GAP = 1
const MIN_SCROLL_DISTANCE = 220
const SCROLL_DISTANCE_RATIO = 0.6

export function useScrollManager() {
  const scrollContainer = ref<HTMLElement>()
  const tabTrack = ref<HTMLElement>()
  const canScrollLeft = ref(false)
  const canScrollRight = ref(false)
  const isOverflow = ref(false)
  let resizeObserver: ResizeObserver | undefined

  function updateScrollState() {
    const el = scrollContainer.value
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

  function scroll(direction: 'left' | 'right') {
    const el = scrollContainer.value
    if (!el)
      return
    const distance = Math.max(MIN_SCROLL_DISTANCE, Math.floor(el.clientWidth * SCROLL_DISTANCE_RATIO))
    el.scrollBy({ left: direction === 'left' ? -distance : distance, behavior: 'smooth' })
  }

  function handleWheel(e: WheelEvent) {
    const el = scrollContainer.value
    if (!el || !isOverflow.value)
      return

    e.preventDefault()
    const offset = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
    el.scrollBy({ left: offset, behavior: 'auto' })
  }

  function scrollActiveIntoView(selector = '.tab-item.is-active') {
    nextTick(() => {
      const activeEl = scrollContainer.value?.querySelector(selector)
      activeEl?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
      updateScrollState()
    })
  }

  function setupScrollListeners(container: Ref<HTMLElement | undefined>, track: Ref<HTMLElement | undefined>) {
    scrollContainer.value = container.value
    tabTrack.value = track.value

    scrollContainer.value?.addEventListener('scroll', updateScrollState, { passive: true })
    window.addEventListener('resize', updateScrollState)

    if (window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => updateScrollState())
      if (scrollContainer.value)
        resizeObserver.observe(scrollContainer.value)
      if (tabTrack.value)
        resizeObserver.observe(tabTrack.value)
    }

    nextTick(updateScrollState)
  }

  function cleanupScrollListeners() {
    scrollContainer.value?.removeEventListener('scroll', updateScrollState)
    window.removeEventListener('resize', updateScrollState)
    resizeObserver?.disconnect()
    resizeObserver = undefined
  }

  return {
    scrollContainer,
    tabTrack,
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
