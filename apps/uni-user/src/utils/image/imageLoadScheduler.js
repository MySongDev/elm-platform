// ⚠️ 与 apps/web-user/src/utils/image/imageLoadScheduler.js 同源，修改需同步两处。
// 不抽共享包的原因见迁移方案议题 7。
//
// ★ 与 web-user 的差异：
// 1. **删除 preloadImageUrl** —— 它用 `new Image()`（小程序端无此构造器），
//    且实测**业务代码零调用**（仅自身测试调用）。方案「测试策略」已预见：
//    「SmartImage 体系重写后，若调度器职责收缩为纯并发控制，测试覆盖面要相应调整」。
//    将来若真要预加载，用 uni.getImageInfo（会触发下载+缓存）另做。
// 2. navigator.connection / window 的 typeof 保护**保留**（端无关，node 测试环境也靠它）。
//    ⚠️ 小程序端 navigator 存在但 connection 通常为 undefined → 走 base 并发数。
// 3. 并发基础值从 @/config 取（web-user 从 config/imageLoading 取，同源同值）。
//
// 职责（D3 退化方案后）：纯并发控制 + 优先级出队。
// 「视口内提优先级」已废弃（IMAGE_VIEWPORT_PRIORITY_OFFSET 不再使用，
// 小程序无 IntersectionObserver；是否恢复列入 Batch 5 O3，且要先评估收益）。

import { IMAGE_LOAD_BASE_CONCURRENCY } from '@/config'

let maxConcurrent = resolveAdaptiveMax(IMAGE_LOAD_BASE_CONCURRENCY)
let active = 0

/** @type {Array<{ priority: number, state: 'queued' | 'running' | 'settled' | 'cancelled', run: (release: () => void) => void }>} */
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

function refreshMaxFromNetwork() {
  maxConcurrent = resolveAdaptiveMax(IMAGE_LOAD_BASE_CONCURRENCY)
  pump()
}

if (typeof window !== 'undefined' && navigator.connection) {
  navigator.connection.addEventListener('change', refreshMaxFromNetwork)
}

/**
 * @param {{ priority?: number, run: (release: () => void) => void }} opts
 * @returns {{ cancel: () => void, updatePriority: (priority: number) => void }}
 */
export function scheduleImageTask({ priority = 10, run }) {
  const task = {
    priority,
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
      pump()
    },
    updatePriority(nextPriority) {
      if (task.state !== 'queued')
        return

      task.priority = nextPriority
      pump()
    },
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
