<script setup lang="ts">
const props = defineProps<{
  visible: boolean
  saving: boolean
}>()

const emit = defineEmits<{
  'update:visible': [visible: boolean]
  'submit': [reason: string]
}>()

const { t } = useI18n()
const reason = ref('')
const canSubmit = computed(() => reason.value.trim().length >= 2 && !props.saving)

function close() {
  emit('update:visible', false)
}

function submit() {
  if (!canSubmit.value)
    return
  emit('submit', reason.value.trim())
}

watch(() => props.visible, (visible) => {
  if (visible)
    reason.value = ''
})
</script>

<template>
  <el-dialog
    :model-value="visible"
    :title="t('commerce.order.rejectRefundTitle')"
    width="420px"
    @update:model-value="emit('update:visible', $event)"
  >
    <el-input
      v-model="reason"
      type="textarea"
      :rows="4"
      maxlength="200"
      show-word-limit
      :placeholder="t('commerce.order.rejectReasonPlaceholder')"
    />

    <template #footer>
      <el-button :disabled="saving" @click="close">
        {{ t('common.cancel') }}
      </el-button>
      <el-button
        type="primary"
        :loading="saving"
        :disabled="!canSubmit"
        @click="submit"
      >
        {{ t('common.confirm') }}
      </el-button>
    </template>
  </el-dialog>
</template>
