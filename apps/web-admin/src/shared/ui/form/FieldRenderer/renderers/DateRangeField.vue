<script setup lang="ts">
import type { DateRangeFormField } from '../../field-schema'

defineProps<{
  field: DateRangeFormField
}>()

const value = defineModel<any>({ required: true })
</script>

<template>
  <el-date-picker
    v-model="value"
    type="daterange"
    :start-placeholder="field.startPlaceholder"
    :end-placeholder="field.endPlaceholder"
    :range-separator="field.rangeSeparator ?? '-'"
    :disabled="field.disabled"
    :clearable="field.clearable ?? true"
    :value-format="field.valueFormat"
    :format="field.format"
    v-bind="field.props ?? {}"
  />
</template>
