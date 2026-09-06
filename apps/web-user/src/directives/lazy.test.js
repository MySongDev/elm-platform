import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

class FakeIntersectionObserver {
  static instances = []

  constructor(callback) {
    this.callback = callback
    this.observed = new Set()
    FakeIntersectionObserver.instances.push(this)
  }

  observe(el) {
    this.observed.add(el)
  }

  unobserve(el) {
    this.observed.delete(el)
  }

  trigger(el, isIntersecting = true) {
    this.callback([{ target: el, isIntersecting }])
  }
}

function createBinding(value, oldValue) {
  return {
    modifiers: {},
    oldValue,
    value,
  }
}

async function createHarness() {
  const scheduler = await import('../utils/image/imageLoadScheduler.js')
  scheduler.setImageLoadMaxConcurrent(1)
  const { default: directive } = await import('./lazy.js')

  return {
    directive,
    scheduler,
  }
}

function mountAndEnter(directive, src) {
  const el = document.createElement('img')
  document.body.append(el)
  directive.mounted(el, createBinding(src))
  FakeIntersectionObserver.instances[0].trigger(el)
  vi.advanceTimersByTime(200)
  return el
}

describe('lazy image directive lifecycle', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.useFakeTimers()
    FakeIntersectionObserver.instances = []
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver)
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
    vi.unstubAllGlobals()
    document.body.innerHTML = ''
  })

  it('does not load an unmounted element left in the local queue', async () => {
    const { directive, scheduler } = await createHarness()
    let releaseBlocker

    scheduler.scheduleImageTask({
      run(release) {
        releaseBlocker = release
      },
    })

    const activeElements = Array.from({ length: 8 }, (_, index) =>
      mountAndEnter(directive, `/active-${index}.png`),
    )
    const queuedEl = mountAndEnter(directive, '/stale-local.png')

    directive.unmounted(queuedEl)
    releaseBlocker()

    activeElements.forEach((el) => {
      expect(el.onload).toBeTypeOf('function')
      el.onload()
    })

    expect(queuedEl.src).not.toContain('/stale-local.png')
  })

  it('schedules a new element after globally queued attempts are cancelled', async () => {
    const { directive, scheduler } = await createHarness()
    let releaseBlocker

    scheduler.scheduleImageTask({
      run(release) {
        releaseBlocker = release
      },
    })

    const cancelledElements = Array.from({ length: 8 }, (_, index) =>
      mountAndEnter(directive, `/cancelled-${index}.png`),
    )

    cancelledElements.forEach(el => directive.unmounted(el))

    const nextEl = mountAndEnter(directive, '/next.png')
    releaseBlocker()

    expect(nextEl.src).toContain('/next.png')
    nextEl.onload?.()
  })

  it('releases a running attempt before loading an updated source', async () => {
    const { directive } = await createHarness()
    const el = mountAndEnter(directive, '/old.png')

    expect(el.src).toContain('/old.png')

    directive.updated(el, createBinding('/new.png', '/old.png'))
    FakeIntersectionObserver.instances[0].trigger(el)
    vi.advanceTimersByTime(200)

    expect(el.src).toContain('/new.png')
    el.onload?.()
  })

  it('returns a task handle that cannot be called as a function', async () => {
    const { scheduler } = await createHarness()
    const handle = scheduler.scheduleImageTask({
      run(release) {
        release()
      },
    })

    expect(() => handle()).toThrow(TypeError)
  })
})
