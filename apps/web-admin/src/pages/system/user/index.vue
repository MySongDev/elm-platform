<script setup lang="ts">
/**
 * @file 用户管理页面
 * @domain pages/system/user
 * @description 装配用户查询、列表和表单，将用户管理状态连接到页面操作。
 */

import type { UserInfo } from '@/entities/user'
import { IconPlus as IconEpPlus } from '@iconify-prerendered/vue-ep'
import { Permissions } from '@/shared/config/access'
import AdminSearchForm from '@/shared/ui/AdminSearchForm/index.vue'
import AdminTablePage from '@/shared/ui/AdminTablePage/index.vue'
import { createUserSearchFields } from './config/fields'
import { useUserList } from './model/useUserList'
import UserFormDialog from './ui/UserFormDialog.vue'
import UserTable from './ui/UserTable.vue'

defineOptions({ name: 'UserList' })

const { t } = useI18n()
const {
  loading,
  error,
  query,
  filteredData,
  isSelf,
  resetQuery,
  fetchUsers,
  handleDelete,
} = useUserList()

const dialogVisible = ref(false)
const editingUser = shallowRef<UserInfo | null>(null)

function openEditor(user: UserInfo | null = null) {
  editingUser.value = user
  dialogVisible.value = true
}

const searchFields = computed(() => createUserSearchFields(t))

onMounted(fetchUsers)
</script>

<template>
  <div class="main">
    <AdminTablePage
      :title="t('user.userList')"
      :loading="loading"
      :error="error"
      :empty="filteredData.length === 0"
      :empty-reason="query.username || query.role || query.status ? 'no-filter-result' : 'no-data'"
      @refresh="fetchUsers"
      @clear-filter="resetQuery"
    >
      <template #search>
        <AdminSearchForm
          v-model:model="query"
          :fields="searchFields"
          :search-text="t('common.search')"
          :reset-text="t('common.reset')"
          @reset="resetQuery"
        />
      </template>

      <template #buttons>
        <el-button
          v-auth="Permissions.USER_ADD"
          type="primary"
          :icon="IconEpPlus"
          @click="openEditor()"
        >
          {{ t('user.addUser') }}
        </el-button>
      </template>

      <UserTable
        :loading="loading"
        :data="filteredData"
        :is-self="isSelf"
        @edit="openEditor"
        @delete="handleDelete"
      />
    </AdminTablePage>

    <UserFormDialog
      v-model:visible="dialogVisible"
      :user="editingUser"
      @saved="fetchUsers"
    />
  </div>
</template>
