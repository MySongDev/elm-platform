<script setup lang="ts">
import type { TabItem } from '@/entities/tab'
import { IconClose as IconEpClose } from '@iconify-prerendered/vue-ep'

defineOptions({ name: 'TabBarItem' })

const props = defineProps<{
  tab: TabItem
  title: string
  active: boolean
  closable?: boolean
}>()

const emit = defineEmits<{
  click: [fullPath: string]
  close: [fullPath: string]
  contextmenu: [e: MouseEvent, fullPath: string]
}>()

const { t } = useI18n()

function handleKeydown(e: KeyboardEvent) {
  if (e.key !== 'Enter' && e.key !== ' ')
    return

  e.preventDefault()
  emit('click', props.tab.fullPath)
}
</script>

<template>
  <div class="tab-item" :class="{ 'is-active': active, 'is-fixed': tab.fixed }" role="tab" :aria-selected="active"
    :title="title" tabindex="0" @click="emit('click', tab.fullPath)" @keydown="handleKeydown"
    @contextmenu="emit('contextmenu', $event, tab.fullPath)">
    <el-icon v-if="tab.icon" class="tab-icon">
      <SvgIcon :icon-name="tab.icon" />
    </el-icon>
    <span class="tab-title">{{ title }}</span>
    <el-icon v-if="!tab.fixed && closable !== false" class="tab-close" role="button" tabindex="-1"
      :aria-label="t('tabs.closeTab')" @click.stop="emit('close', tab.fullPath)">
      <IconEpClose />
    </el-icon>
  </div>
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
  font-size: 12px;
  line-height: 30px;
  color: $text-regular;
  white-space: nowrap;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;

  &:hover {
    color: $primary-color;
    background: rgba($primary-color, 0.08);
  }

  &.is-active {
    font-weight: 500;
    color: $primary-color;
    background: rgba($primary-color, 0.1);
    box-shadow: 0 0 0 1px rgba($primary-color, 0.14) inset;

    &::after {
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
  }
}

.tab-title {
  overflow: hidden;
  text-overflow: ellipsis;
}

.tab-icon {
  flex-shrink: 0;
  font-size: 14px;
}

.tab-close {
  flex-shrink: 0;
  padding: 1px;
  margin-left: 2px;
  font-size: 15px;
  border-radius: 50%;
  transition: all 0.2s;

  &:hover {
    color: #fff;
    background: var(--app-color-primary);
  }

  :deep(svg path) {
    fill: currentcolor;
  }
}
</style>
