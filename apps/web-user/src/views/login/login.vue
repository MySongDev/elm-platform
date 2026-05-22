<script setup>
import { computed, onBeforeUnmount, reactive, shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { showAlert } from '@/components/common/AlterTip/index'
import { customerPasswordLogin, customerRegister, customerSmsLogin, sendCustomerSms } from '@/services/api/'
import { useUserStore } from '@/stores/modules/store-user'

defineOptions({ name: 'Login' })

const tabs = [
  { key: 'sms', label: '验证码登录' },
  { key: 'password', label: '密码登录' },
  { key: 'register', label: '注册' },
]

const phonePattern = /^1\d{10}$/
const activeTab = shallowRef('sms')
const loading = shallowRef(false)
const countdown = shallowRef(0)
let timer = null

const route = useRoute()
const router = useRouter()
const { recordUserInfo } = useUserStore()

const form = reactive({
  phone: '',
  smsCode: '',
  password: '',
  registerPassword: '',
})

const canSendSms = computed(() => countdown.value === 0 && phonePattern.test(form.phone))
const smsScene = computed(() => (activeTab.value === 'register' ? 'register' : 'login'))
const activeTabLabel = computed(() => tabs.find(tab => tab.key === activeTab.value)?.label || '登录')
const smsButtonText = computed(() => (countdown.value > 0 ? `${countdown.value}s` : '获取验证码'))
const submitText = computed(() => (loading.value ? '处理中...' : activeTabLabel.value))

function setActiveTab(tab) {
  activeTab.value = tab
}

function validatePhone() {
  if (!phonePattern.test(form.phone)) {
    showAlert('请输入正确的手机号')
    return false
  }
  return true
}

function getRedirectTarget() {
  const redirect = route.query.redirect
  return Array.isArray(redirect) ? redirect[0] || '/home' : redirect || '/home'
}

function clearTimer() {
  if (!timer)
    return

  clearInterval(timer)
  timer = null
}

function startCountdown() {
  countdown.value = 60
  clearTimer()
  timer = setInterval(() => {
    countdown.value -= 1
    if (countdown.value <= 0) {
      clearTimer()
      countdown.value = 0
    }
  }, 1000)
}

async function sendSms() {
  if (!validatePhone() || !canSendSms.value)
    return

  try {
    const result = await sendCustomerSms(form.phone, smsScene.value)
    startCountdown()
    if (result?.debugCode)
      showAlert(`开发验证码：${result.debugCode}`)
  }
  catch {
    countdown.value = 0
  }
}

async function finishLogin(result) {
  recordUserInfo(result)
  await router.push(getRedirectTarget())
}

async function submitSmsLogin() {
  if (!validatePhone())
    return
  if (!form.smsCode) {
    showAlert('请输入验证码')
    return
  }

  loading.value = true
  try {
    const result = await customerSmsLogin(form.phone, form.smsCode)
    await finishLogin(result)
  }
  finally {
    loading.value = false
  }
}

async function submitPasswordLogin() {
  if (!validatePhone())
    return
  if (!form.password) {
    showAlert('请输入密码')
    return
  }

  loading.value = true
  try {
    const result = await customerPasswordLogin(form.phone, form.password)
    await finishLogin(result)
  }
  finally {
    loading.value = false
  }
}

async function submitRegister() {
  if (!validatePhone())
    return
  if (!form.smsCode) {
    showAlert('请输入验证码')
    return
  }

  loading.value = true
  try {
    const result = await customerRegister(form.phone, form.smsCode, form.registerPassword)
    await finishLogin(result)
  }
  finally {
    loading.value = false
  }
}

function submit() {
  if (loading.value)
    return Promise.resolve()
  if (activeTab.value === 'sms')
    return submitSmsLogin()
  if (activeTab.value === 'password')
    return submitPasswordLogin()
  return submitRegister()
}

onBeforeUnmount(() => {
  clearTimer()
})
</script>

<template>
  <div class="login_nav">
    <head-top />

    <div class="login_tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        :class="{ active: activeTab === tab.key }"
        @click="setActiveTab(tab.key)"
      >
        {{ tab.label }}
      </button>
    </div>

    <form class="login_form" @submit.prevent="submit">
      <section class="input_container">
        <input v-model.trim="form.phone" type="tel" placeholder="手机号" maxlength="11" autocomplete="tel">
      </section>

      <section v-if="activeTab !== 'password'" class="input_container sms_container">
        <input v-model.trim="form.smsCode" type="text" placeholder="短信验证码" maxlength="6" inputmode="numeric">
        <button type="button" :disabled="!canSendSms" @click="sendSms">
          {{ smsButtonText }}
        </button>
      </section>

      <section v-if="activeTab === 'password'" class="input_container">
        <input v-model="form.password" type="password" placeholder="请输入密码" autocomplete="current-password">
      </section>

      <section v-if="activeTab === 'register'" class="input_container">
        <input v-model="form.registerPassword" type="password" placeholder="设置密码（可选）" autocomplete="new-password">
      </section>
    </form>

    <button class="login_container" type="button" :disabled="loading" @click="submit">
      {{ submitText }}
    </button>
    <router-link to="/forget" class="to_forget">
      重置密码？
    </router-link>
  </div>
</template>

<style lang="scss" scoped>
.login_nav {
  min-height: 100vh;
  background: #f5f5f5;
}

.login_tabs {
  display: flex;
  gap: 2.6667vw;
  padding: 4vw 4vw 2.6667vw;
  background: $ff;

  button {
    flex: 1;
    min-width: 0;
    height: 9.6vw;
    color: #666;
    font-size: 3.7333vw;
    background: #f5f5f5;
    border-radius: 4.8vw;

    &.active {
      color: $ff;
      background: #4cd964;
    }
  }
}

.login_form {
  width: 100%;
  background-color: $ff;

  .input_container {
    @include wh(100%, 13.3333vw);
    @include flex-center(space-between);

    padding: 0 4vw;
    border-bottom: 0.0267vw solid $e4;

    input {
      min-width: 0;
      flex: 1;
      @include size-color(4.3733vw, #666);
    }
  }

  .sms_container {
    gap: 3.2vw;

    button {
      flex: 0 0 24vw;
      color: #3190e8;
      font-size: 3.7333vw;
      text-align: right;

      &:disabled {
        color: #aaa;
      }
    }
  }
}

.login_container {
  @include wh(94.6667vw, 13.3333vw);

  display: block;
  margin: 2.6667vw auto;
  color: $ff;
  font-size: 4.2667vw;
  line-height: 13.3333vw;
  text-align: center;
  background-color: #4cd964;
  border-radius: 2.6667vw;

  &:disabled {
    opacity: 0.7;
  }
}

.to_forget {
  display: block;
  width: fit-content;
  margin-left: auto;
  padding: 1.3333vw 4vw;
  color: $blue;
  font-size: 3.4667vw;
}
</style>
