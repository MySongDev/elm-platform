import { IMAGE_LOAD_BASE_CONCURRENCY } from '@/config/imageLoading'

/**
 * 全局图片加载调度：限制同时进行中的请求数量、按优先级出队。
 *
 * 说明：
 * - `<img src>` 一旦交给浏览器，无法用 AbortController 取消网络；「取消」仅表示不再入队/不再赋值 src。
 * - 虚拟列表场景：项卸载时调用返回的 cancel()，避免在队列里排到后才给已回收的 DOM 赋值。
 */

let maxConcurrent = resolveAdaptiveMax(IMAGE_LOAD_BASE_CONCURRENCY)
let active = 0

/** @type {Array<{ priority: number, cancelled: () => boolean, run: (release: () => void) => void }>} */
const queue = []

function resolveAdaptiveMax(base) {
  if (typeof navigator === 'undefined')
    return base

  const c = navigator.connection
  if (!c)
    return base

  if (c.saveData)
    return Math.max(2, Math.floor(base / 3))

  const t = c.effectiveType
  if (t === 'slow-2g')
    return 2
  if (t === '2g')
    return 3
  if (t === '3g')
    return Math.max(4, Math.floor(base / 2))

  return base
}

function pump() {
  queue.sort((a, b) => a.priority - b.priority)

  while (active < maxConcurrent && queue.length > 0) {
    const task = queue.shift()
    if (task.cancelled())
      continue

    active++
    task.run(() => {
      active--
      pump()
    })
  }
}

function refreshMaxFromNetwork() {
  maxConcurrent = resolveAdaptiveMax(IMAGE_LOAD_BASE_CONCURRENCY)
  pump()
}

if (typeof window !== 'undefined' && navigator.connection) {
  navigator.connection.addEventListener('change', refreshMaxFromNetwork)
}

/**
 * @param {{ priority?: number, run: (release: () => void) => void }} opts
 * @returns {() => void} cancel — 标记取消；若已在队列中则跳过，若已执行则无法中断浏览器加载
 */
export function scheduleImageTask({ priority = 10, run }) {
  let cancelled = false

  const task = {
    priority,
    cancelled: () => cancelled,
    run,
  }

  queue.push(task)
  pump()

  return () => {
    cancelled = true
  }
}

export function getImageLoadMaxConcurrent() {
  return maxConcurrent
}

/** 手动覆盖上限（单测或特殊页可用） */
export function setImageLoadMaxConcurrent(n) {
  maxConcurrent = Math.max(1, n)
  pump()
}

/**
 * 预加载（隐藏 Image），仍走同一调度与优先级
 * @returns {{ promise: Promise<void>, cancel: () => void }} Promise 在加载完成时 resolve；cancel 用于取消排队中的任务
 */
export function preloadImageUrl(url, { priority = 0 } = {}) {
  let cancel = () => {}

  const promise = new Promise((resolve, reject) => {
    cancel = scheduleImageTask({
      priority,
      run(release) {
        const img = new Image()
        img.onload = () => {
          img.onload = img.onerror = null
          release()
          resolve()
        }
        img.onerror = () => {
          img.onload = img.onerror = null
          release()
          reject(new Error(`preload failed: ${url}`))
        }
        img.src = url
      },
    })
  })

  return { promise, cancel }
}
