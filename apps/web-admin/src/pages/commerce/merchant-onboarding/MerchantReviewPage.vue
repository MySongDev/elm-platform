<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/entities/session'
import { merchantOnboardingEndpoints } from '@/shared/api/endpoints'
import request from '@/shared/api/request'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const submitting = ref(false)
const reason = ref('')
const action = route.query.action as 'APPROVE' | 'REJECT'

function getId(): string {
  const id = route.params.id
  return Array.isArray(id) ? id[0] : id
}

const actionLabels = {
  APPROVE: '审核通过',
  REJECT: '驳回申请',
}
const reasonRequired = computed(() => action === 'REJECT')
const placeholder = computed(() => action === 'REJECT' ? '请输入驳回原因（必填）' : '请输入审核意见（选填）')

async function handleSubmit() {
  if (reasonRequired.value && !reason.value.trim())
    return ElMessage.warning('请填写原因')
  submitting.value = true
  try {
    await request.post(merchantOnboardingEndpoints.review(getId()), {
      action,
      reason: reason.value.trim(),
    })
    ElMessage.success(`${actionLabels[action]}成功`)
    router.push(`/commerce/merchant-onboarding/detail/${getId()}`)
  }
  finally {
    submitting.value = false
  }
}

function goBack() { router.back() }
</script>

<template>
  <div v-if="authStore.hasPermission('merchant:onboarding:manage')" class="p-4 max-w-md mx-auto mt-8">
    <el-card :header="actionLabels[action] || '审核'">
      <el-form label-position="top">
        <el-form-item :label="reasonRequired ? '原因（必填）' : '审核意见'" :required="reasonRequired">
          <el-input
            v-model="reason"
            type="textarea"
            :rows="4"
            :placeholder="placeholder"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="flex justify-end gap-2">
          <el-button @click="goBack">
            取消
          </el-button>
          <el-button :type="action === 'REJECT' ? 'danger' : 'primary'" :loading="submitting" @click="handleSubmit">
            确认{{ actionLabels[action] }}
          </el-button>
        </div>
      </template>
    </el-card>
  </div>
</template>
