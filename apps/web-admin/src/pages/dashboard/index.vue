<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import {
  DashboardPendingWorkList,
  DashboardShopRankingTable,
  DashboardStatCardGrid,
  useDashboardOverview,
} from '@/features/dashboard'
import { AdminStateView } from '@/shared/ui/state'

defineOptions({ name: 'DashboardView' })

/**
 * 订单趋势图依赖 echarts / vue-echarts，体积远大于其它 dashboard 区块。
 * 使用异步组件拆成独立 chunk：先渲染统计卡/待办/排行，再加载图表，
 * 降低进入 dashboard 时的主包阻塞。
 * 注意：必须直接 import 组件文件，避免经 features/dashboard barrel 同步卷入 echarts。
 */
const DashboardOrderTrendChart = defineAsyncComponent({
  loader: () => import('@/features/dashboard/components/OrderTrendChart.vue'),
  delay: 80,
})

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
        <el-col :xs="24" :lg="16" class="dashboard__chart-col">
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

/* 为异步图表预留高度，减少 chunk 到达前后的布局跳动 */
.dashboard__chart-col {
  min-height: 400px;
}

.dashboard__ranking {
  margin-top: var(--app-space-lg);
}
</style>
