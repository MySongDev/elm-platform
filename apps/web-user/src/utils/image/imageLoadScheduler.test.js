import { beforeEach, describe, expect, it, vi } from 'vitest'

async function createScheduler() {
  vi.doMock('@/config/imageLoading', () => ({ IMAGE_LOAD_BASE_CONCURRENCY: 1 }))
  return import('./imageLoadScheduler.js')
}

describe('imageLoadScheduler', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('runs queued tasks in arrival order', async () => {
    const { scheduleImageTask } = await createScheduler()
    const order = []
    let releaseBlocker

    scheduleImageTask({
      run(release) {
        releaseBlocker = release
      },
    })
    scheduleImageTask({
      run(release) {
        order.push('first')
        release()
      },
    })
    scheduleImageTask({
      run(release) {
        order.push('second')
        release()
      },
    })

    releaseBlocker()

    expect(order).toEqual(['first', 'second'])
  })

  it('continues queued work when a task throws synchronously', async () => {
    const { scheduleImageTask } = await createScheduler()
    const following = vi.fn()
    let releaseBlocker

    scheduleImageTask({
      run(release) {
        releaseBlocker = release
      },
    })
    scheduleImageTask({
      run() {
        throw new Error('bad image task')
      },
    })
    scheduleImageTask({
      run(release) {
        following()
        release()
      },
    })

    expect(() => releaseBlocker()).not.toThrow()
    expect(following).toHaveBeenCalledTimes(1)
  })

  it('does not run a cancelled queued task', async () => {
    const { scheduleImageTask } = await createScheduler()
    const queuedRun = vi.fn()
    let releaseBlocker

    scheduleImageTask({
      run(release) {
        releaseBlocker = release
      },
    })
    const queued = scheduleImageTask({ run: queuedRun })

    queued.cancel()
    releaseBlocker()

    expect(queuedRun).not.toHaveBeenCalled()
  })

  it('does not interrupt or rerun a running task when cancelled', async () => {
    const { scheduleImageTask } = await createScheduler()
    const running = vi.fn()
    const following = vi.fn()
    let releaseRunning

    const handle = scheduleImageTask({
      run(release) {
        running()
        releaseRunning = release
      },
    })
    scheduleImageTask({
      run(release) {
        following()
        release()
      },
    })

    handle.cancel()
    handle.cancel()

    expect(running).toHaveBeenCalledTimes(1)
    expect(following).not.toHaveBeenCalled()

    releaseRunning()

    expect(running).toHaveBeenCalledTimes(1)
    expect(following).toHaveBeenCalledTimes(1)
  })

  it('keeps the active count safe when release is called repeatedly', async () => {
    const { scheduleImageTask } = await createScheduler()
    const order = []
    let releaseFirst
    let releaseSecond

    scheduleImageTask({
      run(release) {
        order.push('first')
        releaseFirst = release
      },
    })
    scheduleImageTask({
      run(release) {
        order.push('second')
        releaseSecond = release
      },
    })
    scheduleImageTask({
      run(release) {
        order.push('third')
        release()
      },
    })

    releaseFirst()
    releaseFirst()

    expect(order).toEqual(['first', 'second'])

    releaseSecond()

    expect(order).toEqual(['first', 'second', 'third'])
  })
})
