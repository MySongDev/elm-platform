import type { CartProduct, CartStore } from './cart'
import type { CheckoutSnapshotInput, CheckoutSnapshotState, ConfirmedCheckoutOrder } from './checkout-snapshot'
import { describe, expect, it } from 'vitest'
import {
  bindCheckoutOrder,
  consumePaidCheckout,
  createCheckoutSnapshotState,
  MAX_CHECKOUT_ITEM_QTY,
  registerCheckoutSnapshot,
} from './checkout-snapshot'

function selection(overrides: Partial<CheckoutSnapshotInput> = {}): CheckoutSnapshotInput {
  return {
    userId: 'user-a',
    requestId: 'request-a',
    shopId: '1',
    cartItems: [{
      itemId: '10',
      skuId: 'sku-a',
      qty: 2,
    }],
    ...overrides,
  }
}

function product(overrides: Partial<CartProduct> = {}): CartProduct {
  return {
    id: '1-10-sku-a',
    itemId: '10',
    skuId: 'sku-a',
    name: '饭',
    spec: '大份',
    image: '',
    price: 10,
    originPrice: 10,
    quantity: 2,
    selected: true,
    tag: '',
    specIndex: 0,
    food: null,
    ...overrides,
  }
}

function store(products: CartProduct[] = [product()], id = '1'): CartStore {
  return {
    id,
    name: '商家',
    deliveryFee: 1,
    minAmount: 1,
    deliveryTime: '',
    distance: '',
    reserveText: '',
    deliveryText: '',
    products,
  }
}

function paidOrder(overrides: Partial<ConfirmedCheckoutOrder> = {}): ConfirmedCheckoutOrder {
  return {
    userId: 'user-a',
    orderNo: 'order-a',
    shopId: '1',
    status: 'PAID',
    ...overrides,
  }
}

function boundState(input = selection(), orderNo = 'order-a'): CheckoutSnapshotState {
  return bindCheckoutOrder(registerCheckoutSnapshot(createCheckoutSnapshotState(), input), {
    userId: input.userId,
    requestId: input.requestId,
    orderNo,
  })
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value))
      deepFreeze(child)
    Object.freeze(value)
  }
  return value
}

// 这里测的是已购买数量与重复到账的不变量，不依赖 Pinia、支付收银台或 storage 替身。
describe('结算快照登记与绑单', () => {
  it('多张未完成快照不会互相覆盖，同一 requestId 在不同用户下隔离', () => {
    const first = registerCheckoutSnapshot(createCheckoutSnapshotState(), selection())
    const second = registerCheckoutSnapshot(first, selection({ requestId: 'request-b' }))
    const third = registerCheckoutSnapshot(second, selection({ userId: 'user-b' }))

    expect(third.snapshots.map(snapshot => [snapshot.userId, snapshot.requestId])).toEqual([
      ['user-a', 'request-a'],
      ['user-a', 'request-b'],
      ['user-b', 'request-a'],
    ])
    expect(first.snapshots).toHaveLength(1)
  })

  it('相同选择允许重试，重复条目归并、排序不影响同键复用', () => {
    const state = registerCheckoutSnapshot(createCheckoutSnapshotState(), selection({
      cartItems: [{
        itemId: '20',
        skuId: 'sku-b',
        qty: 1,
      }, {
        itemId: '10',
        skuId: 'sku-a',
        qty: 1,
      }, {
        itemId: '10',
        skuId: 'sku-a',
        qty: 1,
      }],
    }))
    const retry = registerCheckoutSnapshot(state, selection({
      cartItems: [{
        itemId: '10',
        skuId: 'sku-a',
        qty: 2,
      }, {
        itemId: '20',
        skuId: 'sku-b',
        qty: 1,
      }],
    }))

    expect(retry).toEqual(state)
    expect(retry.snapshots).toHaveLength(1)
    expect(retry.snapshots[0].cartItems).toHaveLength(2)
  })

  it.each([
    { shopId: '2' },
    {
      cartItems: [{
        itemId: '10',
        skuId: 'sku-a',
        qty: 3,
      }],
    },
    {
      cartItems: [{
        itemId: '10',
        skuId: 'sku-b',
        qty: 2,
      }],
    },
    {
      cartItems: [{
        itemId: '20',
        skuId: 'sku-a',
        qty: 2,
      }],
    },
  ])('同一用户与 requestId 的选择变化拒绝登记：%j', (changed) => {
    const state = boundState()
    expect(() => registerCheckoutSnapshot(state, selection(changed))).toThrow('不同的结算选择')
    expect(state.snapshots[0].orderNo).toBe('order-a')
  })

  it.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, MAX_CHECKOUT_ITEM_QTY + 1])(
    '无效商品数量 %s 不能进入快照',
    (qty) => {
      expect(() => registerCheckoutSnapshot(createCheckoutSnapshotState(), selection({
        cartItems: [{
          itemId: '10',
          skuId: 'sku-a',
          qty,
        }],
      }))).toThrow('qty')
    },
  )

  it('数量上限包括边界值及同键归并后的总量', () => {
    const input = selection({
      cartItems: [{
        itemId: '10',
        skuId: 'sku-a',
        qty: MAX_CHECKOUT_ITEM_QTY,
      }],
    })
    expect(registerCheckoutSnapshot(createCheckoutSnapshotState(), input).snapshots[0].cartItems[0].qty)
      .toBe(MAX_CHECKOUT_ITEM_QTY)
    expect(() => registerCheckoutSnapshot(createCheckoutSnapshotState(), selection({
      cartItems: [...input.cartItems, {
        itemId: '10',
        skuId: 'sku-a',
        qty: 1,
      }],
    }))).toThrow('数量不能超过')
  })

  it('不同 SKU 的整单合计 99 件允许登记，100 件拒绝', () => {
    const input = selection({
      cartItems: [{
        itemId: '10',
        skuId: 'sku-a',
        qty: 98,
      }, {
        itemId: '10',
        skuId: 'sku-b',
        qty: 1,
      }],
    })
    const state = registerCheckoutSnapshot(createCheckoutSnapshotState(), input)

    expect(state.snapshots[0].cartItems.reduce((sum, item) => sum + item.qty, 0)).toBe(99)
    expect(() => registerCheckoutSnapshot(createCheckoutSnapshotState(), selection({
      cartItems: [...input.cartItems, {
        itemId: '20',
        skuId: 'sku-c',
        qty: 1,
      }],
    }))).toThrow('整单商品数量不能超过 99')
  })

  it.each([
    { userId: '' },
    { requestId: '' },
    { shopId: 'cart-checkout' },
    { cartItems: [] },
    {
      cartItems: [{
        itemId: '0',
        skuId: 'sku-a',
        qty: 1,
      }],
    },
    {
      cartItems: [{
        itemId: '10',
        skuId: '',
        qty: 1,
      }],
    },
  ])('缺身份、虚拟店铺或无效选择拒绝登记：%j', (changed) => {
    expect(() => registerCheckoutSnapshot(createCheckoutSnapshotState(), selection(changed))).toThrow()
  })

  it('身份 128 字符及本地目录 ID 的最大值允许登记且不改写原文', () => {
    const identity = 'x'.repeat(128)
    const input = selection({
      userId: identity,
      requestId: identity,
      shopId: '2147483647',
      cartItems: [{
        itemId: '2147483647',
        skuId: identity,
        qty: 1,
      }],
    })
    const state = registerCheckoutSnapshot(createCheckoutSnapshotState(), input)

    expect(state.snapshots[0]).toEqual({
      ...input,
      consumed: false,
    })
  })

  it.each(['userId', 'requestId', 'skuId'] as const)('%s 不接受首尾空白或超过 128 字符', (field) => {
    for (const value of [' leading', 'trailing ', '\tvalue', 'x'.repeat(129)]) {
      const input = field === 'skuId'
        ? selection({
            cartItems: [{
              itemId: '10',
              skuId: value,
              qty: 1,
            }],
          })
        : selection({ [field]: value })

      expect(() => registerCheckoutSnapshot(createCheckoutSnapshotState(), input)).toThrow(field)
    }
  })

  it.each(['shopId', 'itemId'] as const)('%s 必须是数据库 Int 范围内的正整数字符串', (field) => {
    for (const value of ['0', '01', '-1', '1.5', '1\n', '1\r', '1 ', '2147483648', '9'.repeat(128)]) {
      const input = field === 'itemId'
        ? selection({
            cartItems: [{
              itemId: value,
              skuId: 'sku-a',
              qty: 1,
            }],
          })
        : selection({ shopId: value })

      expect(() => registerCheckoutSnapshot(createCheckoutSnapshotState(), input)).toThrow(field)
    }
  })

  it('绑定同一订单允许重试，已绑定快照不能换单', () => {
    const state = boundState()
    const binding = {
      userId: 'user-a',
      requestId: 'request-a',
      orderNo: 'order-a',
    }
    expect(bindCheckoutOrder(state, binding)).toEqual(state)
    expect(() => bindCheckoutOrder(state, {
      ...binding,
      orderNo: 'order-b',
    })).toThrow('不能改绑')
  })

  it('不同 requestId 不能重复绑定同一订单，包括消费完成之后', () => {
    const state = registerCheckoutSnapshot(boundState(), selection({ requestId: 'request-b' }))
    const result = consumePaidCheckout(state, [store()], {
      userId: 'user-a',
      order: paidOrder(),
    })
    const binding = {
      userId: 'user-a',
      requestId: 'request-b',
      orderNo: 'order-a',
    }

    expect(() => bindCheckoutOrder(state, binding)).toThrow('已经绑定')
    expect(() => bindCheckoutOrder(result.state, binding)).toThrow('已经绑定')
  })

  it('不能借另一用户或未知 requestId 的身份绑定快照', () => {
    const state = boundState()
    expect(() => bindCheckoutOrder(state, {
      userId: 'user-b',
      requestId: 'request-a',
      orderNo: 'order-b',
    })).toThrow('找不到当前用户')
    expect(() => bindCheckoutOrder(state, {
      userId: 'user-a',
      requestId: 'unknown',
      orderNo: 'order-b',
    })).toThrow('找不到当前用户')
    const anotherUser = registerCheckoutSnapshot(state, selection({ userId: 'user-b' }))
    expect(() => bindCheckoutOrder(anotherUser, {
      userId: 'user-b',
      requestId: 'request-a',
      orderNo: 'order-a',
    })).toThrow('已经绑定')
  })
})

describe('可信 PAID 摘要的精确购物车消费', () => {
  it('只扣快照数量，保留付款期间同 SKU 新增量及其他商品和商家', () => {
    const stores = [store([
      product({ quantity: 5 }),
      product({
        id: '1-10-sku-b',
        skuId: 'sku-b',
        quantity: 4,
      }),
      product({
        id: '1-20-sku-a',
        itemId: '20',
        quantity: 3,
      }),
    ]), store([product({ quantity: 7 })], '2')]
    const result = consumePaidCheckout(boundState(), stores, {
      userId: 'user-a',
      order: paidOrder(),
    })

    expect(result.consumed).toBe(true)
    expect(result.stores[0].products.map(item => item.quantity)).toEqual([3, 4, 3])
    expect(result.stores[1]).toEqual(stores[1])
    expect(result.state.snapshots[0].consumed).toBe(true)
  })

  it('付款期间减少数量只扣剩余，不产生负数，删除空商品和空店', () => {
    const result = consumePaidCheckout(boundState(), [store([product({ quantity: 1 })])], {
      userId: 'user-a',
      order: paidOrder(),
    })

    expect(result.stores).toEqual([])
    expect(result.state.snapshots[0].consumed).toBe(true)
  })

  it('删除购买商品后不扣相同 SKU 的其他商品，并仍标记为已消费', () => {
    const stores = [store([product({
      id: '1-20-sku-a',
      itemId: '20',
      quantity: 3,
    })])]
    const result = consumePaidCheckout(boundState(), stores, {
      userId: 'user-a',
      order: paidOrder(),
    })
    const later = consumePaidCheckout(result.state, [store()], {
      userId: 'user-a',
      order: paidOrder(),
    })

    expect(result.stores).toEqual(stores)
    expect(result.consumed).toBe(true)
    expect(later.stores[0].products[0].quantity).toBe(2)
    expect(later.consumed).toBe(false)
  })

  it('购买店铺已删除时不扣其他店铺同商品', () => {
    const stores = [store([product()], '2')]
    const result = consumePaidCheckout(boundState(), stores, {
      userId: 'user-a',
      order: paidOrder(),
    })

    expect(result.stores).toEqual(stores)
    expect(result.consumed).toBe(true)
  })

  it('意外重复的商品记录共用扣减额度，不会各扣一次', () => {
    const result = consumePaidCheckout(boundState(), [store([
      product({ quantity: 1 }),
      product({
        id: 'duplicate',
        quantity: 4,
      }),
    ])], {
      userId: 'user-a',
      order: paidOrder(),
    })

    expect(result.stores[0].products.map(item => [item.id, item.quantity])).toEqual([['duplicate', 3]])
  })

  it('重复 PAID 不再扣，JSON 恢复已消费标记后同样不再扣', () => {
    const first = consumePaidCheckout(boundState(), [store([product({ quantity: 5 })])], {
      userId: 'user-a',
      order: paidOrder(),
    })
    const restored: CheckoutSnapshotState = JSON.parse(JSON.stringify(first.state))
    const second = consumePaidCheckout(restored, first.stores, {
      userId: 'user-a',
      order: paidOrder(),
    })
    const retryRegistration = registerCheckoutSnapshot(second.state, selection())

    expect(second.consumed).toBe(false)
    expect(second.stores[0].products[0].quantity).toBe(3)
    expect(retryRegistration.snapshots[0].consumed).toBe(true)
    expect(retryRegistration.snapshots[0].orderNo).toBe('order-a')
  })

  it.each(['PENDING', 'CLOSED', 'UNKNOWN', 'paid'])('状态 %s 不消费购物车', (status) => {
    const state = boundState()
    const stores = [store()]
    const result = consumePaidCheckout(state, stores, {
      userId: 'user-a',
      order: paidOrder({ status }),
    })

    expect(result).toEqual({
      state,
      stores,
      consumed: false,
    })
  })

  it.each([
    { userId: 'user-b' },
    { orderNo: 'unknown-order' },
    { shopId: '2' },
  ])('摘要身份或店铺与快照不匹配时不消费：%j', (changed) => {
    const state = boundState()
    const stores = [store()]
    const result = consumePaidCheckout(state, stores, {
      userId: 'user-a',
      order: paidOrder(changed),
    })

    expect(result).toEqual({
      state,
      stores,
      consumed: false,
    })
  })

  it('未绑定订单的快照不能凭 PAID 摘要消费', () => {
    const state = registerCheckoutSnapshot(createCheckoutSnapshotState(), selection())
    const stores = [store()]
    const result = consumePaidCheckout(state, stores, {
      userId: 'user-a',
      order: paidOrder(),
    })

    expect(result).toEqual({
      state,
      stores,
      consumed: false,
    })
  })

  it('切换用户后到达的旧用户 PAID 不能扣当前用户的车', () => {
    const state = boundState()
    const stores = [store()]
    const result = consumePaidCheckout(state, stores, {
      userId: 'user-b',
      order: paidOrder(),
    })

    expect(result).toEqual({
      state,
      stores,
      consumed: false,
    })
  })

  it('同用户新草稿不覆盖旧单，消费旧单只标记旧快照', () => {
    const state = registerCheckoutSnapshot(boundState(), selection({
      requestId: 'request-b',
      cartItems: [{
        itemId: '20',
        skuId: 'sku-a',
        qty: 3,
      }],
    }))
    const result = consumePaidCheckout(state, [store([
      product(),
      product({
        id: '1-20-sku-a',
        itemId: '20',
        quantity: 3,
      }),
    ])], {
      userId: 'user-a',
      order: paidOrder(),
    })

    expect(result.state.snapshots.map(snapshot => snapshot.consumed)).toEqual([true, false])
    expect(result.stores[0].products.map(item => item.itemId)).toEqual(['20'])
  })

  it('登记、绑单、消费均不修改输入对象或借用调用方选择数组', () => {
    const input = deepFreeze(selection())
    const empty = deepFreeze(createCheckoutSnapshotState())
    const registered = deepFreeze(registerCheckoutSnapshot(empty, input))
    const binding = deepFreeze({
      userId: 'user-a',
      requestId: 'request-a',
      orderNo: 'order-a',
    })
    const state = deepFreeze(bindCheckoutOrder(registered, binding))
    const stores = deepFreeze([store([product({
      quantity: 5,
      food: {
        item_id: '10',
        name: '饭',
      },
    })])])
    const consumeInput = deepFreeze({
      userId: 'user-a',
      order: paidOrder(),
    })
    const result = consumePaidCheckout(state, stores, consumeInput)

    expect(empty.snapshots).toEqual([])
    expect(registered.snapshots[0].orderNo).toBeUndefined()
    expect(registered.snapshots[0].cartItems).not.toBe(input.cartItems)
    expect(state.snapshots[0].consumed).toBe(false)
    expect(stores[0].products[0].quantity).toBe(5)
    expect(result.stores).not.toBe(stores)
    expect(result.stores[0]).not.toBe(stores[0])
    expect(result.stores[0].products[0]).not.toBe(stores[0].products[0])
    expect(result.state).not.toBe(state)
    expect(result.state.snapshots[0].cartItems).not.toBe(state.snapshots[0].cartItems)
    expect(result.stores[0].products[0].quantity).toBe(3)
  })
})
