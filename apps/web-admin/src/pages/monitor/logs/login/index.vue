<script setup lang="ts">
import type { LoginLog } from '@/entities/log'
import { IconSearch as IconEpSearch } from '@iconify-prerendered/vue-ep'
import { getLoginLogs } from '@/entities/log'
import { formatDateTime } from '@/shared/lib/format'
import { useReadonlyTable } from '@/shared/lib/useReadonlyTable'
import AdminTablePage from '@/shared/ui/AdminTablePage/index.vue'

defineOptions({ name: 'LoginLogsView' })

const { t } = useI18n()

const { loading, filteredData, query, fetchRows, resetQuery } = useReadonlyTable<
  LoginLog,
  { username: string, status: string }
>({
  fetchApi: getLoginLogs,
  queryDefaults: { username: '', status: '' },
  filter: (data, q) => data.filter((item) => {
    const usernameMatched = !q.username || item.username.includes(q.username)
    const statusMatched = q.status === '' || String(item.status) === q.status
    return usernameMatched && statusMatched
  }),
})
</script>

<template>
  <div class="main">
    <AdminTablePage :title="t('monitor.logs.login.title')" :loading="loading" @refresh="fetchRows">
      <template #search>
        <el-form :model="query" inline>
          <el-form-item :label="`${t('monitor.logs.login.username')}：`">
            <el-input v-model="query.username" :placeholder="t('monitor.logs.login.usernamePlaceholder')" clearable />
          </el-form-item>
          <el-form-item :label="`${t('monitor.logs.login.status')}：`">
            <el-select v-model="query.status" :placeholder="t('monitor.logs.login.statusPlaceholder')" clearable>
              <el-option :label="t('monitor.logs.login.success')" value="1" />
              <el-option :label="t('monitor.logs.login.failed')" value="0" />
            </el-select>
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
        <el-table-column prop="username" :label="t('monitor.logs.login.username')" min-width="120" />
        <el-table-column prop="ip" :label="t('monitor.logs.login.ip')" min-width="140">
          <template #default="{ row }">
            {{ row.ip || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="address" :label="t('monitor.logs.login.address')" min-width="160">
          <template #default="{ row }">
            {{ row.address || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="browser" :label="t('monitor.logs.login.browser')" min-width="140">
          <template #default="{ row }">
            {{ row.browser || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="os" :label="t('monitor.logs.login.os')" min-width="140">
          <template #default="{ row }">
            {{ row.os || '-' }}
          </template>
        </el-table-column>
        <el-table-column :label="t('monitor.logs.login.status')" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? t('monitor.logs.login.success') : t('monitor.logs.login.failed') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="message" :label="t('monitor.logs.login.message')" min-width="180">
          <template #default="{ row }">
            {{ row.message || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" :label="t('monitor.logs.login.time')" min-width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>
        </el-table-column>
      </el-table>
    </AdminTablePage>
  </div>
</template>
