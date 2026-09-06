import { effectScope, nextTick, shallowRef } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useSmartImage } from './useSmartImage'

const mocks = vi.hoisted(() => ({
  visibilityOptions: null,
  task: null,
}))

vi.mock('./useImageVisibilityPriority', () => ({
  useImageVisibilityPriority: vi.fn((options) => {
    mocks.visibilityOptions = options
    return {
      start: vi.fn(),
      stop: vi.fn(),
    }
  }),
}))

vi.mock('@/utils/image/imageCandidates', () => ({
  buildImageCandidateUrls: vi.fn(() => ['primary.jpg', 'fallback.jpg']),
}))

vi.mock('@/utils/image/imageLoadScheduler', () => ({
  scheduleImageTask: vi.fn((options) => {
    mocks.task = {
      options,
      cancel: vi.fn(),
      updatePriority: vi.fn(),
    }
    return mocks.task
  }),
}))

function createSubject() {
  const scope = effectScope()
  const src = shallowRef('source.jpg')
  const img = document.createElement('img')
  const onLoad = vi.fn()
  const onError = vi.fn()
  const subject = scope.run(() => useSmartImage({
    src,
    eager: () => false,
    priority: () => 10,
    rootMargin: () => '0px 0px 200px 0px',
    loadDelay: () => 150,
    rootEl: () => document.createElement('div'),
    imgEl: () => img,
    onLoad,
    onError,
  }))
  return { img, onError, onLoad, scope, src, subject }
}

describe('useSmartImage', () => {
  beforeEach(() => {
    mocks.visibilityOptions = null
    mocks.task = null
  })

  it('成功加载当前候选并报告真实 URL', () => {
    const { img, onLoad, subject } = createSubject()
    mocks.visibilityOptions.loadNow(-90)
    mocks.task.options.run(vi.fn())

    img.onload()

    expect(subject.loaded.value).toBe(true)
    expect(subject.failed.value).toBe(false)
    expect(onLoad).toHaveBeenCalledWith({ src: 'primary.jpg' })
  })

  it('当前候选失败后调度下一个候选', () => {
    const { img } = createSubject()
    mocks.visibilityOptions.loadNow(10)
    mocks.task.options.run(vi.fn())

    img.onerror()
    mocks.task.options.run(vi.fn())

    expect(img.src).toContain('fallback.jpg')
  })

  it('候选耗尽后进入失败状态', () => {
    const { img, onError, subject } = createSubject()
    mocks.visibilityOptions.loadNow(10)
    mocks.task.options.run(vi.fn())
    img.onerror()
    mocks.task.options.run(vi.fn())
    img.onerror()

    expect(subject.failed.value).toBe(true)
    expect(onError).toHaveBeenCalledWith({ src: 'fallback.jpg' })
  })

  it('src 更新时重置状态并清理旧任务', async () => {
    const { img, src, subject } = createSubject()
    mocks.visibilityOptions.schedule(10)

    src.value = 'next.jpg'
    await nextTick()

    expect(mocks.task.cancel).toHaveBeenCalledOnce()
    expect(subject.loaded.value).toBe(false)
    expect(subject.failed.value).toBe(false)
    expect(img.hasAttribute('src')).toBe(false)
  })
})
