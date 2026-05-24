<script setup lang="ts">
import type { FormField } from '../field-schema'
import { fieldRendererMap } from './renderer-map'

defineOptions({ name: 'FormFieldRenderer' })

const props = defineProps<{
  field: FormField
}>()

const value = defineModel<any>({ required: true })
const Renderer = computed(() => fieldRendererMap[props.field.type])
</script>

<template>
  <component
    :is="Renderer"
    v-if="Renderer"
    v-model="value"
    :field="field"
  />
</template>
