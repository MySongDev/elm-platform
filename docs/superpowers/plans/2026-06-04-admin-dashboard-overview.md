# Admin Dashboard Overview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the static admin dashboard placeholder with a front-end-first operational overview showing stat cards, order trend chart, shop ranking, and pending work items.

**Architecture:** Add a focused `features/dashboard` module with typed mock-backed API, a composable for loading/error/retry state, and presentational Vue components. The page `pages/dashboard/index.vue` composes these pieces and reuses Step 1 `AdminStateView` for enterprise-style loading/error handling. Backend changes are intentionally avoided; the API contract is stable so a real endpoint can replace the mock later.

**Tech Stack:** Vue 3, TypeScript, Element Plus, Vue I18n, ECharts, vue-echarts, Vitest, existing `shared/ui/state`.

---

## Scope Check

This plan implements only Step 2 from `docs/superpowers/specs/2026-06-03-admin-enterprise-enhancement-design.md`:

- Dashboard 数据结构
- 统计卡片
- 订单趋势�?- 店铺排行
- 待处理事�?- loading/error/retry 状�?- 最小测试覆�?
This plan does **not** implement Step 3 table enhancements, Step 4 workflow components, or Step 5 merchant onboarding.

## File Structure

### Create

- `apps/web-admin/src/features/dashboard/model/types.ts`
  - Dashboard domain types and union fields.
- `apps/web-admin/src/features/dashboard/api/dashboard.ts`
  - Mock-backed `getDashboardOverview()` API. Keeps a stable async contract for later backend replacement.
- `apps/web-admin/src/features/dashboard/model/useDashboardOverview.ts`
  - Composable that owns `loading`, `error`, `overview`, `fetchOverview`, and derived safe arrays.
- `apps/web-admin/src/features/dashboard/model/__tests__/useDashboardOverview.test.ts`
  - Tests success, failure, retry clearing error, and null-safe derived values.
- `apps/web-admin/src/features/dashboard/lib/format.ts`
  - Pure format helpers for numbers, currency, percentages, and trend text.
- `apps/web-admin/src/features/dashboard/lib/__tests__/format.test.ts`
  - Tests pure formatting helpers.
- `apps/web-admin/src/features/dashboard/lib/echarts.ts`
  - Registers only required ECharts modules for line chart usage.
- `apps/web-admin/src/features/dashboard/components/StatCardGrid.vue`
  - Shows top stat cards.
- `apps/web-admin/src/features/dashboard/components/OrderTrendChart.vue`
  - Uses `vue-echarts` `VChart` with `autoresize` and computed line chart options.
- `apps/web-admin/src/features/dashboard/components/ShopRankingTable.vue`
  - Shows top shops in an Element Plus table.
- `apps/web-admin/src/features/dashboard/components/PendingWorkList.vue`
  - Shows pending work entries and optionally routes when `routeName` is present.
- `apps/web-admin/src/features/dashboard/index.ts`
  - Feature barrel exports.

### Modify

- `apps/web-admin/package.json`
  - Add runtime dependencies: `echarts`, `vue-echarts`.
- `apps/web-admin/src/pages/dashboard/index.vue`
  - Replace static placeholder with feature components and `AdminStateView`.
- `apps/web-admin/src/shared/i18n/lang/zh-CN.ts`
  - Expand `dashboard` copy for card labels, chart labels, ranking, pending work, and units.
- `apps/web-admin/src/shared/i18n/lang/en.ts`
  - Add matching English copy.

## Task 1: Add Dashboard Types and Formatting Helpers

**Files:**
- Create: `apps/web-admin/src/features/dashboard/model/types.ts`
- Create: `apps/web-admin/src/features/dashboard/lib/format.ts`
- Create: `apps/web-admin/src/features/dashboard/lib/__tests__/format.test.ts`

- [ ] **Step 1: Write formatting tests**

Create `apps/web-admin/src/features/dashboard/lib/__tests__/format.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  formatDashboardCurrency,
  formatDashboardNumber,
  formatDashboardPercent,
  formatDashboardTrend,
} from '../format'

describe('dashboard format helpers', () => {
  it('formats large numbers with locale separators', () => {
    expect(formatDashboardNumber(12580)).toBe('12,580')
  })

  it('formats currency values with yuan prefix', () => {
    expect(formatDashboardCurrency(12580)).toBe('¥12,580')
  })

  it('formats percentage values with one decimal place', () => {
    expect(formatDashboardPercent(3.456)).toBe('3.5%')
  })

  it('formats positive, negative, and zero trends', () => {
    expect(formatDashboardTrend(12.3)).toBe('+12.3%')
    expect(formatDashboardTrend(-4.5)).toBe('-4.5%')
    expect(formatDashboardTrend(0)).toBe('0.0%')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
corepack pnpm --filter @elm-platform/web-admin exec vitest run src/features/dashboard/lib/__tests__/format.test.ts
```

Expected: FAIL because `../format` does not exist.

- [ ] **Step 3: Create dashboard types**

Create `apps/web-admin/src/features/dashboard/model/types.ts`:

```ts
export type DashboardStatType = 'primary' | 'success' | 'warning' | 'danger'

export interface DashboardOverview {
  stats: DashboardStatCard[]
  orderTrend: OrderTrendPoint[]
  shopRanking: ShopRankingItem[]
  pendingItems: PendingWorkItem[]
}

export interface DashboardStatCard {
  key: string
  label: string
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
  title: string
  count: number
  permission?: string
  routeName?: string
}
```

- [ ] **Step 4: Implement format helpers**

Create `apps/web-admin/src/features/dashboard/lib/format.ts`:

```ts
export function formatDashboardNumber(value: number) {
  return new Intl.NumberFormat('zh-CN').format(value)
}

export function formatDashboardCurrency(value: number) {
  return `¥${formatDashboardNumber(value)}`
}

export function formatDashboardPercent(value: number) {
  return `${value.toFixed(1)}%`
}

export function formatDashboardTrend(value: number) {
  const prefix = value > 0 ? '+' : ''
  return `${prefix}${formatDashboardPercent(value)}`
}
```

- [ ] **Step 5: Run test to verify it passes**

Run:

```powershell
corepack pnpm --filter @elm-platform/web-admin exec vitest run src/features/dashboard/lib/__tests__/format.test.ts
```

Expected: PASS.

## Task 2: Add Mock Dashboard API and Composable

**Files:**
- Create: `apps/web-admin/src/features/dashboard/api/dashboard.ts`
- Create: `apps/web-admin/src/features/dashboard/model/useDashboardOverview.ts`
- Create: `apps/web-admin/src/features/dashboard/model/__tests__/useDashboardOverview.test.ts`

- [ ] **Step 1: Write composable tests**

Create `apps/web-admin/src/features/dashboard/model/__tests__/useDashboardOverview.test.ts`:

```ts
import type { DashboardOverview } from '../types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope } from 'vue'
import { getDashboardOverview } from '../../api/dashboard'
import { useDashboardOverview } from '../useDashboardOverview'

vi.mock('../../api/dashboard', () => ({
  getDashboardOverview: vi.fn(),
}))

const mockOverview: DashboardOverview = {
  stats: [{
    key: 'todayOrders',
    label: '今日订单',
    value: 86,
    trend: 12.5,
    type: 'primary',
  }],
  orderTrend: [{
    date: '2026-06-01',
    paid: 20,
    completed: 18,
    refunded: 1,
  }],
  shopRanking: [{
    shopId: 'shop-1',
    shopName: '南山轻食',
    orderCount: 128,
    revenue: 3580,
    rating: 4.8,
  }],
  pendingItems: [{
    key: 'refunds',
    title: '待处理退�?,
    count: 3,
    routeName: 'OrderManagement',
  }],
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
      await expect(result.fetchOverview()).rejects.toBe(error)

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
      await expect(result.fetchOverview()).rejects.toBe(error)
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
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
corepack pnpm --filter @elm-platform/web-admin exec vitest run src/features/dashboard/model/__tests__/useDashboardOverview.test.ts
```

Expected: FAIL because API and composable files do not exist.

- [ ] **Step 3: Implement mock API**

Create `apps/web-admin/src/features/dashboard/api/dashboard.ts`:

```ts
import type { DashboardOverview } from '../model/types'

const dashboardOverview: DashboardOverview = {
  stats: [
    {
      key: 'todayOrders',
      label: '今日订单',
      value: 86,
      unit: '�?,
      trend: 12.5,
      type: 'primary',
    },
    {
      key: 'todayRevenue',
      label: '今日营业�?,
      value: 12580,
      unit: '�?,
      trend: 8.2,
      type: 'success',
    },
    {
      key: 'refundRate',
      label: '退款率',
      value: 3.4,
      unit: '%',
      trend: -1.2,
      type: 'warning',
    },
    {
      key: 'pendingWork',
      label: '待处理事�?,
      value: 12,
      unit: '�?,
      trend: 4.8,
      type: 'danger',
    },
  ],
  orderTrend: [
    { date: '06-01', paid: 48, completed: 42, refunded: 2 },
    { date: '06-02', paid: 56, completed: 49, refunded: 3 },
    { date: '06-03', paid: 72, completed: 61, refunded: 4 },
    { date: '06-04', paid: 86, completed: 73, refunded: 3 },
    { date: '06-05', paid: 79, completed: 68, refunded: 2 },
    { date: '06-06', paid: 94, completed: 82, refunded: 5 },
    { date: '06-07', paid: 108, completed: 96, refunded: 4 },
  ],
  shopRanking: [
    { shopId: 'shop-1', shopName: '南山轻食', orderCount: 128, revenue: 35800, rating: 4.8 },
    { shopId: 'shop-2', shopName: '川味小馆', orderCount: 116, revenue: 32680, rating: 4.7 },
    { shopId: 'shop-3', shopName: '城市咖啡', orderCount: 98, revenue: 28600, rating: 4.6 },
    { shopId: 'shop-4', shopName: '鲜榨果铺', orderCount: 76, revenue: 19880, rating: 4.5 },
    { shopId: 'shop-5', shopName: '夜宵档口', orderCount: 64, revenue: 17240, rating: 4.4 },
  ],
  pendingItems: [
    { key: 'refunds', title: '待处理退�?, count: 3, routeName: 'OrderManagement' },
    { key: 'orders', title: '待接单订�?, count: 5, routeName: 'OrderManagement' },
    { key: 'tenants', title: '待审核租�?, count: 2, routeName: 'TenantManagement' },
    { key: 'alerts', title: '系统告警', count: 2, routeName: 'SystemLog' },
  ],
}

export async function getDashboardOverview(): Promise<DashboardOverview> {
  return structuredClone(dashboardOverview)
}
```

- [ ] **Step 4: Implement composable**

Create `apps/web-admin/src/features/dashboard/model/useDashboardOverview.ts`:

```ts
import type { DashboardOverview } from './types'
import { getDashboardOverview } from '../api/dashboard'

export function useDashboardOverview() {
  const loading = shallowRef(false)
  const error = shallowRef<unknown>(null)
  const overview = shallowRef<DashboardOverview | null>(null)

  const stats = computed(() => overview.value?.stats ?? [])
  const orderTrend = computed(() => overview.value?.orderTrend ?? [])
  const shopRanking = computed(() => overview.value?.shopRanking ?? [])
  const pendingItems = computed(() => overview.value?.pendingItems ?? [])

  async function fetchOverview() {
    loading.value = true
    error.value = null

    try {
      overview.value = await getDashboardOverview()
    }
    catch (caughtError) {
      error.value = caughtError
      throw caughtError
    }
    finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    overview,
    stats,
    orderTrend,
    shopRanking,
    pendingItems,
    fetchOverview,
  }
}
```

- [ ] **Step 5: Run composable test**

Run:

```powershell
corepack pnpm --filter @elm-platform/web-admin exec vitest run src/features/dashboard/model/__tests__/useDashboardOverview.test.ts
```

Expected: PASS.

## Task 3: Install and Register Chart Dependencies

**Files:**
- Modify: `apps/web-admin/package.json`
- Modify: `pnpm-lock.yaml`
- Create: `apps/web-admin/src/features/dashboard/lib/echarts.ts`

- [ ] **Step 1: Install chart dependencies**

Run from repository root:

```powershell
corepack pnpm --filter @elm-platform/web-admin add echarts vue-echarts
```

Expected:

- `apps/web-admin/package.json` includes `echarts` and `vue-echarts` under `dependencies`.
- `pnpm-lock.yaml` updates.

- [ ] **Step 2: Create ECharts registration file**

Create `apps/web-admin/src/features/dashboard/lib/echarts.ts`:

```ts
import { LineChart } from 'echarts/charts'
import {
  GridComponent,
  LegendComponent,
  TooltipComponent,
} from 'echarts/components'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'

use([
  CanvasRenderer,
  GridComponent,
  LegendComponent,
  LineChart,
  TooltipComponent,
])
```

- [ ] **Step 3: Verify dependency resolution**

Run:

```powershell
corepack pnpm --filter @elm-platform/web-admin run type-check
```

Expected: PASS or only existing unrelated warnings outside type-check.

## Task 4: Build Presentational Components

**Files:**
- Create: `apps/web-admin/src/features/dashboard/components/StatCardGrid.vue`
- Create: `apps/web-admin/src/features/dashboard/components/OrderTrendChart.vue`
- Create: `apps/web-admin/src/features/dashboard/components/ShopRankingTable.vue`
- Create: `apps/web-admin/src/features/dashboard/components/PendingWorkList.vue`
- Create: `apps/web-admin/src/features/dashboard/index.ts`

- [ ] **Step 1: Create `StatCardGrid.vue`**

Create `apps/web-admin/src/features/dashboard/components/StatCardGrid.vue`:

```vue
<script setup lang="ts">
import type { DashboardStatCard } from '../model/types'
import {
  IconMoney as IconEpMoney,
  IconShoppingCart as IconEpShoppingCart,
  IconTickets as IconEpTickets,
  IconWarning as IconEpWarning,
} from '@iconify-prerendered/vue-ep'
import { formatDashboardCurrency, formatDashboardNumber, formatDashboardPercent, formatDashboardTrend } from '../lib/format'

defineOptions({ name: 'DashboardStatCardGrid' })

defineProps<{
  stats: DashboardStatCard[]
}>()

const typeMeta = {
  primary: {
    icon: IconEpShoppingCart,
    className: 'dashboard-stat-card--primary',
  },
  success: {
    icon: IconEpMoney,
    className: 'dashboard-stat-card--success',
  },
  warning: {
    icon: IconEpTickets,
    className: 'dashboard-stat-card--warning',
  },
  danger: {
    icon: IconEpWarning,
    className: 'dashboard-stat-card--danger',
  },
} as const

function formatStatValue(stat: DashboardStatCard) {
  if (stat.key.toLowerCase().includes('revenue'))
    return formatDashboardCurrency(stat.value)
  if (stat.unit === '%')
    return formatDashboardPercent(stat.value)
  return formatDashboardNumber(stat.value)
}
</script>

<template>
  <el-row :gutter="16" class="dashboard-stat-grid">
    <el-col v-for="stat in stats" :key="stat.key" :xs="24" :sm="12" :lg="6">
      <el-card shadow="hover" class="dashboard-stat-card" :class="typeMeta[stat.type].className">
        <div class="dashboard-stat-card__content">
          <div>
            <div class="dashboard-stat-card__label">
              {{ stat.label }}
            </div>
            <div class="dashboard-stat-card__value">
              {{ formatStatValue(stat) }}
            </div>
            <div v-if="stat.trend !== undefined" class="dashboard-stat-card__trend" :class="{ 'is-down': stat.trend < 0 }">
              {{ formatDashboardTrend(stat.trend) }} 较昨�?            </div>
          </div>
          <div class="dashboard-stat-card__icon">
            <el-icon>
              <component :is="typeMeta[stat.type].icon" />
            </el-icon>
          </div>
        </div>
      </el-card>
    </el-col>
  </el-row>
</template>

<style scoped lang="scss">
.dashboard-stat-grid {
  row-gap: var(--app-space-md);
}

.dashboard-stat-card {
  border: 0;

  &__content {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__label {
    margin-bottom: 8px;
    font-size: 14px;
    color: var(--app-text-secondary);
  }

  &__value {
    font-size: 28px;
    font-weight: 700;
    color: var(--app-text-primary);
  }

  &__trend {
    margin-top: 8px;
    font-size: 13px;
    color: var(--app-color-success, #67c23a);

    &.is-down {
      color: var(--app-color-danger, #f56c6c);
    }
  }

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 52px;
    height: 52px;
    font-size: 28px;
    border-radius: 14px;
  }
}

.dashboard-stat-card--primary .dashboard-stat-card__icon {
  color: #409eff;
  background: rgba(64, 158, 255, 10%);
}

.dashboard-stat-card--success .dashboard-stat-card__icon {
  color: #67c23a;
  background: rgba(103, 194, 58, 10%);
}

.dashboard-stat-card--warning .dashboard-stat-card__icon {
  color: #e6a23c;
  background: rgba(230, 162, 60, 12%);
}

.dashboard-stat-card--danger .dashboard-stat-card__icon {
  color: #f56c6c;
  background: rgba(245, 108, 108, 10%);
}
</style>
```

- [ ] **Step 2: Create `OrderTrendChart.vue`**

Create `apps/web-admin/src/features/dashboard/components/OrderTrendChart.vue`:

```vue
<script setup lang="ts">
import type { OrderTrendPoint } from '../model/types'
import VChart from 'vue-echarts'
import '../lib/echarts'

defineOptions({ name: 'DashboardOrderTrendChart' })

const props = defineProps<{
  data: OrderTrendPoint[]
}>()

const { t } = useI18n()

const chartOption = computed(() => ({
  color: ['#409eff', '#67c23a', '#f56c6c'],
  tooltip: {
    trigger: 'axis',
  },
  legend: {
    top: 0,
    data: [
      t('dashboard.trendPaid'),
      t('dashboard.trendCompleted'),
      t('dashboard.trendRefunded'),
    ],
  },
  grid: {
    top: 48,
    right: 24,
    bottom: 28,
    left: 36,
    containLabel: true,
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: props.data.map(item => item.date),
  },
  yAxis: {
    type: 'value',
    minInterval: 1,
  },
  series: [
    {
      name: t('dashboard.trendPaid'),
      type: 'line',
      smooth: true,
      data: props.data.map(item => item.paid),
    },
    {
      name: t('dashboard.trendCompleted'),
      type: 'line',
      smooth: true,
      data: props.data.map(item => item.completed),
    },
    {
      name: t('dashboard.trendRefunded'),
      type: 'line',
      smooth: true,
      data: props.data.map(item => item.refunded),
    },
  ],
}))
</script>

<template>
  <el-card class="dashboard-panel" shadow="hover">
    <template #header>
      <div class="dashboard-panel__header">
        <span>{{ t('dashboard.orderTrend') }}</span>
        <span class="dashboard-panel__hint">{{ t('dashboard.lastSevenDays') }}</span>
      </div>
    </template>

    <VChart class="dashboard-order-trend-chart" :option="chartOption" autoresize />
  </el-card>
</template>

<style scoped lang="scss">
.dashboard-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
}

.dashboard-panel__hint {
  font-size: 13px;
  font-weight: 400;
  color: var(--app-text-secondary);
}

.dashboard-order-trend-chart {
  height: 320px;
}
</style>
```

- [ ] **Step 3: Create `ShopRankingTable.vue`**

Create `apps/web-admin/src/features/dashboard/components/ShopRankingTable.vue`:

```vue
<script setup lang="ts">
import type { ShopRankingItem } from '../model/types'
import { formatDashboardCurrency, formatDashboardNumber } from '../lib/format'

defineOptions({ name: 'DashboardShopRankingTable' })

defineProps<{
  data: ShopRankingItem[]
}>()

const { t } = useI18n()
</script>

<template>
  <el-card class="dashboard-panel" shadow="hover">
    <template #header>
      <span>{{ t('dashboard.shopRanking') }}</span>
    </template>

    <el-table :data="data" row-key="shopId">
      <el-table-column type="index" :label="t('dashboard.rank')" width="72" />
      <el-table-column prop="shopName" :label="t('dashboard.shopName')" min-width="180" />
      <el-table-column :label="t('dashboard.orderCount')" width="120">
        <template #default="{ row }">
          {{ formatDashboardNumber(row.orderCount) }}
        </template>
      </el-table-column>
      <el-table-column :label="t('dashboard.revenue')" width="140">
        <template #default="{ row }">
          {{ formatDashboardCurrency(row.revenue) }}
        </template>
      </el-table-column>
      <el-table-column :label="t('dashboard.rating')" width="120">
        <template #default="{ row }">
          <el-rate :model-value="row.rating" disabled show-score score-template="{value}" />
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>
```

- [ ] **Step 4: Create `PendingWorkList.vue`**

Create `apps/web-admin/src/features/dashboard/components/PendingWorkList.vue`:

```vue
<script setup lang="ts">
import type { PendingWorkItem } from '../model/types'

defineOptions({ name: 'DashboardPendingWorkList' })

defineProps<{
  items: PendingWorkItem[]
}>()

const router = useRouter()
const { t } = useI18n()

function handleClick(item: PendingWorkItem) {
  if (!item.routeName)
    return
  router.push({ name: item.routeName })
}
</script>

<template>
  <el-card class="dashboard-panel" shadow="hover">
    <template #header>
      <span>{{ t('dashboard.pendingWork') }}</span>
    </template>

    <div class="dashboard-pending-list">
      <button
        v-for="item in items"
        :key="item.key"
        class="dashboard-pending-list__item"
        type="button"
        @click="handleClick(item)"
      >
        <span>{{ item.title }}</span>
        <el-badge :value="item.count" :max="99" />
      </button>
    </div>
  </el-card>
</template>

<style scoped lang="scss">
.dashboard-pending-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dashboard-pending-list__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 12px 14px;
  color: var(--app-text-primary);
  cursor: pointer;
  background: var(--app-bg-page);
  border: 1px solid var(--app-border-light);
  border-radius: 8px;

  &:hover {
    color: var(--app-color-primary, #409eff);
    border-color: var(--app-color-primary, #409eff);
  }
}
</style>
```

- [ ] **Step 5: Create feature barrel**

Create `apps/web-admin/src/features/dashboard/index.ts`:

```ts
export { getDashboardOverview } from './api/dashboard'
export { default as DashboardOrderTrendChart } from './components/OrderTrendChart.vue'
export { default as DashboardPendingWorkList } from './components/PendingWorkList.vue'
export { default as DashboardShopRankingTable } from './components/ShopRankingTable.vue'
export { default as DashboardStatCardGrid } from './components/StatCardGrid.vue'
export { useDashboardOverview } from './model/useDashboardOverview'
export type {
  DashboardOverview,
  DashboardStatCard,
  DashboardStatType,
  OrderTrendPoint,
  PendingWorkItem,
  ShopRankingItem,
} from './model/types'
```

## Task 5: Replace Dashboard Page and Add I18n Copy

**Files:**
- Modify: `apps/web-admin/src/pages/dashboard/index.vue`
- Modify: `apps/web-admin/src/shared/i18n/lang/zh-CN.ts`
- Modify: `apps/web-admin/src/shared/i18n/lang/en.ts`

- [ ] **Step 1: Add i18n dashboard copy**

In `zh-CN.ts`, replace/extend the existing `dashboard` group with:

```ts
dashboard: {
  totalUsers: '用户总数',
  activeUsers: '活跃用户',
  todayOrders: '今日订单',
  totalRevenue: '总收�?,
  dataTrend: '数据趋势',
  chartArea: '图表区域 - 可集�?ECharts',
  overview: '运营概览',
  orderTrend: '订单趋势',
  lastSevenDays: '�?7 �?,
  trendPaid: '已支�?,
  trendCompleted: '已完�?,
  trendRefunded: '已退�?,
  shopRanking: '店铺排行',
  pendingWork: '待处理事�?,
  rank: '排名',
  shopName: '店铺名称',
  orderCount: '订单�?,
  revenue: '营业�?,
  rating: '评分',
},
```

In `en.ts`, replace/extend the existing `dashboard` group with:

```ts
dashboard: {
  totalUsers: 'Total Users',
  activeUsers: 'Active Users',
  todayOrders: 'Today Orders',
  totalRevenue: 'Total Revenue',
  dataTrend: 'Data Trend',
  chartArea: 'Chart Area - ECharts Integration',
  overview: 'Operations Overview',
  orderTrend: 'Order Trend',
  lastSevenDays: 'Last 7 Days',
  trendPaid: 'Paid',
  trendCompleted: 'Completed',
  trendRefunded: 'Refunded',
  shopRanking: 'Shop Ranking',
  pendingWork: 'Pending Work',
  rank: 'Rank',
  shopName: 'Shop Name',
  orderCount: 'Orders',
  revenue: 'Revenue',
  rating: 'Rating',
},
```

- [ ] **Step 2: Replace dashboard page**

Replace `apps/web-admin/src/pages/dashboard/index.vue` with:

```vue
<script setup lang="ts">
import {
  DashboardOrderTrendChart,
  DashboardPendingWorkList,
  DashboardShopRankingTable,
  DashboardStatCardGrid,
  useDashboardOverview,
} from '@/features/dashboard'
import { AdminStateView } from '@/shared/ui/state'

defineOptions({ name: 'DashboardView' })

const {
  loading,
  error,
  stats,
  orderTrend,
  shopRanking,
  pendingItems,
  fetchOverview,
} = useDashboardOverview()

const isEmpty = computed(() => !loading.value && !error.value && stats.value.length === 0)

onMounted(() => {
  fetchOverview()
})
</script>

<template>
  <div class="dashboard">
    <AdminStateView
      :loading="loading"
      :error="error"
      :empty="isEmpty"
      skeleton="card"
      @retry="fetchOverview"
    >
      <DashboardStatCardGrid :stats="stats" />

      <el-row :gutter="16" class="dashboard__main-row">
        <el-col :xs="24" :lg="16">
          <DashboardOrderTrendChart :data="orderTrend" />
        </el-col>
        <el-col :xs="24" :lg="8">
          <DashboardPendingWorkList :items="pendingItems" />
        </el-col>
      </el-row>

      <DashboardShopRankingTable class="dashboard__ranking" :data="shopRanking" />
    </AdminStateView>
  </div>
</template>

<style scoped lang="scss">
.dashboard {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-lg);
}

.dashboard__main-row {
  margin-top: var(--app-space-lg);
  row-gap: var(--app-space-md);
}

.dashboard__ranking {
  margin-top: var(--app-space-lg);
}
</style>
```

- [ ] **Step 3: Run focused tests**

Run:

```powershell
corepack pnpm --filter @elm-platform/web-admin exec vitest run src/features/dashboard/lib/__tests__/format.test.ts src/features/dashboard/model/__tests__/useDashboardOverview.test.ts
```

Expected: PASS.

## Task 6: Final Verification

**Files:**
- Verify all files from Tasks 1-5.

- [ ] **Step 1: Run dashboard tests**

```powershell
corepack pnpm --filter @elm-platform/web-admin exec vitest run src/features/dashboard/lib/__tests__/format.test.ts src/features/dashboard/model/__tests__/useDashboardOverview.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run admin unit tests**

```powershell
corepack pnpm --filter @elm-platform/web-admin run test:unit
```

Expected: PASS.

- [ ] **Step 3: Run type check**

```powershell
corepack pnpm --filter @elm-platform/web-admin run type-check
```

Expected: PASS.

- [ ] **Step 4: Run lint**

```powershell
corepack pnpm --filter @elm-platform/web-admin run lint
```

Expected: 0 errors. Existing warnings may remain; report them if present.

- [ ] **Step 5: Run build**

```powershell
corepack pnpm --filter @elm-platform/web-admin run build
```

Expected: PASS. Existing `TabBarFromScratch` naming conflict warnings and Rollup PURE annotation warnings may appear; report them if still present.

## Self-Review

- Spec coverage:
  - Dashboard data structure: Task 1 and Task 2.
  - ECharts trend chart: Task 3 and Task 4.
  - Stat cards, ranking, pending work: Task 4.
  - Page composition and Step 1 state reuse: Task 5.
  - Tests: Task 1, Task 2, Task 6.
- Placeholder scan: no TBD/TODO placeholders.
- Type consistency:
  - `DashboardOverview`, `DashboardStatCard`, `OrderTrendPoint`, `ShopRankingItem`, `PendingWorkItem` are defined once in `model/types.ts` and reused by API, composable, and components.
  - `getDashboardOverview()` returns `Promise<DashboardOverview>` and `useDashboardOverview()` derives arrays from that shape.
  - `vue-echarts` usage follows current documentation: `VChart` with `:option` and `autoresize`.

