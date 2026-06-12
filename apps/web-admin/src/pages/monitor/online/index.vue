<script setup lang="ts">
import type { OnlineUserQuery } from './config/fields'
import type { OnlineUser } from '@/entities/monitor'
import { IconSwitchButton as IconEpSwitchButton } from '@iconify-prerendered/vue-ep'
import { ElMessage, ElMessageBox } from 'element-plus'
import { forceLogoutOnlineUser, getOnlineUsers } from '@/entities/monitor'
import { ConfigDataTable } from '@/shared/config-crud'
import { Permissions } from '@/shared/config/access'
import { useReadonlyTable } from '@/shared/lib/useReadonlyTable'
import AdminSearchForm from '@/shared/ui/AdminSearchForm/index.vue'
import AdminTablePage from '@/shared/ui/AdminTablePage/index.vue'
import {
  createOnlineUserSearchFields,
  createOnlineUserTableColumns,
  filterOnlineUsers,
} from './config/fields'

defineOptions({ name: 'OnlineUserView' })

const { t } = useI18n()

const { loading, filteredData, query, fetchRows, resetQuery } = useReadonlyTable<
  OnlineUser,
  OnlineUserQuery
>({
  fetchApi: getOnlineUsers,
  queryDefaults: {
    username: '',
    role: '',
  },
  filter: filterOnlineUsers,
})

const searchFields = computed(() => createOnlineUserSearchFields(t))
const columns = computed(() => createOnlineUserTableColumns(t))

async function handleForceLogout(row: OnlineUser) {
  try {
    await ElMessageBox.confirm(t('monitor.online.forceLogoutConfirm', { name: row.username }), t('common.tip'), { type: 'warning' })
    await forceLogoutOnlineUser(row.id)
    ElMessage.success(t('monitor.online.operationSuccess'))
    fetchRows()
  }
  catch {
    // user cancelled or request error
  }
}
</script>

<template>
  <AdminTablePage :title="t('monitor.online.title')" :loading="loading" @refresh="fetchRows">
    <template #search>
      <AdminSearchForm
        v-model:model="query"
        :fields="searchFields"
        :loading="loading"
        @reset="resetQuery"
      />
    </template>

    <ConfigDataTable :loading="loading" :data="filteredData" :columns="columns">
      <el-table-column :label="t('crud.actions')" width="120" fixed="right">
        <template #default="{ row }">
          <el-button
            v-auth="Permissions.MONITOR_ONLINE_FORCE_LOGOUT"
            type="danger"
            link
            :icon="IconEpSwitchButton"
            @click="handleForceLogout(row as OnlineUser)"
          >
            {{ t('monitor.online.forceLogout') }}
          </el-button>
        </template>
      </el-table-column>
    </ConfigDataTable>
  </AdminTablePage>
</template>
