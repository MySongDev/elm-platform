import { getStore, removeStore, setStore } from '@/utils/storage/storage'

const MAX_HISTORY_COUNT = 10

function readHistory(key) {
  const items = getStore(key)
  // getStore 解析失败会返回原字符串，搜索页面只接受历史数组。
  return Array.isArray(items) ? items : []
}

export function setSearchHistory(key, value) {
  if (!key || !value || value.trim() === '')
    return []

  try {
    const trimmedValue = value.trim()
    const items = readHistory(key).filter(
      item => item.toLowerCase() !== trimmedValue.toLowerCase(),
    )

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

export function removeSearchItem(key, value) {
  if (!key || !value)
    return []

  try {
    const newItems = readHistory(key).filter(
      item => item.toLowerCase() !== value.toLowerCase(),
    )

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
