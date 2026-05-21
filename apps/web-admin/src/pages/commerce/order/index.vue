<script setup lang="ts">
import { createOrderSearchFields } from '@/features/order-management/config/fields'
import { useOrderManagement } from '@/features/order-management/model/useOrderManagement'
import OrderStatusDialog from '@/features/order-management/ui/OrderStatusDialog.vue'
import OrderTable from '@/features/order-management/ui/OrderTable.vue'
import AdminSearchForm from '@/shared/ui/AdminSearchForm/index.vue'
import AdminTablePage from '@/shared/ui/AdminTablePage/index.vue'

defineOptions({ name: 'CommerceOrderView' })

const { t } = useI18n()
const searchFields = computed(() => createOrderSearchFields(t))
const {
  loading,
  saving,
  dialogVisible,
  statusForm,
  query,
  filteredData,
  resetQuery,
  openStatusDialog,
  fetchRows,
  submitStatus,
} = useOrderManagement()

onMounted(fetchRows)
</script>

<template>
  <div class="main">
    <AdminTablePage :title="t('commerce.order.title')" :loading="loading" @refresh="fetchRows">
      <template #search>
        <AdminSearchForm v-model:model="query" :fields="searchFields" @reset="resetQuery" />
      </template>

      <OrderTable
        :loading="loading"
        :data="filteredData"
        @edit-status="openStatusDialog"
      />
    </AdminTablePage>

    <OrderStatusDialog
      v-model:visible="dialogVisible"
      v-model:form="statusForm"
      :saving="saving"
      @submit="submitStatus"
    />
  </div>
</template>
