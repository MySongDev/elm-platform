<script setup>
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useRouter } from 'vue-router'

import { confirm } from '@/components/common/ConfirmDialog'
import { signout } from '@/services/api'
import { useUserStore } from '@/stores/modules/store-user'

import AvatarUploader from './components/AvatarUploader.vue'
import SettingItem from './components/SettingItem.vue'

defineOptions({
  name: 'Info',
})

const router = useRouter()
const userStore = useUserStore()
const { userId, userAvatar, userName } = storeToRefs(userStore)

const settingGroups = computed(() => [
  {
    title: null,
    items: [
      { label: '用户名', to: { name: 'SetUserName' }, value: userName.value },
    ],
  },
  {
    title: '账号绑定',
    items: [
      { label: '手机', icon: 'mobile', iconColor: 'blue' },
    ],
  },
  {
    title: '安全设置',
    items: [
      { label: '登录密码', to: '/forget', value: '修改' },
    ],
  },
])

async function handleLogout() {
  const confirmed = await confirm({
    title: '是否退出登录',
    confirmText: '退出登录',
    cancelText: '再等等',
  })
  if (!confirmed)
    return

  try {
    await signout()
  }
  catch {
    // 即使服务端失败，本地也应登出
  }
  finally {
    userStore.logout()
    router.replace('/profile')
  }
}
</script>

<template>
  <div class="info-page">
    <!-- 头像上传 -->
    <div class="settings-section">
      <AvatarUploader :avatar="userAvatar" :user-id="userId" />

      <!-- 基本信息 -->
      <SettingItem v-for="item in settingGroups[0].items" :key="item.label" v-bind="item" />
    </div>

    <!-- 动态分组 -->
    <template v-for="group in settingGroups.slice(1)" :key="group.title">
      <div class="section-title">
        {{ group.title }}
      </div>
      <div class="settings-section">
        <SettingItem v-for="item in group.items" :key="item.label" v-bind="item" />
      </div>
    </template>

    <!-- 退出登录 -->
    <button class="logout-btn" @click="handleLogout">
      退出登录
    </button>
  </div>
</template>

<style lang="scss" scoped>
.info-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.settings-section {
  margin-top: 10px;
}

.section-title {
  padding: 10px 12px 4px;
  font-size: 12px;
  color: #666;
}

.logout-btn {
  display: block;
  width: 92%;
  margin: 30px auto 0;
  padding: 10px 0;
  border: none;
  border-radius: 6px;
  text-align: center;
  background: #d8584a;
  font-size: 14px;
  color: #fff;
  cursor: pointer;

  &:active {
    opacity: 0.85;
  }
}
</style>
