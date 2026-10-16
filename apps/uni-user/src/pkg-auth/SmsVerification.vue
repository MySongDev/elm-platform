<script setup>
/**
 * ⚠️ 与 apps/web-user/src/views/login/SmsVerification.vue 同源改造（短信验证页）。
 * 整体替换占位页（Batch 3 留桩，2 天）。
 *
 * 差异：
 * 1. **OTP 6 格 + ref 聚焦跳转** → 小程序端 `input` 的 ref-focus 不可靠（无
 *    DOM 焦点控制），降级为**单个 number 输入框**（maxlength=6）。功能等价：
 *    用户输入 6 位数字后自动验证，web-user 的「逐格自动跳格/退格回填/粘贴」
 *    在小程序端没有原生对应，用单输入框承接（用户可自由编辑）。
 * 2. `useRoute`/`useRouter` → `onLoad(options)` 取 phone/redirect；
 *    `router.replace({name:'Login',query})` → `navigateTo(withQuery(ROUTES.LOGIN, ...))`
 * 3. `window.setInterval`/`clearInterval` → 全局 `setInterval`/`clearInterval`
 *    （小程序有全局定时器，见 HANDOFF 记录 web-user 同型差异）
 * 4. 手机号非法（query 缺失/格式错）→ web-user `backToLogin()`，
 *    小程序端改为 toast + navigateBack（不强制跳登录页，避免登录页循环）
 * 5. `useLoginSuccess` 已改为接受 redirect 参数（见该文件）
 * 6. px/clamp/media query → rpx
 */
import { onLoad, onUnload } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'

import { withQuery } from '@/config/routes'
import { showToast } from '@/platform/feedback'
import { navigateBack, navigateTo, ROUTES } from '@/platform/navigation'
import { customerSmsLogin, sendCustomerSms } from '@/services/api/api-login'

import { useLoginSuccess } from './useLoginSuccess'

const OTP_LENGTH = 6
const RESEND_SECONDS = 60

// query：phone / redirect（onLoad 传入，对齐 web-user 的 route.query）
const phoneRaw = ref('')
const redirect = ref('')

const phone = computed(() => phoneRaw.value.replace(/\D/g, '').slice(0, 11))
const isPhoneValid = computed(() => /^1\d{10}$/.test(phone.value))
const formattedPhone = computed(() => phone.value.replace(/(\d{3})(\d{4})(\d{4})/, '$1 $2 $3'))

// onLoad 取 phone/redirect（对齐 web-user 的 route.query）
onLoad((options) => {
  phoneRaw.value = options?.phone || ''
  redirect.value = options?.redirect || ''
  // 手机号非法 → 提示并返回（web-user 是 backToLogin，这里降级为返回，避免登录页循环）
  if (!isPhoneValid.value) {
    showToast('手机号无效，请返回重新登录')
    setTimeout(navigateBack, 1200)
    return
  }
  startCountdown()
})

const otp = ref('')
const secondsLeft = ref(RESEND_SECONDS)
const isVerifying = ref(false)
const isResending = ref(false)
const errorMessage = ref('')
let countdownTimer = null

const { completeLogin } = useLoginSuccess({ redirect: () => redirect.value })

const resendText = computed(() => (secondsLeft.value > 0 ? `重新获取(${secondsLeft.value}s)` : '重新获取'))

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

function clearError() {
  errorMessage.value = ''
}

// 输入 6 位后自动验证（单输入框，web-user 的逐格 auto-focus 在此合并）
async function verifyCode() {
  if (isVerifying.value || !isPhoneValid.value)
    return

  const smsCode = otp.value
  if (smsCode.length !== OTP_LENGTH)
    return

  clearError()
  isVerifying.value = true
  try {
    const response = await customerSmsLogin(phone.value, smsCode)
    completeLogin(response)
  }
  catch (error) {
    errorMessage.value = error?.message || '验证码错误或已过期，请重新输入'
  }
  finally {
    isVerifying.value = false
  }
}

// 监听输入，满 6 位自动提交
function onOtpInput(e) {
  clearError()
  const digits = String(e.detail.value).replace(/\D/g, '').slice(0, OTP_LENGTH)
  otp.value = digits
  if (digits.length === OTP_LENGTH)
    verifyCode()
}

async function resendCode() {
  if (secondsLeft.value > 0 || isVerifying.value || isResending.value)
    return

  clearError()
  isResending.value = true
  try {
    await sendCustomerSms(phone.value, 'login')
    startCountdown()
  }
  catch (error) {
    errorMessage.value = error?.message || '验证码发送失败，请稍后重试'
  }
  finally {
    isResending.value = false
  }
}

function backToLogin() {
  navigateTo(withQuery(ROUTES.LOGIN, {
    phone: phone.value || undefined,
    redirect: redirect.value || undefined,
  }))
}

onUnload(() => {
  clearInterval(countdownTimer)
  countdownTimer = null
})
</script>

<template>
  <view class="verification_page">
    <view class="verification_topbar">
      <view class="back_button" @click="navigateBack()">
        <text>‹</text>
      </view>
      <view class="help_button">
        帮助
      </view>
    </view>

    <view class="verification_content">
      <text class="verification-title">
        输入验证码
      </text>
      <text class="phone_hint">
        验证码已发送至 +86 {{ formattedPhone }}
      </text>

      <view class="otp_field">
        <input
          class="otp_input"
          type="number"
          :value="otp"
          :maxlength="6"
          :disabled="isVerifying"
          placeholder="6 位数字验证码"
          @input="onOtpInput"
          @blur="verifyCode"
        >
      </view>

      <text v-if="errorMessage" class="verification_error">
        {{ errorMessage }}
      </text>
      <text v-else-if="isVerifying" class="verification_status">
        正在验证...
      </text>

      <view class="verification_actions">
        <view
          class="resend_button"
          :class="{ 'is-disabled': secondsLeft > 0 || isVerifying || isResending }"
          @click="resendCode()"
        >
          {{ isResending ? '发送中...' : resendText }}
        </view>
        <view
          class="phone_disabled"
          @click="backToLogin()"
        >
          手机号有误?
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.verification_page {
  box-sizing: border-box;
  min-height: 100vh;
  padding: 36rpx 48rpx 64rpx;
  color: #171717;
  background: #fff;
}

.verification_topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 92rpx;
}

.back_button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 88rpx;
  height: 88rpx;
  font-size: 72rpx;
  line-height: 1;
  color: #171717;
  background: transparent;
}

.help_button {
  min-width: 88rpx;
  padding: 16rpx 0;
  font-size: 40rpx;
  font-weight: 500;
  color: #222;
  text-align: center;
  background: transparent;
}

.verification_content {
  width: 100%;
  margin: 224rpx auto 0;
}

.verification-title {
  display: block;
  font-size: 84rpx;
  font-weight: 700;
  line-height: 1.2;
}

.phone_hint {
  display: block;
  margin: 56rpx 0 0;
  font-size: 50rpx;
  line-height: 1.5;
  color: #222;
}

.otp_field {
  margin-top: 192rpx;
}

.otp_input {
  box-sizing: border-box;
  width: 100%;
  min-height: 96rpx;
  padding: 0 32rpx;
  font-size: 68rpx;
  font-weight: 600;
  line-height: 96rpx;
  color: #171717;
  text-align: center;
  letter-spacing: 16rpx;
  background: #f7f7f7;
  border: 4rpx solid transparent;
  border-radius: 48rpx;

  &:focus {
    background: #fff;
    border-color: #171717;
  }
}

.verification_error,
.verification_status {
  display: block;
  min-height: 48rpx;
  margin: 36rpx 0 0;
  font-size: 32rpx;
  line-height: 1.5;
}

.verification_error {
  color: #d9363e;
}

.verification_status {
  color: #888;
}

.verification_actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 68rpx;
  font-size: 46rpx;
}

.resend_button,
.phone_disabled {
  padding: 16rpx 0;
  color: #222;
  background: transparent;
}

.resend_button.is-disabled {
  color: #a8a8a8;
}
</style>
