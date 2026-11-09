<script setup lang="ts">
import {
  IconArrowLeft as IconEpArrowLeft,
} from '@iconify-prerendered/vue-ep'

defineOptions({ name: 'SidebarCenterCollapse' })

withDefaults(defineProps<{
  isActive?: boolean
}>(), {
  isActive: false,
})

defineEmits<{
  toggleClick: []
}>()
</script>

<template>
  <el-tooltip :content="isActive ? '点击折叠' : '点击展开'" placement="right">
    <button class="center-collapse" type="button" @click="$emit('toggleClick')">
      <el-icon :size="16" :style="{ transform: isActive ? 'none' : 'rotateY(180deg)' }">
        <IconEpArrowLeft />
      </el-icon>
    </button>
  </el-tooltip>
</template>

<style scoped lang="scss">
.center-collapse {
  position: absolute;
  top: 50%;
  right: 2px;
  z-index: 1002;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 34px;
  padding: 0;
  color: $primary-color;
  cursor: pointer;
  background: $bg-white;
  border: 1px solid $border-light;
  border-radius: 4px;
  transform: translate(12px, -50%);

  .el-icon {
    transition: transform 0.1s;
  }
}
</style>
