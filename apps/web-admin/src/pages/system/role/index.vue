<script setup lang="ts">
import { IconPlus as IconEpPlus } from '@iconify-prerendered/vue-ep'
import { createRoleSearchFields } from '@/features/role-management/config/fields'
import { useRoleManagement } from '@/features/role-management/model/useRoleManagement'
import RoleFormDialog from '@/features/role-management/ui/RoleFormDialog.vue'
import RoleTable from '@/features/role-management/ui/RoleTable.vue'
import { Permissions } from '@/shared/config/roles'
import AdminSearchForm from '@/shared/ui/AdminSearchForm/index.vue'
import AdminTablePage from '@/shared/ui/AdminTablePage/index.vue'

defineOptions({ name: 'RoleManagementView' })

const { t } = useI18n()
const searchFields = computed(() => createRoleSearchFields(t))

const {
  loading,
  saving,
  dialogVisible,
  permissionOptions,
  query,
  form,
  isEdit,
  rules,
  filteredData,
  resetQuery,
  openCreateDialog,
  openEditDialog,
  fetchRoles,
  fetchPermissionOptions,
  submitForm,
  handleDelete,
} = useRoleManagement()

onMounted(() => {
  fetchRoles()
  fetchPermissionOptions()
})
</script>

<template>
  <div class="main">
    <AdminTablePage :title="t('system.roleManagement')" :loading="loading" @refresh="fetchRoles">
      <template #search>
        <AdminSearchForm v-model:model="query" :fields="searchFields" @reset="resetQuery" />
      </template>

      <template #buttons>
        <el-button v-auth="Permissions.ROLE_ADD" type="primary" :icon="IconEpPlus" @click="openCreateDialog">
          {{ t('system.addRole') }}
        </el-button>
      </template>

      <RoleTable
        :loading="loading"
        :data="filteredData"
        @edit="openEditDialog"
        @delete="handleDelete"
      />
    </AdminTablePage>

    <RoleFormDialog
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
