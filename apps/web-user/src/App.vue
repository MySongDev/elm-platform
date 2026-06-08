<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import GlobalLoading from '@/components/common/GlobalLoading/GlobalLoading.vue'
import { useUserStore } from '@/stores/modules/store-user'

defineOptions({
  name: 'App',
})
const route = useRoute()
const router = useRouter()
const { getUserInfo } = useUserStore()

const cachedLayouts = computed(() => {
  return router.getRoutes()
    .filter(r => r.meta?.keepAlive && r.children?.length)
    .map(r => r.name)
})

const routeViewKey = computed(() => {
  return route.matched[0]?.name || route.path
})

onMounted(() => {
  getUserInfo()
})
</script>

<template>
  <router-view v-slot="{ Component }">
    <transition name="page" mode="out-in">
      <KeepAlive :include="cachedLayouts">
        <component :is="Component" :key="routeViewKey" class="app-page" />
      </KeepAlive>
    </transition>
  </router-view>
  <GlobalLoading />
</template>

<style>
@import '@/assets/styles/reset.css';

.page-enter-active,
.page-leave-active {
  transition: opacity .2s ease, transform 0.2s ease;

  /* position: absolute;
  inset: 0; */
}

.page-enter-from {
  opacity: 0;
  transform: scale(0.96);
}

.page-leave-to {
  opacity: 0;
  transform: scale(0.96);
}
</style>
