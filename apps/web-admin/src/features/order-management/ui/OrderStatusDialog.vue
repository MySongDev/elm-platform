<script setup lang="ts">
/**
 * @file 订单状态弹窗
 * @domain features/order-management
 * @description 适配配置化表单弹窗，仅编辑订单状态并向父级提交保存事件。
 */

import type { OrderStatusFormState } from '../model/useOrderManagement'
import { ConfigFormDialog } from '@/shared/config-crud'
import { createOrderStatusFields } from '../config/fields'

defineOptions({ name: 'OrderStatusDialog' })

defineProps<{
  saving: boolean
}>()

const emit = defineEmits<{
  submit: []
}>()
const dialogVisible = defineModel<boolean>('visible', { required: true })
const form = defineModel<OrderStatusFormState>('form', { required: true })
const { t } = useI18n()
const fields = computed(() => createOrderStatusFields(t))
</script>

<template>
  <ConfigFormDialog
    v-model:visible="dialogVisible"
    v-model:model="form"
    :fields="fields"
    :dialog-title="t('crud.editOrderStatus')"
    :saving="saving"
    width="420px"
    label-width="60px"
    @submit="emit('submit')"
  />
</template>
