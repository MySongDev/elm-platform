const SCROLL_EDGE_GAP = 1
const MIN_SCROLL_DISTANCE = 220
const SCROLL_DISTANCE_RATIO = 0.6

export interface ScrollMetrics {
  scrollLeft: number
  scrollWidth: number
  clientWidth: number
}

export function getMaxScrollLeft(scrollWidth: number, clientWidth: number): number {
  return Math.max(0, scrollWidth - clientWidth)
}

export function getScrollState(metrics: ScrollMetrics) {
  const maxScrollLeft = getMaxScrollLeft(metrics.scrollWidth, metrics.clientWidth)
  return {
    isOverflow: maxScrollLeft > SCROLL_EDGE_GAP,
    canScrollLeft: metrics.scrollLeft > SCROLL_EDGE_GAP,
    canScrollRight: metrics.scrollLeft < maxScrollLeft - SCROLL_EDGE_GAP,
  }
}

export function getScrollDistance(clientWidth: number): number {
  return Math.max(MIN_SCROLL_DISTANCE, Math.floor(clientWidth * SCROLL_DISTANCE_RATIO))
}
