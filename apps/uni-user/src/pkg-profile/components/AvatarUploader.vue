<script setup>
/**
 * ⚠️ 与 apps/web-user/src/views/profile/info/components/AvatarUploader.vue 同源改造。
 *
 * 差异：
 * 1. `<input type="file">` → 小程序没有 DOM 文件选择器，改用
 *    `uni.chooseImage({ sourceType: ['album', 'camera'] })` + `uni.uploadFile`
 * 2. `uploadUserAvatar(file)`（web-user 的 FormData + axios）→ `uni.uploadFile`
 *    （uni-user 侧 api-user.js 刻意未搬 uploadUserAvatar，注释里已预留此处为接缝，
 *    见该文件头部说明）。上传端点/鉴权头与后端约定一致（见 uploadAvatar 实现）
 * 3. 文件大小/类型限制保留（web-user 原文 2MB，小程序端 chooseImage 的压缩产物
 *    通常也远低于此，限制逻辑照抄）
 * 4. showAlert 走 platform/feedback（uni.showModal 封装，与 web-user 的 DOM 挂载
 *    AlterTip 等价）
 * 5. 头像展示仍走 getUploadUrl（platform/image 的 URL 收口层，含图片代理前缀）
 */
import { ref } from 'vue'

import { getUploadUrl } from '@/config'
import { showAlert } from '@/platform/feedback'
import { useUserStore } from '@/stores/modules/store-user'

defineProps({
  avatar: String,
})

const userStore = useUserStore()
const isUploading = ref(false)

const MAX_SIZE = 2 * 1024 * 1024

async function handleUpload() {
  // 选图：相册或拍照（小程序端没有文件选择器，chooseImage 是标准入口）
  const chosen = await new Promise((resolve, reject) => {
    uni.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: res => resolve(res.tempFiles?.[0]),
      fail: reject,
    })
  }).catch(() => undefined)

  if (!chosen)
    return

  const { path: filePath, size: fileSize } = chosen
  if (fileSize && fileSize > MAX_SIZE) {
    showAlert('图片大小不能超过 2MB')
    return
  }

  isUploading.value = true
  try {
    const avatar = await uploadAvatar(filePath)
    if (avatar)
      userStore.updateAvatar(avatar)
  }
  catch {
    showAlert('上传失败，请重试')
  }
  finally {
    isUploading.value = false
  }
}

/**
 * 上传头像。端点与鉴权头对齐后端 `customer-auth` 的用户资料上传契约
 * （与 web-user 的 `uploadUserAvatar` 走同一个后端接口，只是传输层换成
 * uni.uploadFile —— axios 的 FormData 在小程序端没有等价物）。
 *
 * @returns 后端返回的头像路径（`data.avatar`），空路径表示上传失败
 */
async function uploadAvatar(filePath) {
  const { getAccessToken } = await import('@/services/http/auth-storage')
  const token = getAccessToken()

  const res = await new Promise((resolve, reject) => {
    uni.uploadFile({
      url: '/api/customer/avatar',
      filePath,
      name: 'file',
      header: token ? { Authorization: `Bearer ${token}` } : {},
      success: r => resolve(JSON.parse(r.data || '{}')),
      fail: reject,
    })
  }).catch(() => undefined)

  return res?.data?.avatar ?? res?.avatar ?? ''
}
</script>

<template>
  <view class="avatar-uploader" @click="handleUpload">
    <text class="avatar-uploader_label">
      头像
    </text>
    <view class="avatar-uploader_right">
      <image
        v-if="avatar"
        :src="getUploadUrl(avatar)"
        mode="aspectFill"
        class="avatar-uploader_img"
      />
      <view v-else class="avatar-uploader_img avatar-uploader_img--default">
        <SvgIcon icon-name="avatar-default" />
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
    }
  }

  /* ⚠️ 标签级 class + font-size（007 坑 17-20），原 wh(16px,16px) → 32rpx */
  .avatar-uploader_arrow {
    font-size: 32rpx;
  }
}
</style>
