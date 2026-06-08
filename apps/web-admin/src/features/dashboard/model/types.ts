export type DashboardStatType = 'primary' | 'success' | 'warning' | 'danger'

export interface DashboardOverview {
  stats: DashboardStatCard[]
  orderTrend: OrderTrendPoint[]
  shopRanking: ShopRankingItem[]
  pendingItems: PendingWorkItem[]
}

export interface DashboardStatCard {
  key: string
  labelKey: string
  value: number
  unit?: string
  trend?: number
  type: DashboardStatType
}

export interface OrderTrendPoint {
  date: string
  paid: number
  completed: number
  refunded: number
}

export interface ShopRankingItem {
  shopId: string
  shopName: string
  orderCount: number
  revenue: number
  rating?: number
}

export interface PendingWorkItem {
  key: string
  titleKey: string
  count: number
  permission?: string
  routeName?: string
}
