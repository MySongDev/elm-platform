import type { TabItem } from '@/entities/tab/model/types'
import { describe, expect, it } from 'vitest'
import { createTabCommandState } from '../createTabCommandState'

function tab(partial: Partial<TabItem> & Pick<TabItem, 'fullPath'>): TabItem {
  return {
    key: partial.key ?? partial.fullPath,
    path: partial.path ?? partial.fullPath,
    fullPath: partial.fullPath,
    title: partial.title ?? partial.fullPath,
    fixed: partial.fixed ?? false,
    icon: partial.icon,
    cacheName: partial.cacheName,
  }
}

describe('createTabCommandState', () => {
  it('marks single-tab state for dropdown/context commands', () => {
    const state = createTabCommandState([
      tab({
        fullPath: '/dashboard',
        fixed: true,
      }),
    ], '/dashboard')

    expect(state.onlyOneTab).toBe(true)
    expect(state.closableCount).toBe(0)
    expect(state.fixed).toBe(true)
    expect(state.closable).toBe(false)
    expect(state.firstNonFixed).toBe(true)
    expect(state.lastNonFixed).toBe(true)
  })

  it('detects first/last closable positions around the target tab', () => {
    const tabs = [
      tab({
        fullPath: '/home',
        fixed: true,
      }),
      tab({ fullPath: '/a' }),
      tab({ fullPath: '/b' }),
      tab({ fullPath: '/c' }),
    ]

    const middle = createTabCommandState(tabs, '/b')
    expect(middle.onlyOneTab).toBe(false)
    expect(middle.closableCount).toBe(3)
    expect(middle.fixed).toBe(false)
    expect(middle.closable).toBe(true)
    expect(middle.firstNonFixed).toBe(false)
    expect(middle.lastNonFixed).toBe(false)

    const firstClosable = createTabCommandState(tabs, '/a')
    expect(firstClosable.firstNonFixed).toBe(true)
    expect(firstClosable.lastNonFixed).toBe(false)

    const lastClosable = createTabCommandState(tabs, '/c')
    expect(lastClosable.firstNonFixed).toBe(false)
    expect(lastClosable.lastNonFixed).toBe(true)
  })
})
