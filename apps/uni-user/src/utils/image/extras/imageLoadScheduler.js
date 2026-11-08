// 留档模块：2026-11-08 从 uni-user 的 SmartImage 主链路撤下，当前无调用方。
// 原因：原生 lazy-load 等待可见期间不触发 load/error，不能提前占用这里的并发槽。
// 重新启用的前提与步骤见 docs/engineering/014-uni-user-image-scheduler-extras.md。
// web-user 仍在使用其独立副本；本留档模块不要求与 web-user 同步。

// 保留旧并发值方便研究与复用，不再占用全局 config 的无调用方配置项。
const maxConcurrent = 6
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
