// PaymentOrder 的 Decimal(10, 2) 最多存八位整数和两位小数，分单位也必须守同一个上限。
// 微信建单方还要单独检查渠道的收款限制；不能把这个存储上限当成可微信收款的额度。
export const MAX_ORDER_STORAGE_AMOUNT_MINOR = 9_999_999_999

/** 只接受能精确到分的元金额；查价方不能把坏价格归零或四舍五入后继续收款。 */
export function orderMajorToMinor(value: unknown): number {
  if ((typeof value !== 'number' && typeof value !== 'string')
    || (typeof value === 'number' && (!Number.isFinite(value) || Object.is(value, -0)))) {
    throw new RangeError('金额必须是有限、非负且最多两位小数的元金额')
  }

  const text = String(value)
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(text)
  if (!match || match[0] !== text)
    throw new RangeError('金额必须是非负且最多两位小数的元金额')

  const majorDigits = match[1].replace(/^0+/, '') || '0'
  if (majorDigits.length > 8)
    throw new RangeError('金额超过订单存储上限')

  const minor = Number(majorDigits) * 100 + Number((match[2] || '').padEnd(2, '0'))
  return assertOrderAmountMinor(minor)
}

export function assertOrderAmountMinor(value: number): number {
  if (!Number.isSafeInteger(value) || value < 0 || Object.is(value, -0) || value > MAX_ORDER_STORAGE_AMOUNT_MINOR)
    throw new RangeError('分金额必须是订单上限内的非负安全整数')
  return value
}

export function addOrderAmountsMinor(...values: number[]): number {
  return values.reduce((sum, value) => {
    assertOrderAmountMinor(value)
    return assertOrderAmountMinor(sum + value)
  }, 0)
}

export function multiplyOrderAmountMinor(unitPriceMinor: number, qty: number): number {
  assertOrderAmountMinor(unitPriceMinor)
  if (!Number.isSafeInteger(qty) || qty <= 0)
    throw new RangeError('数量必须是正安全整数')
  return assertOrderAmountMinor(unitPriceMinor * qty)
}

/** 后续写 Decimal 时用这个字符串，不先除以 100 再让浮点金额参与建单计算。 */
export function orderMinorToMajorString(value: number): string {
  assertOrderAmountMinor(value)
  return `${Math.floor(value / 100)}.${String(value % 100).padStart(2, '0')}`
}
