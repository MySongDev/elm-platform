<script setup lang="ts">
import {
  IconMoney as IconEpMoney,
  IconShoppingCart as IconEpShoppingCart,
  IconTrendCharts as IconEpTrendCharts,
  IconUser as IconEpUser,
} from '@iconify-prerendered/vue-ep'

defineOptions({ name: 'DashboardView' })

const { t } = useI18n()

const statCards = computed(() => [
  { title: t('dashboard.totalUsers'), value: '1,024', icon: IconEpUser, color: '#409eff' },
  { title: t('dashboard.activeUsers'), value: '512', icon: IconEpTrendCharts, color: '#67c23a' },
  { title: t('dashboard.todayOrders'), value: '86', icon: IconEpShoppingCart, color: '#e6a23c' },
  { title: t('dashboard.totalRevenue'), value: '¥12,580', icon: IconEpMoney, color: '#f56c6c' },
])
</script>

<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <el-col v-for="card in statCards" :key="card.title" :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-value">
                {{ card.value }}
              </div>
              <div class="stat-title">
                {{ card.title }}
              </div>
            </div>
            <el-icon :size="48" :color="card.color">
              <component :is="card.icon" />
            </el-icon>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="chart-placeholder" shadow="hover">
      <template #header>
        <span>{{ t('dashboard.dataTrend') }}</span>
      </template>
      <div class="placeholder-content">
        <el-empty :description="t('dashboard.chartArea')" />
      </div>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.dashboard {
  .stat-card {
    margin-bottom: 20px;

    .stat-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .stat-value {
      font-size: 28px;
      font-weight: 700;
      line-height: 1.2;
      color: $text-primary;
    }

    .stat-title {
      margin-top: 8px;
      font-size: 14px;
      color: $text-secondary;
    }
  }

  .chart-placeholder {
    .placeholder-content {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 300px;
    }
  }
}
</style>
