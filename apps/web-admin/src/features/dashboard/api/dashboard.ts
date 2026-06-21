import type { DashboardOverview } from '../model/types'

const dashboardOverview: DashboardOverview = {
  stats: [
    {
      key: 'todayOrders',
      labelKey: 'dashboard.statTodayOrders',
      value: 86,
      unit: '单',
      trend: 12.5,
      type: 'primary',
    },
    {
      key: 'todayRevenue',
      labelKey: 'dashboard.statTodayRevenue',
      value: 12580,
      unit: '元',
      trend: 8.2,
      type: 'success',
    },
    {
      key: 'refundRate',
      labelKey: 'dashboard.statRefundRate',
      value: 3.4,
      unit: '%',
      trend: -1.2,
      type: 'warning',
    },
    {
      key: 'pendingWork',
      labelKey: 'dashboard.statPendingWork',
      value: 12,
      unit: '项',
      trend: 4.8,
      type: 'danger',
    },
  ],
  orderTrend: [
    {
      date: '06-01',
      paid: 48,
      completed: 42,
      refunded: 2,
    },
    {
      date: '06-02',
      paid: 56,
      completed: 49,
      refunded: 3,
    },
    {
      date: '06-03',
      paid: 72,
      completed: 61,
      refunded: 4,
    },
    {
      date: '06-04',
      paid: 86,
      completed: 73,
      refunded: 3,
    },
    {
      date: '06-05',
      paid: 79,
      completed: 68,
      refunded: 2,
    },
    {
      date: '06-06',
      paid: 94,
      completed: 82,
      refunded: 5,
    },
    {
      date: '06-07',
      paid: 108,
      completed: 96,
      refunded: 4,
    },
  ],
  shopRanking: [
    {
      shopId: 'shop-1',
      shopName: '南山轻食',
      orderCount: 128,
      revenue: 35800,
      rating: 4.8,
    },
    {
      shopId: 'shop-2',
      shopName: '川味小馆',
      orderCount: 116,
      revenue: 32680,
      rating: 4.7,
    },
    {
      shopId: 'shop-3',
      shopName: '城市咖啡',
      orderCount: 98,
      revenue: 28600,
      rating: 4.6,
    },
    {
      shopId: 'shop-4',
      shopName: '鲜榨果铺',
      orderCount: 76,
      revenue: 19880,
      rating: 4.5,
    },
    {
      shopId: 'shop-5',
      shopName: '夜宵档口',
      orderCount: 64,
      revenue: 17240,
      rating: 4.4,
    },
  ],
  pendingItems: [
    {
      key: 'refunds',
      titleKey: 'dashboard.pendingRefunds',
      count: 3,
      routeName: 'CommerceOrderView',
    },
    {
      key: 'orders',
      titleKey: 'dashboard.pendingOrders',
      count: 5,
      routeName: 'CommerceOrderView',
    },
    {
      key: 'tenants',
      titleKey: 'dashboard.pendingTenants',
      count: 2,
      routeName: 'PlatformTenantView',
    },
    {
      key: 'alerts',
      titleKey: 'dashboard.pendingAlerts',
      count: 2,
      routeName: 'SystemLogs',
    },
  ],
}

export async function getDashboardOverview(): Promise<DashboardOverview> {
  return structuredClone(dashboardOverview)
}
