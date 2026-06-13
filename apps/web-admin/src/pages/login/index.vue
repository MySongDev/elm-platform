<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus'
import { IconLock as IconEpLock, IconUser as IconEpUser } from '@iconify-prerendered/vue-ep'
import { useAuthStore } from '@/entities/session'
import { DEFAULT_HOME_PATH } from '@/shared/config/paths'

defineOptions({ name: 'LoginView' })

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const authStore = useAuthStore()

const loginFormRef = ref<FormInstance>()
const loading = ref(false)

const loginForm = reactive({
  account: '',
  password: '',
  rememberMe: false,
})

const rules: FormRules = {
  account: [{
    required: true,
    message: t('login.usernameRequired'),
    trigger: 'blur',
  }],
  password: [
    {
      required: true,
      message: t('login.passwordRequired'),
      trigger: 'blur',
    },
    {
      min: 6,
      message: t('login.passwordMin'),
      trigger: 'blur',
    },
  ],
}

async function handleLogin() {
  const valid = await loginFormRef.value?.validate().catch(() => false)

  if (!valid)
    return

  loginForm.account = loginForm.account.trim()
  loginForm.password = loginForm.password.trim()

  loading.value = true

  try {
    await authStore.login(loginForm)
    const redirect = (route.query.redirect as string) || DEFAULT_HOME_PATH
    router.push(redirect)
  }
  catch {
    // 请求错误已在 HTTP 拦截器中统一提示
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="login-page">
    <section class="login-panel">
      <h1>Elm Admin</h1>
      <p class="login-hint">
        {{ t('login.defaultCredentialHint') }}
      </p>
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="rules"
        @keyup.enter="handleLogin"
      >
        <el-form-item prop="account">
          <el-input
            v-model="loginForm.account"
            :placeholder="t('login.usernamePlaceholder')"
            :prefix-icon="IconEpUser"
            size="large"
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            :placeholder="t('login.passwordPlaceholder')"
            :prefix-icon="IconEpLock"
            size="large"
            show-password
          />
        </el-form-item>
        <div class="login-options">
          <el-checkbox v-model="loginForm.rememberMe">
            {{ t('login.rememberMe') }}
          </el-checkbox>
        </div>
        <el-button
          type="primary"
          size="large"
          :loading="loading"
          class="login-button"
          @click="handleLogin"
        >
          {{ t('login.login') }}
        </el-button>
      </el-form>
    </section>
  </main>
</template>

<style scoped lang="scss">
.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 24px;
  background:
    linear-gradient(135deg, rgb(64 158 255 / 16%), rgb(103 194 58 / 12%)),
    var(--app-bg-page);
}

.login-panel {
  width: min(420px, 100%);
  padding: 32px;
  background: var(--app-bg-surface);
  border: 1px solid var(--app-border-light);
  border-radius: 8px;
  box-shadow: 0 20px 45px rgb(31 45 61 / 10%);
}

h1 {
  margin: 0 0 20px;
  font-size: 24px;
  color: var(--app-text-primary);
  text-align: center;
}

.login-hint {
  margin: -8px 0 20px;
  font-size: 13px;
  color: var(--app-text-secondary);
  text-align: center;
}

.login-button {
  width: 100%;
}

.login-options {
  display: flex;
  justify-content: space-between;
  margin: -4px 0 18px;
}
</style>
