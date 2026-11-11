<script setup>
/**
 * ⚠️ 与 apps/web-user/src/views/profile/info/info.vue 同源改造（账户信息页）。
 * 整体替换占位页（Batch 3 profile 组，方案排期 4 天的一部分）。
 *
 * 差异：
 * 1. `router.replace('/profile')` → `navigateTo(ROUTES.PROFILE, { replace: true })`
 *    （profile 是 tabBar 页，navigateTo 内部会自动改走 switchTab）
 * 2. `confirm`（web-user 命令式挂载 DOM 的 ConfirmDialog）→ platform/feedback 的
 *    showConfirm（uni.showModal 封装，Promise<boolean> 语义一致）
 * 3. `router-link`（SettingItem 的 to 属性）→ view + @click + navigateTo（见 SettingItem）
 * 4. `AvatarUploader` 用 uni.chooseImage + uni.uploadFile 实现（见该组件头部说明）
 * 5. 「修改密码」入口 `to: '/forget'` → ROUTES.FORGET（`/forget` 是主包路径，
 *    这里换成 uni-user 的分包路径常量）
 * 6. min-height:100vh / 100% 保留（uni-app 会编译成对应值，无需改）
 */
import { onShow } from '@dcloudio/uni-app'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'

import { ROUTES } from '@/config/routes'
import { showConfirm } from '@/platform/feedback'
import { navigateTo } from '@/platform/navigation'
import { signout } from '@/services/api'
import { useUserStore } from '@/stores/modules/store-user'

import AvatarUploader from './components/AvatarUploader.vue'
import SettingItem from './components/SettingItem.vue'

const userStore = useUserStore()
// 直接解构 store 会留下旧头像快照；上传更新 store 后，这里必须继续跟随它变化。
const { userName, userAvatar } = storeToRefs(userStore)

onShow(() => {
  // 支持资料尚未载入时直接进入本页；请求频率仍由 store 的缓存有效期控制。
  void userStore.getUserInfo()
})

const settingGroups = computed(() => [
  {
    title: null,
    items: [
      {
        label: '用户名',
        to: ROUTES.SET_USERNAME,
        value: userName.value,
      },
    ],
  },
  {
    title: '账号绑定',
    items: [
      {
        label: '手机',
        icon: 'mobile',
        iconColor: 'blue',
      },
    ],
  },
  {
    title: '安全设置',
    items: [
      {
        label: '登录密码',
        to: ROUTES.FORGET,
        value: '修改',
      },
    ],
  },
])

async function handleLogout() {
  const confirmed = await showConfirm({
    title: '是否退出登录',
    content: '确认要退出当前账号吗？',
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
    navigateTo(ROUTES.PROFILE, { replace: true })
  }
}
</script>

<template>
  <view class="info-page">
    <!-- 头像上传 -->
    <view class="settings-section">
      <AvatarUploader :avatar="userAvatar" />

      <!-- 基本信息 -->
      <SettingItem
        v-for="item in settingGroups[0].items"
        :key="item.label"
        v-bind="item"
      />
    </view>

    <!-- 动态分组 -->
    <template v-for="group in settingGroups.slice(1)" :key="group.title">
      <view class="section-title">
        {{ group.title }}
      </view>
      <view class="settings-section">
        <SettingItem
          v-for="item in group.items"
          :key="item.label"
          v-bind="item"
        />
      </view>
    </template>

    <!-- 退出登录 -->
    <view class="logout-btn" @click="handleLogout">
      退出登录
    </view>
  </view>
</template>

<style lang="scss" scoped>
.info-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.settings-section {
  margin-top: 20rpx;
}

.section-title {
  padding: 20rpx 24rpx 8rpx;
  font-size: 24rpx;
  color: #666;
}

.logout-btn {
  display: block;
  width: 92%;
  padding: 20rpx 0;
  margin: 60rpx auto 0;
  font-size: 28rpx;
  color: #fff;
  text-align: center;
  background: #d8584a;
  border-radius: 12rpx;

  &:active {
    opacity: 0.85;
  }
}
</style>
