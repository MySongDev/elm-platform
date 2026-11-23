<script setup lang="ts">
/**
 * @file 配置化表单弹窗
 * @domain shared/config-crud
 * @description 统一表单校验与弹窗布局，字段可由业务插槽或配置提供。
 */

import type { FormInstance, FormRules } from 'element-plus'
import type { ConfigFormField, ConfigFormModel } from '../../model/form'
import FormFieldRenderer from '@/shared/ui/form/FieldRenderer/index.vue'

defineOptions({ name: 'ConfigFormDialog' })

const props = withDefaults(defineProps<{
  fields?: ConfigFormField[]
  title: string
  saving: boolean
  submitDisabled?: boolean
  rules?: FormRules
  width?: string
  labelWidth?: string
  destroyOnClose?: boolean
  confirmText?: string
  cancelText?: string
}>(), {
  fields: () => [],
  submitDisabled: false,
  width: '620px',
  labelWidth: '90px',
  destroyOnClose: false,
})

const emit = defineEmits<{
  submit: []
}>()

const visible = defineModel<boolean>('visible', { required: true })
const model = defineModel<ConfigFormModel>('model', { required: true })
const formRef = ref<FormInstance>()
const validating = ref(false)
const { t } = useI18n()

const busy = computed(() => props.saving || validating.value)

const visibleFields = computed(() => props.fields.filter(field => !field.showWhen || field.showWhen(model.value)))

const resolvedConfirmText = computed(() => props.confirmText ?? t('crud.save'))
const resolvedCancelText = computed(() => props.cancelText ?? t('crud.cancel'))

watch(visible, (value) => {
  if (value)
    nextTick(() => formRef.value?.clearValidate())
})

async function handleSubmit() {
  if (busy.value || props.submitDisabled)
    return

  validating.value = true
  try {
    const valid = await formRef.value?.validate().catch(() => false)
    if (valid && visible.value && !props.saving)
      emit('submit')
  }
  finally {
    validating.value = false
  }
}
</script>

<template>
  <el-dialog
    v-model="visible"
    append-to-body
    class="crud-form-dialog"
    body-class="crud-form-dialog__body"
    top="5vh"
    :title="title"
    :width="width"
    :destroy-on-close="destroyOnClose"
    :close-on-click-modal="!busy"
    :close-on-press-escape="!busy"
    :show-close="!busy"
  >
    <el-form
      ref="formRef"
      :model="model"
      :rules="rules"
      :label-width="labelWidth"
      :disabled="busy"
    >
      <slot>
        <el-form-item
          v-for="field in visibleFields"
          :key="field.prop"
          :label="field.label"
          :prop="field.prop"
        >
          <FormFieldRenderer
            v-model="model[field.prop]"
            :field="field"
          />
        </el-form-item>
      </slot>
    </el-form>
    <template #footer>
      <el-button
        :disabled="busy"
        @click="visible = false"
      >
        {{ resolvedCancelText }}
      </el-button>
      <el-button
        type="primary"
        :loading="busy"
        :disabled="submitDisabled"
        @click="handleSubmit"
      >
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
