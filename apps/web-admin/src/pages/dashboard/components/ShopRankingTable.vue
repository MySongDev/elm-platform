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
          <el-rate
            :model-value="row.rating"
            disabled
            show-score
            score-template="{value}"
          />
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>
