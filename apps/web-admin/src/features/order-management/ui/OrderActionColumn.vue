<script setup lang="ts">
import type { AdminOrderAction, OrderItem } from '@/entities/order'
import { useAuthStore } from '@/entities/session'
import { StateMachineActions } from '@/shared/workflow'
import { orderActionConfig } from '../config/workflow'

const props = defineProps<{
  row: OrderItem
}>()

const emit = defineEmits<{
  detail: [row: OrderItem]
  action: [action: AdminOrderAction, row: OrderItem]
}>()

const { t } = useI18n()
const authStore = useAuthStore()

function handleAction(action: string) {
  emit('action', action as AdminOrderAction, props.row)
}
</script>

<template>
  <div class="order-actions">
    <el-button link type="primary" @click="emit('detail', row)">
      {{ t('commerce.order.detail') }}
    </el-button>
    <StateMachineActions
      :action-map="orderActionConfig"
      :available-actions="row.availableActions || []"
      :record="row"
      :has-permission="authStore.hasPermission"
      button-style="link"
      @action="handleAction"
    />
  </div>
</template>

<style scoped>
.order-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 8px;
}
</style>
