<script setup lang="ts">
import type { MerchantApplicationAction } from '@/entities/merchant-onboarding'
import { ElMessage } from 'element-plus'

defineOptions({ name: 'MerchantReviewDialog' })

const props = defineProps<{
  action: MerchantApplicationAction
  submitting: boolean
}>()

const emit = defineEmits<{
  confirm: [reason: string]
}>()

const visible = defineModel<boolean>('visible', { required: true })

const reason = ref('')

const actionLabels: Record<string, string> = {
  APPROVE: '审核通过',
  REJECT: '驳回申请',
  REQUEST_SUPPLEMENT: '要求补充材料',
}

const title = computed(() => actionLabels[props.action] || '审核操作')

const reasonRequired = computed(() => {
  return props.action === 'REJECT' || props.action === 'REQUEST_SUPPLEMENT'
})

const reasonPlaceholder = computed(() => {
  if (props.action === 'REJECT')
    return '请输入驳回原因（必填）'
  if (props.action === 'REQUEST_SUPPLEMENT')
    return '请说明需要补充的材料（必填）'
  return '请输入审核意见（选填）'
})

function handleConfirm() {
  if (reasonRequired.value && !reason.value.trim()) {
    ElMessage.warning('请填写原因')
    return
  }
  emit('confirm', reason.value.trim())
}

function handleClose() {
  reason.value = ''
}
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="title"
    width="480px"
    destroy-on-close
    @closed="handleClose"
  >
    <el-form label-position="top">
      <el-form-item
        :label="reasonRequired ? '原因（必填）' : '审核意见'"
        :required="reasonRequired"
      >
        <el-input
          v-model="reason"
          type="textarea"
          :rows="4"
          :placeholder="reasonPlaceholder"
          :maxlength="500"
          show-word-limit
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">
        取消
      </el-button>
      <el-button
        :type="action === 'REJECT' ? 'danger' : 'primary'"
        :loading="submitting"
        @click="handleConfirm"
      >
        确认{{ actionLabels[action] || '提交' }}
      </el-button>
    </template>
  </el-dialog>
</template>
