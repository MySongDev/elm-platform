<script setup>
import { computed, ref, watch } from 'vue'

import { ROUTES } from '@/config/routes'
import { showToast } from '@/platform/feedback'
import { navigateBack, navigateTo } from '@/platform/navigation'
import { updateCustomerNickname } from '@/services/api'
import { useUserStore } from '@/stores/modules/store-user'

const userStore = useUserStore()
const username = ref(userStore.userInfo.nickname || '')
const hasInput = ref(false)
const isSubmitting = ref(false)

const isValid = computed(() => {
  // 与后端 Length 的字符计数对齐，避免一个 emoji 在页面被当成两个字符。
  const len = Array.from(username.value.trim()).length
  return len >= 2 && len <= 24
})

const showError = computed(() => hasInput.value && !isValid.value)

watch(username, () => {
  hasInput.value = true
})

/** 保存成功才回写完整资料；只调用本地 updateUserName 会在重新拉资料后恢复旧名。 */
async function saveUsername() {
  if (!isValid.value || isSubmitting.value)
    return

  isSubmitting.value = true
  try {
    const profile = await updateCustomerNickname(username.value.trim())
    userStore.recordUserInfo(profile)
    showToast('用户名修改成功')
    if (getCurrentPages().length > 1)
      navigateBack()
    else
      navigateTo(ROUTES.INFO, { replace: true })
  }
  catch {
    // HTTP 层已统一提示错误；保留输入和原资料，方便用户重试。
  }
  finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <view>
    <view class="setname">
      <view class="setname-top">
        <input v-model="username" type="text" placeholder="输入用户名" :disabled="isSubmitting" :class="{ 'setname-input': showError }">

        <view>
          <text v-if="!hasInput" class="setname-hint">
            用户名长度为 2～24 个字符，可多次修改
          </text>
          <text v-else class="setname-hint" :class="{ unlikep: showError }">
            用户名长度须在 2～24 个字符之间
          </text>
        </view>
      </view>

      <view class="reset">
        <view class="reset-btn" :class="{ fontopacity: !isValid || isSubmitting }" @click="saveUsername">
          {{ isSubmitting ? '保存中...' : '确认修改' }}
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
