import { IMAGE_PRIORITY } from '@/config/imageLoading'
import { scheduleImageTask } from '@/utils/imageLoadScheduler'

// 并发加载上限
const MAX_CONCURRENT = 8

// 透明占位 GIF（避免 img 无 src 时显示裂图）
const TRANSPARENT_GIF = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
// const TRANSPARENT_GIF = './loading.gif'
// 默认失败占位图
const ERROR_PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23f0f0f0" width="100" height="100"/%3E%3Ctext fill="%23aaa" font-size="14" x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"%3E加载失败%3C/text%3E%3C/svg%3E'

const imgMap = new Map()
const elPriority = new WeakMap()
const pendingCancel = new WeakMap()
const delayTimer = new WeakMap()

let observer = null

const queue = []
let activeCount = 0

function readPriority(binding) {
  if (binding.modifiers.critical)
    return IMAGE_PRIORITY.CRITICAL
  if (binding.modifiers.fold || binding.modifiers.above)
    return IMAGE_PRIORITY.ABOVE_THE_FOLD
  return IMAGE_PRIORITY.NORMAL
}

// 清除元素上由本指令添加的状态（包括透明占位）
function clearElementState(el) {
  el.classList.remove('img-loading', 'img-error')
  if (el.src === ERROR_PLACEHOLDER || el.src === TRANSPARENT_GIF) {
    el.removeAttribute('src')
  }
}

function processQueue() {
  if (activeCount >= MAX_CONCURRENT || queue.length === 0)
    return

  queue.sort((a, b) => a.priority - b.priority)
  const task = queue.shift()
  activeCount++

  const { el, src, priority } = task

  // 开始真正加载，确保加载类存在（可能由延迟阶段已添加）
  el.classList.add('img-loading')
  el.classList.remove('img-error')
  if (!el.src || el.src === ERROR_PLACEHOLDER) {
    el.src = TRANSPARENT_GIF
  }

  const cancel = scheduleImageTask({
    priority,
    run(release) {
      const onLoad = () => {
        el.onload = el.onerror = null
        el.classList.remove('img-loading', 'img-error')
        release()
        activeCount--
        processQueue()
      }
      const onError = () => {
        el.onload = el.onerror = null
        el.classList.remove('img-loading')
        el.classList.add('img-error')
        el.src = ERROR_PLACEHOLDER
        release()
        activeCount--
        processQueue()
      }
      el.onload = onLoad
      el.onerror = onError
      el.src = src
    },
  })
  pendingCancel.set(el, cancel)
}

function enqueue(el, src, priority) {
  queue.push({ el, src, priority })
  processQueue()
}

function cancelElement(el) {
  const timer = delayTimer.get(el)
  if (timer) {
    clearTimeout(timer)
    delayTimer.delete(el)
  }

  pendingCancel.get(el)?.()
  pendingCancel.delete(el)

  clearElementState(el)
}

function getObserver() {
  if (observer)
    return observer

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const el = entry.target
        const src = imgMap.get(el)
        if (!src)
          return

        if (entry.isIntersecting) {
          // ✅ 进入视口：立即显示加载态，并设透明占位
          el.classList.add('img-loading')
          el.classList.remove('img-error')
          if (!el.src || el.src === ERROR_PLACEHOLDER) {
            el.src = TRANSPARENT_GIF
          }

          const delay = 200
          const timer = setTimeout(() => {
            delayTimer.delete(el)
            observer.unobserve(el)
            imgMap.delete(el)
            const priority = elPriority.get(el) ?? IMAGE_PRIORITY.NORMAL
            enqueue(el, src, priority)
          }, delay)
          delayTimer.set(el, timer)
        }
        else {
          // ✅ 离开视口：如果还在延迟等待，取消定时器并移除加载态
          const timer = delayTimer.get(el)
          if (timer) {
            clearTimeout(timer)
            delayTimer.delete(el)
            el.classList.remove('img-loading')
            if (el.src === TRANSPARENT_GIF) {
              el.removeAttribute('src')
            }
          }
        }
      })
    },
    {
      rootMargin: '0px 0px 200px 0px',
      threshold: 0.01,
    },
  )

  return observer
}

export default {
  mounted(el, binding) {
    elPriority.set(el, readPriority(binding))
    imgMap.set(el, binding.value)
    getObserver().observe(el)
  },

  updated(el, binding) {
    if (binding.value === binding.oldValue)
      return

    cancelElement(el)
    el.removeAttribute('src')
    el.onload = el.onerror = null

    elPriority.set(el, readPriority(binding))
    imgMap.set(el, binding.value)
    getObserver().observe(el)
  },

  unmounted(el) {
    cancelElement(el)
    elPriority.delete(el)
    if (observer)
      observer.unobserve(el)
    imgMap.delete(el)
  },
}
