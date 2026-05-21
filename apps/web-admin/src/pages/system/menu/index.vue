<script setup lang="ts">
import { IconPlus as IconEpPlus } from '@iconify-prerendered/vue-ep'
import { createMenuSearchFields } from '@/features/menu-management/config/fields'
import { useMenuManagement } from '@/features/menu-management/model/useMenuManagement'
import MenuFormDialog from '@/features/menu-management/ui/MenuFormDialog.vue'
import MenuTable from '@/features/menu-management/ui/MenuTable.vue'
import { Permissions } from '@/shared/config/roles'
import AdminSearchForm from '@/shared/ui/AdminSearchForm/index.vue'
import AdminTablePage from '@/shared/ui/AdminTablePage/index.vue'

defineOptions({ name: 'MenuManagementView' })

const { t } = useI18n()
const searchFields = computed(() => createMenuSearchFields(t))

const {
  loading,
  saving,
  dialogVisible,
  query,
  form,
  isEdit,
  rules,
  filteredData,
  parentOptions,
  resetQuery,
  openCreateDialog,
  openEditDialog,
  fetchMenus,
  submitForm,
  handleDelete,
} = useMenuManagement()

onMounted(fetchMenus)
</script>

<template>
  <div class="main">
    <AdminTablePage :title="t('system.menuManagement')" :loading="loading" @refresh="fetchMenus">
      <template #search>
        <AdminSearchForm v-model:model="query" :fields="searchFields" @reset="resetQuery" />
      </template>

      <template #buttons>
        <el-button v-auth="Permissions.MENU_ADD" type="primary" :icon="IconEpPlus" @click="openCreateDialog()">
          {{ t('system.addMenu') }}
        </el-button>
      </template>

      <MenuTable
        :loading="loading"
        :data="filteredData"
        @create="openCreateDialog"
        @edit="openEditDialog"
        @delete="handleDelete"
      />
    </AdminTablePage>

    <MenuFormDialog
      v-model:visible="dialogVisible"
      v-model:form="form"
      :saving="saving"
      :is-edit="isEdit"
      :rules="rules"
      :parent-options="parentOptions"
      @submit="submitForm"
    />
  </div>
</template>
