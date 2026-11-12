import {
  addOrderAmountsMinor,
  assertOrderAmountMinor,
  MAX_ORDER_STORAGE_AMOUNT_MINOR,
  multiplyOrderAmountMinor,
  orderMajorToMinor,
  orderMinorToMajorString,
} from './order-money'

describe('订单整数分金额', () => {
  it.each([
    [0, 0],
    [0.01, 1],
    [0.29, 29],
    ['12.3', 1230],
    ['12.34', 1234],
    ['99999999.99', MAX_ORDER_STORAGE_AMOUNT_MINOR],
  ])('将元金额 %s 精确转换为 %s 分', (major, minor) => {
    expect(orderMajorToMinor(major)).toBe(minor)
  })

  it.each([null, undefined, '', ' ', '1\n', '-1', -0, -1, Number.NaN, Number.POSITIVE_INFINITY, '0.001', 0.1 + 0.2, '1e2', '100000000', {}, true])(
    '拒绝坏价格或超限金额 %p，不把它归零',
    (value) => {
      expect(() => orderMajorToMinor(value)).toThrow(RangeError)
    },
  )

  it('商品小计、商品总额和应付总额始终按整数分累加', () => {
    const goodsAmountMinor = addOrderAmountsMinor(multiplyOrderAmountMinor(orderMajorToMinor('0.29'), 3), orderMajorToMinor('0.01'))
    expect(goodsAmountMinor).toBe(88)
    expect(addOrderAmountsMinor(goodsAmountMinor, 12)).toBe(100)
    expect(orderMinorToMajorString(goodsAmountMinor)).toBe('0.88')
    expect(orderMinorToMajorString(MAX_ORDER_STORAGE_AMOUNT_MINOR)).toBe('99999999.99')
  })

  it('拒绝小计、商品累加和配送费累加导致的金额越界', () => {
    expect(() => multiplyOrderAmountMinor(MAX_ORDER_STORAGE_AMOUNT_MINOR, 2)).toThrow(RangeError)
    expect(() => addOrderAmountsMinor(MAX_ORDER_STORAGE_AMOUNT_MINOR, 1)).toThrow(RangeError)
    expect(() => addOrderAmountsMinor(1, Number.MAX_SAFE_INTEGER)).toThrow(RangeError)
  })

  it.each([-1, -0, 0.5, Number.NaN, MAX_ORDER_STORAGE_AMOUNT_MINOR + 1])('分金额边界拒绝 %p', (value) => {
    expect(() => assertOrderAmountMinor(value)).toThrow(RangeError)
    expect(() => orderMinorToMajorString(value)).toThrow(RangeError)
  })

  it.each([0, -1, 0.5, Number.NaN, Number.MAX_SAFE_INTEGER + 1])('计算小计时拒绝无效数量 %p', (qty) => {
    expect(() => multiplyOrderAmountMinor(1, qty)).toThrow(RangeError)
  })
})
