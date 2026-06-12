<script setup lang="ts">
import type { SystemLogQuery } from './config/fields'
import type { SystemLog } from '@/entities/log'
import { getSystemLogs } from '@/entities/log'
import { ConfigDataTable } from '@/shared/config-crud'
import { useReadonlyTable } from '@/shared/lib/useReadonlyTable'
import AdminSearchForm from '@/shared/ui/AdminSearchForm/index.vue'
import AdminTablePage from '@/shared/ui/AdminTablePage/index.vue'
import {
  createSystemLogSearchFields,
  createSystemLogTableColumns,
  filterSystemLogs,
} from './config/fields'

defineOptions({ name: 'SystemLogsView' })

const { t } = useI18n()

const { loading, filteredData, query, fetchRows, resetQuery } = useReadonlyTable<
  SystemLog,
  SystemLogQuery
>({
  fetchApi: getSystemLogs,
  queryDefaults: {
    level: '',
    source: '',
  },
  filter: filterSystemLogs,
})

const searchFields = computed(() => createSystemLogSearchFields(t))
const columns = computed(() => createSystemLogTableColumns(t))
</script>

<template>
  <AdminTablePage :title="t('monitor.logs.system.title')" :loading="loading" @refresh="fetchRows">
    <template #search>
      <AdminSearchForm
        v-model:model="query"
        :fields="searchFields"
        :loading="loading"
        @reset="resetQuery"
      />
    </template>

    <ConfigDataTable :loading="loading" :data="filteredData" :columns="columns" />
  </AdminTablePage>
</template>
