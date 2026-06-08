<script setup lang="ts">
import MainContent from './MainContent/index.vue'
import Sidebar from './Sidebar/index.vue'
import TabBar from './TabBarFromScratch/index.vue'
import TopNavigation from './TopNavigation/index.vue'

defineOptions({ name: 'AdminLayout' })

const isCollapse = shallowRef(false)

function toggleCollapse() {
  isCollapse.value = !isCollapse.value
}
</script>

<template>
  <div class="app-wrapper" :class="{ collapse: isCollapse }">
    <Sidebar :collapse="isCollapse" @toggle-collapse="toggleCollapse" />
    <div class="main-container">
      <TopNavigation :collapse="isCollapse" @toggle-collapse="toggleCollapse" />
      <TabBar />
      <MainContent />
    </div>
  </div>
</template>

<style scoped lang="scss">
.app-wrapper {
  display: grid;
  grid-template-columns: $sidebar-width minmax(0, 1fr);
  width: 100%;
  height: 100vh;
  overflow: hidden;
  transition: grid-template-columns 0.2s ease-out;

  &.collapse {
    grid-template-columns: $sidebar-collapsed-width minmax(0, 1fr);
  }
}

.main-container {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background: $bg-color;

  :deep(.el-scrollbar__wrap) {
    height: 100%;
    overflow: auto;
  }
}
</style>
