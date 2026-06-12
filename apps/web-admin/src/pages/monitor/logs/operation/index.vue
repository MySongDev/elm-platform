<script setup lang="ts">
import type { OperationLogQuery } from './config/fields'
import type { OperationLog } from '@/entities/log'
import { getOperationLogs } from '@/entities/log'
import { ConfigDataTable } from '@/shared/config-crud'
import { useReadonlyTable } from '@/shared/lib/useReadonlyTable'
import AdminSearchForm from '@/shared/ui/AdminSearchForm/index.vue'
import AdminTablePage from '@/shared/ui/AdminTablePage/index.vue'
import {
  createOperationLogSearchFields,
  createOperationLogTableColumns,
  filterOperationLogs,

} from './config/fields'

defineOptions({ name: 'OperationLogsView' })

const { t } = useI18n()

const { loading, filteredData, query, fetchRows, resetQuery } = useReadonlyTable<
  OperationLog,
  OperationLogQuery
>({
  fetchApi: getOperationLogs,
  queryDefaults: {
    username: '',
    module: '',
  },
  filter: filterOperationLogs,
})

const searchFields = computed(() => createOperationLogSearchFields(t))
const columns = computed(() => createOperationLogTableColumns(t))
</script>

<template>
  <AdminTablePage :title="t('monitor.logs.operation.title')" :loading="loading" @refresh="fetchRows">
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
