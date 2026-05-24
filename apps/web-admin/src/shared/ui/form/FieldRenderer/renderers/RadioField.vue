<script setup lang="ts">
import type { RadioFormField } from '../../field-schema'

defineProps<{
  field: RadioFormField
}>()

const value = defineModel<any>({ required: true })
</script>

<template>
  <el-radio-group
    v-model="value"
    :disabled="field.disabled"
    v-bind="field.props ?? {}"
  >
    <el-radio
      v-for="option in field.options"
      :key="String(option.value)"
      :value="option.value"
      :disabled="option.disabled"
    >
      {{ option.label }}
    </el-radio>
  </el-radio-group>
</template>
