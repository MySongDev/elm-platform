<script setup lang="ts">
import type { FormRules } from 'element-plus'
import type { ConfigFormField, ConfigFormModel } from '../../model/form'
import ConfigFormFields from './ConfigFormFields.vue'
import CrudFormDialog from './CrudFormDialog.vue'

defineOptions({ name: 'ConfigFormDialog' })

withDefaults(defineProps<{
  fields: ConfigFormField[]
  title?: string
  dialogTitle?: string
  isEdit?: boolean
  saving: boolean
  rules?: FormRules
  width?: string
  labelWidth?: string
  confirmText?: string
  cancelText?: string
  destroyOnClose?: boolean
}>(), {
  title: '',
  dialogTitle: undefined,
  isEdit: false,
  rules: undefined,
  width: '620px',
  labelWidth: '90px',
  confirmText: undefined,
  cancelText: undefined,
  destroyOnClose: false,
})

const emit = defineEmits<{
  submit: []
}>()

const visible = defineModel<boolean>('visible', { required: true })
const model = defineModel<ConfigFormModel>('model', { required: true })
</script>

<template>
  <CrudFormDialog
    v-model:visible="visible"
    :title="title"
    :dialog-title="dialogTitle"
    :is-edit="isEdit"
    :saving="saving"
    :width="width"
    :model="model"
    :rules="rules"
    :label-width="labelWidth"
    :confirm-text="confirmText"
    :cancel-text="cancelText"
    :destroy-on-close="destroyOnClose"
    @submit="emit('submit')"
  >
    <ConfigFormFields v-model:model="model" :fields="fields">
      <template v-for="(_, slotName) in $slots" #[slotName]="slotProps">
        <slot :name="slotName" v-bind="slotProps" />
      </template>
    </ConfigFormFields>
  </CrudFormDialog>
</template>
