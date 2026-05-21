<script setup lang="ts">
import type { ConfigTableColumn } from '../../model/table'

defineOptions({ name: 'ConfigTableCellTag' })

const props = defineProps<{
  column: ConfigTableColumn<any>
  row: Record<string, any>
}>()

const tag = computed(() => props.column.tag?.(props.row))
</script>

<template>
  <el-tag v-if="tag" :type="tag.type">
    {{ tag.label }}
  </el-tag>
</template>
