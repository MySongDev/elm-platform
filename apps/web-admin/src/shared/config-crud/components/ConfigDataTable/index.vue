<script setup lang="ts">
import type { ConfigTableColumn } from '../../model/table'
import ConfigTableColumns from './ConfigTableColumns.vue'

defineOptions({ name: 'ConfigDataTable' })

withDefaults(defineProps<{
  loading: boolean
  data: any[]
  columns: ConfigTableColumn<any>[]
  rowKey?: string
  border?: boolean
  stripe?: boolean
  defaultExpandAll?: boolean
}>(), {
  rowKey: undefined,
  border: true,
  stripe: true,
  defaultExpandAll: false,
})
</script>

<template>
  <el-table
    v-loading="loading"
    :data="data"
    :row-key="rowKey"
    :border="border"
    :stripe="stripe"
    :default-expand-all="defaultExpandAll"
  >
    <ConfigTableColumns :columns="columns" />
    <slot />
  </el-table>
</template>
