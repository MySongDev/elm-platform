<script setup>
/**
 * ⚠️ 与 apps/web-user/src/views/profile/info/setusername.vue 同源改造。
 * 整体替换占位页（Batch 3 profile 组）。
 *
 * 差异：
 * 1. `<button>` → `<view @click>`（小程序 button 自带原生样式，与 web 端
 *    `background: none` 的用法冲突；用 view 更贴合原文的「纯文字按钮」意图）
 * 2. `disabled` 属性小程序端 button 有原生渲染但 view 没有 —— 用
 *    `:class="{ fontopacity: !isValid }"` + `@click` 内部判 `isValid` 双重把关
 * 3. `$blue` / `$ff` SCSS 变量已随 vite 全局注入（见 vite.config.ts additionalData），
 *    直接可用，不需要额外 import
 * 4. px → rpx
 */
import { computed, ref, watch } from 'vue'

import { useUserStore } from '@/stores/modules/store-user'

const { updateUserName } = useUserStore()
const username = ref('')
const hasInput = ref(false)

// 是否合法
const isValid = computed(() => {
  const len = username.value.trim().length
  return len >= 2 && len <= 24
})

// 是否显示错误
const showError = computed(() => {
  return hasInput.value && !isValid.value
})

// 监听输入（只做状态标记）
watch(username, () => {
  hasInput.value = true
})

function resetName() {
  if (!isValid.value)
    return

  updateUserName(username.value)
}
</script>

<template>
  <view>
    <view class="setname">
      <view class="setname-top">
        <input v-model="username" type="text" placeholder="输入用户名" :class="{ 'setname-input': showError }">

        <view>
          <text v-if="!hasInput" class="setname-hint">
            用户名只能修改一次（2-24字符之间）
          </text>
          <text v-else class="setname-hint" :class="{ unlikep: showError }">
            用户名长度在2到24位之间
          </text>
        </view>
      </view>

      <view class="reset">
        <view class="reset-btn" :class="{ fontopacity: !isValid }" @click="resetName">
          确认修改
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.setname {
  padding: 0 30rpx;
}

.setname-top {
  input {
    box-sizing: border-box;
    display: block;
    width: 100%;
    height: 80rpx;
    padding: 9rpx 4.5rpx;
    margin: 20rpx auto;
    font-size: 32rpx;
    background: transparent;
    border: 2rpx solid #ddd;

    &::placeholder {
      font-size: 32rpx;
    }
  }

  .setname-input {
    border: 2rpx solid red;
  }

  .setname-hint {
    font-size: 28rpx;
  }

  .unlikep {
    color: red;
  }
}

.reset {
  width: 100%;
  margin-top: 30rpx;
  line-height: 94rpx;
  text-align: center;
  background: $blue;
}

.reset-btn {
  font-size: 33rpx;
  color: $ff;
}

.fontopacity {
  opacity: 0.7;
}
</style>
