<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const transitionName = ref('slide-right')
const historyStack = ref([])

// 监听路由变化，判断方向
watch(() => route.path, (newPath, oldPath) => {
  if (!oldPath)
    return

  const stack = historyStack.value
  const isBack = stack.includes(newPath)

  if (isBack) {
    // 后退：新页面从左边进入
    transitionName.value = 'slide-left'
    // 从栈中移除
    historyStack.value = stack.filter(p => p !== newPath)
  }
  else {
    // 前进：新页面从右边进入
    transitionName.value = 'slide-right'
    // 记录旧路径
    historyStack.value.push(oldPath)
  }
})
</script>

<template>
  <div class="address-layout">
    <head-top v-if="!route.meta.hideLayoutHeader" />

    <main class="address-main">
      <router-view v-slot="{ Component, route }">
        <transition :name="transitionName">
          <component :is="Component" :key="route.path" class="address-page" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<style lang="scss">
.address-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

/* 内容区域（关键） */
.address-main {
  position: relative;
  flex: 1;
  overflow: hidden;
}

/* 页面动画层 */
.address-page {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow-y: auto;
}

/* 前进动画：新页从右进入，旧页向左离开 */

.slide-right-enter-from {
  // position: absolute;
  opacity: 0;
  transform: translateX(100%);
}

.slide-right-enter-to {
  // position: absolute;
  opacity: 1;
  transform: translateX(0);
}

.slide-right-leave-from {
  opacity: 1;
  transform: translateX(0);
}

.slide-right-leave-to {
  opacity: 0;
  transform: translateX(-20%); // 离开的页面整体向左移动20%有一种层叠的效果  100%则有一种推动的效果
}

/* 后退动画：新页从左进入，旧页向右离开 */
.slide-left-enter-from {
  opacity: 0;
  transform: translateX(-20%);
}

.slide-left-enter-to {
  opacity: 1;
  transform: translateX(0);
}

.slide-left-leave-from {
  opacity: 1;
  transform: translateX(0);
}

.slide-left-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

/* 共用动画时间 */

.slide-right-enter-active,
.slide-left-enter-active,
.slide-right-leave-active,
.slide-left-leave-active {
  transition: transform 0.4s, opacity 0.4s;
}
</style>
