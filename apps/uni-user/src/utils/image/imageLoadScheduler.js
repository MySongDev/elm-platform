// ⚠️ 与 apps/web-user/src/utils/image/imageLoadScheduler.js 同源，修改需同步两处。
// 不抽共享包的原因见迁移方案议题 7。
//
// ★ 与 web-user 的差异：并发基础值从 @/config 取（web-user 从 config/imageLoading 取，同值 6）。
//
// 职责：纯并发控制，先来先出。2026-11-06 与 web-user 一起删掉了优先级排序、
// 网络自适应并发（小程序端 navigator.connection 通常为 undefined，本来就不生效）
// 和 get/setImageLoadMaxConcurrent（无调用方）。

import { IMAGE_LOAD_BASE_CONCURRENCY } from '@/config'

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
