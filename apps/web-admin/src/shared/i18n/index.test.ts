import type { WritableComputedRef } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed } from 'vue'

function setLocale(locale: string) {
  return import('./index').then(({ default: i18n }) => {
    const currentLocale = i18n.global.locale as string | WritableComputedRef<string>
    if (typeof currentLocale !== 'string')
      currentLocale.value = locale
  })
}

describe('transformI18n', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => 'zh-CN'),
      setItem: vi.fn(),
    })
  })

  it('translates known i18n keys for the active locale', async () => {
    const { transformI18n } = await import('./index')
    await setLocale('en')

    expect(transformI18n('route.buttonPermission')).toBe('Button Permission')
  })

  it('keeps backend literal menu titles without emitting missing-key warnings', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const { transformI18n } = await import('./index')
    await setLocale('en')

    expect(transformI18n('按钮权限')).toBe('按钮权限')
    expect(warn).not.toHaveBeenCalled()

    warn.mockRestore()
  })

  it('tracks locale changes when used inside computed values', async () => {
    const { transformI18n } = await import('./index')
    await setLocale('zh-CN')

    const title = computed(() => transformI18n('route.buttonPermission'))

    expect(title.value).toBe('按钮权限')

    await setLocale('en')

    expect(title.value).toBe('Button Permission')
  })
})
