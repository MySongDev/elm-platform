<script setup>
import { computed, nextTick, onActivated, onBeforeUnmount, onMounted, provide, shallowRef, useTemplateRef, watch } from 'vue'
import { onBeforeRouteLeave, onBeforeRouteUpdate, useRoute, useRouter } from 'vue-router'

import { navbarHeaderContextKey } from './navbarHeaderContext'

defineOptions({
  name: 'NavbarLayout',
})
const route = useRoute()
const router = useRouter()
const navMainRef = useTemplateRef('navMainRef')
const navbarHeader = shallowRef(null)

const cachedSubPages = computed(() => {
  const layoutRoute = router.getRoutes().find(item => item.name === 'NavbarLayout')
  return layoutRoute?.children
    ?.filter(item => item.name && item.meta?.keepAlive)
    .map(item => item.name) || []
})

const scrollStorageKey = computed(() => `navbar-layout-scroll:${route.name || route.path}`)
const showLayoutHeader = computed(() => !route.meta?.hideLayoutHeader)

provide(navbarHeaderContextKey, {
  setHeader(config) {
    navbarHeader.value = config
  },
  clearHeader() {
    navbarHeader.value = null
  },
})

function saveScrollPosition() {
  const navMain = navMainRef.value
  if (!navMain)
    return

  sessionStorage.setItem(scrollStorageKey.value, String(navMain.scrollTop))
}

async function restoreScrollPosition() {
  const savedPosition = Number(sessionStorage.getItem(scrollStorageKey.value) || 0)
  const navMain = navMainRef.value
  if (!navMain || !Number.isFinite(savedPosition))
    return

  await nextTick()
  requestAnimationFrame(() => {
    if (navMainRef.value)
      navMainRef.value.scrollTop = savedPosition
  })
}

watch(() => route.fullPath, async () => {
  await restoreScrollPosition()
})

onMounted(() => {
  restoreScrollPosition()
})

onActivated(restoreScrollPosition)
onBeforeRouteUpdate(saveScrollPosition)
onBeforeRouteLeave(saveScrollPosition)
onBeforeUnmount(saveScrollPosition)
</script>

<template>
  <div class="nav-layout">
    <head-top v-if="showLayoutHeader" :head-title="navbarHeader?.title || ''">
      <template v-if="navbarHeader?.editLabel" #edit>
        <button class="nav-header-edit" type="button" @click="navbarHeader.onEdit">
          {{ navbarHeader.editLabel }}
        </button>
      </template>
    </head-top>
    <main ref="navMainRef" class="nav-main">
      <router-view v-slot="{ Component, route }">
        <transition name="nav-bar" mode="out-in">
          <KeepAlive :include="cachedSubPages" :max="10">
            <component :is="Component" :key="route.name" class="nav-page" />
          </KeepAlive>
        </transition>
      </router-view>
    </main>
    <foot-guide />
  </div>
</template>

<style lang="scss" scoped>
.nav-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.nav-main {
  flex: 1;
  position: relative;
  overflow-y: auto;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}

.nav-page {
  width: 100%;
  min-height: 100%;
}

.nav-header-edit {
  border: 0;
  background: transparent;
  padding: 0;
  color: #fff;
  font-size: 14px;
  white-space: nowrap;
}

:deep(.van-tabbar-item--active .van-icon) {
  color: var(--van-tabbar-item-active-color);
}

:deep(.van-tabbar-item--active .van-tabbar-item__text) {
  color: var(--van-tabbar-item-active-color);
}

.nav-bar-enter-active,
.nav-bar-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.nav-bar-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.nav-bar-leave-to {
  opacity: 0;
  transform: scale(0.96);
}
</style>
