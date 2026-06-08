<script setup lang="ts">
import { DataScopeHint } from '@/entities/session'
import {
  createOrderSearchFields,
  OrderDetailDrawer,
  OrderTable,
  RefundRejectDialog,
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
  detailVisible,
  rejectVisible,
  detailLoading,
  actionSaving,
  selectedOrder,
  openDetail,
  executeAction,
  submitReject,
} = useOrderManagement()

onMounted(fetchRows)
</script>

<template>
  <AdminTablePage :title="t('commerce.order.title')" :loading="loading" @refresh="fetchRows">
    <template #search>
      <DataScopeHint />
      <AdminSearchForm v-model:model="query" :fields="searchFields" @reset="resetQuery" />
    </template>

    <OrderTable
      :loading="loading"
      :data="filteredData"
      @detail="openDetail"
      @action="executeAction"
    />

    <OrderDetailDrawer
      v-model:visible="detailVisible"
      :loading="detailLoading"
      :order="selectedOrder"
    />

    <RefundRejectDialog
      v-model:visible="rejectVisible"
      :saving="actionSaving"
      @submit="submitReject"
    />
  </AdminTablePage>
</template>
