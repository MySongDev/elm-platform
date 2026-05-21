import type { Ref } from 'vue'
import { onMounted, onUnmounted, ref, watch } from 'vue'

interface UseInfiniteScrollOptions {
  target?: Ref<HTMLElement | null>
  callback: () => void
  loading: Ref<boolean>
  finished: Ref<boolean>
  threshold?: number
}

interface UseInfiniteScrollReturn {
  sentinel: Ref<HTMLElement | null>
}

export function useInfiniteScroll({
  target,
  callback,
  loading,
  finished,
  threshold = 200,
}: UseInfiniteScrollOptions): UseInfiniteScrollReturn {
  const sentinel = ref<HTMLElement | null>(null)
  let observer: IntersectionObserver | null = null

  const init = () => {
    if (observer)
      observer.disconnect()

    observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loading.value && !finished.value) {
          callback()
        }
      },
      {
        root: target?.value || null,
        rootMargin: `0px 0px ${threshold}px 0px`,
      },
    )

    sentinel.value && observer.observe(sentinel.value)
  }

  onMounted(init)
  onUnmounted(() => observer?.disconnect())

  if (target)
    watch(target, init)

  return { sentinel }
}
