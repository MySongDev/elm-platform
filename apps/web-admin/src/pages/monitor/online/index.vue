<script setup lang="ts">
import type { OnlineUser } from '@/entities/monitor'
import { IconSearch as IconEpSearch, IconSwitchButton as IconEpSwitchButton } from '@iconify-prerendered/vue-ep'
import { ElMessage, ElMessageBox } from 'element-plus'
import { forceLogoutOnlineUser, getOnlineUsers } from '@/entities/monitor'
import { Permissions } from '@/shared/config/access'
import { formatDateTime } from '@/shared/lib/format'
import { useReadonlyTable } from '@/shared/lib/useReadonlyTable'
import AdminTablePage from '@/shared/ui/AdminTablePage/index.vue'

defineOptions({ name: 'OnlineUserView' })

const { t } = useI18n()

const { loading, filteredData, query, fetchRows, resetQuery } = useReadonlyTable<
  OnlineUser,
  { username: string, role: string }
>({
  fetchApi: getOnlineUsers,
  queryDefaults: { username: '', role: '' },
  filter: (data, q) => data.filter((item) => {
    const usernameMatched = !q.username || item.username.includes(q.username)
    const roleMatched = !q.role || item.role === q.role
    return usernameMatched && roleMatched
  }),
})

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
  <div class="main">
    <AdminTablePage :title="t('monitor.online.title')" :loading="loading" @refresh="fetchRows">
      <template #search>
        <el-form :model="query" inline>
          <el-form-item :label="`${t('monitor.online.username')}：`">
            <el-input v-model="query.username" :placeholder="t('monitor.online.usernamePlaceholder')" clearable />
          </el-form-item>
          <el-form-item :label="`${t('monitor.online.role')}：`">
            <el-select
              v-model="query.role"
              class="admin-search-control"
              :placeholder="t('monitor.online.rolePlaceholder')"
              clearable
            >
              <el-option :label="t('monitor.online.admin')" value="admin" />
              <el-option :label="t('monitor.online.normalUser')" value="user" />
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

      <el-table
        v-loading="loading"
        :data="filteredData"
        border
        stripe
      >
        <el-table-column prop="username" :label="t('monitor.online.username')" min-width="120" />
        <el-table-column prop="role" :label="t('monitor.online.role')" width="120">
          <template #default="{ row }">
            <el-tag :type="row.role === 'admin' ? 'danger' : 'info'">
              {{ row.role }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="ip" :label="t('monitor.online.ip')" min-width="140">
          <template #default="{ row }">
            {{ row.ip || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="browser" :label="t('monitor.online.browser')" min-width="140">
          <template #default="{ row }">
            {{ row.browser || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="os" :label="t('monitor.online.os')" min-width="140">
          <template #default="{ row }">
            {{ row.os || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="loginTime" :label="t('monitor.online.loginTime')" min-width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.loginTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="lastActiveAt" :label="t('monitor.online.lastActive')" min-width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.lastActiveAt) }}
          </template>
        </el-table-column>
        <el-table-column :label="t('crud.actions')" width="120" fixed="right">
          <template #default="{ row }">
            <el-button
              v-auth="Permissions.MONITOR_ONLINE_FORCE_LOGOUT"
              type="danger"
              link
              :icon="IconEpSwitchButton"
              @click="handleForceLogout(row)"
            >
              {{ t('monitor.online.forceLogout') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </AdminTablePage>
  </div>
</template>
