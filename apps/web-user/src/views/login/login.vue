<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { showAlert } from '@/components/common/AlterTip/index'
import { accountLogin, getCaptchas } from '@/services/api/'
import { useUserStore } from '@/stores/modules/store-user'

defineOptions({
  name: 'Login',
})
const { recordUserInfo } = useUserStore()
const router = useRouter()
const route = useRoute()

const showPassword = ref(false)
// 用户名
const userAccount = ref('')
// 密码
const passWord = ref('')
// 验证码
const codeNumber = ref('')
// 图片验证码
const captchaCodeImg = ref('')

const userInfo = ref({})
// 更改密码状态
function changePassWordType() {
  showPassword.value = !showPassword.value
}

// 获取图片验证码
async function getCaptchaCode() {
  try {
    captchaCodeImg.value = await getCaptchas()
  }
  catch (error) {
    if (!error?.code && !error?.response)
      showAlert(error?.message || '验证码获取失败，请稍后重试')
  }
}
// 登录
async function mobileLogin() {
  if (!userAccount.value.trim()) {
    showAlert('请输入手机号/邮箱/用户名')
    return
  }
  if (!passWord.value.trim()) {
    showAlert('密码不能为空')
    return
  }

  if (!codeNumber.value) {
    showAlert('请输入验证码')
    return
  }

  try {
    userInfo.value = await accountLogin(userAccount.value, passWord.value, codeNumber.value)
  }
  catch (error) {
    if (error?.isBusinessError) {
      codeNumber.value = ''
      getCaptchaCode()
    }
    return
  }

  console.log(userInfo.value)
  // 记录用户信息
  recordUserInfo(userInfo.value)
  router.push(route.query.redirect || '/home')
}

// 初始验证码
getCaptchaCode()
</script>

<template>
  <div class="login_nav">
    <head-top />
    <form class="login_form">
      <section class="input_container">
        <input id="username" v-model.lazy="userAccount" type="text" placeholder="账号" maxlength="11">
      </section>

      <section class="input_container">
        <input id="password" v-model="passWord" :type="showPassword ? 'text' : 'password'" placeholder="请输入密码">
        <!-- <input type="text" v-show="true" placeholder="密码" /> -->
        <div class="button_switch" :class="{ change_to_text: showPassword }">
          <div class="circle_button" :class="{ change_to_right: showPassword }" @click="changePassWordType" />
          <span>abc</span>
          <span>.....</span>
        </div>
      </section>
      <section class="input_container captcha_code_container">
        <input v-model="codeNumber" type="text" placeholder="验证码" maxlength="4">
        <div class="img_change_img">
          <!-- <img src="@/components/icons/loading.gif" class="loding" v-if="showLoading" /> -->
          <img v-show="captchaCodeImg" :src="captchaCodeImg">
          <div class="change_img" @click="getCaptchaCode">
            <p>看不清</p>
            <p>换一张</p>
          </div>
        </div>
      </section>
    </form>

    <div class="login_container" @click="mobileLogin">
      登录
    </div>
    <router-link to="/forget" class="to_forget">
      重置密码？
    </router-link>
    <!-- <alert-tip :alert-text="alertText" @close-alert="closeAlert"></alert-tip> -->
  </div>
</template>

<style lang="scss" scoped>
.login_form {
  width: 100%;
  background-color: $ff;

  .input_container {
    @include wh(100%, 13.3333vw);
    @include flex-center(space-between);

    padding: 0 4vw;
    border-bottom: 0.0267vw solid $e4;

    input {
      width: 75%;
      @include size-color(4.3733vw, #666);
    }
  }

  .captcha_code_container {
    .img_change_img {
      @include flex-center();

      .loding {
        @include wh(8vw, 8vw);
        margin-right: 4.5vw;
      }

      img {
        @include wh(14.9333vw, 9.3333vw);
        margin-right: 1.6vw;
      }

      .change_img {
        @include flex-center();
        flex-direction: column;
        flex-wrap: wrap;
        width: 10.6667vw;

        p {
          @include size-color(3.2vw, #666);
        }

        p:nth-of-type(2) {
          color: #3b95e9;
          margin-top: 0.8533vw;
        }
      }
    }
  }
}

.button_switch {
  @include wh(12.8vw, 4.3733vw);

  background-color: $e4;
  border-radius: 3.12vw;
  @include flex-center();
  position: relative;
  margin-top: 1vw;
  transition: background-color 0.75s ease; // 关键：添加背景色过渡

  .circle_button {
    @include wh(7.5vw, 7.5vw);
    position: absolute;
    border-radius: 50%;
    background-color: #f1f1f1;
    transition: transform 0.5s ease;
    transform: translateX(-2.6667vw);
  }

  .change_to_right {
    transform: translateX(4.5333vw);
  }
}

.change_to_text {
  background-color: #4cd964;
}

.login_container {
  @include wh(95%, 13.3333vw);
  margin: 2.6667vw 2.6667vw;
  color: $ff;
  background-color: #4cd964;
  border-radius: 2.6667vw;
  line-height: 13.3333vw;
  text-align: center;
}

.to_forget {
  display: block;
  width: 100%;
  color: $blue;
  padding-left: 75%;
}
</style>
