<script setup lang="ts">
import {
  createOrderSearchFields,
  OrderTable,
  useOrderManagement,
} from '@/features/order-management'
import AdminSearchForm from '@/shared/ui/AdminSearchForm/index.vue'
import AdminTablePage from '@/shared/ui/AdminTablePage/index.vue'

defineOptions({ name: 'CommerceOrderView' })

const { t } = useI18n()
const searchFields = computed(() => createOrderSearchFields(t))
const {
  loading,
  query,
  filteredData,
  resetQuery,
  fetchRows,
} = useOrderManagement()

onMounted(fetchRows)
</script>

<template>
  <div class="main">
    <AdminTablePage :title="t('commerce.order.title')" :loading="loading" @refresh="fetchRows">
      <template #search>
        <AdminSearchForm v-model:model="query" :fields="searchFields" @reset="resetQuery" />
      </template>

      <OrderTable :loading="loading" :data="filteredData" />
    </AdminTablePage>
  </div>
</template>
