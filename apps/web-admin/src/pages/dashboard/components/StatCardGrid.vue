<script setup lang="ts">
import type { DashboardStatCard } from '../model/types'
import {
  IconMoney as IconEpMoney,
  IconShoppingCart as IconEpShoppingCart,
  IconTickets as IconEpTickets,
  IconWarning as IconEpWarning,
} from '@iconify-prerendered/vue-ep'
import {
  formatDashboardCurrency,
  formatDashboardNumber,
  formatDashboardPercent,
  formatDashboardTrend,
} from '../lib/format'

defineOptions({ name: 'DashboardStatCardGrid' })

defineProps<{
  stats: DashboardStatCard[]
}>()

const { t } = useI18n()

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
    <el-col
      v-for="stat in stats"
      :key="stat.key"
      :xs="24"
      :sm="12"
      :lg="6"
    >
      <el-card shadow="hover" class="dashboard-stat-card" :class="typeMeta[stat.type].className">
        <div class="dashboard-stat-card__content">
          <div>
            <div class="dashboard-stat-card__label">
              {{ t(stat.labelKey) }}
            </div>
            <div class="dashboard-stat-card__value">
              {{ formatStatValue(stat) }}
            </div>
            <div
              v-if="stat.trend !== undefined"
              class="dashboard-stat-card__trend"
              :class="{ 'is-down': stat.trend < 0 }"
            >
              {{ formatDashboardTrend(stat.trend) }} {{ t('dashboard.comparedWithYesterday') }}
            </div>
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
  background: rgb(64 158 255 / 10%);
}

.dashboard-stat-card--success .dashboard-stat-card__icon {
  color: #67c23a;
  background: rgb(103 194 58 / 10%);
}

.dashboard-stat-card--warning .dashboard-stat-card__icon {
  color: #e6a23c;
  background: rgb(230 162 60 / 12%);
}

.dashboard-stat-card--danger .dashboard-stat-card__icon {
  color: #f56c6c;
  background: rgb(245 108 108 / 10%);
}
</style>
