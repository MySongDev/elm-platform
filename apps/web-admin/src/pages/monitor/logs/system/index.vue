<script setup lang="ts">
import type { SystemLog } from '@/entities/log'
import { IconSearch as IconEpSearch } from '@iconify-prerendered/vue-ep'
import { getSystemLogs } from '@/entities/log'
import { formatDateTime } from '@/shared/lib/format'
import { useReadonlyTable } from '@/shared/lib/useReadonlyTable'
import AdminTablePage from '@/shared/ui/AdminTablePage/index.vue'

defineOptions({ name: 'SystemLogsView' })

const { t } = useI18n()

const { loading, filteredData, query, fetchRows, resetQuery } = useReadonlyTable<
  SystemLog,
  {
    level: string
    source: string
  }
>({
  fetchApi: getSystemLogs,
  queryDefaults: {
    level: '',
    source: '',
  },
  filter: (data, q) => data.filter((item) => {
    const levelMatched = !q.level || item.level === q.level
    const sourceMatched = !q.source || item.source.includes(q.source)
    return levelMatched && sourceMatched
  }),
})

function getLevelType(level: SystemLog['level']) {
  if (level === 'error')
    return 'danger'
  if (level === 'warn')
    return 'warning'
  return 'success'
}
</script>

<template>
  <div class="main">
    <AdminTablePage :title="t('monitor.logs.system.title')" :loading="loading" @refresh="fetchRows">
      <template #search>
        <el-form :model="query" inline>
          <el-form-item :label="`${t('monitor.logs.system.level')}：`">
            <el-select
              v-model="query.level"
              class="admin-search-control"
              :placeholder="t('monitor.logs.system.levelPlaceholder')"
              clearable
            >
              <el-option label="Info" value="info" />
              <el-option label="Warn" value="warn" />
              <el-option label="Error" value="error" />
            </el-select>
          </el-form-item>
          <el-form-item :label="`${t('monitor.logs.system.source')}：`">
            <el-input v-model="query.source" :placeholder="t('monitor.logs.system.sourcePlaceholder')" clearable />
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

      <el-table
        v-loading="loading"
        :data="filteredData"
        border
        stripe
      >
        <el-table-column :label="t('monitor.logs.system.level')" width="100">
          <template #default="{ row }">
            <el-tag :type="getLevelType(row.level)">
              {{ row.level }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="source" :label="t('monitor.logs.system.source')" min-width="140" />
        <el-table-column prop="message" :label="t('monitor.logs.system.message')" min-width="240" />
        <el-table-column prop="detail" :label="t('monitor.logs.system.detail')" min-width="260">
          <template #default="{ row }">
            {{ row.detail || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" :label="t('monitor.logs.system.time')" min-width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>
        </el-table-column>
      </el-table>
    </AdminTablePage>
  </div>
</template>
