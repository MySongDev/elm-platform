// ⚠️ 与 apps/web-user/src/utils/search/SearchHistory.js 同源，修改需同步两处。
// 不抽共享包的原因见迁移方案议题 7。
//
// ★ 与 web-user 的差异（方案 ⑥ 节）：web-user 在 :4,30,61,74 **直接用 localStorage，
// 无任何保护** —— 小程序端没有 localStorage 全局对象，会直接 ReferenceError。
// 这里改走 platform/storage 的 getStore/setStore/removeStore 封装
// （顺带修掉绕过封装的坏味道）。业务逻辑（去重/上限 10 条/大小写不敏感）逐行一致。

import { getStore, removeStore, setStore } from '@/platform/storage'

const MAX_HISTORY_COUNT = 10

function readHistory(key) {
  const items = getStore(key)
  if (!items)
    return []

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
