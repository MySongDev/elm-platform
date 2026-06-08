<script setup lang="ts">
import type { AdminOrderAction, OrderItem } from '@/entities/order'
import { ConfigDataTable } from '@/shared/config-crud'
import { createOrderTableColumns } from '../config/fields'
import OrderActionColumn from './OrderActionColumn.vue'

defineOptions({ name: 'OrderTable' })

defineProps<{
  loading: boolean
  data: OrderItem[]
}>()

const emit = defineEmits<{
  detail: [row: OrderItem]
  action: [action: AdminOrderAction, row: OrderItem]
}>()

const { t } = useI18n()
const columns = computed(() => createOrderTableColumns(t))

function asOrderItem(row: unknown) {
  return row as OrderItem
}
</script>

<template>
  <ConfigDataTable :loading="loading" :data="data" :columns="columns">
    <el-table-column :label="t('user.actions')" fixed="right" min-width="220">
      <template #default="{ row }">
        <OrderActionColumn
          :row="asOrderItem(row)"
          @detail="emit('detail', $event)"
          @action="(action, order) => emit('action', action, order)"
        />
      </template>
    </el-table-column>
  </ConfigDataTable>
</template>
