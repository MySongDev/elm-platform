<script setup lang="ts">
/**
 * @file 餐馆表格
 * @domain features/restaurant-management
 * @description 展示餐馆列表和餐馆编辑/删除操作入口，权限控制交给 CrudActionColumn 处理。
 */

import type { RestaurantItem } from '@/entities/restaurant'
import { ConfigDataTable, CrudActionColumn } from '@/shared/config-crud'
import { Permissions } from '@/shared/config/roles'
import { createRestaurantTableColumns } from '../config/fields'

defineOptions({ name: 'RestaurantTable' })

defineProps<{
  loading: boolean
  data: RestaurantItem[]
}>()

defineEmits<{
  edit: [row: RestaurantItem]
  delete: [row: RestaurantItem]
}>()
const { t } = useI18n()
const columns = computed(() => createRestaurantTableColumns(t))
</script>

<template>
  <ConfigDataTable :loading="loading" :data="data" :columns="columns">
    <CrudActionColumn
      :edit-auth="Permissions.COMMERCE_RESTAURANT_EDIT"
      :delete-auth="Permissions.COMMERCE_RESTAURANT_DELETE"
      @edit="$emit('edit', $event)"
      @delete="$emit('delete', $event)"
    />
  </ConfigDataTable>
</template>
