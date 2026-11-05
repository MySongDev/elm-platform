import { beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick, shallowRef } from 'vue'
import { useSmartImage } from './useSmartImage'

const mocks = vi.hoisted(() => ({
  visibilityOptions: null,
  task: null,
}))

vi.mock('./useImageVisibility', () => ({
  useImageVisibility: vi.fn((options) => {
    mocks.visibilityOptions = options
    return {
      start: vi.fn(),
      stop: vi.fn(),
    }
  }),
}))

vi.mock('@/utils/image/imageLoadScheduler', () => ({
  scheduleImageTask: vi.fn((options) => {
    mocks.task = {
      options,
      cancel: vi.fn(),
    }
    return mocks.task
  }),
}))

function createSubject() {
  const scope = effectScope()
  const src = shallowRef('source.jpg')
  const img = document.createElement('img')
  const subject = scope.run(() => useSmartImage({
    src,
    rootMargin: () => '0px 0px 200px 0px',
    loadDelay: () => 150,
    rootEl: () => document.createElement('div'),
    imgEl: () => img,
  }))
  return {
    img,
    scope,
    src,
    subject,
  }
}

describe('useSmartImage', () => {
  beforeEach(() => {
    mocks.visibilityOptions = null
    mocks.task = null
  })

  it('加载成功后进入完成状态并归还名额', () => {
    const { img, subject } = createSubject()
    const release = vi.fn()
    mocks.visibilityOptions.onEnter()
    mocks.task.options.run(release)

    img.onload()

    expect(img.src).toContain('source.jpg')
    expect(subject.loaded.value).toBe(true)
    expect(subject.failed.value).toBe(false)
    expect(release).toHaveBeenCalledOnce()
  })

  it('加载失败后进入失败状态', () => {
    const { img, subject } = createSubject()
    mocks.visibilityOptions.onEnter()
    mocks.task.options.run(vi.fn())

    img.onerror()

    expect(subject.failed.value).toBe(true)
  })

  it('src 更新时重置状态并清理旧任务', async () => {
    const { img, src, subject } = createSubject()
    mocks.visibilityOptions.onEnter()

    src.value = 'next.jpg'
    await nextTick()

    expect(mocks.task.cancel).toHaveBeenCalledOnce()
    expect(subject.loaded.value).toBe(false)
    expect(subject.failed.value).toBe(false)
    expect(img.hasAttribute('src')).toBe(false)
  })

  it('下载中卸载时归还并发名额', () => {
    const { scope } = createSubject()
    const release = vi.fn()
    mocks.visibilityOptions.onEnter()
    mocks.task.options.run(release)

    scope.stop()

    expect(release).toHaveBeenCalledOnce()
  })
})
