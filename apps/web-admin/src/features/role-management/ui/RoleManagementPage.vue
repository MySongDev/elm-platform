<script setup lang="ts">
import type { RoleItem } from '@/entities/role'
import { IconMenu as IconEpMenu, IconPlus as IconEpPlus } from '@iconify-prerendered/vue-ep'
import { ConfigDataTable, CrudActionColumn } from '@/shared/config-crud'
import { Permissions } from '@/shared/config/access'
import AdminSearchForm from '@/shared/ui/AdminSearchForm/index.vue'
import AdminTablePage from '@/shared/ui/AdminTablePage/index.vue'
import { createRoleSearchFields, createRoleTableColumns } from '../config/fields'
import { useRoleManagement } from '../model/useRoleManagement'
import RoleFormDialog from './RoleFormDialog.vue'
import RolePermissionPanel from './RolePermissionPanel.vue'

defineOptions({ name: 'RoleManagementPage' })

const { t } = useI18n()
const searchFields = computed(() => createRoleSearchFields(t))
const tableColumns = computed(() => createRoleTableColumns(t))

const {
  loading,
  saving,
  savingPermissions,
  dialogVisible,
  permissionOptions,
  menuPermissionTree,
  permissionPanelRendered,
  permissionPanelVisible,
  selectedRole,
  checkedMenuIds,
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
  fetchMenuTree,
  submitForm,
  handleDelete,
  openPermissionPanel,
  closePermissionPanel,
  saveMenuPermissions,
} = useRoleManagement()

function handleEditRow(row: unknown) {
  openEditDialog(row as RoleItem)
}

function handleDeleteRow(row: unknown) {
  handleDelete(row as RoleItem)
}

function handlePermissionRow(row: unknown) {
  void openPermissionPanel(row as RoleItem)
}

function handleSaveMenuPermissions(checkedKeys: number[]) {
  saveMenuPermissions(checkedKeys)
}

onMounted(() => {
  fetchRoles()
  fetchPermissionOptions()
  fetchMenuTree()
})
</script>

<template>
  <div class="role-management">
    <div class="role-management__table">
      <AdminTablePage :title="t('system.roleManagement')" :loading="loading" @refresh="fetchRoles">
        <template #search>
          <AdminSearchForm v-model:model="query" :fields="searchFields" @reset="resetQuery" />
        </template>

        <template #buttons>
          <el-button
            v-auth="Permissions.ROLE_ADD"
            type="primary"
            :icon="IconEpPlus"
            @click="openCreateDialog"
          >
            {{ t('system.addRole') }}
          </el-button>
        </template>

        <ConfigDataTable :loading="loading" :data="filteredData" :columns="tableColumns">
          <CrudActionColumn
            :column="{ width: 230 }"
            :edit-action="{ auth: Permissions.ROLE_EDIT }"
            :delete-action="{ auth: Permissions.ROLE_DELETE }"
            @edit="handleEditRow"
            @delete="handleDeleteRow"
          >
            <template #append="{ row }">
              <el-button
                v-auth="Permissions.ROLE_EDIT"
                type="primary"
                link
                :icon="IconEpMenu"
                @click="handlePermissionRow(row)"
              >
                {{ t('role.menuPermissionsShort') }}
              </el-button>
            </template>
          </CrudActionColumn>
        </ConfigDataTable>
      </AdminTablePage>
    </div>

    <RolePermissionPanel
      v-if="permissionPanelRendered"
      v-model:visible="permissionPanelVisible"
      :role="selectedRole"
      :tree-data="menuPermissionTree"
      :checked-keys="checkedMenuIds"
      :saving="savingPermissions"
      @close="closePermissionPanel"
      @save="handleSaveMenuPermissions"
    />

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

<style scoped lang="scss">
.role-management {
  display: flex;
  align-items: flex-start;
  width: 100%;
}

.role-management__table {
  flex: 1 1 auto;
  min-width: 0;
  transition: flex-basis 180ms ease, width 180ms ease;
}

@media (width <=960px) {
  .role-management {
    flex-direction: column;
  }
}
</style>
