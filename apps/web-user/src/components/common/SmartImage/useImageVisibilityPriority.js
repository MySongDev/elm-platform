import { toValue } from 'vue'

export function useImageVisibilityPriority(options) {
  const {
    target,
    eager,
    rootMargin,
    loadDelay,
    priority,
    viewportPriorityOffset,
    schedule,
    loadNow,
    updatePriority,
    cancelPending,
  } = options

  let preloadObserver = null
  let viewportObserver = null
  let delayTimer = null
  let inPreloadZone = false
  let inViewport = false

  function clearDelay() {
    if (delayTimer === null)
      return
    clearTimeout(delayTimer)
    delayTimer = null
  }

  function currentPriority() {
    return toValue(priority)
      + (inViewport ? viewportPriorityOffset : 0)
  }

  function onPreloadChange(hit) {
    inPreloadZone = hit
    clearDelay()

    if (!hit) {
      cancelPending()
      return
    }

    if (!toValue(loadDelay)) {
      if (inViewport)
        loadNow(currentPriority())
      else
        schedule(currentPriority())
      return
    }

    delayTimer = setTimeout(() => {
      delayTimer = null
      if (inPreloadZone)
        schedule(currentPriority())
    }, toValue(loadDelay))
  }

  function onViewportChange(hit) {
    inViewport = hit
    if (hit) {
      clearDelay()
      loadNow(currentPriority())
      return
    }
    updatePriority(toValue(priority))
  }

  function stop() {
    clearDelay()
    preloadObserver?.disconnect()
    viewportObserver?.disconnect()
    preloadObserver = null
    viewportObserver = null
    inPreloadZone = false
    inViewport = false
  }

  function start() {
    stop()
    if (toValue(eager)) {
      loadNow(toValue(priority))
      return
    }

    const element = toValue(target)
    if (!element)
      return

    if (typeof IntersectionObserver !== 'function') {
      loadNow(toValue(priority))
      return
    }

    preloadObserver = new IntersectionObserver(
      entries => onPreloadChange(entries.some(entry => entry.isIntersecting)),
      {
        rootMargin: toValue(rootMargin),
        threshold: 0.01,
      },
    )
    viewportObserver = new IntersectionObserver(
      entries => onViewportChange(entries.some(entry => entry.isIntersecting)),
      {
        rootMargin: '0px',
        threshold: 0.01,
      },
    )
    preloadObserver.observe(element)
    viewportObserver.observe(element)
  }

  return {
    start,
    stop,
  }
}
