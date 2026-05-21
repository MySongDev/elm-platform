<script setup lang="ts">
import type { TabCommand } from './tabCommands'
import type { TabItem } from '@/entities/tab'
import { computed } from 'vue'
import { getTabCommands } from './tabCommands'

defineOptions({ name: 'TabBarContextMenu' })

const props = defineProps<{
  visible: boolean
  x: number
  y: number
  targetTab?: TabItem
  targetClosable: boolean
  firstNonFixed: boolean
  lastNonFixed: boolean
  onlyOneTab: boolean
  closableCount: number
}>()

const emit = defineEmits<{
  command: [command: TabCommand]
}>()

const { t } = useI18n()

const commands = computed(() =>
  getTabCommands('contextmenu', {
    currentFixed: props.targetTab?.fixed ?? false,
    targetFixed: props.targetTab?.fixed ?? false,
    currentClosable: props.targetClosable,
    targetClosable: props.targetClosable,
    firstNonFixed: props.firstNonFixed,
    lastNonFixed: props.lastNonFixed,
    onlyOneTab: props.onlyOneTab,
    closableCount: props.closableCount,
  }),
)

function handleCommand(item: { command: TabCommand, disabled: boolean }) {
  if (!item.disabled)
    emit('command', item.command)
}
</script>

<template>
  <Teleport to="body">
    <transition name="el-zoom-in-top">
      <ul v-show="visible" class="tab-context-menu" :style="{ left: `${x}px`, top: `${y}px` }">
        <template v-for="item in commands" :key="item.command">
          <li v-if="item.divided" class="divider" />
          <li :class="{ disabled: item.disabled }" @click="handleCommand(item)">
            <el-icon>
              <component :is="item.icon" />
            </el-icon>
            {{ t(item.labelKey) }}
          </li>
        </template>
      </ul>
    </transition>
  </Teleport>
</template>

<style lang="scss">
.tab-context-menu {
  position: fixed;
  z-index: 3000;
  min-width: 140px;
  padding: 4px 0;
  margin: 0;
  font-size: 13px;
  list-style: none;
  background: $bg-white;
  border-radius: 6px;
  box-shadow: 0 4px 16px rgb(0 0 0 / 12%);

  li {
    display: flex;
    gap: 8px;
    align-items: center;
    padding: 8px 16px;
    color: $text-regular;
    cursor: pointer;
    transition: all 0.15s;

    .el-icon {
      font-size: 14px;

      svg path {
        fill: currentcolor;
      }
    }

    &:hover {
      color: $primary-color;
      background: rgba($primary-color, 0.06);
    }

    &.disabled {
      color: $text-placeholder;
      cursor: not-allowed;

      &:hover {
        color: $text-placeholder;
        background: transparent;
      }
    }

    &.divider {
      height: 1px;
      padding: 0;
      margin: 4px 0;
      cursor: default;
      background: $border-light;

      &:hover {
        background: $border-light;
      }
    }
  }
}
</style>
