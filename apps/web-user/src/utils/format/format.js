/**
 * 手机号脱敏。
 * @param {string | number} phone 原始手机号
 * @param {string} maskChar 掩码字符，默认 `*`
 * @returns {string} 脱敏后的手机号
 */
export function maskPhone(phone, maskChar = '*') {
  if (!phone)
    return ''

  const phoneStr = String(phone).replace(/\D/g, '')
  if (phoneStr.length !== 11)
    return phoneStr

  return phoneStr.replace(/(\d{3})\d{4}(\d{4})/, `$1${maskChar.repeat(4)}$2`)
}
