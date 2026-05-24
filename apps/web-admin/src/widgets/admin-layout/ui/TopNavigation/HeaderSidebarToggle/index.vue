<script setup lang="ts">
import { SidebarToggle } from '@/widgets/admin-layout/ui/Sidebar'

defineOptions({ name: 'HeaderSidebarToggle' })

defineProps<{
  collapsed: boolean
}>()

const emit = defineEmits<{
  toggleClick: []
}>()
</script>

<template>
  <div class="header-sidebar-toggle">
    <SidebarToggle
      :collapsed="collapsed"
      :icon-size="20"
      tooltip-placement="bottom"
      @toggle-click="emit('toggleClick')"
    />
  </div>
</template>

<style scoped lang="scss">
.header-sidebar-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 0 10px;
  color: var(--app-text-regular);
  cursor: pointer;

  &:hover {
    color: var(--el-color-primary);
    background-color: var(--app-border-light);
  }
}
</style>
