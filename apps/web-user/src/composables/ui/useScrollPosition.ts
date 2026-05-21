import type { Ref } from 'vue'
import { nextTick, onActivated, onMounted, ref } from 'vue'
import { onBeforeRouteLeave, useRoute } from 'vue-router'

export function useScrollPosition(containerRef: Ref<HTMLElement | null> | null = null) {
  const route = useRoute()
  const key = route.fullPath
  const scrollY = ref(0)

  const save = (value: number) => {
    sessionStorage.setItem(`scroll:${key}`, String(value))
    scrollY.value = value
  }

  const load = (): number => {
    const raw = sessionStorage.getItem(`scroll:${key}`)
    return raw ? Number.parseInt(raw, 10) : 0
  }

  const getScrollTop = (): number => {
    const el = containerRef?.value
    return el ? el.scrollTop : window.scrollY
  }

  const restore = async () => {
    const target = load()
    if (!target)
      return

    await nextTick()
    requestAnimationFrame(() => {
      const el = containerRef?.value
      if (el) {
        el.scrollTo({ top: target, behavior: 'instant' })
      }
      else {
        window.scrollTo({ top: target, behavior: 'instant' })
      }
    })
  }

  onBeforeRouteLeave(() => {
    save(getScrollTop())
  })

  onMounted(() => restore())
  onActivated(() => restore())

  return {
    scrollY,
    saveNow: () => save(getScrollTop()),
  }
}
