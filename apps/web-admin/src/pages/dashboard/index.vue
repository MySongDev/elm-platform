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
  row-gap: var(--app-space-md);
  margin-top: var(--app-space-lg);
}

.dashboard__ranking {
  margin-top: var(--app-space-lg);
}
</style>
