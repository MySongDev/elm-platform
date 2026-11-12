<script setup>
/**
 * ⚠️ 与 apps/web-user/src/views/login/login.vue 同源改造（登录页）。
 * 整体替换占位页（Batch 3 留桩，2 天）。
 *
 * 差异：
 * 1. vue-router（`useRoute`/`useRouter`）→ 小程序端：
 *    - `route.query.redirect` 由本被跳来时的 `onLoad(options).redirect` 传入
 *    - `router.push({name:'SmsVerification', query:{phone,redirect}})` →
 *      `navigateTo(withQuery(ROUTES.SMS_VERIFICATION, {phone, redirect}))`
 *    - `router.back()`（closeLogin）→ `navigateBack()`（platform/navigation，
 *      首页栈会降级 switchTab msite）
 * 2. `inputmode`/`autocomplete` 等 HTML 属性小程序 input 支持有限：
 *    - 手机号 `type="number"`（数字键盘）+ `maxlength`
 *    - 密码 `password` prop + 切换显示用 `type` 切换（小程序 input 无 password 图标，
 *      用文字按钮「显示/隐藏」降级）
 *    - 用户协议 `checkbox` 用原生 view + 状态切换（无 `:checked` 事件，用 @tap 翻转）
 * 3. `useLoginSuccess` 已改写为接受 `redirect` 参数（见该文件差异说明）
 * 4. px/clamp/svH/media query → rpx（小程序无 clamp/media query，直接按 375 基准取值）
 * 5. 顶部「×」关闭按钮：web-user 是跳走，小程序端用 `navigateBack()` 等价
 */
import { onLoad } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'

import { normalizeRedirectTarget, withQuery } from '@/config/routes'
import { navigateBack, navigateTo, ROUTES } from '@/platform/navigation'

import { customerPasswordLogin, sendCustomerSms } from '@/services/api/api-login'
import { useLoginSuccess } from './useLoginSuccess'

// 登录入口带过来的回跳目标（redirectToLogin / navigateTo 时拼进 url）。
// 在 onLoad 就读成规范路径，后面转交短信页时 withQuery 不会对已编码串二次编码。
const redirect = ref('')
onLoad((options) => {
  redirect.value = normalizeRedirectTarget(options?.redirect)
})

const loginMode = ref('sms')
const phone = ref('')
const password = ref('')
const passwordVisible = ref(false)
const agreementAccepted = ref(false)
// ⚠️ redirect 是响应式的 ref，completeLogin 落地时读的是当时的值（onLoad 后已就绪）
const { completeLogin } = useLoginSuccess({ redirect: () => redirect.value })

// ⚠️ 小程序 input 的 @input 事件对象是 `e.detail.value`（与 web 的 `event.target.value` 不同）
function handlePhoneInput(e) {
  phone.value = String(e.detail.value).replace(/\D/g, '').slice(0, 11)
}

const formattedPhone = computed(() => {
  const digits = phone.value
  return [digits.slice(0, 3), digits.slice(3, 7), digits.slice(7, 11)].filter(Boolean).join(' ')
})
const isPhoneValid = computed(() => phone.value.length === 11 && /^1\d{10}$/.test(phone.value))
const canSubmit = computed(() =>
  isPhoneValid.value && agreementAccepted.value
  && (loginMode.value === 'sms' || password.value.length > 0),
)
const submitText = computed(() => (loginMode.value === 'sms' ? '获取短信验证码' : '登录'))

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

function toggleAgreement() {
  agreementAccepted.value = !agreementAccepted.value
}

async function handleSubmit() {
  if (!canSubmit.value)
    return

  if (loginMode.value === 'sms') {
    // 短信模式：发码后跳验证页，把回跳目标（redirect）随 url 带过去，
    // 真正登录落地在 SmsVerification 页完成
    await sendCustomerSms(phone.value, 'login')
    navigateTo(withQuery(ROUTES.SMS_VERIFICATION, {
      phone: phone.value,
      redirect: redirect.value || undefined,
    }))
    return
  }

  // 密码模式：登录成功直接落地 + 回跳
  const response = await customerPasswordLogin(phone.value, password.value)
  completeLogin(response)
}

function closeLogin() {
  navigateBack()
}
</script>

<template>
  <view class="login_page">
    <view class="login_topbar">
      <view class="close_button" @click="closeLogin">
        <text>×</text>
      </view>
    </view>

    <view class="login_content">
      <text class="login_title">
        欢迎登录
      </text>

      <view class="phone_field">
        <text class="country_code">
          +86
        </text>
        <input
          class="phone_input"
          type="number"
          :value="formattedPhone"
          :maxlength="13"
          placeholder="请输入手机号"
          @input="handlePhoneInput"
        >
        <view v-if="phone" class="clear_phone" @click="clearPhone">
          <text>×</text>
        </view>
      </view>

      <text v-if="loginMode === 'sms'" class="login_hint">
        未注册的手机号验证后自动创建账号
      </text>

      <view v-else class="password_field">
        <input
          v-model="password"
          class="password_input"
          :password="!passwordVisible"
          placeholder="请输入密码"
        >
        <view
          class="password_visibility"
          @click="togglePasswordVisibility"
        >
          <text>{{ passwordVisible ? '隐藏' : '显示' }}</text>
        </view>
      </view>

      <view class="agreement_row" @click="toggleAgreement">
        <view
          class="agreement_mark"
          :class="{ checked: agreementAccepted }"
        >
          <text v-if="agreementAccepted">
            ✓
          </text>
        </view>
        <view class="agreement_text">
          我已阅读并同意<text class="agreement_link">
            《用户协议》
          </text>和<text class="agreement_link">
            《隐私政策》
          </text>
        </view>
      </view>

      <view
        class="login_submit"
        :class="{ 'is-disabled': !canSubmit }"
        @click="handleSubmit"
      >
        {{ submitText }}
      </view>

      <view v-if="loginMode === 'sms'" class="password_login" @click="switchToPassword">
        密码登录
      </view>
      <view v-else class="password_login" @click="switchToSms">
        验证码登录
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.login_page {
  box-sizing: border-box;
  min-height: 100vh;
  padding: 36rpx 48rpx 64rpx;
  color: #171717;
  background: #fff;
}

.login_topbar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  min-height: 92rpx;
}

.close_button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 84rpx;
  height: 84rpx;
  font-size: 68rpx;
  font-weight: 300;
  line-height: 1;
  color: #1d1d1d;
  background: #f6f7f8;
  border-radius: 50%;
}

.login_content {
  width: 100%;
  margin: 152rpx auto 0;
}

.login_title {
  display: block;
  margin: 0 16rpx 100rpx;
  font-size: 84rpx;
  font-weight: 700;
  line-height: 1.2;
}

.phone_field {
  display: flex;
  align-items: center;
  min-height: 124rpx;
  padding: 0 44rpx;
  background: #f7f7f7;
  border-radius: 64rpx;
}

.country_code {
  flex: 0 0 auto;
  min-width: 176rpx;
  font-size: 44rpx;
  font-weight: 600;
  color: #242424;
}

.phone_input {
  flex: 1;
  min-width: 0;
  height: 112rpx;
  font-size: 42rpx;
  font-weight: 600;
  color: #222;
  letter-spacing: 2rpx;
  background: transparent;
}

.clear_phone {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48rpx;
  height: 48rpx;
  margin-left: 16rpx;
  font-size: 34rpx;
  color: #fff;
  background: #d0d0d0;
  border-radius: 50%;
}

.login_hint {
  display: block;
  margin: 36rpx 44rpx 0;
  font-size: 32rpx;
  line-height: 1.4;
  color: #999;
}

.password_field {
  display: flex;
  align-items: center;
  min-height: 124rpx;
  padding: 0 44rpx;
  margin-top: 32rpx;
  background: #f7f7f7;
  border-radius: 64rpx;
}

.password_input {
  flex: 1;
  min-width: 0;
  height: 112rpx;
  font-size: 42rpx;
  font-weight: 500;
  color: #222;
  background: transparent;
}

.password_visibility {
  flex: 0 0 auto;
  margin-left: 16rpx;
  font-size: 28rpx;
  color: #555;
}

.agreement_row {
  display: flex;
  gap: 18rpx;
  align-items: flex-start;
  margin: 188rpx 16rpx 32rpx;
  font-size: 32rpx;
  line-height: 1.45;
  color: #444;
}

.agreement_mark {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 36rpx;
  height: 36rpx;
  margin-top: 4rpx;
  font-size: 26rpx;
  font-weight: 700;
  color: transparent;
  background: #fff;
  border: 2rpx solid #c9c9c9;
  border-radius: 50%;

  &.checked {
    color: #171717;
    background: #ffdb00;
    border-color: #ffdb00;
  }
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
  min-height: 124rpx;
  font-size: 42rpx;
  font-weight: 700;
  line-height: 124rpx;
  color: #171717;
  text-align: center;
  background: #ffdc00;
  border-radius: 64rpx;

  &.is-disabled {
    color: #c5b975;
    background: #fff3b2;
  }
}

.password_login {
  display: block;
  padding: 0;
  margin: 46rpx auto 0;
  font-size: 34rpx;
  color: #555;
  text-align: center;
}
</style>
