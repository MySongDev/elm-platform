<script setup lang="ts">
import { transformI18n } from '@/shared/i18n'
import { formatDateTime } from '@/shared/lib/format'
import { activePaneKey } from '../config'
import { securityLogPageSizes, useSecurityLogTable } from '../model/security-log'

defineOptions({ name: 'AccountSecurityLog' })

const { t } = useI18n()
const activePaneInfo = inject(activePaneKey)
const sectionTitle = computed(() => activePaneInfo?.value ? transformI18n(activePaneInfo.value.label) : '')

const {
  loading,
  dataList,
  pagination,
  fetchData,
  handleCurrentChange,
  handleSizeChange,
} = useSecurityLogTable()

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="security-log-section">
    <h3 class="section-title">
      {{ sectionTitle }}
    </h3>
    <el-table
      v-loading="loading"
      :data="dataList"
      stripe
      border
      style="width: 100%"
    >
      <el-table-column :label="t('securityLog.detail')" prop="message" min-width="140" />
      <el-table-column :label="t('securityLog.ipAddress')" prop="ip" min-width="120" />
      <el-table-column :label="t('securityLog.os')" prop="os" min-width="100" />
      <el-table-column :label="t('securityLog.browser')" prop="browser" min-width="100" />
      <el-table-column :label="t('securityLog.status')" prop="status" min-width="80">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
            {{ row.status === 1 ? t('securityLog.logSuccess') : t('securityLog.logFailed') }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="t('securityLog.time')" min-width="180">
        <template #default="{ row }">
          {{ formatDateTime(row.createdAt) }}
        </template>
      </el-table-column>
    </el-table>
    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="pagination.currentPage"
        v-model:page-size="pagination.pageSize"
        :page-sizes="securityLogPageSizes"
        :total="pagination.total"
        :disabled="loading"
        layout="total, sizes, prev, pager, next"
        :background="pagination.background"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.security-log-section {
  max-width: 90%;
}

.section-title {
  margin: 32px 0;
  font-size: 18px;
  font-weight: 600;
  color: $text-primary;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
