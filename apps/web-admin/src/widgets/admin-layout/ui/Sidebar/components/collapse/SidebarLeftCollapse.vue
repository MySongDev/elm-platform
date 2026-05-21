<script setup lang="ts">
import {
  IconFold as IconEpFold,
} from '@iconify-prerendered/vue-ep'

defineOptions({ name: 'SidebarLeftCollapse' })

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
  <div class="left-collapse">
    <el-tooltip :content="isActive ? '点击折叠' : '点击展开'" placement="right">
      <button class="left-collapse__button" type="button" @click="$emit('toggleClick')">
        <el-icon :size="18" :style="{ transform: isActive ? 'none' : 'rotateY(180deg)' }">
          <IconEpFold />
        </el-icon>
      </button>
    </el-tooltip>
  </div>
</template>

<style scoped lang="scss">
.left-collapse {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 40px;
  line-height: 40px;
  box-shadow: 0 0 6px -3px $primary-color;
}

.left-collapse__button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 0;
  color: $sidebar-text;
  cursor: pointer;
  background: transparent;
  border: 0;

  &:hover {
    color: $white-color;
  }

  .el-icon {
    transition: transform 0.1s;
  }
}
</style>
