import type { DashboardOverview } from './types'
import { computed, shallowRef } from 'vue'
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
