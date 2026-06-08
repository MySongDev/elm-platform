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
