<script setup lang="ts">
import type { FormInstance } from 'element-plus'

defineOptions({
  name: 'CrudFormDialog',
  inheritAttrs: false,
})

const props = withDefaults(defineProps<{
  title?: string
  dialogTitle?: string
  isEdit?: boolean
  saving: boolean
  width?: string
  confirmText?: string
  cancelText?: string
  destroyOnClose?: boolean
}>(), {
  title: '',
  isEdit: false,
  width: '620px',
  confirmText: undefined,
  cancelText: undefined,
  destroyOnClose: false,
})

const emit = defineEmits<{
  submit: []
}>()
const dialogVisible = defineModel<boolean>('visible', { required: true })
const formRef = ref<FormInstance>()
const { t } = useI18n()
const resolvedConfirmText = computed(() => props.confirmText ?? t('crud.save'))
const resolvedCancelText = computed(() => props.cancelText ?? t('crud.cancel'))
const resolvedTitle = computed(() => props.dialogTitle ?? (props.isEdit ? t('crud.editTitle', { title: props.title }) : t('crud.addTitle', { title: props.title })))

watch(dialogVisible, (visible) => {
  if (visible)
    nextTick(() => formRef.value?.clearValidate())
})

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (valid)
    emit('submit')
}

defineExpose({
  formRef,
})
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    append-to-body
    class="crud-form-dialog"
    body-class="crud-form-dialog__body"
    top="5vh"
    :title="resolvedTitle"
    :width="width"
    :destroy-on-close="destroyOnClose"
  >
    <el-form ref="formRef" v-bind="$attrs">
      <slot />
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">
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
