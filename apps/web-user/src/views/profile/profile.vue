<script setup>
import { storeToRefs } from 'pinia'
import { computed, onMounted } from 'vue'

import { PROFILE_ASSETS, profileCardConfig, THEME_MAP } from '@/config/profileConfig'
import { useUserStore } from '@/stores/modules/store-user'

import ProfileCard from './components/ProfileCard.vue'
import ProfileNav from './components/ProfileNav.vue'
import ProfileStats from './components/ProfileStats.vue'

defineOptions({
  name: 'Profile',
})

const userStore = useUserStore()
const { getUserInfo } = useUserStore()
const { userInfo } = storeToRefs(userStore)

const isLoggedIn = computed(() => !!userInfo.value.user_id)
const userName = computed(() => userInfo.value.username || '')
const userAvatar = computed(() => userInfo.value.avatar || '')
const profileLink = computed(() => isLoggedIn.value ? '/profile/info' : '/login')

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
  })),
)

const navGroups = PROFILE_ASSETS.nav.map(group =>
  group.map(item => ({
    to: item.route,
    title: item.title,
    icon: item.icon,
    color: THEME_MAP[item.theme],
  })),
)

onMounted(async () => {
  if (!isLoggedIn.value) {
    await getUserInfo()
  }
})
</script>

<template>
  <div>
    <ProfileCard :is-logged-in="isLoggedIn" :user-name="userName" :user-avatar="userAvatar" :profile-link="profileLink"
      :display-name="displayName" :display-desc="displayDesc" />
    <ProfileStats :items="infoItems" />
    <ProfileNav :groups="navGroups" />
  </div>
</template>

<style lang="scss" scoped>
:deep(a) {
  color: inherit;

  &:active,
  &:visited,
  &:hover {
    color: inherit;
  }
}

:deep(.svg-right) {
  color: #ccc;
}
</style>
