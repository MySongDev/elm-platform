import type { DashboardOverview } from '../types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope } from 'vue'
import { getDashboardOverview } from '../../api/dashboard'
import { useDashboardOverview } from '../useDashboardOverview'

vi.mock('../../api/dashboard', () => ({
  getDashboardOverview: vi.fn(),
}))

const mockOverview: DashboardOverview = {
  stats: [
    {
      key: 'todayOrders',
      labelKey: 'dashboard.statTodayOrders',
      value: 86,
      trend: 12.5,
      type: 'primary',
    },
  ],
  orderTrend: [
    {
      date: '2026-06-01',
      paid: 20,
      completed: 18,
      refunded: 1,
    },
  ],
  shopRanking: [
    {
      shopId: 'shop-1',
      shopName: '南山轻食',
      orderCount: 128,
      revenue: 3580,
      rating: 4.8,
    },
  ],
  pendingItems: [
    {
      key: 'refunds',
      titleKey: 'dashboard.pendingRefunds',
      count: 3,
      routeName: 'CommerceOrderView',
    },
  ],
}

function runInScope<T>(factory: () => T) {
  const scope = effectScope()
  const result = scope.run(factory)
  if (!result)
    throw new Error('effect scope did not return a result')
  return {
    result,
    dispose: () => scope.stop(),
  }
}

describe('useDashboardOverview', () => {
  beforeEach(() => {
    vi.mocked(getDashboardOverview).mockReset()
  })

  it('loads dashboard overview data', async () => {
    vi.mocked(getDashboardOverview).mockResolvedValue(mockOverview)
    const { result, dispose } = runInScope(() => useDashboardOverview())

    try {
      await result.fetchOverview()

      expect(result.loading.value).toBe(false)
      expect(result.error.value).toBeNull()
      expect(result.overview.value).toEqual(mockOverview)
      expect(result.stats.value).toEqual(mockOverview.stats)
      expect(result.orderTrend.value).toEqual(mockOverview.orderTrend)
      expect(result.shopRanking.value).toEqual(mockOverview.shopRanking)
      expect(result.pendingItems.value).toEqual(mockOverview.pendingItems)
    }
    finally {
      dispose()
    }
  })

  it('records errors and keeps derived arrays safe', async () => {
    const error = new Error('dashboard failed')
    vi.mocked(getDashboardOverview).mockRejectedValue(error)
    const { result, dispose } = runInScope(() => useDashboardOverview())

    try {
      await result.fetchOverview()

      expect(result.loading.value).toBe(false)
      expect(result.error.value).toBe(error)
      expect(result.stats.value).toEqual([])
      expect(result.orderTrend.value).toEqual([])
      expect(result.shopRanking.value).toEqual([])
      expect(result.pendingItems.value).toEqual([])
    }
    finally {
      dispose()
    }
  })

  it('clears the previous error before retrying', async () => {
    const error = new Error('dashboard failed')
    vi.mocked(getDashboardOverview)
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce(mockOverview)
    const { result, dispose } = runInScope(() => useDashboardOverview())

    try {
      await result.fetchOverview()
      expect(result.error.value).toBe(error)

      await result.fetchOverview()

      expect(result.error.value).toBeNull()
      expect(result.overview.value).toEqual(mockOverview)
    }
    finally {
      dispose()
    }
  })
})
