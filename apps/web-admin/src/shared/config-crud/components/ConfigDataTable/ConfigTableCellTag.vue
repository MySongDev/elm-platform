<script setup lang="ts" generic="Row extends object = object">
import type { ConfigTableColumn } from '../../model/table'

defineOptions({ name: 'ConfigTableCellTag' })

const props = defineProps<{
  column: ConfigTableColumn<Row>
  row: Row
}>()

const tag = computed(() => props.column.tag?.(props.row))
</script>

<template>
  <el-tag v-if="tag" :type="tag.type">
    {{ tag.label }}
  </el-tag>
</template>
