import { beforeEach, describe, expect, it, vi } from 'vitest'

async function createScheduler() {
  vi.resetModules()
  const scheduler = await import('./imageLoadScheduler.js')
  scheduler.setImageLoadMaxConcurrent(1)
  return scheduler
}

describe('imageLoadScheduler', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('promotes a queued task after its priority changes', async () => {
    const { scheduleImageTask } = await createScheduler()
    const order = []
    let releaseBlocking

    scheduleImageTask({
      run(release) {
        order.push('blocking')
        releaseBlocking = release
      },
    })
    scheduleImageTask({
      priority: 10,
      run(release) {
        order.push('preload')
        release()
      },
    })
    const viewportTask = scheduleImageTask({
      priority: 20,
      run(release) {
        order.push('viewport')
        release()
      },
    })

    viewportTask.updatePriority(-80)
    releaseBlocking()

    expect(order).toEqual(['blocking', 'viewport', 'preload'])
  })

  it('does not run a cancelled queued task', async () => {
    const { scheduleImageTask } = await createScheduler()
    const order = []
    let releaseBlocking

    scheduleImageTask({
      run(release) {
        releaseBlocking = release
      },
    })
    const queuedTask = scheduleImageTask({
      run(release) {
        order.push('cancelled')
        release()
      },
    })

    queuedTask.cancel()
    releaseBlocking()

    expect(order).toEqual([])
  })

  it('does not interrupt or duplicate a running task', async () => {
    const { scheduleImageTask } = await createScheduler()
    let runs = 0
    let releaseRunning

    const task = scheduleImageTask({
      run(release) {
        runs++
        releaseRunning = release
      },
    })

    task.updatePriority(-100)
    task.cancel()
    releaseRunning()
    releaseRunning()

    expect(runs).toBe(1)
  })
})
