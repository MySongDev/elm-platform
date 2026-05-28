<script setup lang="ts">
import type { TabItem } from '@/entities/tab'

defineOptions({ name: 'TabBarFromScratchItem' })

defineProps<{
  tab: TabItem
  title: string
  active: boolean
  itemClass: Record<string, boolean>
}>()

const emit = defineEmits<{
  click: [fullPath: string]
}>()
</script>

<template>
  <button
    class="tab-item"
    :class="itemClass"
    type="button"
    role="tab"
    :aria-selected="active"
    :title="title"
    @click="emit('click', tab.fullPath)"
  >
    <el-icon v-if="tab.icon" class="tab-icon">
      <SvgIcon :icon-name="tab.icon" />
    </el-icon>
    <span class="tab-title">{{ title }}</span>
  </button>
</template>

<style scoped lang="scss">
.tab-item {
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
  gap: 6px;
  align-items: center;
  justify-content: center;
  max-width: 180px;
  height: 30px;
  padding: 0 12px;
  margin-right: 4px;
  font: inherit;
  font-size: 12px;
  line-height: 30px;
  color: $text-regular;
  white-space: nowrap;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 4px;
  transition:
    color 0.2s,
    background 0.2s,
    box-shadow 0.2s;
}

.tab-item:hover {
  color: $primary-color;
  background: rgba($primary-color, 0.08);
}

.tab-item.is-active {
  font-weight: 500;
  color: $primary-color;
  background: rgba($primary-color, 0.1);
  box-shadow: 0 0 0 1px rgba($primary-color, 0.14) inset;
}

.tab-item.is-active::after {
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 16px;
  height: 2px;
  content: '';
  background: $primary-color;
  border-radius: 1px;
  transform: translateX(-50%);
}

.tab-title {
  overflow: hidden;
  text-overflow: ellipsis;
}

.tab-icon {
  flex-shrink: 0;
  font-size: 14px;
}
</style>
