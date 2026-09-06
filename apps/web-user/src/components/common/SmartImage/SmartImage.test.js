import { describe, expect, it, vi } from 'vitest'
import { createApp, nextTick, ref } from 'vue'
import SmartImage from './SmartImage.vue'

const facade = vi.hoisted(() => ({
  loaded: false,
  failed: false,
  options: null,
}))

vi.mock('./useSmartImage', () => ({
  useSmartImage: vi.fn((options) => {
    facade.options = options
    return {
      loaded: ref(facade.loaded),
      failed: ref(facade.failed),
    }
  }),
}))

async function mountSmartImage(props = {}) {
  const root = document.createElement('div')
  document.body.appendChild(root)
  const events = {
    load: vi.fn(),
    error: vi.fn(),
  }
  const app = createApp(SmartImage, {
    src: 'https://img.example.test/a.jpg',
    onLoad: events.load,
    onError: events.error,
    ...props,
  })
  app.mount(root)
  await nextTick()
  return {
    events,
    root,
    unmount() {
      app.unmount()
      root.remove()
    },
  }
}

describe('smartImage facade', () => {
  it('加载前显示骨架并保留渐进式类名', async () => {
    facade.loaded = false
    facade.failed = false
    const wrapper = await mountSmartImage()

    expect(wrapper.root.querySelector('.smart-img__skeleton')).not.toBeNull()
    expect(wrapper.root.querySelector('img').classList.contains('smart-img__img--progressive')).toBe(true)
    wrapper.unmount()
  })

  it('加载完成后隐藏骨架并显示完成状态', async () => {
    facade.loaded = true
    facade.failed = false
    const wrapper = await mountSmartImage()

    expect(wrapper.root.querySelector('.smart-img__skeleton')).toBeNull()
    expect(wrapper.root.querySelector('img').classList.contains('is-loaded')).toBe(true)
    wrapper.unmount()
  })

  it('失败时显示既有占位内容', async () => {
    facade.loaded = false
    facade.failed = true
    const wrapper = await mountSmartImage({ alt: '商家图片' })

    expect(wrapper.root.querySelector('.smart-img__broken')).not.toBeNull()
    expect(wrapper.root.querySelector('.smart-img__broken').getAttribute('aria-label')).toBe('商家图片')
    wrapper.unmount()
  })

  it('透传 load 与 error 事件载荷', async () => {
    facade.loaded = false
    facade.failed = false
    const wrapper = await mountSmartImage()

    facade.options.onLoad({ src: 'loaded.jpg' })
    facade.options.onError({ src: 'failed.jpg' })

    expect(wrapper.events.load).toHaveBeenCalledWith({ src: 'loaded.jpg' })
    expect(wrapper.events.error).toHaveBeenCalledWith({ src: 'failed.jpg' })
    wrapper.unmount()
  })
})
