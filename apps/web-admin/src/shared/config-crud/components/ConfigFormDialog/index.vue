<script setup lang="ts">
import type { FormInstance } from 'element-plus'
import type {
  ActionOptions,
  ConfigFormField,
  ConfigFormModel,
  DialogOptions,
  FormOptions,
} from '../../model/form'
import FormFieldRenderer from '@/shared/ui/form/FieldRenderer/index.vue'
import {
  DEFAULT_ACTION_OPTIONS,
  DEFAULT_DIALOG_OPTIONS,
  DEFAULT_FORM_OPTIONS,
} from '../../model/form'

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
const formRef = ref<FormInstance>()
const { t } = useI18n()

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

const visibleFields = computed(() => props.fields.filter(field => !field.showWhen || field.showWhen(model.value)))

const resolvedConfirmText = computed(() => actionConfig.value.confirmText ?? t('crud.save'))
const resolvedCancelText = computed(() => actionConfig.value.cancelText ?? t('crud.cancel'))
const resolvedTitle = computed(() => dialogOptions.value.dialogTitle ?? (props.isEdit ? t('crud.editTitle', { title: dialogOptions.value.title }) : t('crud.addTitle', { title: dialogOptions.value.title })))

watch(visible, (value) => {
  if (value)
    nextTick(() => formRef.value?.clearValidate())
})

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (valid)
    emit('submit')
}
</script>

<template>
  <el-dialog
    v-model="visible"
    append-to-body
    class="crud-form-dialog"
    body-class="crud-form-dialog__body"
    top="5vh"
    :title="resolvedTitle"
    :width="dialogOptions.width"
    :destroy-on-close="dialogOptions.destroyOnClose"
  >
    <el-form
      ref="formRef"
      :model="model"
      :rules="formOptions.rules"
      :label-width="formOptions.labelWidth"
    >
      <el-form-item
        v-for="field in visibleFields"
        :key="field.prop"
        :label="field.label"
        :prop="field.prop"
      >
        <FormFieldRenderer v-model="model[field.prop]" :field="field" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">
        {{ resolvedCancelText }}
      </el-button>
      <el-button type="primary" :loading="saving" @click="handleSubmit">
        {{ resolvedConfirmText }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style lang="scss">
.crud-form-dialog {
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  margin-bottom: 0;

  .crud-form-dialog__body {
    flex: 1;
    overflow-y: auto;
  }
}
</style>
