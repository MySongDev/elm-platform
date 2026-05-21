<script setup lang="ts">
import type { ConfigTableColumn } from '../../model/table'
import ConfigTableCellTag from './ConfigTableCellTag.vue'

defineOptions({ name: 'ConfigTableColumns' })

defineProps<{
  columns: ConfigTableColumn<any>[]
}>()

function getCellText(row: Record<string, any>, column: ConfigTableColumn<any>) {
  const value = column.formatter ? column.formatter(row) : column.prop ? row[column.prop] : ''
  return value === null || value === undefined || value === '' ? column.emptyText ?? '-' : value
}
</script>

<template>
  <el-table-column v-for="column in columns" :key="column.prop || column.label" :prop="column.prop"
    :label="column.label" :width="column.width" :min-width="column.minWidth" :fixed="column.fixed"
    :show-overflow-tooltip="column.showOverflowTooltip">
    <template v-if="column.formatter || column.tag" #default="{ row }">
      <ConfigTableCellTag v-if="column.tag" :row="row" :column="column" />
      <template v-else>
        {{ getCellText(row, column) }}
      </template>
    </template>
  </el-table-column>
</template>
