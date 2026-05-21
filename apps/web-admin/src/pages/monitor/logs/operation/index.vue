<script setup lang="ts">
import type { OperationLog } from '@/entities/log'
import { IconSearch as IconEpSearch } from '@iconify-prerendered/vue-ep'
import { getOperationLogs } from '@/entities/log'
import { formatDateTime } from '@/shared/lib/format'
import { useReadonlyTable } from '@/shared/lib/useReadonlyTable'
import AdminTablePage from '@/shared/ui/AdminTablePage/index.vue'

defineOptions({ name: 'OperationLogsView' })

const { t } = useI18n()

const { loading, filteredData, query, fetchRows, resetQuery } = useReadonlyTable<
  OperationLog,
  { username: string, module: string }
>({
  fetchApi: getOperationLogs,
  queryDefaults: { username: '', module: '' },
  filter: (data, q) => data.filter((item) => {
    const usernameMatched = !q.username || item.username.includes(q.username)
    const moduleMatched = !q.module || item.module.includes(q.module)
    return usernameMatched && moduleMatched
  }),
})
</script>

<template>
  <div class="main">
    <AdminTablePage :title="t('monitor.logs.operation.title')" :loading="loading" @refresh="fetchRows">
      <template #search>
        <el-form :model="query" inline>
          <el-form-item :label="`${t('monitor.logs.operation.username')}：`">
            <el-input v-model="query.username" :placeholder="t('monitor.logs.operation.usernamePlaceholder')"
              clearable />
          </el-form-item>
          <el-form-item :label="`${t('monitor.logs.operation.module')}：`">
            <el-input v-model="query.module" :placeholder="t('monitor.logs.operation.modulePlaceholder')" clearable />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :icon="IconEpSearch">
              {{ t('common.search') }}
            </el-button>
            <el-button @click="resetQuery">
              {{ t('common.reset') }}
            </el-button>
          </el-form-item>
        </el-form>
      </template>

      <el-table v-loading="loading" :data="filteredData" border stripe>
        <el-table-column prop="username" :label="t('monitor.logs.operation.username')" min-width="120" />
        <el-table-column prop="module" :label="t('monitor.logs.operation.module')" min-width="120" />
        <el-table-column prop="action" :label="t('monitor.logs.operation.action')" min-width="120" />
        <el-table-column prop="method" :label="t('monitor.logs.operation.method')" width="100" />
        <el-table-column prop="path" :label="t('monitor.logs.operation.path')" min-width="220" />
        <el-table-column prop="ip" :label="t('monitor.logs.operation.ip')" min-width="140">
          <template #default="{ row }">
            {{ row.ip || '-' }}
          </template>
        </el-table-column>
        <el-table-column :label="t('monitor.logs.operation.status')" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status >= 200 && row.status < 400 ? 'success' : 'danger'">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="duration" :label="t('monitor.logs.operation.duration')" width="100">
          <template #default="{ row }">
            {{ row.duration }} ms
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" :label="t('monitor.logs.operation.time')" min-width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>
        </el-table-column>
      </el-table>
    </AdminTablePage>
  </div>
</template>
