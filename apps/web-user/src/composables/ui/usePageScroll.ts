import type { Ref, ShallowRef } from 'vue'
import { nextTick, onActivated, onDeactivated, onMounted, onUnmounted, shallowRef } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'

interface UsePageScrollOptions {
  threshold?: number
  containerRef?: Ref<HTMLElement | null> | null
}

interface UsePageScrollReturn {
  showBackTop: ShallowRef<boolean>
  scrollToTop: () => void
  scrollY: ShallowRef<number>
  activeScrollTarget: ShallowRef<string | null>
}

export function usePageScroll(options: UsePageScrollOptions = {}): UsePageScrollReturn {
  const { threshold = 500, containerRef = null } = options

  const activeScrollTarget = shallowRef<string | null>(null)
  const showBackTop = shallowRef(false)
  const scrollY = shallowRef(0)

  let rafId: number | null = null
  let isRestoring = false

  const getScrollTop = (): number => {
    if (containerRef?.value) {
      return containerRef.value.scrollTop
    }
    return window.scrollY || document.documentElement.scrollTop
  }

  const isContainerScrollable = (): boolean => {
    if (!containerRef?.value)
      return false
    const el = containerRef.value
    return el.scrollHeight > el.clientHeight
  }

  const handleScroll = (source: string) => {
    if (rafId || isRestoring)
      return

    rafId = requestAnimationFrame(() => {
      const current = getScrollTop()
      scrollY.value = current
      showBackTop.value = current > threshold
      activeScrollTarget.value = source
      rafId = null
    })
  }

  const scrollTo = (top: number, behavior: ScrollBehavior = 'auto') => {
    if (containerRef?.value && isContainerScrollable()) {
      containerRef.value.scrollTo({
        top,
        behavior,
      })
    }
    else {
      window.scrollTo({
        top,
        behavior,
      })
    }
  }

  const scrollToTop = () => {
    scrollTo(0, 'smooth')
  }

  const start = () => {
    if (containerRef?.value) {
      containerRef.value.addEventListener('scroll', () => handleScroll('container'), {
        passive: true,
      })
    }
    window.addEventListener('scroll', () => handleScroll('window'), { passive: true })
  }

  const stop = () => {
    if (containerRef?.value) {
      containerRef.value.removeEventListener('scroll', () => handleScroll('container'))
    }
    window.removeEventListener('scroll', () => handleScroll('window'))
    if (rafId)
      cancelAnimationFrame(rafId)
  }

  onBeforeRouteLeave(() => {
    scrollY.value = getScrollTop()
  })

  const performRestore = async () => {
    await nextTick()
    isRestoring = true

    requestAnimationFrame(() => {
      scrollTo(scrollY.value, 'instant')
      setTimeout(() => {
        isRestoring = false
        start()
      }, 50)
    })
  }

  onMounted(performRestore)
  onActivated(performRestore)
  onUnmounted(stop)
  onDeactivated(stop)

  return {
    showBackTop,
    scrollToTop,
    scrollY,
    activeScrollTarget,
  }
}
