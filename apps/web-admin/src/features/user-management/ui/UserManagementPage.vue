<script setup lang="ts">
import { IconPlus as IconEpPlus } from '@iconify-prerendered/vue-ep'
import { Permissions } from '@/shared/config/access'
import AdminSearchForm from '@/shared/ui/AdminSearchForm/index.vue'
import AdminTablePage from '@/shared/ui/AdminTablePage/index.vue'
import { createUserSearchFields } from '../config/fields'
import { useUserManagement } from '../model/useUserManagement'
import UserFormDialog from './UserFormDialog.vue'
import UserTable from './UserTable.vue'

defineOptions({ name: 'UserManagementPage' })

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
  tenantOptions,
  shopOptions,
  isSelf,
  resetQuery,
  openCreateDialog,
  openEditDialog,
  fetchUsers,
  submitForm,
  handleDelete,
  fetchPermissionOptions,
  fetchTenantOptions,
  fetchShopOptions,
} = useUserManagement()

const searchFields = computed(() => createUserSearchFields(t))

onMounted(() => {
  fetchUsers()
  fetchPermissionOptions()
  fetchTenantOptions()
  fetchShopOptions()
})
</script>

<template>
  <div class="main">
    <AdminTablePage :title="t('user.userList')" :loading="loading" @refresh="fetchUsers">
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
          @click="openCreateDialog"
        >
          {{ t('user.addUser') }}
        </el-button>
      </template>

      <UserTable
        :loading="loading"
        :data="filteredData"
        :is-self="isSelf"
        @edit="openEditDialog"
        @delete="handleDelete"
      />
    </AdminTablePage>

    <UserFormDialog
      v-model:visible="dialogVisible"
      v-model:form="form"
      :saving="saving"
      :is-edit="isEdit"
      :rules="rules"
      :permission-options="permissionOptions"
      :tenant-options="tenantOptions"
      :shop-options="shopOptions"
      @submit="submitForm"
    />
  </div>
</template>
