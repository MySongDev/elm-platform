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
    class="sidebar-container"
    @mouseenter.prevent="isSidebarHover = true"
    @mouseleave.prevent="isSidebarHover = false"
  >
    <Logo :collapse="props.collapse" />
    <SidebarMenu :collapse="props.collapse" />
    <SidebarCollapseControls
      :collapse="props.collapse"
      :is-hover="isSidebarHover"
      @toggle-collapse="emit('toggleCollapse')"
    />
  </div>
</template>

<style scoped lang="scss">
.sidebar-container {
  position: relative;
  z-index: 1;
  width: 100%;
  min-width: 0;
  height: 100vh;
  overflow: visible;
  font-size: 0;
  user-select: none;
  background: $sidebar-bg;
  border-right: 1px solid rgb(5 5 5 / 6%);
}
</style>
