<script setup lang="ts">
import type { ConfigFormField, ConfigFormModel } from '../../model/form'
import FormFieldRenderer from '@/shared/ui/form/FieldRenderer/index.vue'

defineOptions({ name: 'ConfigFormFields' })

const props = defineProps<{
  fields: ConfigFormField[]
}>()

const model = defineModel<ConfigFormModel>('model', { required: true })
const visibleFields = computed(() => props.fields.filter(field => !field.showWhen || field.showWhen(model.value)))
</script>

<template>
  <el-form-item
    v-for="field in visibleFields"
    :key="field.prop"
    :label="field.label"
    :prop="field.prop"
  >
    <slot :name="`field-${field.prop}`" :field="field" :model="model">
      <FormFieldRenderer v-model="model[field.prop]" :field="field" />
    </slot>
  </el-form-item>
</template>
