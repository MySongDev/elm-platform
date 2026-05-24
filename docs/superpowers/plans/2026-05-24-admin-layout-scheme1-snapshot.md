# Admin Layout Scheme 1 Snapshot

Created on 2026-05-24 before trying the stronger overlay scheme.

## `apps/web-admin/src/widgets/admin-layout/ui/AdminLayout.vue`

```vue
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
  transition: margin-left 0.2s ease-out;
  will-change: margin-left;

  :deep(.el-scrollbar__wrap) {
    height: 100%;
    overflow: auto;
  }

  &.collapse {
    margin-left: $sidebar-collapsed-width;
  }
}
</style>
```

## `apps/web-admin/src/widgets/admin-layout/ui/Sidebar/index.vue`

```vue
<script setup lang="ts">
import Logo from './components/brand/Logo.vue'
import SidebarCollapseControls from './components/collapse/SidebarCollapseControls.vue'
import SidebarMenu from './components/menu/SidebarMenu.vue'

defineOptions({ name: 'AppSidebar' })

const props = defineProps<{
  collapse: boolean
}>()

const emit = defineEmits<{
  toggleCollapse: []
}>()

const isSidebarHover = shallowRef(false)
</script>

<template>
  <div
    class="sidebar-container" :class="{ collapse: props.collapse }" @mouseenter.prevent="isSidebarHover = true"
    @mouseleave.prevent="isSidebarHover = false"
  >
    <Logo :collapse="props.collapse" />
    <SidebarMenu :collapse="props.collapse" />
    <SidebarCollapseControls
      :collapse="props.collapse" :is-hover="isSidebarHover"
      @toggle-collapse="emit('toggleCollapse')"
    />
  </div>
</template>

<style scoped lang="scss">
.sidebar-container {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  z-index: 1001;
  width: $sidebar-width ;
  height: 100%;
  overflow: visible;
  font-size: 0;
  background: $sidebar-bg ;
  border-right: 1px solid rgb(5 5 5 / 6%);
  transition: width 0.2s ease-out;
  will-change: width;

  &.collapse {
    width: $sidebar-collapsed-width ;
  }
}
</style>
```
