import type { MaybeRefOrGetter, ShallowRef } from 'vue'
import { onActivated, onDeactivated, onMounted, onUnmounted, shallowRef, toValue } from 'vue'

type ScrollTarget = Window | HTMLElement

interface UseBackTopOptions {
  threshold?: MaybeRefOrGetter<number>
  offset?: MaybeRefOrGetter<number>
  showAfter?: MaybeRefOrGetter<HTMLElement | string | null>
}

interface UseBackTopReturn {
  showBackTop: ShallowRef<boolean>
  scrollToTop: (behavior?: ScrollBehavior) => void
  setTarget: (target: ScrollTarget | null) => void
  setAnchor: (anchor: HTMLElement | string | null) => void
  updateScroll: (options?: { force?: boolean }) => void
}

function normalizeElement(target: any): HTMLElement | null {
  const value = toValue(target)

  if (!value)
    return null

  if (typeof value === 'string')
    return document.querySelector(value)

  if (value === window || value instanceof HTMLElement)
    return value

  return value.$el instanceof HTMLElement ? value.$el : null
}

function toNumber(value: string): number {
  const number = Number.parseFloat(value)
  return Number.isFinite(number) ? number : 0
}

function getVerticalOuterSize(element: Element | null): number {
  if (!element)
    return 0

  const rect = element.getBoundingClientRect()
  const style = window.getComputedStyle(element)

  return rect.height + toNumber(style.marginTop) + toNumber(style.marginBottom)
}

function getAnchorEndDistance(target: ScrollTarget, anchor: Element): number {
  const isWindow = target === window
  const targetTop = isWindow ? 0 : (target as HTMLElement).getBoundingClientRect().top
  const baseScrollTop = isWindow ? window.scrollY : (target as HTMLElement).scrollTop || 0

  const candidates = [anchor, ...anchor.querySelectorAll('*')]
  let maxBottom = anchor.getBoundingClientRect().bottom + toNumber(window.getComputedStyle(anchor).marginBottom)

  for (const element of candidates) {
    const rect = element.getBoundingClientRect()
    const style = window.getComputedStyle(element)
    maxBottom = Math.max(maxBottom, rect.bottom + toNumber(style.marginBottom))
  }

  return baseScrollTop + maxBottom - targetTop - getTargetStartPadding(target)
}

function getTargetStartPadding(target: ScrollTarget): number {
  if (!target || target === window)
    return 0

  const style = window.getComputedStyle(target as HTMLElement)
  return toNumber(style.paddingTop)
}

export function useBackTop(options: UseBackTopOptions | number = {}): UseBackTopReturn {
  const normalizedOptions: UseBackTopOptions = typeof options === 'number'
    ? { threshold: options }
    : options

  const {
    threshold = 400,
    offset = 0,
    showAfter = null,
  } = normalizedOptions

  const showBackTop = shallowRef(false)

  let currentTarget: ScrollTarget | null = null
  let currentAnchor: HTMLElement | null = null
  let anchorDistance = 0
  let last = 0
  let ticking = false
  let resizeObserver: ResizeObserver | null = null

  function getThreshold(): number {
    if (currentAnchor)
      return anchorDistance + Number(toValue(offset) || 0)

    return Number(toValue(threshold) || 0)
  }

  function updateAnchorDistance() {
    anchorDistance = Math.max(
      getTargetStartPadding(currentTarget!) + getVerticalOuterSize(currentAnchor),
      getAnchorEndDistance(currentTarget!, currentAnchor!),
    )
  }

  function getScrollTop(): number {
    if (!currentTarget)
      return 0

    return currentTarget === window
      ? window.scrollY
      : (currentTarget as HTMLElement).scrollTop || 0
  }

  function updateScroll({ force = false } = {}) {
    if (!currentTarget)
      return

    if (currentAnchor)
      updateAnchorDistance()

    const scrollTop = getScrollTop()
    if (!force && scrollTop === last)
      return

    last = scrollTop
    showBackTop.value = scrollTop >= getThreshold()
  }

  function handleScroll() {
    if (ticking)
      return

    requestAnimationFrame(() => {
      updateScroll()
      ticking = false
    })
    ticking = true
  }

  function cleanupTarget() {
    if (currentTarget)
      currentTarget.removeEventListener('scroll', handleScroll)
  }

  function cleanupAnchor() {
    resizeObserver?.disconnect()
    resizeObserver = null
    currentAnchor = null
    anchorDistance = 0
  }

  function setTarget(target: ScrollTarget | null) {
    const nextTarget = target instanceof HTMLElement || target === window ? target : null
    if (!nextTarget || nextTarget === currentTarget)
      return

    cleanupTarget()
    currentTarget = nextTarget
    currentTarget.addEventListener('scroll', handleScroll, { passive: true })
    if (currentAnchor)
      updateAnchorDistance()
    last = -1
    updateScroll({ force: true })
  }

  function setAnchor(anchor: HTMLElement | string | null) {
    const nextAnchor = normalizeElement(anchor)

    cleanupAnchor()

    if (!nextAnchor) {
      updateScroll({ force: true })
      return
    }

    currentAnchor = nextAnchor
    updateAnchorDistance()

    resizeObserver = new ResizeObserver(() => {
      updateAnchorDistance()
      updateScroll({ force: true })
    })
    resizeObserver.observe(currentAnchor)
    updateScroll({ force: true })
  }

  function scrollToTop(behavior: ScrollBehavior = 'smooth') {
    showBackTop.value = false

    if (!currentTarget)
      return

    if (currentTarget === window)
      window.scrollTo({ top: 0, behavior })
    else
      currentTarget.scrollTo({ top: 0, behavior })
  }

  onMounted(() => {
    setAnchor(showAfter as any)
    updateScroll({ force: true })
  })

  onActivated(() => {
    if (currentTarget)
      currentTarget.addEventListener('scroll', handleScroll, { passive: true })

    last = -1
    updateScroll({ force: true })
  })

  onDeactivated(() => {
    showBackTop.value = false
    cleanupTarget()
  })

  onUnmounted(() => {
    cleanupTarget()
    cleanupAnchor()
  })

  return {
    showBackTop,
    scrollToTop,
    setTarget,
    setAnchor,
    updateScroll,
  }
}
