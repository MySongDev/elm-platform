<script setup lang="ts">
import type { RestaurantItem } from '@/entities/restaurant'
import { IconPlus as IconEpPlus } from '@iconify-prerendered/vue-ep'
import { ConfigDataTable, CrudActionColumn } from '@/shared/config-crud'
import { Permissions } from '@/shared/config/access'
import AdminSearchForm from '@/shared/ui/AdminSearchForm/index.vue'
import AdminTablePage from '@/shared/ui/AdminTablePage/index.vue'
import { createRestaurantSearchFields, createRestaurantTableColumns } from '../config/fields'
import { useRestaurantManagement } from '../model/useRestaurantManagement'
import RestaurantFormDialog from './RestaurantFormDialog.vue'

defineOptions({ name: 'RestaurantManagementPage' })

const { t } = useI18n()
const searchFields = computed(() => createRestaurantSearchFields(t))
const tableColumns = computed(() => createRestaurantTableColumns(t))
const {
  loading,
  saving,
  dialogVisible,
  query,
  form,
  isEdit,
  rules,
  filteredData,
  resetQuery,
  openCreateDialog,
  openEditDialog,
  fetchRows,
  submitForm,
  handleDelete,
} = useRestaurantManagement()

function handleEditRow(row: unknown) {
  openEditDialog(row as RestaurantItem)
}

function handleDeleteRow(row: unknown) {
  handleDelete(row as RestaurantItem)
}

onMounted(fetchRows)
</script>

<template>
  <div class="main">
    <AdminTablePage :title="t('commerce.restaurant.title')" :loading="loading" @refresh="fetchRows">
      <template #search>
        <AdminSearchForm v-model:model="query" :fields="searchFields" @reset="resetQuery" />
      </template>

      <template #buttons>
        <el-button
          v-auth="Permissions.COMMERCE_RESTAURANT_ADD"
          type="primary"
          :icon="IconEpPlus"
          @click="openCreateDialog"
        >
          {{ t('commerce.restaurant.add') }}
        </el-button>
      </template>

      <ConfigDataTable :loading="loading" :data="filteredData" :columns="tableColumns">
        <CrudActionColumn
          :edit-action="{ auth: Permissions.COMMERCE_RESTAURANT_EDIT }"
          :delete-action="{ auth: Permissions.COMMERCE_RESTAURANT_DELETE }"
          @edit="handleEditRow"
          @delete="handleDeleteRow"
        />
      </ConfigDataTable>
    </AdminTablePage>

    <RestaurantFormDialog
      v-model:visible="dialogVisible"
      v-model:form="form"
      :saving="saving"
      :is-edit="isEdit"
      :rules="rules"
      @submit="submitForm"
    />
  </div>
</template>
