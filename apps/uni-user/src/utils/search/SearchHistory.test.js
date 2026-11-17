import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { clearAll, getSearchHistory, removeSearchItem, setSearchHistory } from './SearchHistory'

const key = 'search-history-test'

describe('searchHistory', () => {
  beforeEach(() => {
    const storage = new Map()
    // 测试使用真实 platform/storage，只替代 Node 中不存在的 uni 存储接口。
    vi.stubGlobal('uni', {
      getStorageSync: name => storage.get(name) ?? '',
      setStorageSync: (name, content) => storage.set(name, content),
      removeStorageSync: name => storage.delete(name),
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('stores newest keywords first and only removes exact duplicates', () => {
    setSearchHistory(key, 'Milk Tea')
    setSearchHistory(key, 'noodles')
    setSearchHistory(key, 'milk tea')
    setSearchHistory(key, ' Milk Tea ')

    expect(getSearchHistory(key)).toEqual(['Milk Tea', 'milk tea', 'noodles'])
  })

  it('limits history to ten items', () => {
    Array.from({ length: 12 }, (_, index) => `keyword-${index}`)
      .forEach(item => setSearchHistory(key, item))

    expect(getSearchHistory(key)).toHaveLength(10)
    expect(getSearchHistory(key)[0]).toBe('keyword-11')
  })

  it('removes only the matching case variant and can clear all history', () => {
    setSearchHistory(key, 'Apple')
    setSearchHistory(key, 'apple')
    setSearchHistory(key, 'banana')

    expect(removeSearchItem(key, 'apple')).toEqual(['banana', 'Apple'])

    clearAll(key)
    expect(getSearchHistory(key)).toEqual([])
  })
})
