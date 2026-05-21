<script setup>
import { computed, nextTick, onMounted, reactive, shallowRef } from 'vue'

import { showAlert } from '@/components/common/AlterTip/index'
import { changePassword, getCaptchas } from '@/services/api/index'
import FormItem from './components/FormItem.vue'

defineOptions({
  name: 'Forget',
})

const form = reactive({
  username: '',
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
  captchaCode: '',
})
const captchaImage = shallowRef('')
const submitting = shallowRef(false)

const formFields = [
  {
    key: 'username',
    label: '账号',
    placeholder: '请输入账号',
    name: 'username',
    maxlength: 11,
    autocomplete: 'on',
  },
  {
    key: 'oldPassword',
    label: '旧密码',
    placeholder: '请输入旧密码',
    name: 'oldpass',
    type: 'password',
    maxlength: 20,
  },
  {
    key: 'newPassword',
    label: '新密码',
    placeholder: '请输入新密码',
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

const validateRules = [
  {
    check: () => !!form.username.trim(),
    message: '请输入正确的账号',
    selector: 'input[name="username"]',
  },
  { check: () => !!form.oldPassword, message: '请输入旧密码', selector: 'input[name="oldpass"]' },
  { check: () => !!form.newPassword, message: '请输入新密码', selector: 'input[name="newpass"]' },
  { check: () => !!form.confirmPassword, message: '请输入确认密码', selector: 'input[name="enterpass"]' },
  {
    check: () => form.newPassword === form.confirmPassword,
    message: '两次输入的密码不一致',
    selector: 'input[name="enterpass"]',
  },
  { check: () => form.captchaCode.length === 4, message: '请输入验证码', selector: 'input[name="captcha_code"]' },
]

const isSubmitDisabled = computed(() => {
  return submitting.value || !validateRules.every(rule => rule.check())
})

function validate() {
  for (const rule of validateRules) {
    if (!rule.check()) {
      showAlert(rule.message)

      nextTick(() => {
        const el = document.querySelector(rule.selector)
        el?.focus()
      })

      return false
    }
  }
  return true
}

function onInput(e) {
  let value = e.target.value.replace(/\D/g, '')

  if (value.length > 4)
    value = value.slice(0, 4)

  form.captchaCode = value
  e.target.value = value

  if (value.length === 4)
    e.target.blur()
}

async function getCode() {
  try {
    captchaImage.value = await getCaptchas()
  }
  catch (error) {
    if (!error?.code && !error?.response)
      showAlert(error?.message || '验证码获取失败，请稍后重试')
  }
}

function resetForm() {
  form.username = ''
  form.oldPassword = ''
  form.newPassword = ''
  form.confirmPassword = ''
  form.captchaCode = ''
}

async function sendResetInfo() {
  if (!validate())
    return

  submitting.value = true
  try {
    await changePassword(
      form.username.trim(),
      form.oldPassword,
      form.newPassword,
      form.confirmPassword,
      form.captchaCode,
    )

    showAlert('密码修改成功')
    resetForm()
  }
  catch (error) {
    if (error?.isBusinessError) {
      form.captchaCode = ''
      getCode()
    }
  }
  finally {
    submitting.value = false
  }
}

onMounted(getCode)
</script>

<template>
  <div class="forget-content">
    <head-top />
    <form class="reset-form" @submit.prevent="sendResetInfo">
      <FormItem v-for="field in formFields" :key="field.key" v-model="form[field.key]" :label="field.label"
        :placeholder="field.placeholder" :name="field.name" :type="field.type" :maxlength="field.maxlength"
        :autocomplete="field.autocomplete" />
      <FormItem :model-value="form.captchaCode" label="验证码" placeholder="验证码" name="captcha_code" maxlength="4"
        inputmode="numeric" pattern="[0-9]*" class="code-number" @input="onInput">
        <img v-show="captchaImage" :src="captchaImage" class="captcha-image" alt="验证码">
        <div class="line" />
        <button class="next" type="button" @click="getCode">
          换一张
        </button>
      </FormItem>
      <button class="submit" :class="{ disabled: isSubmitDisabled }" :disabled="isSubmitDisabled" type="submit">
        {{ submitting ? '提交中...' : '确认修改' }}
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
  border: 0;
  background: #f69;
  color: $ff;
  text-align: center;
  line-height: 42px;
  border-radius: 22px;
  font-size: 16px;

  &.disabled {
    opacity: 0.55;
  }
}

.code-number {
  .captcha-image {
    width: 50px;
    height: 35px;
    flex-shrink: 0;
  }

  .line {
    width: 1px;
    height: 30px;
    margin: 0 4px;
    flex-shrink: 0;
    background-color: #e3e5e7;
  }

  .next {
    border: 0;
    background: transparent;
    white-space: nowrap;
    font-size: 14px;
    color: #ff6699;
  }
}
</style>
