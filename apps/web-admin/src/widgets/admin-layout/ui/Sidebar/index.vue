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
    class="sidebar-container has-logo"
    :class="{ collapse: props.collapse }"
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
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  z-index: 1001;
  width: $sidebar-width !important;
  height: 100%;
  overflow: visible;
  font-size: 0;
  background: $sidebar-bg !important;
  border-right: 1px solid rgb(5 5 5 / 6%);
  transition: width var(--app-transition-duration);

  &.collapse {
    width: $sidebar-collapsed-width !important;
  }
}
</style>
