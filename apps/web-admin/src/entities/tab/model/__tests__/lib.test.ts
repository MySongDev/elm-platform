import type { TabItem } from '../types'
import { describe, expect, it } from 'vitest'
import { isTabClosable, moveHomeTabFirst } from '../lib'

function createTab(overrides: Partial<TabItem>): TabItem {
  return {
    key: overrides.fullPath ?? '/default',
    path: overrides.fullPath ?? '/default',
    fullPath: overrides.fullPath ?? '/default',
    title: 'route.default',
    fixed: false,
    ...overrides,
  }
}

describe('tab model lib', () => {
  it('treats the dashboard tab as not closable', () => {
    expect(isTabClosable(createTab({ fullPath: '/dashboard/index' }))).toBe(false)
    expect(isTabClosable(createTab({ fullPath: '/system/user', fixed: true }))).toBe(false)
    expect(isTabClosable(createTab({ fullPath: '/system/user' }))).toBe(true)
  })

  it('keeps the dashboard tab as the first tab when it exists', () => {
    const tabs = [
      createTab({ fullPath: '/system/user' }),
      createTab({ path: '/dashboard/index', fullPath: '/dashboard/index' }),
      createTab({ fullPath: '/commerce/restaurant' }),
    ]

    expect(moveHomeTabFirst(tabs).map(tab => tab.fullPath)).toEqual([
      '/dashboard/index',
      '/system/user',
      '/commerce/restaurant',
    ])
  })
})
