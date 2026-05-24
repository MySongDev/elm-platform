<script setup lang="ts">
import type { OrderItem } from '@/entities/order'
import { ConfigDataTable } from '@/shared/config-crud'
import { createOrderTableColumns } from '../config/fields'

defineOptions({ name: 'OrderTable' })

defineProps<{
  loading: boolean
  data: OrderItem[]
}>()

const { t } = useI18n()
const columns = computed(() => createOrderTableColumns(t))
</script>

<template>
  <ConfigDataTable :loading="loading" :data="data" :columns="columns" />
</template>
