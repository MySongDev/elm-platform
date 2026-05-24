<script setup lang="ts">
import { SidebarToggle } from '@/widgets/admin-layout/ui/Sidebar'

defineOptions({ name: 'SidebarFooterCollapse' })

defineProps<{
  collapsed: boolean
}>()

const emit = defineEmits<{
  toggleClick: []
}>()
</script>

<template>
  <div class="sidebar-footer-collapse">
    <SidebarToggle :collapsed="collapsed" @toggle-click="emit('toggleClick')" />
  </div>
</template>

<style scoped lang="scss">
.sidebar-footer-collapse {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 40px;
  line-height: 40px;
  color: $sidebar-text;
  box-shadow: 0 0 6px -3px $primary-color;

  &:hover {
    color: $white-color;
  }
}
</style>
