// utils/paginate.js
export function paginateLazy(array = [], pageSize = 8, page = 1) {
  if (!Array.isArray(array) || array.length === 0)
    return []
  const start = (page - 1) * pageSize
  return array.slice(start, start + pageSize)
}

export function getPageCount(array = [], pageSize = 8) {
  if (!Array.isArray(array))
    return 0
  return Math.ceil(array.length / pageSize)
}
