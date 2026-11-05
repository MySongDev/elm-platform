import {
  nextTick,
  onScopeDispose,
  readonly,
  shallowRef,
  toValue,
  watch,
} from 'vue'
import { scheduleImageTask } from '@/utils/image/imageLoadScheduler'
import { useImageVisibility } from './useImageVisibility'

export function useSmartImage(options) {
  const {
    src,
    rootMargin,
    loadDelay,
    rootEl,
    imgEl,
  } = options

  const loaded = shallowRef(false)
  const failed = shallowRef(false)

  let imageTask = null
  // 浏览器已经在下载时，这里保存调度器给的 release，用来归还并发名额
  let releaseSlot = null

  function clearImageHandlers() {
    const image = toValue(imgEl)
    if (!image)
      return
    image.onload = null
    image.onerror = null
  }

  // 离开可视区：只撤掉还在排队的任务。已经开始下载的请求无法取消，让它下完。
  function cancelQueued() {
    imageTask?.cancel()
    imageTask = null
  }

  // src 变化或组件卸载：排队的撤掉，下载中的也要归还名额，否则这个名额会一直被占着
  function abort() {
    cancelQueued()
    clearImageHandlers()
    releaseSlot?.()
    releaseSlot = null
  }

  function settle(ok) {
    clearImageHandlers()
    releaseSlot?.()
    releaseSlot = null
    imageTask = null
    loaded.value = ok
    failed.value = !ok
  }

  function load() {
    if (loaded.value || failed.value || imageTask || releaseSlot)
      return

    const url = toValue(src)
    const image = toValue(imgEl)
    if (!url || !image) {
      failed.value = true
      return
    }

    imageTask = scheduleImageTask({
      run(release) {
        releaseSlot = release
        image.onload = () => settle(true)
        image.onerror = () => settle(false)
        image.src = url
      },
    })
  }

  const visibility = useImageVisibility({
    target: rootEl,
    rootMargin,
    loadDelay,
    onEnter: load,
    onLeave: cancelQueued,
  })

  watch(
    () => toValue(src),
    () => {
      visibility.stop()
      abort()
      loaded.value = false
      failed.value = false
      toValue(imgEl)?.removeAttribute('src')
      nextTick(visibility.start)
    },
  )

  nextTick(visibility.start)
  onScopeDispose(() => {
    visibility.stop()
    abort()
  })

  return {
    loaded: readonly(loaded),
    failed: readonly(failed),
  }
}
