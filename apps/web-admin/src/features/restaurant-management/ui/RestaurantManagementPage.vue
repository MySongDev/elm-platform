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
  error,
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
  batchDeleteRows,
} = useRestaurantManagement()

const hasSearchCondition = computed(() => Boolean(query.name.trim() || query.category.trim()))
const emptyReason = computed(() => hasSearchCondition.value ? 'no-filter-result' : 'no-data')
const isTableEmpty = computed(() => !loading.value && !error.value && filteredData.value.length === 0)

function handleClearFilter() {
  resetQuery()
  fetchRows()
}

function handleEditRow(row: unknown) {
  openEditDialog(row as RestaurantItem)
}

function handleDeleteRow(row: unknown) {
  handleDelete(row as RestaurantItem)
}

function handleBatchAction(actionKey: string, rows: RestaurantItem[]) {
  if (actionKey === 'delete')
    batchDeleteRows(rows)
}

onMounted(fetchRows)
</script>

<template>
  <div class="main">
    <AdminTablePage
      :title="t('commerce.restaurant.title')"
      :loading="loading"
      :error="error"
      :empty="isTableEmpty"
      :empty-reason="emptyReason"
      skeleton="table"
      @refresh="fetchRows"
      @clear-filter="handleClearFilter"
    >
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

      <ConfigDataTable
        :loading="loading"
        :data="filteredData"
        :columns="tableColumns"
        :table="{
          selection: true,
          batchActions: [{
            key: 'delete',
            text: t('tableEnhance.batchDelete'),
            type: 'danger',
            auth: Permissions.COMMERCE_RESTAURANT_DELETE,
          }],
          preferencesKey: 'commerce.restaurant.table',
          density: 'default',
          exportable: true,
          exportFileName: 'restaurants.csv',
        }"
        @batch-action="handleBatchAction"
      >
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
