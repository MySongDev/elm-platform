// ⚠️ 与 apps/web-user/src/utils/format/format.js 同源，修改需同步两处。
// 不抽共享包的原因见迁移方案议题 7。

export function maskPhone(phone, maskChar = '*') {
  if (!phone)
    return ''

  const phoneStr = String(phone).replace(/\D/g, '')
  if (phoneStr.length !== 11)
    return phoneStr

  return phoneStr.replace(/(\d{3})\d{4}(\d{4})/, `$1${maskChar.repeat(4)}$2`)
}
