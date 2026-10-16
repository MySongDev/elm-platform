<script setup>
/**
 * ⚠️ 与 apps/web-user/src/views/profile/profile.vue 同源改造（tabBar 页，navigationStyle: custom）。
 *
 * 差异：
 * 1. onMounted → onShow（tabBar 页二次进入只触发 onShow；资料需在每次进入时确认新鲜度）
 * 2. profileLink 换分包路径：`/profile/info` → ROUTES.INFO，`/login` → ROUTES.LOGIN
 * 3. **映射时带上 disabled**（D2 置灰）：web-user 的 infoItems/navGroups 映射漏了 disabled
 *    是因为它没有这个字段；uni-user 的 profileConfig 有，必须透传给子组件
 * 4. custom 导航页：本页在 pages.json 里是 navigationStyle: custom → 需要自己画头部。
 *    ⚠️ 但 web-user 的 profile 页头部来自 NavbarLayout 的自定义导航头（hideLayoutHeader），
 *    小程序端无 Layout → 本页用 ProfileCard 的蓝色卡片充当视觉头部，
 *    **状态栏避让**由 ProfileCard 外层加 statusBarHeight 占位（见模板）
 */
import { onShow } from '@dcloudio/uni-app'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'

import { PROFILE_ASSETS, profileCardConfig, THEME_MAP } from '@/config/profileConfig'
import { ROUTES } from '@/config/routes'
import { useUserStore } from '@/stores/modules/store-user'

import ProfileCard from './components/ProfileCard.vue'
import ProfileNav from './components/ProfileNav.vue'
import ProfileStats from './components/ProfileStats.vue'

const userStore = useUserStore()
const { userInfo, isLogin } = storeToRefs(userStore)
const { getUserInfo } = userStore

const isLoggedIn = computed(() => isLogin.value)
const userName = computed(() => userInfo.value.nickname || userInfo.value.phone || '')
const userAvatar = computed(() => userInfo.value.avatar || '')
const profileLink = computed(() => (isLoggedIn.value ? ROUTES.INFO : ROUTES.LOGIN))

const displayName = computed(() => userName.value || profileCardConfig.guest.name)
const displayDesc = computed(() => ({
  icon: profileCardConfig.guest.mobileIcon,
  text: isLoggedIn.value ? (profileCardConfig.loggedIn.desc || '暂无绑定手机号') : profileCardConfig.guest.desc,
}))

const infoItems = computed(() =>
  PROFILE_ASSETS.info.map(item => ({
    to: item.route,
    value: item.format ? item.format(userInfo.value[item.key]) : (userInfo.value[item.key] ?? 0),
    unit: item.unit,
    label: item.label,
    color: THEME_MAP[item.theme],
    disabled: Boolean(item.disabled),
  })),
)

const navGroups = PROFILE_ASSETS.nav.map(group =>
  group.map(item => ({
    to: item.route,
    title: item.title,
    icon: item.icon,
    color: THEME_MAP[item.theme],
    disabled: Boolean(item.disabled),
  })),
)

// custom 导航页：状态栏高度占位（微信胶囊避让）
const statusBarHeight = uni.getSystemInfoSync().statusBarHeight || 0

onShow(async () => {
  // ★ 先刷新登录态时间基准：profile 是 tabBar 页，用 switchTab 切入不走 addInterceptor
  //   （见 platform/navigation.ts registerNavigationGuards 的「switchTab 拦不住」注释），
  //   isLogin 依赖的 now 不会自动更新 → 长时间挂后台回来会把过期会话误判为已登录。
  //   syncAuthSessionFromStorage() 内部已处理「过期 → logout()」，返回最新登录态。
  const loggedIn = userStore.syncAuthSessionFromStorage()

  // 已登录但资料尚未载入时才请求；未登录无需发起请求
  if (loggedIn && !Object.keys(userInfo.value).length) {
    await getUserInfo()
  }
})
</script>

<template>
  <view>
    <!-- 状态栏占位（custom 导航页必须避让微信状态栏） -->
    <!-- ★ 背景填 $blue：对齐 web-user NavbarLayout 的 .nav-header-spacer（同样 background-color: $blue），
         让蓝底从屏幕顶一直铺到 ProfileCard，否则会出现「灰色状态栏条 + 蓝色卡片」的硬断带 -->
    <view
      class="status-bar-spacer"
      :style="{ height: `${statusBarHeight}px` }"
    />
    <ProfileCard
      :is-logged-in="isLoggedIn"
      :user-name="userName"
      :user-avatar="userAvatar"
      :profile-link="profileLink"
      :display-name="displayName"
      :display-desc="displayDesc"
    />
    <ProfileStats :items="infoItems" />
    <ProfileNav :groups="navGroups" />
  </view>
</template>

<style lang="scss" scoped>
/* :deep(a) 的链接色重置作废（小程序无 a 标签） */

/* :deep(.svg-right) 已删：SvgIcon 默认样式隔离（isolated），:deep 穿不进子组件内部 <text>，
   该规则在 mp-weixin 下是死代码 → 右箭头颜色改由 ProfileNav 的 SvgIcon color="#ccc" prop 提供。
   通用约定（尺寸/颜色怎么写才生效）见 components/SvgIcon/SvgIcon.vue 头部注释 */
.status-bar-spacer {
  background: $blue;
}
</style>
