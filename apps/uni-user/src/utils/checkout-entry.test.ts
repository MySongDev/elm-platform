import { describe, expect, it } from 'vitest'

import {
  buildSingleShopSelection,
  createCheckoutRequestId,
  describeCrossShopCheckout,
  discardSnapshotsOfOtherUsers,
  findPendingCheckoutSnapshot,
  isSnapshotShopPresent,
} from './checkout-entry'
import { createCheckoutSnapshotState, registerCheckoutSnapshot } from './checkout-snapshot'

function item(overrides = {}) {
  return {
    shopId: '1',
    shopName: '示例商家',
    itemId: '11',
    skuId: '111',
    qty: 1,
    ...overrides,
  }
}

describe('createCheckoutRequestId', () => {
  it('同一毫秒连续调用也生成不同 ID，避免双击复用同一个请求键', () => {
    const first = createCheckoutRequestId(1000, 0.5)
    const second = createCheckoutRequestId(1000, 0.5)
    expect(first).not.toBe(second)
  })

  it('格式为非空字符串，满足后端 128 字符限制', () => {
    const id = createCheckoutRequestId()
    expect(typeof id).toBe('string')
    expect(id.length).toBeGreaterThan(0)
    expect(id.length).toBeLessThanOrEqual(128)
    expect(id.trim()).toBe(id)
  })
})

describe('buildSingleShopSelection', () => {
  it('单一商家：返回该商家的选择', () => {
    const result = buildSingleShopSelection([
      item(),
      item({
        itemId: '12',
        skuId: '121',
        qty: 2,
      }),
    ])

    expect(result).toEqual({
      shopId: '1',
      shopName: '示例商家',
      cartItems: [
        {
          itemId: '11',
          skuId: '111',
          qty: 1,
        },
        {
          itemId: '12',
          skuId: '121',
          qty: 2,
        },
      ],
    })
  })

  it('跨商家：返回 null，绝不自动只取第一家', () => {
    const items = [
      item(),
      item({
        shopId: '2',
        shopName: '另一家',
      }),
    ]

    expect(buildSingleShopSelection(items)).toBeNull()
  })

  it('空选择返回 null', () => {
    expect(buildSingleShopSelection([])).toBeNull()
  })

  it('缺 itemId 或数量非法时返回 null，不把脏数据送进建单', () => {
    expect(buildSingleShopSelection([item({ itemId: '' })])).toBeNull()
    expect(buildSingleShopSelection([item({ qty: 0 })])).toBeNull()
    expect(buildSingleShopSelection([item({ qty: 1.5 })])).toBeNull()
  })
})

describe('describeCrossShopCheckout', () => {
  it('多个商家时给出商家名清单', () => {
    const result = describeCrossShopCheckout([
      item(),
      item({
        shopId: '2',
        shopName: '另一家',
      }),
    ])

    expect(result?.shopIds).toEqual(['1', '2'])
    expect(result?.shopNames).toEqual(['示例商家', '另一家'])
  })

  it('单一商家返回 null', () => {
    expect(describeCrossShopCheckout([item(), item({ itemId: '12' })])).toBeNull()
  })
})

function stateWith(snapshots) {
  let state = createCheckoutSnapshotState()
  for (const entry of snapshots) {
    state = registerCheckoutSnapshot(state, entry)
  }
  return state
}

describe('findPendingCheckoutSnapshot', () => {
  it('返回当前用户在该商家下最新的未消费快照', () => {
    const state = stateWith([
      {
        userId: '1',
        requestId: 'req-a',
        shopId: '1',
        cartItems: [{
          itemId: '11',
          skuId: '111',
          qty: 1,
        }],
      },
      {
        userId: '1',
        requestId: 'req-b',
        shopId: '1',
        cartItems: [{
          itemId: '11',
          skuId: '111',
          qty: 2,
        }],
      },
    ])

    const found = findPendingCheckoutSnapshot(state, {
      userId: '1',
      shopId: '1',
    })
    expect(found?.requestId).toBe('req-b')
  })

  it('不跨用户、不跨商家匹配', () => {
    const state = stateWith([{
      userId: '1',
      requestId: 'req-a',
      shopId: '1',
      cartItems: [{
        itemId: '11',
        skuId: '111',
        qty: 1,
      }],
    }])

    expect(findPendingCheckoutSnapshot(state, {
      userId: '2',
      shopId: '1',
    })).toBeNull()
    expect(findPendingCheckoutSnapshot(state, {
      userId: '1',
      shopId: '2',
    })).toBeNull()
  })

  it('已消费的快照不会被再次取用', () => {
    const state = {
      snapshots: [{
        userId: '1',
        requestId: 'req-a',
        shopId: '1',
        cartItems: [{
          itemId: '11',
          skuId: '111',
          qty: 1,
        }],
        consumed: true,
      }],
    }

    expect(findPendingCheckoutSnapshot(state, {
      userId: '1',
      shopId: '1',
    })).toBeNull()
  })
})

describe('discardSnapshotsOfOtherUsers', () => {
  it('只保留目标用户的快照', () => {
    const state = stateWith([
      {
        userId: '1',
        requestId: 'req-a',
        shopId: '1',
        cartItems: [{
          itemId: '11',
          skuId: '111',
          qty: 1,
        }],
      },
      {
        userId: '2',
        requestId: 'req-b',
        shopId: '1',
        cartItems: [{
          itemId: '11',
          skuId: '111',
          qty: 1,
        }],
      },
    ])

    const next = discardSnapshotsOfOtherUsers(state, '2')
    expect(next.snapshots).toHaveLength(1)
    expect(next.snapshots[0].userId).toBe('2')
  })

  it('没有别人的快照时原样返回，不制造新对象', () => {
    const state = stateWith([{
      userId: '1',
      requestId: 'req-a',
      shopId: '1',
      cartItems: [{
        itemId: '11',
        skuId: '111',
        qty: 1,
      }],
    }])

    expect(discardSnapshotsOfOtherUsers(state, '1')).toBe(state)
  })

  it('登出（userId 为空）清空全部快照', () => {
    const state = stateWith([{
      userId: '1',
      requestId: 'req-a',
      shopId: '1',
      cartItems: [{
        itemId: '11',
        skuId: '111',
        qty: 1,
      }],
    }])

    expect(discardSnapshotsOfOtherUsers(state, '').snapshots).toHaveLength(0)
  })
})

describe('isSnapshotShopPresent', () => {
  // 只关心「这家店还在不在、还有没有商品」，用最小形状断言类型，不铺满 CartStore 全部字段。
  function storeWith(id, products) {
    return {
      id,
      products,
    } as unknown as Parameters<typeof isSnapshotShopPresent>[0][number]
  }

  it('商家车里还有商品时返回 true', () => {
    expect(isSnapshotShopPresent([storeWith('1', [{ id: 'p1' }])], '1')).toBe(true)
  })

  it('商家车已被清空时返回 false', () => {
    expect(isSnapshotShopPresent([storeWith('1', [])], '1')).toBe(false)
  })

  it('商家已不在车里时返回 false', () => {
    expect(isSnapshotShopPresent([], '1')).toBe(false)
  })
})
