<script setup lang="ts">
import { useTabsStore } from '@/entities/tab'

defineOptions({ name: 'MainContent' })

const tabsStore = useTabsStore()
</script>

<template>
  <div class="main-content">
    <router-view v-slot="{ Component, route }">
      <transition name="fade-transform" mode="out-in" appear>
        <keep-alive :include="tabsStore.cachedViews">
          <component :is="Component" :key="route.fullPath" />
        </keep-alive>
      </transition>
    </router-view>
  </div>
</template>

<style scoped lang="scss">
.main-content {
  @include scroll-bar;

  position: relative;
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background-color: $bg-color;
}
</style>
