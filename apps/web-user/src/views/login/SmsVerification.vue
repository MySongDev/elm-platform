<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { customerSmsLogin, sendCustomerSms } from '@/services/api/api-login'
import { useUserStore } from '@/stores/modules/store-user'

defineOptions({ name: 'SmsVerification' })

const OTP_LENGTH = 6
const RESEND_SECONDS = 60
const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const otp = ref(Array.from({ length: OTP_LENGTH }).fill(''))
const inputRefs = ref([])
const secondsLeft = ref(RESEND_SECONDS)
const isVerifying = ref(false)
const isResending = ref(false)
const errorMessage = ref('')
let countdownTimer

const phone = computed(() => {
  const value = Array.isArray(route.query.phone) ? route.query.phone[0] : route.query.phone
  return typeof value === 'string' ? value.replace(/\D/g, '').slice(0, 11) : ''
})
const isPhoneValid = computed(() => /^1\d{10}$/.test(phone.value))
const formattedPhone = computed(() => phone.value.replace(/(\d{3})(\d{4})(\d{4})/, '$1 $2 $3'))
const resendText = computed(() => secondsLeft.value > 0 ? `重新获取(${secondsLeft.value}s)` : '重新获取')

function loginQuery() {
  const redirect = Array.isArray(route.query.redirect) ? route.query.redirect[0] : route.query.redirect
  return {
    phone: phone.value || undefined,
    redirect: typeof redirect === 'string' ? redirect : undefined,
  }
}

function backToLogin() {
  router.replace({
    name: 'Login',
    query: loginQuery(),
  })
}

function startCountdown() {
  clearInterval(countdownTimer)
  secondsLeft.value = RESEND_SECONDS
  countdownTimer = window.setInterval(() => {
    if (secondsLeft.value <= 1) {
      clearInterval(countdownTimer)
      secondsLeft.value = 0
      return
    }
    secondsLeft.value -= 1
  }, 1000)
}

function focusInput(index) {
  nextTick(() => inputRefs.value[index]?.focus())
}

function clearError() {
  errorMessage.value = ''
}

function getRedirectTarget() {
  const redirect = Array.isArray(route.query.redirect) ? route.query.redirect[0] : route.query.redirect
  if (typeof redirect !== 'string' || !redirect.startsWith('/') || redirect.startsWith('//') || redirect.startsWith('/login'))
    return '/msite'

  return redirect
}

async function verifyCode() {
  if (isVerifying.value || !isPhoneValid.value)
    return

  const smsCode = otp.value.join('')
  if (smsCode.length !== OTP_LENGTH)
    return

  clearError()
  isVerifying.value = true
  try {
    const response = await customerSmsLogin(phone.value, smsCode)
    userStore.recordUserInfo(response)
    router.replace(getRedirectTarget())
  }
  catch (error) {
    errorMessage.value = error?.message || '验证码错误或已过期，请重新输入'
    focusInput(OTP_LENGTH - 1)
  }
  finally {
    isVerifying.value = false
  }
}

function handleInput(event, index) {
  clearError()
  const digits = event.target.value.replace(/\D/g, '')
  if (!digits) {
    otp.value[index] = ''
    return
  }

  digits.slice(0, OTP_LENGTH - index).split('').forEach((digit, offset) => {
    otp.value[index + offset] = digit
  })
  focusInput(Math.min(index + digits.length, OTP_LENGTH - 1))
  verifyCode()
}

function handleKeydown(event, index) {
  if (event.key === 'Backspace' && !otp.value[index] && index > 0) {
    otp.value[index - 1] = ''
    focusInput(index - 1)
  }
}

function handlePaste(event, index) {
  const digits = event.clipboardData?.getData('text').replace(/\D/g, '')
  if (!digits)
    return

  event.preventDefault()
  clearError()
  digits.slice(0, OTP_LENGTH - index).split('').forEach((digit, offset) => {
    otp.value[index + offset] = digit
  })
  focusInput(Math.min(index + digits.length, OTP_LENGTH - 1))
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

onMounted(() => {
  if (!isPhoneValid.value) {
    backToLogin()
    return
  }
  startCountdown()
  focusInput(0)
})

onBeforeUnmount(() => clearInterval(countdownTimer))
</script>

<template>
  <main class="verification_page">
    <header class="verification_topbar">
      <button class="back_button" type="button" aria-label="返回登录页" @click="backToLogin">
        <span aria-hidden="true" />
      </button>
      <button class="help_button" type="button">
帮助
</button>
    </header>

    <section class="verification_content" aria-labelledby="verification-title">
      <h1 id="verification-title">
输入验证码
</h1>
      <p class="phone_hint">
验证码已发送至 <span>+86 {{ formattedPhone }}</span>
</p>

      <div class="otp_inputs" role="group" aria-label="六位短信验证码">
        <input
          v-for="(_, index) in otp"
          :key="index"
          :ref="element => { if (element) inputRefs[index] = element }"
          :value="otp[index]"
          class="otp_input"
          type="text"
          inputmode="numeric"
          :autocomplete="index === 0 ? 'one-time-code' : 'off'"
          maxlength="1"
          :disabled="isVerifying"
          :aria-label="`验证码第 ${index + 1} 位`"
          @input="handleInput($event, index)"
          @keydown="handleKeydown($event, index)"
          @paste="handlePaste($event, index)"
        >
      </div>

      <p v-if="errorMessage" class="verification_error" role="alert" aria-live="polite">
        {{ errorMessage }}
      </p>
      <p v-else-if="isVerifying" class="verification_status" aria-live="polite">
        正在验证...
      </p>

      <div class="verification_actions">
        <button class="resend_button" type="button" :disabled="secondsLeft > 0 || isVerifying || isResending" @click="resendCode">
          {{ isResending ? '发送中...' : resendText }}
        </button>
        <button class="phone_disabled" type="button" :disabled="isVerifying">
手机号已停用?
</button>
      </div>
    </section>
  </main>
</template>

<style lang="scss" scoped>
.verification_page {
  min-height: 100svh;
  padding: calc(18px + env(safe-area-inset-top)) 24px calc(32px + env(safe-area-inset-bottom));
  color: #171717;
  background: #fff;
}

.verification_topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 46px;
}

.back_button {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  padding: 0;
  background: transparent;
}

.back_button span {
  width: 17px;
  height: 17px;
  border-bottom: 3px solid #171717;
  border-left: 3px solid #171717;
  transform: rotate(45deg);
}

.help_button {
  min-width: 44px;
  padding: 8px 0;
  font-size: 20px;
  font-weight: 500;
  color: #222;
  background: transparent;
}

.verification_content {
  width: min(100%, 720px);
  margin: 112px auto 0;
}

h1 {
  margin: 0;
  font-size: clamp(30px, 8vw, 42px);
  font-weight: 700;
  line-height: 1.2;
}

.phone_hint {
  margin: 28px 0 0;
  font-size: clamp(18px, 5vw, 25px);
  line-height: 1.5;
  color: #222;
}

.phone_hint span {
  margin-left: 8px;
  letter-spacing: .4px;
}

.otp_inputs {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: clamp(8px, 2.7vw, 22px);
  margin-top: 96px;
}

.verification_error,
.verification_status {
  min-height: 24px;
  margin: 18px 0 0;
  font-size: 16px;
  line-height: 1.5;
}

.verification_error {
  color: #d9363e;
}

.verification_status {
  color: #888;
}

.otp_input {
  width: 100%;
  min-height: 48px;
  aspect-ratio: 1;
  padding: 0;
  font-size: clamp(23px, 7vw, 34px);
  font-weight: 600;
  line-height: 1;
  color: #171717;
  text-align: center;
  caret-color: transparent;
  background: #f7f7f7;
  border: 2px solid transparent;
  border-radius: clamp(12px, 4vw, 24px);
}

.otp_input:focus-visible {
  background: #fff;
  border-color: #171717;
  outline: none;
}

.verification_actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 34px;
  font-size: clamp(16px, 4.8vw, 23px);
}

.resend_button,
.phone_disabled {
  padding: 8px 0;
  color: #222;
  background: transparent;
}

.resend_button:disabled {
  color: #a8a8a8;
}

@media (width <=360px) {
  .verification_page {
    padding-right: 18px;
    padding-left: 18px;
  }

  .verification_content {
    margin-top: 82px;
  }

  .otp_inputs {
    gap: 7px;
    margin-top: 72px;
  }

  .verification_actions {
    margin-top: 28px;
    font-size: 16px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .otp_input {
    transition: none;
  }
}
</style>
