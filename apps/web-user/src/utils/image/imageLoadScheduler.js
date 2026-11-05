import { IMAGE_LOAD_BASE_CONCURRENCY } from '@/config/imageLoading'

/**
 * 全局图片加载调度：限制同时进行中的请求数量，其余按先来后到排队。
 *
 * 说明：
 * - `<img src>` 一旦交给浏览器，无法用 AbortController 取消网络；「取消」仅表示不再入队/不再赋值 src。
 * - 列表项卸载或滑出时调用返回的 cancel()，避免排到后才给已经看不见的 DOM 赋值。
 */

const maxConcurrent = Math.max(1, IMAGE_LOAD_BASE_CONCURRENCY)
let active = 0

/** @type {Array<{ state: 'queued' | 'running' | 'settled' | 'cancelled', run: (release: () => void) => void }>} */
const queue = []

function pump() {
  while (active < maxConcurrent && queue.length > 0) {
    const task = queue.shift()
    if (task.state !== 'queued')
      continue

    task.state = 'running'
    active++
    let released = false
    const release = () => {
      if (released)
        return

      released = true
      task.state = 'settled'
      active--
      pump()
    }

    try {
      task.run(release)
    }
    catch {
      release()
    }
  }
}

/**
 * @param {{ run: (release: () => void) => void }} opts
 * @returns {{ cancel: () => void }} cancel 只撤掉还在排队的任务，已开始的不受影响
 */
export function scheduleImageTask({ run }) {
  const task = {
    state: 'queued',
    run,
  }

  queue.push(task)
  pump()

  return {
    cancel() {
      if (task.state !== 'queued')
        return

      task.state = 'cancelled'
      const index = queue.indexOf(task)
      if (index !== -1)
        queue.splice(index, 1)
    },
  }
}
