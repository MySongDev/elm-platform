<script setup>
import { computed, nextTick, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import { showAlert } from '@/components/common/AlterTip/index'
import { resetCustomerPassword, sendCustomerSms } from '@/services/api/api-login'
import FormItem from './components/FormItem.vue'

defineOptions({
  name: 'Forget',
})

const RESEND_SECONDS = 60

const router = useRouter()
const form = reactive({
  phone: '',
  smsCode: '',
  newPassword: '',
  confirmPassword: '',
})
const submitting = ref(false)
const sendingCode = ref(false)
const secondsLeft = ref(0)
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
    check: () => isPhoneValid.value,
    message: '请输入正确的手机号',
    selector: 'input[name="phone"]',
  },
  {
    check: () => form.smsCode.length === 6,
    message: '请输入 6 位验证码',
    selector: 'input[name="sms_code"]',
  },
  {
    check: () => form.newPassword.length >= 6,
    message: '新密码至少 6 位',
    selector: 'input[name="newpass"]',
  },
  {
    check: () => form.newPassword === form.confirmPassword,
    message: '两次输入的密码不一致',
    selector: 'input[name="enterpass"]',
  },
]

const isSubmitDisabled = computed(() => submitting.value || !validateRules.every(rule => rule.check()))

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

function validate() {
  for (const rule of validateRules) {
    if (!rule.check()) {
      showAlert(rule.message)
      nextTick(() => document.querySelector(rule.selector)?.focus())
      return false
    }
  }
  return true
}

function onCodeInput(event) {
  const value = event.target.value.replace(/\D/g, '').slice(0, 6)
  form.smsCode = value
  event.target.value = value
}

async function sendCode() {
  if (secondsLeft.value > 0 || sendingCode.value)
    return

  if (!isPhoneValid.value) {
    showAlert('请输入正确的手机号')
    return
  }

  sendingCode.value = true
  try {
    await sendCustomerSms(form.phone, 'reset_password')
    startCountdown()
    showAlert('验证码已发送')
  }
  catch (error) {
    if (!error?.code && !error?.response)
      showAlert(error?.message || '验证码发送失败，请稍后重试')
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
    showAlert('密码已重置，请重新登录')
    router.replace('/login')
  }
  catch (error) {
    if (!error?.code && !error?.response)
      showAlert(error?.message || '重置失败，请稍后重试')
  }
  finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="forget-content">
    <head-top />
    <form class="reset-form" @submit.prevent="submit">
      <FormItem
        v-model="form.phone" label="手机号" placeholder="请输入手机号" name="phone" type="tel" :maxlength="11"
        inputmode="numeric"
      />
      <FormItem
        :model-value="form.smsCode" label="验证码" placeholder="6 位验证码" name="sms_code" :maxlength="6"
        inputmode="numeric" pattern="[0-9]*" class="code-number" @input="onCodeInput"
      >
        <button class="send-code" type="button" :disabled="secondsLeft > 0 || sendingCode" @click="sendCode">
          {{ sendCodeText }}
        </button>
      </FormItem>
      <FormItem
        v-for="field in formFields" :key="field.key" v-model="form[field.key]" :label="field.label"
        :placeholder="field.placeholder" :name="field.name" :type="field.type" :maxlength="field.maxlength"
      />
      <button class="submit" :class="{ disabled: isSubmitDisabled }" :disabled="isSubmitDisabled" type="submit">
        {{ submitting ? '提交中...' : '确认重置' }}
      </button>
    </form>
  </div>
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
  width: 351px;
  height: 44px;
  margin: 20px auto 0;
  font-size: 16px;
  line-height: 42px;
  color: $ff;
  text-align: center;
  background: #f69;
  border: 0;
  border-radius: 22px;

  &.disabled {
    opacity: 0.55;
  }
}

.code-number {
  .send-code {
    flex-shrink: 0;
    font-size: 14px;
    color: #f69;
    white-space: nowrap;
    background: transparent;
    border: 0;

    &:disabled {
      color: #a8a8a8;
    }
  }
}
</style>
