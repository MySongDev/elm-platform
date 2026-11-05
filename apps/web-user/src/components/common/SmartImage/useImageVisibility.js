import { toValue } from 'vue'

/**
 * 观察元素是否进入「视口 + rootMargin」区域，并要求停留满 loadDelay 毫秒才算真正进入。
 *
 * 停留时间是为了快速滑动：图片只是一闪而过时，计时器在离开时被清掉，onEnter 不会触发，
 * 也就不会发出请求。进入后又离开则调用 onLeave，让调用方撤掉还在排队的任务。
 */
export function useImageVisibility(options) {
  const {
    target,
    rootMargin,
    loadDelay,
    onEnter,
    onLeave,
  } = options

  let observer = null
  let delayTimer = null

  function clearDelay() {
    if (delayTimer === null)
      return
    clearTimeout(delayTimer)
    delayTimer = null
  }

  function onChange(hit) {
    clearDelay()

    if (!hit) {
      onLeave()
      return
    }

    const delay = toValue(loadDelay)
    if (!delay) {
      onEnter()
      return
    }

    delayTimer = setTimeout(() => {
      delayTimer = null
      onEnter()
    }, delay)
  }

  function stop() {
    clearDelay()
    observer?.disconnect()
    observer = null
  }

  function start() {
    stop()

    const element = toValue(target)
    if (!element)
      return

    if (typeof IntersectionObserver !== 'function') {
      onEnter()
      return
    }

    observer = new IntersectionObserver(
      entries => onChange(entries.some(entry => entry.isIntersecting)),
      {
        rootMargin: toValue(rootMargin),
        threshold: 0.01,
      },
    )
    observer.observe(element)
  }

  return {
    start,
    stop,
  }
}
