<script setup lang="ts">
import { IconPlus as IconEpPlus } from '@iconify-prerendered/vue-ep'
import { createFoodSearchFields } from '@/features/food-management/config/fields'
import { useFoodManagement } from '@/features/food-management/model/useFoodManagement'
import FoodFormDialog from '@/features/food-management/ui/FoodFormDialog.vue'
import FoodTable from '@/features/food-management/ui/FoodTable.vue'
import { Permissions } from '@/shared/config/roles'
import AdminSearchForm from '@/shared/ui/AdminSearchForm/index.vue'
import AdminTablePage from '@/shared/ui/AdminTablePage/index.vue'

defineOptions({ name: 'CommerceFoodView' })

const { t } = useI18n()
const searchFields = computed(() => createFoodSearchFields(t))
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

onMounted(fetchRows)
</script>

<template>
  <div class="main">
    <AdminTablePage :title="t('commerce.food.title')" :loading="loading" @refresh="fetchRows">
      <template #search>
        <AdminSearchForm v-model:model="query" :fields="searchFields" @reset="resetQuery" />
      </template>

      <template #buttons>
        <el-button v-auth="Permissions.COMMERCE_FOOD_ADD" type="primary" :icon="IconEpPlus" @click="openCreateDialog">
          {{ t('commerce.food.add') }}
        </el-button>
      </template>

      <FoodTable :loading="loading" :data="filteredData" @edit="openEditDialog" @delete="handleDelete" />
    </AdminTablePage>

    <FoodFormDialog v-model:visible="dialogVisible" v-model:form="form" :saving="saving" :is-edit="isEdit"
      :rules="rules" @submit="submitForm" />
  </div>
</template>
