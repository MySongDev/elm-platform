<script setup lang="ts" generic="Row extends object = object">
import type { ConfigDataTableOptions, ConfigTableColumn } from '../../model/table'
import { DEFAULT_CONFIG_DATA_TABLE_OPTIONS } from '../../model/table'
import ConfigTableColumns from './ConfigTableColumns.vue'

defineOptions({ name: 'ConfigDataTable' })

const props = defineProps<{
  loading: boolean
  data: Row[]
  columns: ConfigTableColumn<Row>[]
  table?: ConfigDataTableOptions
}>()

const tableOptions = computed<ConfigDataTableOptions & typeof DEFAULT_CONFIG_DATA_TABLE_OPTIONS>(() => ({
  ...DEFAULT_CONFIG_DATA_TABLE_OPTIONS,
  ...props.table,
}))
</script>

<template>
  <el-table
    v-loading="loading"
    :data="data"
    :row-key="tableOptions.rowKey"
    :border="tableOptions.border"
    :stripe="tableOptions.stripe"
    :default-expand-all="tableOptions.defaultExpandAll"
  >
    <ConfigTableColumns :columns="columns" />
    <slot />
  </el-table>
</template>
