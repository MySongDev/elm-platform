// 与 apps/web-user/src/utils/search/SearchHistory.js 同源，业务规则修改需同步两处。
// 小程序统一从 platform/storage 读写，底层由 uni.*StorageSync 适配。

import { getStore, removeStore, setStore } from '@/platform/storage'

const MAX_HISTORY_COUNT = 10

function readHistory(key) {
  const items = getStore(key)
  // getStore 解析失败会返回原字符串，搜索页面只接受历史数组。
  return Array.isArray(items) ? items : []
}

// 去掉首尾空格后，大小写不同的搜索词仍分别保留。
export function setSearchHistory(key, value) {
  if (!key || !value || value.trim() === '')
    return []

  try {
    const trimmedValue = value.trim()
    const items = readHistory(key).filter(item => item !== trimmedValue)

    items.unshift(trimmedValue)
    const limitedItems = items.slice(0, MAX_HISTORY_COUNT)

    setStore(key, limitedItems)
    return limitedItems
  }
  catch (error) {
    console.error('保存搜索历史失败:', error)
    return []
  }
}

export function getSearchHistory(key) {
  if (!key)
    return []

  try {
    return readHistory(key)
  }
  catch (error) {
    console.error('读取搜索历史失败:', error)
    return []
  }
}

// 按展示的原文删除，避免同时删掉大小写不同的另一条历史。
export function removeSearchItem(key, value) {
  if (!key || !value)
    return []

  try {
    const newItems = readHistory(key).filter(item => item !== value)

    setStore(key, newItems)
    return newItems
  }
  catch (error) {
    console.error('删除搜索历史失败:', error)
    return []
  }
}

export function clearAll(key) {
  if (!key)
    return

  removeStore(key)
}
