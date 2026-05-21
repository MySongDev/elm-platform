<script setup lang="ts">
import { IconPlus as IconEpPlus } from '@iconify-prerendered/vue-ep'
import { createUserSearchFields } from '@/features/user-management/config/fields'
import { useUserManagement } from '@/features/user-management/model/useUserManagement'
import UserFormDialog from '@/features/user-management/ui/UserFormDialog.vue'
import UserTable from '@/features/user-management/ui/UserTable.vue'
import { Permissions } from '@/shared/config/roles'
import AdminSearchForm from '@/shared/ui/AdminSearchForm/index.vue'
import AdminTablePage from '@/shared/ui/AdminTablePage/index.vue'

defineOptions({ name: 'UserListView' })

const { t } = useI18n()
const {
  loading,
  saving,
  dialogVisible,
  query,
  form,
  isEdit,
  filteredData,
  rules,
  permissionOptions,
  isSelf,
  resetQuery,
  openCreateDialog,
  openEditDialog,
  fetchUsers,
  submitForm,
  handleDelete,
  fetchPermissionOptions,
} = useUserManagement()

const searchFields = computed(() => createUserSearchFields(t))

onMounted(() => {
  fetchUsers()
  fetchPermissionOptions()
})
</script>

<template>
  <div class="main">
    <AdminTablePage :title="t('user.userList')" :loading="loading" @refresh="fetchUsers">
      <template #search>
        <AdminSearchForm v-model:model="query" :fields="searchFields" :search-text="t('common.search')"
          :reset-text="t('common.reset')" @reset="resetQuery" />
      </template>

      <template #buttons>
        <el-button v-auth="Permissions.USER_ADD" type="primary" :icon="IconEpPlus" @click="openCreateDialog">
          {{ t('user.addUser') }}
        </el-button>
      </template>

      <UserTable :loading="loading" :data="filteredData" :is-self="isSelf" @edit="openEditDialog"
        @delete="handleDelete" />
    </AdminTablePage>

    <UserFormDialog
      v-model:visible="dialogVisible"
      v-model:form="form"
      :saving="saving"
      :is-edit="isEdit"
      :rules="rules"
      :permission-options="permissionOptions"
      @submit="submitForm"
    />
  </div>
</template>
