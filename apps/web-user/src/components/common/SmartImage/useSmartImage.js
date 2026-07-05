import {
  computed,
  nextTick,
  onScopeDispose,
  readonly,
  shallowRef,
  toValue,
  watch,
} from 'vue'
import { IMAGE_VIEWPORT_PRIORITY_OFFSET } from '@/config/imageLoading'
import { buildImageCandidateUrls } from '@/utils/image/imageCandidates'
import { scheduleImageTask } from '@/utils/image/imageLoadScheduler'
import { useImageVisibilityPriority } from './useImageVisibilityPriority'

export function useSmartImage(options) {
  const {
    src,
    eager,
    priority,
    rootMargin,
    loadDelay,
    rootEl,
    imgEl,
    onLoad,
    onError,
  } = options

  const candidates = computed(() => buildImageCandidateUrls(toValue(src)))
  const candidateIndex = shallowRef(0)
  const loaded = shallowRef(false)
  const failed = shallowRef(false)

  let imageTask = null
  let requestStarted = false

  function clearImageHandlers() {
    const image = toValue(imgEl)
    if (!image)
      return
    image.onload = null
    image.onerror = null
  }

  function cancelPending() {
    if (requestStarted)
      return
    imageTask?.cancel()
    imageTask = null
  }

  function finishAttempt() {
    imageTask = null
    requestStarted = false
  }

  function attachHandlers(image, url, release) {
    image.onload = () => {
      clearImageHandlers()
      release()
      finishAttempt()
      loaded.value = true
      failed.value = false
      onLoad({ src: url })
    }
    image.onerror = () => {
      clearImageHandlers()
      release()
      finishAttempt()
      const nextIndex = candidateIndex.value + 1
      if (nextIndex < candidates.value.length) {
        candidateIndex.value = nextIndex
        loadNow(toValue(priority))
        return
      }
      failed.value = true
      onError({ src: url })
    }
  }

  function createTask(taskPriority) {
    const url = candidates.value[candidateIndex.value]
    const image = toValue(imgEl)
    if (!url || !image) {
      failed.value = true
      onError({ src: url || toValue(src) })
      return null
    }

    return scheduleImageTask({
      priority: taskPriority,
      run(release) {
        requestStarted = true
        attachHandlers(image, url, release)
        image.src = url
      },
    })
  }

  function schedule(taskPriority) {
    if (loaded.value || failed.value || requestStarted)
      return
    if (imageTask) {
      imageTask.updatePriority(taskPriority)
      return
    }
    imageTask = createTask(taskPriority)
  }

  function loadNow(taskPriority) {
    if (loaded.value || failed.value || requestStarted)
      return
    if (imageTask) {
      imageTask.updatePriority(taskPriority)
      return
    }
    imageTask = createTask(taskPriority)
  }

  function updatePriority(taskPriority) {
    if (!requestStarted)
      imageTask?.updatePriority(taskPriority)
  }

  const visibility = useImageVisibilityPriority({
    target: rootEl,
    eager,
    rootMargin,
    loadDelay,
    priority,
    viewportPriorityOffset: IMAGE_VIEWPORT_PRIORITY_OFFSET,
    schedule,
    loadNow,
    updatePriority,
    cancelPending,
  })

  function reset() {
    visibility.stop()
    cancelPending()
    clearImageHandlers()
    requestStarted = false
    imageTask = null
    candidateIndex.value = 0
    loaded.value = false
    failed.value = false
    toValue(imgEl)?.removeAttribute('src')
    nextTick(visibility.start)
  }

  watch(
    () => toValue(src)
    ,
    reset,
  )
  watch(
    () => [toValue(eager), toValue(priority)],
    () => {
      if (!loaded.value)
        nextTick(visibility.start)
    },
  )

  nextTick(visibility.start)
  onScopeDispose(() => {
    visibility.stop()
    cancelPending()
    clearImageHandlers()
  })

  return {
    loaded: readonly(loaded),
    failed: readonly(failed),
  }
}
