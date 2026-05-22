<script setup lang="ts">
import type {
  ActionOptions,
  ConfigFormField,
  ConfigFormModel,
  DialogOptions,
  FormOptions,
} from '../../model/form'
import {
  DEFAULT_ACTION_OPTIONS,
  DEFAULT_DIALOG_OPTIONS,
  DEFAULT_FORM_OPTIONS,
} from '../../model/form'
import ConfigFormFields from './ConfigFormFields.vue'
import CrudFormDialog from './CrudFormDialog.vue'

defineOptions({ name: 'ConfigFormDialog' })

const props = withDefaults(defineProps<{
  fields: ConfigFormField[]
  isEdit?: boolean
  saving: boolean
  dialog?: DialogOptions
  formOptions?: FormOptions
  action?: ActionOptions
}>(), {
  isEdit: false,
  dialog: undefined,
  formOptions: undefined,
  action: undefined,
})

const emit = defineEmits<{
  submit: []
}>()

const visible = defineModel<boolean>('visible', { required: true })
const model = defineModel<ConfigFormModel>('model', { required: true })

const dialogOptions = computed<DialogOptions & typeof DEFAULT_DIALOG_OPTIONS>(() => ({
  ...DEFAULT_DIALOG_OPTIONS,
  ...props.dialog,
}))

const formOptions = computed<FormOptions & typeof DEFAULT_FORM_OPTIONS>(() => ({
  ...DEFAULT_FORM_OPTIONS,
  ...props.formOptions,
}))

const actionConfig = computed<ActionOptions & typeof DEFAULT_ACTION_OPTIONS>(() => ({
  ...DEFAULT_ACTION_OPTIONS,
  ...props.action,
}))
</script>

<template>
  <CrudFormDialog
    v-model:visible="visible"
    :title="dialogOptions.title"
    :dialog-title="dialogOptions.dialogTitle"
    :is-edit="isEdit"
    :saving="saving"
    :width="dialogOptions.width"
    :model="model"
    :rules="formOptions.rules"
    :label-width="formOptions.labelWidth"
    :confirm-text="actionConfig.confirmText"
    :cancel-text="actionConfig.cancelText"
    :destroy-on-close="dialogOptions.destroyOnClose"
    @submit="emit('submit')"
  >
    <ConfigFormFields v-model:model="model" :fields="fields">
      <template v-for="(_, slotName) in $slots" #[slotName]="slotProps">
        <slot :name="slotName" v-bind="slotProps" />
      </template>
    </ConfigFormFields>
  </CrudFormDialog>
</template>
