<script setup lang="ts">
import type { InputFormField } from '../../field-schema'

defineProps<{
  field: InputFormField
}>()

const value = defineModel<any>({ required: true })
</script>

<template>
  <el-input
    v-model="value"
    :placeholder="field.placeholder"
    :disabled="field.disabled"
    :clearable="field.clearable ?? true"
    v-bind="field.props ?? {}"
  />
</template>
