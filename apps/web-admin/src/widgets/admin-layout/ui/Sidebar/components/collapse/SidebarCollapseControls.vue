<script setup lang="ts">
import SidebarCenterCollapse from './SidebarCenterCollapse.vue'
import SidebarLeftCollapse from './SidebarLeftCollapse.vue'

defineOptions({ name: 'SidebarCollapseControls' })

const props = defineProps<{
  collapse: boolean
  isHover: boolean
}>()

const emit = defineEmits<{
  toggleCollapse: []
}>()
</script>

<template>
  <SidebarCenterCollapse
    v-if="props.isHover || props.collapse"
    :is-active="!props.collapse"
    @toggle-click="emit('toggleCollapse')"
  />
  <SidebarLeftCollapse :is-active="!props.collapse" @toggle-click="emit('toggleCollapse')" />
</template>
