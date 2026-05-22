<script setup lang="ts">
/**
 * @file 食品表格
 * @domain features/food-management
 * @description 展示食品列表和食品编辑/删除操作入口，权限控制交给 CrudActionColumn 处理。
 */

import type { FoodItem } from '@/entities/food'
import { ConfigDataTable, CrudActionColumn } from '@/shared/config-crud'
import { Permissions } from '@/shared/config/roles'
import { createFoodTableColumns } from '../config/fields'

defineOptions({ name: 'FoodTable' })

defineProps<{
  loading: boolean
  data: FoodItem[]
}>()

defineEmits<{
  edit: [row: FoodItem]
  delete: [row: FoodItem]
}>()
const { t } = useI18n()
const columns = computed(() => createFoodTableColumns(t))
</script>

<template>
  <ConfigDataTable :loading="loading" :data="data" :columns="columns">
    <CrudActionColumn
      :edit-action="{ auth: Permissions.COMMERCE_FOOD_EDIT }"
      :delete-action="{ auth: Permissions.COMMERCE_FOOD_DELETE }"
      @edit="$emit('edit', $event as FoodItem)"
      @delete="$emit('delete', $event as FoodItem)"
    />
  </ConfigDataTable>
</template>
