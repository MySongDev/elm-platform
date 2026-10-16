// ⚠️ 与 apps/web-user/src/services/http/policies/meta.js 同源，修改需同步两处。
// 不抽共享包的原因见迁移方案议题 7（真正可共享的只有 ~154 行，不值得付建包成本）。
//
// ⚠️ 与 web-user 的唯一差异：stableStringify 里的 FormData 分支加了 typeof 保护。
// 小程序端**没有 FormData 全局对象**，web-user 的 `value instanceof FormData`
// 会直接 ReferenceError（不是返回 false）。该分支在小程序端永远走不到
// （uni.request 的 data 只接受 Object/string/ArrayBuffer），但引用不存在的
// 全局对象会在模块求值/调用时抛错，必须防住。

export function getMeta(config) {
  config.meta = config.meta || {}
  return config.meta
}

export function stableStringify(value) {
  if (value == null)
    return ''

  // ⚠️ 小程序端无 FormData，先判全局对象存在再 instanceof
  if (typeof FormData !== 'undefined' && value instanceof FormData) {
    return '[FormData]'
  }

  if (typeof value !== 'object') {
    return String(value)
  }

  // 数组保持原顺序，形如 "[a,b,c]"
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`
  }

  // key 先排序，使 {a:1,b:2} 与 {b:2,a:1} 都产出 "{a:1,b:2}"
  return `{${Object.keys(value)
    .sort()
    .map(key => `${key}:${stableStringify(value[key])}`)
    .join(',')}}`
}
