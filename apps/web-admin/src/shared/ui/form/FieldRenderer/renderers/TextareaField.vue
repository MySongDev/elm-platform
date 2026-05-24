<script setup lang="ts">
import type { TextareaFormField } from '../../field-schema'

defineProps<{
  field: TextareaFormField
}>()

const value = defineModel<any>({ required: true })
</script>

<template>
  <el-input
    v-model="value"
    type="textarea"
    :rows="field.rows ?? 3"
    :placeholder="field.placeholder"
    :disabled="field.disabled"
    v-bind="field.props ?? {}"
  />
</template>
