import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useCheckoutEntry } from '@/composables/features/useCheckoutEntry'
import { useCartStore } from '@/stores/modules/store-cart'
import { useUserStore } from '@/stores/modules/store-user'
import { createCheckoutSnapshotState } from '@/utils/checkout-snapshot'

// 这里只验证结算入口到购物车 store 的接线；网络与 storage 都用内存替身。
vi.mock('@/services/api', () => ({
  getUserInfo: vi.fn(),
}))
vi.mock('@/platform/storage', () => ({
  getStore: () => null,
  setStore: () => {},
  removeStore: () => {},
}))

function addCartProduct(cartStore, shopId = '1', itemId = '11', quantity = 3) {
  cartStore.stores = [{
    id: shopId,
    name: '示例商家',
    deliveryFee: 0,
    minAmount: 0,
    deliveryTime: '',
    distance: '',
    reserveText: '',
    deliveryText: '',
    products: [{
      id: `${shopId}-${itemId}-111`,
      itemId,
      skuId: '111',
      name: '菜品',
      spec: '',
      image: '',
      price: 10,
      originPrice: 10,
      quantity,
      selected: true,
      tag: '',
      specIndex: 0,
      food: null,
    }],
  }]
}

function paidOrder(orderNo) {
  return {
    userId: '1',
    orderNo,
    shopId: '1',
    status: 'PAID',
  }
}

describe('结算快照在真实购物车 store 上的接线', () => {
  let cartStore

  beforeEach(() => {
    setActivePinia(createPinia())
    cartStore = useCartStore()
    cartStore.stores = []
    cartStore.checkoutSnapshots = createCheckoutSnapshotState()
    cartStore.pendingCheckout = null
    useUserStore().userId = '1'
  })

  it('同一份乱序、拆分的商品选择连续提交，复用同一个 requestId 与快照', () => {
    const entry = useCheckoutEntry()
    const first = entry.beginCheckout({
      userId: '1',
      shopId: '1',
      cartItems: [
        {
          itemId: '22',
          skuId: '222',
          qty: 1,
        },
        {
          itemId: '11',
          skuId: '111',
          qty: 1,
        },
      ],
    })
    const second = entry.beginCheckout({
      userId: '1',
      shopId: '1',
      cartItems: [
        {
          itemId: '11',
          skuId: '111',
          qty: 1,
        },
        {
          itemId: '22',
          skuId: '222',
          qty: 1,
        },
      ],
    })

    expect(second).toBe(first)
    expect(cartStore.checkoutSnapshots.snapshots).toHaveLength(1)
  })

  it('结果页已扣车后返回商家页再处理同一订单，不清空付款期间新加的商品', () => {
    addCartProduct(cartStore)
    const entry = useCheckoutEntry()
    const requestId = entry.beginCheckout({
      userId: '1',
      shopId: '1',
      cartItems: [{
        itemId: '11',
        skuId: '111',
        qty: 2,
      }],
    })
    entry.bindOrder('1', requestId, 'ORDER1')
    expect(cartStore.consumePaidSnapshot('1', paidOrder('ORDER1'))).toBe('consumed')

    addCartProduct(cartStore, '1', '11', 1)
    expect(cartStore.consumePaidSnapshot('1', paidOrder('ORDER1'))).toBe('already-consumed')
    expect(cartStore.getShopTotalQty('1')).toBe(1)
  })

  it('关闭的订单不扣商品，并且下一次结算使用新的 requestId', () => {
    addCartProduct(cartStore)
    const entry = useCheckoutEntry()
    const input = {
      userId: '1',
      shopId: '1',
      cartItems: [{
        itemId: '11',
        skuId: '111',
        qty: 2,
      }],
    }
    const requestId = entry.beginCheckout({
      ...input,
      cartItems: [...input.cartItems],
    })
    entry.bindOrder('1', requestId, 'ORDER1')

    cartStore.closeCheckoutSnapshot('1', {
      orderNo: 'ORDER1',
      shopId: '1',
      status: 'CLOSED',
    })

    expect(cartStore.getPendingCheckout('1', '1')).toBeNull()
    expect(cartStore.getShopTotalQty('1')).toBe(3)
    expect(entry.beginCheckout({
      ...input,
      cartItems: [...input.cartItems],
    })).not.toBe(requestId)
  })
})
