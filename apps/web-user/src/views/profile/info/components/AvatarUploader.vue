<script setup>
import { ref } from 'vue'

import { showAlert } from '@/components/common/AlterTip'
import { IMAGE_BASE_URL } from '@/config'
import { uploadUserAvatar } from '@/services/api'
import { useUserStore } from '@/stores/modules/store-user'

const props = defineProps({
  avatar: String,
  userId: String,
})

const userStore = useUserStore()
const fileInputRef = ref(null)
const isUploading = ref(false)

const MAX_SIZE = 2 * 1024 * 1024

function triggerUpload() {
  fileInputRef.value?.click()
}

async function handleFileChange(event) {
  const file = event.target.files?.[0]
  if (!file)
    return

  if (!file.type.startsWith('image/')) {
    showAlert('请上传图片文件')
    return
  }
  if (file.size > MAX_SIZE) {
    showAlert('图片大小不能超过 2MB')
    return
  }
  if (!props.userId)
    return

  isUploading.value = true
  try {
    const res = await uploadUserAvatar(props.userId, file)
    if (res.status === 1) {
      userStore.updateAvatar(res.image_path)
    }
  }
  catch {
    showAlert('上传失败，请重试')
  }
  finally {
    isUploading.value = false
    event.target.value = ''
  }
}
</script>

<template>
  <div class="avatar-uploader" @click="triggerUpload">
    <input ref="fileInputRef" type="file" accept="image/*" class="avatar-uploader_input" @change="handleFileChange">
    <span class="avatar-uploader_label">头像</span>
    <div class="avatar-uploader_right">
      <img v-if="avatar" :src="IMAGE_BASE_URL + avatar" class="avatar-uploader_img">
      <span v-else class="avatar-uploader_img avatar-uploader_img--default">
        <SvgIcon icon-name="avatar-default" />
      </span>
      <SvgIcon icon-name="arrow-right" icon-class="avatar-uploader_arrow" color="#d8d8d8" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.avatar-uploader {
  position: relative;
  padding: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  border-bottom: 1px solid $e4;

  &_input {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
  }

  &_label {
    font-size: 14px;
    color: #333;
  }

  &_right {
    display: flex;
    align-items: center;
  }

  &_img {
    @include wh(46px, 46px);
    border-radius: 50%;
    margin-right: 8px;
    vertical-align: bottom;
    object-fit: cover;

    &--default {
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  &_arrow {
    @include wh(16px, 16px);
  }
}
</style>
