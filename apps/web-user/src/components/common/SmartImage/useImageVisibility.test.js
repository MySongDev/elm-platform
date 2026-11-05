import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useImageVisibility } from './useImageVisibility'

class FakeIntersectionObserver {
  static instances = []

  constructor(callback, options) {
    this.callback = callback
    this.options = options
    FakeIntersectionObserver.instances.push(this)
  }

  observe = vi.fn()
  disconnect = vi.fn()

  trigger(isIntersecting) {
    this.callback([{ isIntersecting }])
  }
}

function createSubject(overrides = {}) {
  const actions = {
    onEnter: vi.fn(),
    onLeave: vi.fn(),
  }
  const subject = useImageVisibility({
    target: () => document.createElement('div'),
    rootMargin: () => '0px 0px 200px 0px',
    loadDelay: () => 150,
    ...actions,
    ...overrides,
  })
  return {
    actions,
    subject,
  }
}

describe('useImageVisibility', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    FakeIntersectionObserver.instances.length = 0
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('快速离开时取消延迟且不触发进入', () => {
    const { actions, subject } = createSubject()
    subject.start()
    const observer = FakeIntersectionObserver.instances[0]

    observer.trigger(true)
    observer.trigger(false)
    vi.advanceTimersByTime(150)

    expect(actions.onEnter).not.toHaveBeenCalled()
    expect(actions.onLeave).toHaveBeenCalledOnce()
  })

  it('停留满延迟后才触发进入', () => {
    const { actions, subject } = createSubject()
    subject.start()

    FakeIntersectionObserver.instances[0].trigger(true)
    vi.advanceTimersByTime(149)
    expect(actions.onEnter).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(actions.onEnter).toHaveBeenCalledOnce()
  })

  it('缺少 IntersectionObserver 时立即加载', () => {
    vi.stubGlobal('IntersectionObserver', undefined)
    const { actions, subject } = createSubject()

    subject.start()

    expect(actions.onEnter).toHaveBeenCalledOnce()
  })

  it('stop 会清理观察器和未触发定时器', () => {
    const { actions, subject } = createSubject()
    subject.start()
    FakeIntersectionObserver.instances[0].trigger(true)

    subject.stop()
    vi.advanceTimersByTime(150)

    expect(FakeIntersectionObserver.instances).toHaveLength(1)
    expect(FakeIntersectionObserver.instances[0].disconnect).toHaveBeenCalledOnce()
    expect(actions.onEnter).not.toHaveBeenCalled()
  })
})
