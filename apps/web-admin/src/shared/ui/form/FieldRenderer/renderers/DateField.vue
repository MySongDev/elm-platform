<script setup lang="ts">
import type { DateFormField } from '../../field-schema'

defineProps<{
  field: DateFormField
}>()

const value = defineModel<any>({ required: true })
</script>

<template>
  <el-date-picker
    v-model="value"
    type="date"
    :placeholder="field.placeholder"
    :disabled="field.disabled"
    :clearable="field.clearable ?? true"
    :value-format="field.valueFormat"
    :format="field.format"
    v-bind="field.props ?? {}"
  />
</template>
