import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick } from 'vue'
import SmartImage from './SmartImage.vue'

const { scheduled } = vi.hoisted(() => ({
  scheduled: [],
}))

vi.mock('@/utils/image/imageLoadScheduler', () => ({
  scheduleImageTask: vi.fn((options) => {
    const task = {
      options,
      cancel: vi.fn(),
      updatePriority: vi.fn(),
    }
    scheduled.push(task)
    return task
  }),
}))

class FakeIntersectionObserver {
  static instances = []

  constructor(callback, options) {
    this.callback = callback
    this.options = options
    FakeIntersectionObserver.instances.push(this)
  }

  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()

  trigger(isIntersecting) {
    this.callback([{
      isIntersecting,
      target: this.observe.mock.calls[0][0],
    }])
  }
}

async function mountSmartImage(props = {}) {
  const root = document.createElement('div')
  document.body.appendChild(root)
  const app = createApp(SmartImage, {
    src: 'https://img.example.test/a.jpg',
    ...props,
  })
  app.mount(root)
  await nextTick()
  return {
    root,
    unmount() {
      app.unmount()
      root.remove()
    },
  }
}

describe('smartImage viewport priority', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    scheduled.length = 0
    FakeIntersectionObserver.instances.length = 0
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('cancels delayed loading after rapidly leaving the preload zone', async () => {
    const wrapper = await mountSmartImage()
    const preload = FakeIntersectionObserver.instances.find(
      observer => observer.options.rootMargin === '0px 0px 200px 0px',
    )

    preload.trigger(true)
    preload.trigger(false)
    vi.advanceTimersByTime(150)

    expect(scheduled).toHaveLength(0)
    wrapper.unmount()
  })

  it('promotes and demotes a queued task with real viewport visibility', async () => {
    const wrapper = await mountSmartImage({
      loadDelay: 0,
      priority: 10,
    })
    const preload = FakeIntersectionObserver.instances.find(
      observer => observer.options.rootMargin === '0px 0px 200px 0px',
    )
    const viewport = FakeIntersectionObserver.instances.find(
      observer => observer.options.rootMargin === '0px',
    )

    preload.trigger(true)
    vi.runOnlyPendingTimers()
    viewport.trigger(true)
    expect(scheduled[0].updatePriority).toHaveBeenLastCalledWith(-90)

    viewport.trigger(false)
    expect(scheduled[0].updatePriority).toHaveBeenLastCalledWith(10)

    preload.trigger(false)
    expect(scheduled[0].cancel).toHaveBeenCalledOnce()
    wrapper.unmount()
  })

  it('loads immediately when IntersectionObserver is unavailable', async () => {
    vi.stubGlobal('IntersectionObserver', undefined)
    const wrapper = await mountSmartImage()

    expect(scheduled).toHaveLength(1)
    wrapper.unmount()
  })
})
