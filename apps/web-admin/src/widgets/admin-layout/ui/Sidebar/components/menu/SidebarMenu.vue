<script setup lang="ts">
import type { MenuInstance } from 'element-plus'
import { ref } from 'vue'
import { useSidebarMenu } from '@/widgets/admin-layout/ui/Sidebar/composables/useSidebarMenu'
import SidebarItem from './SidebarItem.vue'

defineOptions({ name: 'SidebarMenu' })

const props = defineProps<{
  collapse: boolean
}>()

const menuRef = ref<MenuInstance>()
const {
  activeMenu,
  filteredRoutes,
  handleClose,
  handleOpen,
} = useSidebarMenu(menuRef)
</script>

<template>
  <el-scrollbar wrap-class="sidebar-menu__scrollbar-wrapper" class="sidebar-menu-scrollbar">
    <el-menu
      ref="menuRef"
      unique-opened
      mode="vertical"
      popper-class="admin-sidebar-menu-popper"
      class="sidebar-menu outer-most select-none"
      :default-active="activeMenu"
      :collapse="props.collapse"
      :collapse-transition="false"
      background-color="#001529"
      text-color="rgb(254 254 254 / 65%)"
      active-text-color="#fff"
      @open="handleOpen"
      @close="handleClose"
    >
      <SidebarItem
        v-for="routeItem in filteredRoutes"
        :key="routeItem.path"
        :route="routeItem"
        :base-path="routeItem.path"
        :collapse="props.collapse"
      />
    </el-menu>
  </el-scrollbar>
</template>

<style scoped lang="scss" src="./SidebarMenu.scss"></style>

<style lang="scss" src="./SidebarMenu.popper.scss"></style>
