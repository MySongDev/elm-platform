/**
 * 存储localStorage
 */
export function setStore(name, content) {
  if (!name)
    return
  if (typeof content !== 'string') {
    content = JSON.stringify(content)
  }
  window.localStorage.setItem(name, content)
}

/**
 * 获取localStorage
 */
export function getStore(name) {
  if (!name)
    return
  const content = window.localStorage.getItem(name)
  try {
    return JSON.parse(content)
  }
  catch {
    return content
  }
}

/**
 * 删除localStorage
 */
export function removeStore(name) {
  if (!name)
    return
  window.localStorage.removeItem(name)
}
