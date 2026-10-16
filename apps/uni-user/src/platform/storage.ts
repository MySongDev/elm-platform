/**
 * 平台适配收口层 —— storage
 *
 * ⚠️ 与 apps/web-user/src/utils/storage/storage.js 同源（同一套 setStore/getStore/removeStore
 * 契约），仅底层实现从 window.localStorage 换成 uni.*StorageSync。修改需同步两处语义。
 *
 * 业务代码只调 platform/*，不直接碰 uni.*（迁移方案 A 节）。
 * 将来加 H5/App 端时，在本文件内部加 #ifdef 分支即可。
 */

/** 写入。对象会被 JSON 序列化，与 web-user 的 utils/storage/storage.js 行为对齐。 */
export function setStore(name: string, content: unknown): void {
  // 与 web-user 一致：空 name 静默返回，不抛错
  if (!name) {
    return
  }
  const value = typeof content === 'string' ? content : JSON.stringify(content)
  uni.setStorageSync(name, value)
}

/**
 * 读取。
 * ⚠️ 两处与 web-user 的行为差异，均已核实安全：
 * 1. uni.getStorageSync 对不存在的 key 返回 **''** 而非 null
 *    （web-user 走 JSON.parse(null) → null）。JSON.parse('') 会抛错，靠 catch 兜底。
 *    两者都是 falsy，而现有调用方一律写成 `getStore(KEY) || {}` / `|| ''`，行为一致。
 * 2. 空 name 返回 undefined（与 web-user 的 `if (!name) return` 一致）。
 */
export function getStore<T = unknown>(name: string): T | '' | null | undefined {
  if (!name) {
    return undefined
  }
  const raw = uni.getStorageSync(name)
  if (raw === '' || raw === null || raw === undefined) {
    return (raw || '') as '' | null
  }
  try {
    return JSON.parse(raw as string) as T
  }
  catch {
    return raw as T
  }
}

export function removeStore(name: string): void {
  if (!name) {
    return
  }
  uni.removeStorageSync(name)
}
