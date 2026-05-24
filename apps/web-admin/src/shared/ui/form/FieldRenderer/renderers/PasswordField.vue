<script setup lang="ts">
import type { PasswordFormField } from '../../field-schema'

defineProps<{
  field: PasswordFormField
}>()

const value = defineModel<any>({ required: true })
</script>

<template>
  <el-input
    v-model="value"
    type="password"
    :placeholder="field.placeholder"
    :disabled="field.disabled"
    :show-password="field.showPassword ?? true"
    v-bind="field.props ?? {}"
  />
</template>
