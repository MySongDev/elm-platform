<script setup lang="ts">
import type { InputNumberFormField } from '../../field-schema'

defineProps<{
  field: InputNumberFormField
}>()

const value = defineModel<any>({ required: true })
</script>

<template>
  <el-input-number
    v-model="value"
    :min="field.min"
    :max="field.max"
    :step="field.step"
    :precision="field.precision"
    :disabled="field.disabled"
    v-bind="field.props ?? {}"
  />
</template>
