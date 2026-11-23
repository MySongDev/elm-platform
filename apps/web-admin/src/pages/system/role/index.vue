<script setup lang="ts">
/**
 * @file 角色管理页面
 * @domain pages/system/role
 * @description 装配角色列表、基本信息弹窗与页面权限面板，持有编辑目标和可见状态。
 */

import type { RoleItem } from './model/types'
import { IconMenu as IconEpMenu, IconPlus as IconEpPlus } from '@iconify-prerendered/vue-ep'
import { computed, onMounted, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { ConfigDataTable, CrudActionColumn } from '@/shared/config-crud'
import { Permissions } from '@/shared/config/access'
import AdminSearchForm from '@/shared/ui/AdminSearchForm/index.vue'
import AdminTablePage from '@/shared/ui/AdminTablePage/index.vue'
import { createRoleSearchFields, createRoleTableColumns } from './config/fields'
import { useRoleList } from './model/useRoleList'
import RoleFormDialog from './ui/RoleFormDialog.vue'
import RolePermissionPanel from './ui/RolePermissionPanel.vue'

defineOptions({ name: 'RoleManagement' })

const { t } = useI18n()
const searchFields = computed(() => createRoleSearchFields(t))
const tableColumns = computed(() => createRoleTableColumns(t))
const editingRole = shallowRef<RoleItem | null>(null)
const dialogVisible = shallowRef(false)
const permissionRole = shallowRef<RoleItem | null>(null)
const permissionVisible = shallowRef(false)

const {
  loading,
  error,
  query,
  filteredData,
  resetQuery,
  fetchRoles,
  handleDelete,
} = useRoleList()

function openCreateDialog() {
  editingRole.value = null
  dialogVisible.value = true
}

function handleEditRow(row: unknown) {
  editingRole.value = row as RoleItem
  dialogVisible.value = true
}

function handleDeleteRow(row: unknown) {
  handleDelete(row as RoleItem)
}

function handlePermissionRow(row: unknown) {
  permissionRole.value = row as RoleItem
  permissionVisible.value = true
}

onMounted(() => {
  void fetchRoles()
})
</script>

<template>
  <div class="role-management">
    <div class="role-management__table">
      <AdminTablePage
        :title="t('system.roleManagement')"
        :loading="loading"
        :error="error"
        @refresh="fetchRoles"
      >
        <template #search>
          <AdminSearchForm
            v-model:model="query"
            :fields="searchFields"
            @reset="resetQuery"
          />
        </template>

        <template #buttons>
          <el-button
            v-auth="Permissions.ROLE_ADD"
            type="primary"
            :icon="IconEpPlus"
            @click="openCreateDialog()"
          >
            {{ t('system.addRole') }}
          </el-button>
        </template>

        <ConfigDataTable
          :loading="loading"
          :data="filteredData"
          :columns="tableColumns"
        >
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
      v-model:visible="permissionVisible"
      :role="permissionRole"
      @saved="fetchRoles"
    />

    <RoleFormDialog
      v-model:visible="dialogVisible"
      :role="editingRole"
      @saved="fetchRoles"
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
