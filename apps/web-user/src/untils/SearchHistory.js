const MAX_HISTORY_COUNT = 10

function readHistory(key) {
  const raw = localStorage.getItem(key)
  if (!raw)
    return []

  try {
    const items = JSON.parse(raw)
    return Array.isArray(items) ? items : []
  }
  catch {
    return []
  }
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

    localStorage.setItem(key, JSON.stringify(limitedItems))
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

    localStorage.setItem(key, JSON.stringify(newItems))
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

  localStorage.removeItem(key)
}
