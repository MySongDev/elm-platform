import type { RouteLocationNormalized } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

function createStorageMock() {
  const storage = new Map<string, string>()
  return {
    getItem: vi.fn((key: string) => storage.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => storage.set(key, value)),
    removeItem: vi.fn((key: string) => storage.delete(key)),
    clear: vi.fn(() => storage.clear()),
  }
}

function createRoute(path: string, title = `route.${path}`): RouteLocationNormalized {
  return {
    path,
    fullPath: path,
    name: path,
    meta: { title },
  } as RouteLocationNormalized
}

describe('tabs store dashboard ordering', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.stubGlobal('localStorage', createStorageMock())
    setActivePinia(createPinia())
  })

  it('moves the dashboard tab to the first position when adding tabs', async () => {
    const { useTabsStore } = await import('../store')
    const store = useTabsStore()

    store.addTab(createRoute('/system/user'))
    store.addTab(createRoute('/dashboard/index', 'route.dashboard'))

    expect(store.tabs.map(tab => tab.fullPath)).toEqual([
      '/dashboard/index',
      '/system/user',
    ])
  })

  it('keeps the dashboard tab when closing tabs to the left', async () => {
    const { useTabsStore } = await import('../store')
    const store = useTabsStore()

    store.addTab(createRoute('/dashboard/index', 'route.dashboard'))
    store.addTab(createRoute('/system/user'))
    store.addTab(createRoute('/commerce/restaurant'))

    store.closeLeftTabs('/commerce/restaurant')

    expect(store.tabs.map(tab => tab.fullPath)).toEqual([
      '/dashboard/index',
      '/commerce/restaurant',
    ])
  })

  it('does not close the dashboard tab directly', async () => {
    const { useTabsStore } = await import('../store')
    const store = useTabsStore()

    store.addTab(createRoute('/dashboard/index', 'route.dashboard'))
    store.addTab(createRoute('/system/user'))

    expect(store.closeTab('/dashboard/index')).toBeNull()
    expect(store.tabs.map(tab => tab.fullPath)).toEqual([
      '/dashboard/index',
      '/system/user',
    ])
  })

  it('keeps the active tab when closing a non-active tab on the left', async () => {
    const { useTabsStore } = await import('../store')
    const store = useTabsStore()

    store.addTab(createRoute('/a'))
    store.addTab(createRoute('/b'))
    store.addTab(createRoute('/c'))
    store.addTab(createRoute('/d'))
    store.addTab(createRoute('/e'))

    expect(store.activeTab).toBe('/e')

    expect(store.closeTab('/b')).toBeNull()
    expect(store.activeTab).toBe('/e')
    expect(store.tabs.map(tab => tab.fullPath)).toEqual([
      '/a',
      '/c',
      '/d',
      '/e',
    ])
  })

  it('keeps the dashboard tab when closing other or all tabs', async () => {
    const { useTabsStore } = await import('../store')
    const store = useTabsStore()

    store.addTab(createRoute('/dashboard/index', 'route.dashboard'))
    store.addTab(createRoute('/system/user'))
    store.addTab(createRoute('/commerce/restaurant'))

    store.closeOtherTabs('/system/user')

    expect(store.tabs.map(tab => tab.fullPath)).toEqual([
      '/dashboard/index',
      '/system/user',
    ])

    store.closeAllTabs()

    expect(store.tabs.map(tab => tab.fullPath)).toEqual([
      '/dashboard/index',
    ])
  })
})
