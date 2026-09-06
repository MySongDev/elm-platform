import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useImageVisibilityPriority } from './useImageVisibilityPriority'

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
    schedule: vi.fn(),
    loadNow: vi.fn(),
    updatePriority: vi.fn(),
    cancelPending: vi.fn(),
  }
  const subject = useImageVisibilityPriority({
    target: () => document.createElement('div'),
    eager: () => false,
    rootMargin: () => '0px 0px 200px 0px',
    loadDelay: () => 150,
    priority: () => 10,
    viewportPriorityOffset: -100,
    ...actions,
    ...overrides,
  })
  return {
    actions,
    subject,
  }
}

describe('useImageVisibilityPriority', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    FakeIntersectionObserver.instances.length = 0
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('快速离开预加载区时取消延迟且不排队', () => {
    const { actions, subject } = createSubject()
    subject.start()
    const preload = FakeIntersectionObserver.instances[0]

    preload.trigger(true)
    preload.trigger(false)
    vi.advanceTimersByTime(150)

    expect(actions.schedule).not.toHaveBeenCalled()
    expect(actions.cancelPending).toHaveBeenCalledOnce()
  })

  it('进入和离开真实视口时升降优先级', () => {
    const { actions, subject } = createSubject({ loadDelay: () => 0 })
    subject.start()
    const [preload, viewport] = FakeIntersectionObserver.instances

    preload.trigger(true)
    viewport.trigger(true)
    viewport.trigger(false)

    expect(actions.schedule).toHaveBeenCalledWith(10)
    expect(actions.loadNow).toHaveBeenCalledWith(-90)
    expect(actions.updatePriority).toHaveBeenLastCalledWith(10)
  })

  it('缺少 IntersectionObserver 时立即加载', () => {
    vi.stubGlobal('IntersectionObserver', undefined)
    const { actions, subject } = createSubject()

    subject.start()

    expect(actions.loadNow).toHaveBeenCalledWith(10)
  })

  it('eager 模式跳过观察器并立即加载', () => {
    const { actions, subject } = createSubject({ eager: () => true })

    subject.start()

    expect(actions.loadNow).toHaveBeenCalledWith(10)
    expect(FakeIntersectionObserver.instances).toHaveLength(0)
  })

  it('stop 会清理两个观察器和未触发定时器', () => {
    const { actions, subject } = createSubject()
    subject.start()
    FakeIntersectionObserver.instances[0].trigger(true)

    subject.stop()
    vi.advanceTimersByTime(150)

    expect(FakeIntersectionObserver.instances).toHaveLength(2)
    expect(FakeIntersectionObserver.instances[0].disconnect).toHaveBeenCalledOnce()
    expect(FakeIntersectionObserver.instances[1].disconnect).toHaveBeenCalledOnce()
    expect(actions.schedule).not.toHaveBeenCalled()
  })
})
