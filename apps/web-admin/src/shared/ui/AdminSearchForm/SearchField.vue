<script setup lang="ts">
import type { AdminSearchField } from './types'
import FormFieldRenderer from '@/shared/ui/form/FieldRenderer/index.vue'

defineOptions({ name: 'AdminSearchField' })

defineProps<{
  field: AdminSearchField
}>()

const value = defineModel<any>({ required: true })
</script>

<template>
  <FormFieldRenderer v-model="value" :field="field" />
</template>
