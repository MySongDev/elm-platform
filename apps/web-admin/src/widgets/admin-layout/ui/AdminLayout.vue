<script setup lang="ts">
import MainContent from './MainContent/index.vue'
import Sidebar from './Sidebar/index.vue'
import TabBar from './TabBar/index.vue'
import TopNavigation from './TopNavigation/index.vue'

defineOptions({ name: 'AdminLayout' })

const isCollapse = ref(false)

function toggleCollapse() {
  isCollapse.value = !isCollapse.value
}
</script>

<template>
  <div class="app-wrapper">
    <Sidebar :collapse="isCollapse" @toggle-collapse="toggleCollapse" />
    <div class="main-container" :class="{ collapse: isCollapse }">
      <TopNavigation :collapse="isCollapse" @toggle-collapse="toggleCollapse" />
      <TabBar />
      <MainContent />
    </div>
  </div>
</template>

<style scoped lang="scss">
.app-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

.main-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  min-height: 100%;
  margin-left: $sidebar-width;
  overflow: hidden;
  transition: margin-left var(--app-transition-duration);

  :deep(.el-scrollbar__wrap) {
    height: 100%;
    overflow: auto;
  }

  &.collapse {
    margin-left: $sidebar-collapsed-width;
  }
}
</style>
