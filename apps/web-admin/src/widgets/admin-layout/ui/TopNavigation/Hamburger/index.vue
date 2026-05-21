<script setup lang="ts">
import {
  IconExpand as IconEpExpand,
  IconFold as IconEpFold,
} from '@iconify-prerendered/vue-ep'

defineOptions({ name: 'Hamburger' })

defineProps<{
  isActive: boolean
}>()

defineEmits<{
  toggleClick: []
}>()
</script>

<template>
  <div class="hamburger" @click="$emit('toggleClick')">
    <el-icon :size="20">
      <IconEpExpand v-if="isActive" />
      <IconEpFold v-else />
    </el-icon>
  </div>
</template>

<style scoped lang="scss">
.hamburger {
  display: inline-flex;
  align-items: center;
  padding: 0 10px;
  color: $text-regular;
  cursor: pointer;

  &:hover {
    color: $primary-color;
    background-color: rgb(0 0 0 / 2.5%);
  }

  :deep(svg path) {
    fill: currentcolor;
  }
}
</style>
