import type { CheckoutSelection } from './checkout-selection'
import {
  areCheckoutSelectionsEqual,
  createCheckoutRequestKey,
  MAX_CHECKOUT_ITEM_QTY,
  normalizeCheckoutSelection,
} from './checkout-selection'

function selection(qty = 1, shopId = '1'): CheckoutSelection {
  return {
    shopId,
    cartItems: [{
      itemId: '11',
      skuId: '111',
      qty,
    }],
  }
}

describe('结算选择与用户隔离键', () => {
  it('同商品同SKU合并数量并稳定排序，不修改入参', () => {
    const input = {
      shopId: '1',
      cartItems: [
        {
          itemId: '22',
          skuId: '222',
          qty: 1,
        },
        {
          itemId: '11',
          skuId: '112',
          qty: 2,
        },
        {
          itemId: '11',
          skuId: '111',
          qty: 1,
        },
        {
          itemId: '11',
          skuId: '111',
          qty: 2,
        },
      ],
    }
    const original = JSON.stringify(input)
    expect(normalizeCheckoutSelection(input)).toEqual({
      shopId: '1',
      cartItems: [
        {
          itemId: '11',
          skuId: '111',
          qty: 3,
        },
        {
          itemId: '11',
          skuId: '112',
          qty: 2,
        },
        {
          itemId: '22',
          skuId: '222',
          qty: 1,
        },
      ],
    })
    expect(JSON.stringify(input)).toBe(original)
  })

  it.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, MAX_CHECKOUT_ITEM_QTY + 1, '1'])('拒绝无效数量 %p', (qty) => {
    const input = selection()
    input.cartItems = [{
      ...input.cartItems[0],
      qty: qty as number,
    }]
    expect(() => normalizeCheckoutSelection(input)).toThrow(RangeError)
  })

  it('在重复项归并后仍检查每SKU和整单数量上限', () => {
    const item = selection(60).cartItems[0]
    expect(() => normalizeCheckoutSelection({
      shopId: '1',
      cartItems: [item, item],
    })).toThrow(RangeError)
    expect(() => normalizeCheckoutSelection({
      shopId: '1',
      cartItems: [item, {
        ...item,
        skuId: '112',
      }],
    })).toThrow(RangeError)
    expect(normalizeCheckoutSelection(selection(MAX_CHECKOUT_ITEM_QTY)).cartItems[0].qty).toBe(MAX_CHECKOUT_ITEM_QTY)
  })

  it.each(['0', '01', '-1', '1.5', ' 1', '1\n', '2147483648'])('拒绝非本地正整数商家ID %s', (shopId) => {
    expect(() => normalizeCheckoutSelection(selection(1, shopId))).toThrow(RangeError)
  })

  it('拒绝空选择、无效商品ID和空SKU', () => {
    expect(() => normalizeCheckoutSelection({
      shopId: '1',
      cartItems: [],
    })).toThrow(RangeError)
    for (const patch of [{ itemId: '01' }, { skuId: '' }]) {
      expect(() => normalizeCheckoutSelection({
        ...selection(),
        cartItems: [{
          ...selection().cartItems[0],
          ...patch,
        }],
      })).toThrow(RangeError)
    }
  })

  it('相同请求键稳定，跨用户或含分隔符的键不会碰撞', () => {
    expect(createCheckoutRequestKey('42', 'retry-1')).toBe(createCheckoutRequestKey('42', 'retry-1'))
    expect(createCheckoutRequestKey('42', 'retry-1')).not.toBe(createCheckoutRequestKey('43', 'retry-1'))
    expect(createCheckoutRequestKey('a:b', 'c')).not.toBe(createCheckoutRequestKey('a', 'b:c'))
    expect(() => createCheckoutRequestKey('', 'retry-1')).toThrow(RangeError)
    expect(() => createCheckoutRequestKey('42', ' ')).toThrow(RangeError)
  })

  it('同键重试按规范化选择比较，不按变化的报价和标题比较', () => {
    const original = {
      ...selection(2),
      shopName: '旧商家名',
      cartItems: [{
        ...selection(2).cartItems[0],
        title: '旧标题',
        unitPriceMinor: 100,
      }],
    }
    const retry = {
      ...selection(),
      cartItems: [
        {
          ...selection().cartItems[0],
          title: '新标题',
          unitPriceMinor: 200,
        },
        selection().cartItems[0],
      ],
    }
    expect(areCheckoutSelectionsEqual(original, retry)).toBe(true)
    expect(areCheckoutSelectionsEqual(original, selection(3))).toBe(false)
    expect(areCheckoutSelectionsEqual(original, selection(2, '2'))).toBe(false)
    expect(areCheckoutSelectionsEqual(original, {
      ...selection(2),
      cartItems: [{
        ...selection(2).cartItems[0],
        skuId: '112',
      }],
    })).toBe(false)
    expect(areCheckoutSelectionsEqual(original, {
      ...selection(2),
      cartItems: [{
        ...selection(2).cartItems[0],
        itemId: '12',
      }],
    })).toBe(false)
  })
})
