<script setup lang="ts">
import type { SecurityLog } from '@/entities/session'
import { getSecurityLogs } from '@/entities/session'
import { transformI18n } from '@/shared/i18n'
import { formatDateTime } from '@/shared/lib/format'
import { activePaneKey } from '../config'

defineOptions({ name: 'AccountSecurityLog' })

const { t } = useI18n()
const activePaneInfo = inject(activePaneKey)
const sectionTitle = computed(() => activePaneInfo?.value ? transformI18n(activePaneInfo.value.label) : '')

const loading = ref(true)
const dataList = ref<SecurityLog[]>([])
const pagination = reactive({
  total: 0,
  pageSize: 10,
  currentPage: 1,
  background: true,
})

async function fetchData() {
  loading.value = true
  try {
    const res = await getSecurityLogs({
      page: pagination.currentPage,
      pageSize: pagination.pageSize,
    })
    dataList.value = res.list
    pagination.total = res.total
    pagination.currentPage = res.page
    pagination.pageSize = res.pageSize
  }
  catch {
    // error handled by request interceptor
  }
  finally {
    loading.value = false
  }
}

function handleCurrentChange(page: number) {
  pagination.currentPage = page
  fetchData()
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="security-log-section">
    <h3 class="section-title">
      {{ sectionTitle }}
    </h3>
    <el-table v-loading="loading" :data="dataList" stripe border style="width: 100%">
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
      <el-pagination v-model:current-page="pagination.currentPage" :page-size="pagination.pageSize"
        :total="pagination.total" :disabled="loading" layout="total, prev, pager, next"
        :background="pagination.background" @current-change="handleCurrentChange" />
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
