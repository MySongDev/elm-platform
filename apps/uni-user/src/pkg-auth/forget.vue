<script setup>
/**
 * ⚠️ 与 apps/web-user/src/views/forget/forget.vue 同源改造。
 * 迁移来源已整体替换占位页（Batch 3 forget，方案排期 1 天）。
 *
 * 差异：
 * 1. `showAlert`（AlterTip 命令式挂载 DOM）→ platform/feedback 的 showToast
 * 2. `document.querySelector(selector)?.focus()` → **小程序端无此能力**。
 *    改为受控 focus：validate 失败时把对应 FormItem 的 focus prop 置 true
 *    （小程序 input 的 focus 是响应式属性，置 true 即获焦）
 * 3. `window.setInterval` → setInterval（小程序有全局 setInterval，无需 window 前缀）
 * 4. `router.replace('/login')` → navigateTo(ROUTES.LOGIN, { replace: true })
 * 5. form/@submit.prevent → view + 按钮 @click（小程序无 form submit 语义）
 * 6. `error?.response` 判定 → TransportError 结构（同 api-payment 的理由）
 * 7. px → rpx；`width: 351px` 这类固定宽改百分比（小程序屏宽不一）
 */
import { computed, nextTick, onUnmounted, reactive, ref } from 'vue'

import { ROUTES } from '@/config/routes'
import { showToast } from '@/platform/feedback'
import { navigateTo } from '@/platform/navigation'
import { TransportError } from '@/platform/request'
import { resetCustomerPassword, sendCustomerSms } from '@/services/api/api-login'
import FormItem from './components/FormItem.vue'

const RESEND_SECONDS = 60

const form = reactive({
  phone: '',
  smsCode: '',
  newPassword: '',
  confirmPassword: '',
})
const submitting = ref(false)
const sendingCode = ref(false)
const secondsLeft = ref(0)
// 受控聚焦目标：validate 失败时置为对应字段名，FormItem 的 focus prop 消费它
const focusField = ref('')
let countdownTimer

const formFields = [
  {
    key: 'newPassword',
    label: '新密码',
    placeholder: '至少 6 位',
    name: 'newpass',
    type: 'password',
    maxlength: 20,
  },
  {
    key: 'confirmPassword',
    label: '确认密码',
    placeholder: '请再次输入新密码',
    name: 'enterpass',
    type: 'password',
    maxlength: 20,
  },
]

const isPhoneValid = computed(() => /^1\d{10}$/.test(form.phone))
const sendCodeText = computed(() => {
  if (sendingCode.value)
    return '发送中...'
  return secondsLeft.value > 0 ? `重新获取(${secondsLeft.value}s)` : '获取验证码'
})

const validateRules = [
  {
    field: 'phone',
    check: () => isPhoneValid.value,
    message: '请输入正确的手机号',
  },
  {
    field: 'smsCode',
    check: () => form.smsCode.length === 6,
    message: '请输入 6 位验证码',
  },
  {
    field: 'newPassword',
    check: () => form.newPassword.length >= 6,
    message: '新密码至少 6 位',
  },
  {
    field: 'confirmPassword',
    check: () => form.newPassword === form.confirmPassword,
    message: '两次输入的密码不一致',
  },
]

const isSubmitDisabled = computed(() => submitting.value || !validateRules.every(rule => rule.check()))

function startCountdown() {
  clearInterval(countdownTimer)
  secondsLeft.value = RESEND_SECONDS
  countdownTimer = setInterval(() => {
    if (secondsLeft.value <= 1) {
      clearInterval(countdownTimer)
      secondsLeft.value = 0
      return
    }
    secondsLeft.value -= 1
  }, 1000)
}

function validate() {
  for (const rule of validateRules) {
    if (!rule.check()) {
      showToast(rule.message)
      // 受控聚焦替代 document.querySelector().focus()
      focusField.value = ''
      nextTick(() => {
        focusField.value = rule.field
      })
      return false
    }
  }
  return true
}

function onCodeInput(event) {
  const value = String(event.detail?.value ?? '').replace(/\D/g, '').slice(0, 6)
  form.smsCode = value
}

async function sendCode() {
  if (secondsLeft.value > 0 || sendingCode.value)
    return

  if (!isPhoneValid.value) {
    showToast('请输入正确的手机号')
    return
  }

  sendingCode.value = true
  try {
    await sendCustomerSms(form.phone, 'reset_password')
    startCountdown()
    showToast('验证码已发送')
  }
  catch (error) {
    // ⚠️ 与 web-user 同语义：只提示「非后端业务错误」的失败（网络/传输层），
    // 后端返回的业务错误由全局 policies 弹窗，避免双重提示。
    // 判定依据换成 TransportError（axios.isAxiosError 的同构替代）
    if (!(error instanceof TransportError))
      showToast(error?.message || '验证码发送失败，请稍后重试')
  }
  finally {
    sendingCode.value = false
  }
}

async function submit() {
  if (!validate())
    return

  submitting.value = true
  try {
    await resetCustomerPassword(form.phone, form.smsCode, form.newPassword)
    showToast('密码已重置，请重新登录')
    navigateTo(ROUTES.LOGIN, { replace: true })
  }
  catch (error) {
    if (!(error instanceof TransportError))
      showToast(error?.message || '重置失败，请稍后重试')
  }
  finally {
    submitting.value = false
  }
}

onUnmounted(() => {
  clearInterval(countdownTimer)
})
</script>

<template>
  <view class="forget-content">
    <view class="reset-form">
      <FormItem
        v-model="form.phone"
        label="手机号"
        placeholder="请输入手机号"
        name="phone"
        type="tel"
        :maxlength="11"
        :focus="focusField === 'phone'"
      />
      <FormItem
        :model-value="form.smsCode"
        label="验证码"
        placeholder="6 位验证码"
        name="sms_code"
        :maxlength="6"
        :focus="focusField === 'smsCode'"
        class="code-number"
        @input="onCodeInput"
      >
        <view
          class="send-code"
          :class="{ disabled: secondsLeft > 0 || sendingCode }"
          @click="sendCode"
        >
          {{ sendCodeText }}
        </view>
      </FormItem>
      <FormItem
        v-for="field in formFields"
        :key="field.key"
        v-model="form[field.key]"
        :label="field.label"
        :placeholder="field.placeholder"
        :name="field.name"
        :type="field.type"
        :maxlength="field.maxlength"
        :focus="focusField === field.key"
      />
      <view
        class="submit"
        :class="{ disabled: isSubmitDisabled }"
        @click="submit"
      >
        {{ submitting ? '提交中...' : '确认重置' }}
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.forget-content {
  min-height: 100vh;
  background: #f5f5f5;
}

.reset-form {
  width: 100%;
  background-color: $ff;
}

.submit {
  display: block;
  width: 90%;
  margin: 40rpx auto 0;
  font-size: 32rpx;
  line-height: 84rpx;
  color: $ff;
  text-align: center;
  background: #f69;
  border-radius: 44rpx;

  &.disabled {
    opacity: 0.55;
  }
}

.code-number {
  .send-code {
    flex-shrink: 0;
    font-size: 28rpx;
    color: #f69;
    white-space: nowrap;
    background: transparent;

    &.disabled {
      color: #a8a8a8;
    }
  }
}
</style>
