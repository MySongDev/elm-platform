import { beforeEach, describe, expect, it } from 'vitest'

import { clearAll, getSearchHistory, removeSearchItem, setSearchHistory } from './SearchHistory'

const key = 'search-history-test'

describe('searchHistory', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('stores newest keywords first and removes duplicates case-insensitively', () => {
    setSearchHistory(key, 'Milk Tea')
    setSearchHistory(key, 'noodles')
    setSearchHistory(key, 'milk tea')

    expect(getSearchHistory(key)).toEqual(['milk tea', 'noodles'])
  })

  it('limits history to ten items', () => {
    Array.from({ length: 12 }, (_, index) => `keyword-${index}`)
      .forEach(item => setSearchHistory(key, item))

    expect(getSearchHistory(key)).toHaveLength(10)
    expect(getSearchHistory(key)[0]).toBe('keyword-11')
  })

  it('removes one item and can clear all history', () => {
    setSearchHistory(key, 'apple')
    setSearchHistory(key, 'banana')

    expect(removeSearchItem(key, 'apple')).toEqual(['banana'])

    clearAll(key)
    expect(getSearchHistory(key)).toEqual([])
  })
})
