<script setup lang="ts">
import type { LoginLogQuery } from './config/fields'
import type { LoginLog } from '@/entities/log'
import { getLoginLogs } from '@/entities/log'
import { ConfigDataTable } from '@/shared/config-crud'
import { useReadonlyTable } from '@/shared/lib/useReadonlyTable'
import AdminSearchForm from '@/shared/ui/AdminSearchForm/index.vue'
import AdminTablePage from '@/shared/ui/AdminTablePage/index.vue'
import {
  createLoginLogSearchFields,
  createLoginLogTableColumns,
  filterLoginLogs,
} from './config/fields'

defineOptions({ name: 'LoginLogsView' })

const { t } = useI18n()

const { loading, filteredData, query, fetchRows, resetQuery } = useReadonlyTable<
  LoginLog,
  LoginLogQuery
>({
  fetchApi: getLoginLogs,
  queryDefaults: {
    username: '',
    status: '',
  },
  filter: filterLoginLogs,
})

const searchFields = computed(() => createLoginLogSearchFields(t))
const columns = computed(() => createLoginLogTableColumns(t))
</script>

<template>
  <AdminTablePage :title="t('monitor.logs.login.title')" :loading="loading" @refresh="fetchRows">
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
