<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/entities/session'
import { transformI18n } from '@/shared/i18n'
import { activePaneKey } from '../config'

defineOptions({ name: 'AccountProfile' })

const authStore = useAuthStore()
const { t } = useI18n()
const activePaneInfo = inject(activePaneKey)
const sectionTitle = computed(() => activePaneInfo?.value ? transformI18n(activePaneInfo.value.label) : '')
const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({
  username: '',
  email: '',
  phone: '',
})

watch(() => authStore.userInfo, (info) => {
  if (info) {
    form.username = info.username || ''
    form.email = info.email || ''
    form.phone = info.phone || ''
  }
}, { immediate: true })

const rules = computed<FormRules>(() => ({
  username: [
    { required: true, message: t('profile.usernameRequired'), trigger: 'blur' },
    { min: 2, message: t('profile.usernameMin'), trigger: 'blur' },
  ],
  email: [
    { type: 'email', message: t('profile.emailInvalid'), trigger: 'blur' },
  ],
}))

async function handleSave() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid)
    return

  loading.value = true
  try {
    await authStore.updateUserInfo({
      username: form.username,
      email: form.email || undefined,
      phone: form.phone || undefined,
    })
    ElMessage.success(t('profile.updateSuccess'))
  }
  catch {
    // error handled by request interceptor
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="profile-section">
    <h3 class="section-title">
      {{ sectionTitle }}
    </h3>
    <el-form ref="formRef" label-position="top" :model="form" :rules="rules" class="profile-form">
      <el-form-item :label="t('profile.avatar')">
        <el-avatar :size="80" :src="authStore.userInfo?.avatar ?? undefined">
          {{ authStore.userInfo?.username?.charAt(0)?.toUpperCase() || 'U' }}
        </el-avatar>
      </el-form-item>
      <el-form-item :label="t('profile.username')" prop="username">
        <el-input v-model="form.username" :placeholder="t('profile.usernamePlaceholder')" />
      </el-form-item>
      <el-form-item :label="t('profile.email')" prop="email">
        <el-input v-model="form.email" :placeholder="t('profile.emailPlaceholder')" clearable />
      </el-form-item>
      <el-form-item :label="t('profile.phone')" prop="phone">
        <el-input v-model="form.phone" :placeholder="t('profile.phonePlaceholder')" clearable />
      </el-form-item>
      <el-button type="primary" :loading="loading" @click="handleSave">
        {{ t('profile.updateButton') }}
      </el-button>
    </el-form>
  </div>
</template>

<style scoped lang="scss">
.profile-section {
  min-width: 45%;
  max-width: 70%;
}

.section-title {
  margin: 32px 0;
  font-size: 18px;
  font-weight: 600;
  color: $text-primary;
}

.profile-form {
  max-width: 480px;
}
</style>
