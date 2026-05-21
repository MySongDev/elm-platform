<script setup lang="ts">
import { IconPlus as IconEpPlus } from '@iconify-prerendered/vue-ep'
import { createRestaurantSearchFields } from '@/features/restaurant-management/config/fields'
import { useRestaurantManagement } from '@/features/restaurant-management/model/useRestaurantManagement'
import RestaurantFormDialog from '@/features/restaurant-management/ui/RestaurantFormDialog.vue'
import RestaurantTable from '@/features/restaurant-management/ui/RestaurantTable.vue'
import { Permissions } from '@/shared/config/roles'
import AdminSearchForm from '@/shared/ui/AdminSearchForm/index.vue'
import AdminTablePage from '@/shared/ui/AdminTablePage/index.vue'

defineOptions({ name: 'CommerceRestaurantView' })

const { t } = useI18n()
const searchFields = computed(() => createRestaurantSearchFields(t))
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

onMounted(fetchRows)
</script>

<template>
  <div class="main">
    <AdminTablePage :title="t('commerce.restaurant.title')" :loading="loading" @refresh="fetchRows">
      <template #search>
        <AdminSearchForm v-model:model="query" :fields="searchFields" @reset="resetQuery" />
      </template>

      <template #buttons>
        <el-button v-auth="Permissions.COMMERCE_RESTAURANT_ADD" type="primary" :icon="IconEpPlus"
          @click="openCreateDialog">
          {{ t('commerce.restaurant.add') }}
        </el-button>
      </template>

      <RestaurantTable :loading="loading" :data="filteredData" @edit="openEditDialog" @delete="handleDelete" />
    </AdminTablePage>

    <RestaurantFormDialog v-model:visible="dialogVisible" v-model:form="form" :saving="saving" :is-edit="isEdit"
      :rules="rules" @submit="submitForm" />
  </div>
</template>
