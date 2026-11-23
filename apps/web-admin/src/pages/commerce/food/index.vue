<script setup lang="ts">
import type { FoodItem } from './model/types'
import { IconPlus as IconEpPlus } from '@iconify-prerendered/vue-ep'
import { DataScopeHint } from '@/entities/session'
import { ConfigDataTable, CrudActionColumn } from '@/shared/config-crud'
import { Permissions } from '@/shared/config/access'
import AdminSearchForm from '@/shared/ui/AdminSearchForm/index.vue'
import AdminTablePage from '@/shared/ui/AdminTablePage/index.vue'
import { createFoodSearchFields, createFoodTableColumns } from './config/fields'
import { useFoodList } from './model/useFoodList'
import FoodFormDialog from './ui/FoodFormDialog.vue'

defineOptions({ name: 'CommerceFoodView' })

const { t } = useI18n()
const searchFields = computed(() => createFoodSearchFields(t))
const tableColumns = computed(() => createFoodTableColumns(t))
const editingFood = shallowRef<FoodItem | null>(null)
const dialogVisible = shallowRef(false)
const {
  loading,
  error,
  query,
  filteredData,
  resetQuery,
  fetchFoods,
  handleDelete,
} = useFoodList()

function openCreateDialog() {
  editingFood.value = null
  dialogVisible.value = true
}

function handleEditRow(row: unknown) {
  editingFood.value = row as FoodItem
  dialogVisible.value = true
}

function handleDeleteRow(row: unknown) {
  handleDelete(row as FoodItem)
}

onMounted(fetchFoods)
</script>

<template>
  <div>
    <DataScopeHint />
    <div class="main">
      <AdminTablePage
        :title="t('commerce.food.title')"
        :loading="loading"
        :error="error"
        @refresh="fetchFoods"
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
            v-auth="Permissions.COMMERCE_FOOD_ADD"
            type="primary"
            :icon="IconEpPlus"
            @click="openCreateDialog()"
          >
            {{ t('commerce.food.add') }}
          </el-button>
        </template>

        <ConfigDataTable
          :loading="loading"
          :data="filteredData"
          :columns="tableColumns"
        >
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
        :food="editingFood"
        @saved="fetchFoods"
      />
    </div>
  </div>
</template>
