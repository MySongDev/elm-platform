<script setup lang="ts">
import type { FoodItem } from '@/entities/food'
import { IconPlus as IconEpPlus } from '@iconify-prerendered/vue-ep'
import { ConfigDataTable, CrudActionColumn } from '@/shared/config-crud'
import { Permissions } from '@/shared/config/access'
import AdminSearchForm from '@/shared/ui/AdminSearchForm/index.vue'
import AdminTablePage from '@/shared/ui/AdminTablePage/index.vue'
import { createFoodSearchFields, createFoodTableColumns } from '../config/fields'
import { useFoodManagement } from '../model/useFoodManagement'
import FoodFormDialog from './FoodFormDialog.vue'

defineOptions({ name: 'FoodManagementPage' })

const { t } = useI18n()
const searchFields = computed(() => createFoodSearchFields(t))
const tableColumns = computed(() => createFoodTableColumns(t))
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
} = useFoodManagement()

function handleEditRow(row: unknown) {
  openEditDialog(row as FoodItem)
}

function handleDeleteRow(row: unknown) {
  handleDelete(row as FoodItem)
}

onMounted(fetchRows)
</script>

<template>
  <div class="main">
    <AdminTablePage :title="t('commerce.food.title')" :loading="loading" @refresh="fetchRows">
      <template #search>
        <AdminSearchForm v-model:model="query" :fields="searchFields" @reset="resetQuery" />
      </template>

      <template #buttons>
        <el-button
          v-auth="Permissions.COMMERCE_FOOD_ADD"
          type="primary"
          :icon="IconEpPlus"
          @click="openCreateDialog"
        >
          {{ t('commerce.food.add') }}
        </el-button>
      </template>

      <ConfigDataTable :loading="loading" :data="filteredData" :columns="tableColumns">
        <CrudActionColumn
          :edit-action="{ auth: Permissions.COMMERCE_FOOD_EDIT }"
          :delete-action="{ auth: Permissions.COMMERCE_FOOD_DELETE }"
          @edit="handleEditRow"
          @delete="handleDeleteRow"
        />
      </ConfigDataTable>
    </AdminTablePage>

    <FoodFormDialog
      v-model:visible="dialogVisible"
      v-model:form="form"
      :saving="saving"
      :is-edit="isEdit"
      :rules="rules"
      @submit="submitForm"
    />
  </div>
</template>
