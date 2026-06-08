<script setup lang="ts">
import type { OrderItem } from '@/entities/order'
import { formatDateTime } from '@/shared/lib/admin-display'
import {
  fulfillmentStatusLabelMap,
  paymentStatusLabelMap,
  refundStatusLabelMap,
} from '../config/workflow'
import { displayOrderLogRequestId } from '../model/orderLogDisplay'

defineProps<{
  visible: boolean
  loading: boolean
  order: OrderItem | null
}>()

const emit = defineEmits<{
  'update:visible': [visible: boolean]
}>()

const { t } = useI18n()

function displayTime(value: string | null) {
  return value ? formatDateTime(value) : '-'
}
</script>

<template>
  <el-drawer
    :model-value="visible"
    :title="t('commerce.order.detail')"
    size="680px"
    @update:model-value="emit('update:visible', $event)"
  >
    <el-skeleton v-if="loading" :rows="8" animated />

    <template v-else-if="order">
      <el-descriptions :column="1" border>
        <el-descriptions-item :label="t('commerce.order.orderNo')">
          {{ order.orderNo }}
        </el-descriptions-item>
        <el-descriptions-item :label="t('commerce.order.restaurant')">
          {{ order.shopName }}
        </el-descriptions-item>
        <el-descriptions-item :label="t('commerce.order.amount')">
          ¥{{ Number(order.payableAmount || 0).toFixed(2) }}
        </el-descriptions-item>
        <el-descriptions-item :label="t('commerce.order.paymentStatus')">
          {{ t(paymentStatusLabelMap[order.status] || order.status) }}
        </el-descriptions-item>
        <el-descriptions-item :label="t('commerce.order.fulfillmentStatus')">
          {{ t(fulfillmentStatusLabelMap[order.fulfillmentStatus]) }}
        </el-descriptions-item>
        <el-descriptions-item :label="t('commerce.order.refundStatus')">
          {{ t(refundStatusLabelMap[order.refundStatus]) }}
        </el-descriptions-item>
        <el-descriptions-item :label="t('commerce.order.refundReason')">
          {{ order.refundReason || '-' }}
        </el-descriptions-item>
        <el-descriptions-item :label="t('commerce.order.refundRejectReason')">
          {{ order.refundRejectReason || '-' }}
        </el-descriptions-item>
      </el-descriptions>

      <el-timeline class="order-timeline">
        <el-timeline-item :timestamp="displayTime(order.paidAt)">
          {{ t('commerce.order.paymentPaid') }}
        </el-timeline-item>
        <el-timeline-item :timestamp="displayTime(order.acceptedAt)">
          {{ t('commerce.order.fulfillmentAccepted') }}
        </el-timeline-item>
        <el-timeline-item :timestamp="displayTime(order.preparingAt)">
          {{ t('commerce.order.fulfillmentPreparing') }}
        </el-timeline-item>
        <el-timeline-item :timestamp="displayTime(order.deliveringAt)">
          {{ t('commerce.order.fulfillmentDelivering') }}
        </el-timeline-item>
        <el-timeline-item :timestamp="displayTime(order.completedAt)">
          {{ t('commerce.order.fulfillmentCompleted') }}
        </el-timeline-item>
        <el-timeline-item :timestamp="displayTime(order.refundRequestedAt)">
          {{ t('commerce.order.refundRequested') }}
        </el-timeline-item>
      </el-timeline>

      <el-table :data="order.actionLogs || []" size="small" class="order-log-table">
        <el-table-column prop="action" :label="t('commerce.order.logAction')" width="150" />
        <el-table-column prop="operatorName" :label="t('commerce.order.logOperator')" width="120" />
        <el-table-column :label="t('commerce.order.logRemark')">
          <template #default="{ row }">
            {{ row.reason || row.remark || '-' }}
          </template>
        </el-table-column>
        <el-table-column :label="t('commerce.order.logRequestId')" min-width="220" show-overflow-tooltip>
          <template #default="{ row }">
            {{ displayOrderLogRequestId(row.requestId) }}
          </template>
        </el-table-column>
        <el-table-column :label="t('commerce.order.logTime')" width="180">
          <template #default="{ row }">
            {{ displayTime(row.createdAt) }}
          </template>
        </el-table-column>
      </el-table>
    </template>
  </el-drawer>
</template>

<style scoped>
.order-timeline,
.order-log-table {
  margin-top: 18px;
}
</style>
