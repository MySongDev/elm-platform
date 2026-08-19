import { beforeEach, describe, expect, it, vi } from 'vitest'

async function createScheduler() {
  const scheduler = await import('./imageLoadScheduler.js')
  scheduler.setImageLoadMaxConcurrent(1)
  return scheduler
}

describe('imageLoadScheduler', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('runs a queued task first after its priority is raised', async () => {
    const { scheduleImageTask } = await createScheduler()
    const order = []
    let releaseBlocker

    scheduleImageTask({
      run(release) {
        releaseBlocker = release
      },
    })
    scheduleImageTask({
      priority: 5,
      run(release) {
        order.push('first')
        release()
      },
    })
    const promoted = scheduleImageTask({
      priority: 10,
      run(release) {
        order.push('promoted')
        release()
      },
    })

    promoted.updatePriority(0)
    releaseBlocker()

    expect(order).toEqual(['promoted', 'first'])
  })

  it('runs a later high-priority task before an earlier low-priority task', async () => {
    const { scheduleImageTask } = await createScheduler()
    const order = []
    let releaseBlocker

    scheduleImageTask({
      run(release) {
        releaseBlocker = release
      },
    })
    scheduleImageTask({
      priority: 10,
      run(release) {
        order.push('low')
        release()
      },
    })
    scheduleImageTask({
      priority: 1,
      run(release) {
        order.push('high')
        release()
      },
    })

    releaseBlocker()

    expect(order).toEqual(['high', 'low'])
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

  it('cancels a queued preload through its public cancel function', async () => {
    const { preloadImageUrl, scheduleImageTask } = await createScheduler()
    const OriginalImage = globalThis.Image
    const ImageMock = vi.fn()
    let releaseBlocker

    globalThis.Image = ImageMock

    try {
      scheduleImageTask({
        run(release) {
          releaseBlocker = release
        },
      })
      const preload = preloadImageUrl('/queued-image.png')

      preload.cancel()
      releaseBlocker()

      expect(ImageMock).not.toHaveBeenCalled()
    }
    finally {
      releaseBlocker?.()
      globalThis.Image = OriginalImage
    }
  })

  it('does not interrupt or rerun a running task when updated or cancelled', async () => {
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

    handle.updatePriority(0)
    handle.cancel()
    handle.updatePriority(20)
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
