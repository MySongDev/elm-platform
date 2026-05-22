<script setup lang="ts">
/**
 * @file 订单表格
 * @domain features/order-management
 * @description 展示订单列表，并提供订单状态编辑入口；订单删除在当前业务中不暴露。
 */

import type { OrderItem } from '@/entities/order'
import { IconEditPen as IconEpEditPen } from '@iconify-prerendered/vue-ep'
import { ConfigDataTable, CrudActionColumn } from '@/shared/config-crud'
import { Permissions } from '@/shared/config/roles'
import { createOrderTableColumns } from '../config/fields'

defineOptions({ name: 'OrderTable' })

defineProps<{
  loading: boolean
  data: OrderItem[]
}>()

defineEmits<{
  editStatus: [row: OrderItem]
}>()
const { t } = useI18n()
const columns = computed(() => createOrderTableColumns(t))
</script>

<template>
  <ConfigDataTable :loading="loading" :data="data" :columns="columns">
    <CrudActionColumn :column="{ width: 120 }">
      <template #edit="{ row }">
        <el-button v-auth="Permissions.COMMERCE_ORDER_EDIT" type="primary" link :icon="IconEpEditPen"
          @click="$emit('editStatus', row)">
          {{ t('crud.editStatus') }}
        </el-button>
      </template>
      <template #delete />
    </CrudActionColumn>
  </ConfigDataTable>
</template>
