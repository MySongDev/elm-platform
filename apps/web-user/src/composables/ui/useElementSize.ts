import type { Ref } from 'vue'
import { onDeactivated, onUnmounted, ref } from 'vue'

interface UseElementSizeReturn {
  elRef: (el: HTMLElement | null) => void
  height: Ref<number>
  width: Ref<number>
}

export function useElementSize(): UseElementSizeReturn {
  const height = ref(0)
  const width = ref(0)
  let currentEl: HTMLElement | null = null

  const observer = new ResizeObserver((entries) => {
    const entry = entries[0]
    if (entry) {
      height.value = entry.contentBoxSize?.[0]?.blockSize ?? entry.contentRect.height
      width.value = entry.contentBoxSize?.[0]?.inlineSize ?? entry.contentRect.width
    }
  })

  const elRef = (el: HTMLElement | null) => {
    if (currentEl) {
      observer.unobserve(currentEl)
    }
    if (el) {
      observer.observe(el)
      currentEl = el
    }
    else {
      currentEl = null
    }
  }

  onUnmounted(() => observer.disconnect())
  onDeactivated(() => observer.disconnect())

  return {
    elRef,
    height,
    width,
  }
}
