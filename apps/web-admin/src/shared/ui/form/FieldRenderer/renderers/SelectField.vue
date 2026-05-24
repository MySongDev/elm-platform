<script setup lang="ts">
import type { SelectFormField } from '../../field-schema'

defineProps<{
  field: SelectFormField
}>()

const value = defineModel<any>({ required: true })
</script>

<template>
  <el-select
    v-model="value"
    :placeholder="field.placeholder"
    :disabled="field.disabled"
    :clearable="field.clearable ?? true"
    :multiple="field.multiple"
    :filterable="field.filterable"
    :collapse-tags="field.collapseTags"
    :collapse-tags-tooltip="field.collapseTagsTooltip"
    v-bind="field.props ?? {}"
  >
    <el-option
      v-for="option in field.options"
      :key="String(option.value)"
      :label="option.label"
      :value="option.value"
      :disabled="option.disabled"
    />
  </el-select>
</template>
