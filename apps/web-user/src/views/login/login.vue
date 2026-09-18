<script setup>
import { computed, shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { customerPasswordLogin, sendCustomerSms } from '@/services/api/api-login'

defineOptions({ name: 'Login' })

const loginMode = shallowRef('sms')
const phone = shallowRef('')
const password = shallowRef('')
const passwordVisible = shallowRef(false)
const agreementAccepted = shallowRef(false)
const router = useRouter()
const route = useRoute()

const formattedPhone = computed(() => formatPhone(phone.value))
const isPhoneValid = computed(() => phone.value.length === 11 && /^1\d{10}$/.test(phone.value))
const canSubmit = computed(() => isPhoneValid.value && agreementAccepted.value && (loginMode.value === 'sms' || password.value.length > 0))
const submitText = computed(() => (loginMode.value === 'sms' ? '获取短信验证码' : '登录'))

function formatPhone(value) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  return [digits.slice(0, 3), digits.slice(3, 7), digits.slice(7, 11)].filter(Boolean).join(' ')
}

function handlePhoneInput(event) {
  phone.value = event.target.value.replace(/\D/g, '').slice(0, 11)
}

function clearPhone() {
  phone.value = ''
}

function switchToPassword() {
  loginMode.value = 'password'
}

function switchToSms() {
  loginMode.value = 'sms'
  password.value = ''
  passwordVisible.value = false
}

function togglePasswordVisibility() {
  passwordVisible.value = !passwordVisible.value
}

async function handleSubmit() {
  if (loginMode.value === 'sms') {
    await sendCustomerSms(phone.value, 'login')
    router.push({
      name: 'SmsVerification',
      query: {
        phone: phone.value,
        redirect: route.query.redirect,
      },
    })
  }
  else {
    customerPasswordLogin(phone.value, password.value)
  }
}

function closeLogin() {
  router.back()
}
</script>

<template>
  <main class="login_page">
    <div class="login_topbar">
      <button class="close_button" type="button" aria-label="关闭登录页" @click="closeLogin">
        <span aria-hidden="true">×</span>
      </button>
    </div>

    <section class="login_content">
      <h1 class="login_title">
欢迎登录
</h1>

      <div class="phone_field">
        <button class="country_code" type="button" aria-label="国家或地区代码">
          <span>+86</span>
          <span class="country_arrow" aria-hidden="true" />
        </button>

        <input
          class="phone_input"
          :value="formattedPhone"
          type="tel"
          inputmode="numeric"
          autocomplete="tel"
          maxlength="13"
          placeholder="请输入手机号"
          aria-label="手机号"
          @input="handlePhoneInput"
        >

        <button
          v-if="phone"
          class="clear_phone"
          type="button"
          aria-label="清除手机号"
          @click="clearPhone"
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>

      <p v-if="loginMode === 'sms'" class="login_hint">
未注册的手机号验证后自动创建账号
</p>

      <div v-else class="password_field">
        <input
          v-model="password"
          class="password_input"
          :type="passwordVisible ? 'text' : 'password'"
          autocomplete="current-password"
          placeholder="请输入密码"
          aria-label="密码"
        >
        <button
          class="password_visibility"
          type="button"
          :aria-label="passwordVisible ? '隐藏密码' : '显示密码'"
          :aria-pressed="passwordVisible"
          @click="togglePasswordVisibility"
        >
          <span aria-hidden="true" />
        </button>
      </div>

      <label class="agreement_row">
        <input v-model="agreementAccepted" type="checkbox">
        <span class="agreement_mark" aria-hidden="true">✓</span>
        <span class="agreement_text">我已阅读并同意<span class="agreement_link">《用户协议》</span>和<span class="agreement_link">《隐私政策》</span></span>
      </label>

      <button class="login_submit" type="button" :disabled="!canSubmit" @click="handleSubmit">
        {{ submitText }}
      </button>

      <button v-if="loginMode === 'sms'" class="password_login" type="button" @click="switchToPassword">
        密码登录
      </button>
      <button v-else class="password_login" type="button" @click="switchToSms">
        验证码登录
      </button>
    </section>
  </main>
</template>

<style lang="scss" scoped>
.login_page {
  min-height: 100svh;
  padding: calc(18px + env(safe-area-inset-top)) 24px calc(32px + env(safe-area-inset-bottom));
  color: #171717;
  background: #fff;
}

.login_topbar {
  display: flex;
  align-items: center;
  min-height: 46px;
}

.close_button {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  color: #1d1d1d;
  background: #f6f7f8;
  border-radius: 50%;

  span {
    margin-top: -4px;
    font-size: 34px;
    font-weight: 300;
    line-height: 1;
  }
}

.login_content {
  width: min(100%, 720px);
  margin: 76px auto 0;
}

.login_title {
  margin: 0 8px 50px;
  font-size: clamp(28px, 8vw, 42px);
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: 0;
}

.phone_field {
  display: flex;
  align-items: center;
  min-height: 62px;
  padding: 0 22px;
  background: #f7f7f7;
  border-radius: 32px;
}

.country_code {
  display: inline-flex;
  flex: 0 0 auto;
  gap: 12px;
  align-items: center;
  min-width: 88px;
  padding: 0;
  font-size: 22px;
  font-weight: 600;
  color: #242424;
  background: transparent;
}

.country_arrow {
  width: 0;
  height: 0;
  border-top: 7px solid currentcolor;
  border-right: 5px solid transparent;
  border-left: 5px solid transparent;
}

.phone_input {
  flex: 1;
  min-width: 0;
  height: 56px;
  font-size: 21px;
  font-weight: 600;
  color: #222;
  letter-spacing: 1px;
  background: transparent;

  &::placeholder {
    font-weight: 500;
    color: #c9c9c9;
  }
}

.clear_phone {
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  width: 24px;
  height: 24px;
  margin-left: 8px;
  color: #fff;
  background: #d0d0d0;
  border-radius: 50%;

  span {
    margin-top: -2px;
    font-size: 17px;
    font-weight: 300;
    line-height: 1;
  }
}

.login_hint {
  margin: 18px 22px 0;
  font-size: 16px;
  line-height: 1.4;
  color: #999;
}

.password_field {
  display: flex;
  align-items: center;
  min-height: 62px;
  padding: 0 22px;
  margin-top: 16px;
  background: #f7f7f7;
  border-radius: 32px;
}

.password_input {
  flex: 1;
  min-width: 0;
  height: 56px;
  font-size: 21px;
  font-weight: 500;
  color: #222;
  background: transparent;

  &::placeholder {
    font-weight: 500;
    color: #c9c9c9;
  }
}

.password_visibility {
  position: relative;
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  width: 30px;
  height: 30px;
  margin-left: 8px;
  background: transparent;

  span {
    position: relative;
    display: block;
    width: 23px;
    height: 13px;
    border: 2px solid #222;
    border-radius: 50% / 65%;
    transform: rotate(-8deg);

    &::after {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 6px;
      height: 6px;
      content: '';
      background: #222;
      border-radius: 50%;
      transform: translate(-50%, -50%);
    }
  }

  &[aria-pressed='true'] span::before {
    position: absolute;
    top: 50%;
    left: -3px;
    width: 29px;
    height: 2px;
    content: '';
    background: #222;
    transform: rotate(35deg);
  }
}

.agreement_row {
  display: flex;
  gap: 9px;
  align-items: flex-start;
  margin: 94px 8px 16px;
  font-size: 16px;
  line-height: 1.45;
  color: #444;
  cursor: pointer;

  input {
    position: absolute;
    width: 1px;
    height: 1px;
    opacity: 0;
  }

  input:focus-visible + .agreement_mark {
    outline: 2px solid #1686dc;
    outline-offset: 2px;
  }

  input:checked + .agreement_mark {
    color: #171717;
    background: #ffdb00;
    border-color: #ffdb00;
  }
}

.password_field + .agreement_row {
  margin-top: 74px;
}

.agreement_mark {
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  width: 18px;
  height: 18px;
  margin-top: 2px;
  font-size: 13px;
  font-weight: 700;
  line-height: 1;
  color: transparent;
  background: #fff;
  border: 1px solid #c9c9c9;
  border-radius: 50%;
}

.agreement_text {
  min-width: 0;
}

.agreement_link {
  color: #1686dc;
}

.login_submit {
  display: block;
  width: 100%;
  min-height: 62px;
  font-size: 21px;
  font-weight: 700;
  color: #171717;
  background: #ffdc00;
  border-radius: 32px;

  &:disabled {
    color: #c5b975;
    background: #fff3b2;
  }
}

.password_login {
  display: block;
  padding: 0;
  margin: 23px auto 0;
  font-size: 17px;
  color: #555;
  background: transparent;
}

@media (width <= 360px) {
  .login_page {
    padding-right: 18px;
    padding-left: 18px;
  }

  .phone_field {
    padding-right: 18px;
    padding-left: 18px;
  }

  .country_code {
    min-width: 78px;
    font-size: 20px;
  }

  .phone_input {
    font-size: 19px;
  }

  .agreement_row {
    margin-top: 72px;
    font-size: 14px;
  }

  .password_field + .agreement_row {
    margin-top: 58px;
  }
}
</style>
