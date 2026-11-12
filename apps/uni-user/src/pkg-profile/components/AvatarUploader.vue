<script setup>
import { computed, ref, watch } from 'vue'

import { showAlert, showToast } from '@/platform/feedback'
import { getUploadUrl } from '@/platform/image'
import { uploadUserAvatar } from '@/services/api/api-user'
import { useUserStore } from '@/stores/modules/store-user'

const props = defineProps({
  avatar: String,
})

const userStore = useUserStore()
// 从打开相册到上传结束都锁住；否则快速点击会打开多个选图流程，后返回的上传覆盖先前头像。
const isBusy = ref(false)
const imageFailed = ref(false)
const avatarUrl = computed(() => getUploadUrl(props.avatar))
const MAX_SIZE = 2 * 1024 * 1024

watch(avatarUrl, () => {
  // 旧文件失效不代表新头像也失效；上传返回新路径后允许重新加载图片。
  imageFailed.value = false
})

/** 组件只负责选图和展示；接口地址、鉴权和上传失败提示都交给 HTTP 链路。 */
async function handleUpload() {
  if (isBusy.value)
    return

  isBusy.value = true
  try {
    let chosen
    try {
      chosen = await new Promise((resolve, reject) => {
        uni.chooseImage({
          count: 1,
          sizeType: ['compressed'],
          sourceType: ['album', 'camera'],
          success: resolve,
          fail: reject,
        })
      })
    }
    catch (error) {
      // 取消相册不算失败；权限或选图异常不能再静默吞掉，否则看起来像点击没反应。
      if (!/cancel/i.test(error?.errMsg || '')) {
        console.error('选择头像失败:', error)
        await showAlert({ content: '无法选择图片，请检查相册或相机权限后重试' })
      }
      return
    }

    // H5 的 tempFiles 可能是 File，没有 path；上传路径应从跨端的 tempFilePaths 读取。
    const filePath = Array.isArray(chosen.tempFilePaths) ? chosen.tempFilePaths[0] : chosen.tempFilePaths
    const file = Array.isArray(chosen.tempFiles) ? chosen.tempFiles[0] : chosen.tempFiles
    if (!filePath) {
      await showAlert({ content: '未获取到图片，请重新选择' })
      return
    }
    if (file?.size > MAX_SIZE) {
      await showAlert({ content: '图片大小不能超过 2MB' })
      return
    }

    try {
      const avatar = await uploadUserAvatar(filePath)
      if (!avatar) {
        await showAlert({ content: '上传响应缺少头像地址，请重试' })
        return
      }
      userStore.updateAvatar(avatar)
      showToast('头像已更新')
    }
    catch {
      // HTTP 层已经提示具体原因并处理 401；这里不再弹“上传失败”盖掉它，也不改旧头像。
    }
  }
  finally {
    isBusy.value = false
  }
}
</script>

<template>
  <view class="avatar-uploader" @tap="handleUpload">
    <text class="avatar-uploader_label">
      头像
    </text>
    <view class="avatar-uploader_right">
      <image
        v-if="avatarUrl && !imageFailed"
        :src="avatarUrl"
        mode="aspectFill"
        class="avatar-uploader_img"
        @error="imageFailed = true"
      />
      <view v-else class="avatar-uploader_img avatar-uploader_img--default">
        <SvgIcon icon-name="avatar-default" class="avatar-uploader_default-icon" />
      </view>
      <SvgIcon
        icon-name="arrow-right"
        class="avatar-uploader_arrow"
        color="#d8d8d8"
      />
    </view>
  </view>
</template>

<style lang="scss" scoped>
.avatar-uploader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx;
  background: #fff;
  border-bottom: 2rpx solid $e4;

  &_label {
    font-size: 28rpx;
    color: #333;
  }

  &_right {
    display: flex;
    align-items: center;
  }

  &_img {
    width: 92rpx;
    height: 92rpx;
    margin-right: 16rpx;
    vertical-align: bottom;
    border-radius: 50%;

    &--default {
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f5f5f5;
    }
  }

  &_default-icon {
    font-size: 72rpx;
    color: #999;
  }

  &_arrow {
    font-size: 32rpx;
  }
}
</style>
