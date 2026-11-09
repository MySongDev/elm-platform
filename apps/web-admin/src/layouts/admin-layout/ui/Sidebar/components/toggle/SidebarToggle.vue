<script setup lang="ts">
import { IconFold as IconEpFold } from '@iconify-prerendered/vue-ep'
import { computed } from 'vue'
import { getSidebarTogglePresentation } from './sidebarTogglePresentation'

type TooltipPlacement
  = | 'top'
    | 'top-start'
    | 'top-end'
    | 'bottom'
    | 'bottom-start'
    | 'bottom-end'
    | 'left'
    | 'left-start'
    | 'left-end'
    | 'right'
    | 'right-start'
    | 'right-end'

defineOptions({ name: 'SidebarToggle' })

const props = withDefaults(defineProps<{
  collapsed: boolean
  iconSize?: number
  tooltipPlacement?: TooltipPlacement
}>(), {
  iconSize: 18,
  tooltipPlacement: 'right',
})

const emit = defineEmits<{
  toggleClick: []
}>()

const presentation = computed(() => getSidebarTogglePresentation(props.collapsed))
</script>

<template>
  <el-tooltip :content="presentation.tooltip" :placement="tooltipPlacement">
    <button
      class="sidebar-toggle"
      type="button"
      :aria-expanded="presentation.ariaExpanded"
      :aria-label="presentation.ariaLabel"
      @click="emit('toggleClick')"
    >
      <el-icon :size="iconSize" :style="{ transform: presentation.iconTransform }">
        <IconEpFold />
      </el-icon>
    </button>
  </el-tooltip>
</template>

<style scoped lang="scss">
.sidebar-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 0;
  color: inherit;
  cursor: pointer;
  background: transparent;
  border: 0;

  .el-icon {
    transition: transform 0.1s;
  }
}
</style>
