<script setup lang="ts">
import type { TabCommand, TabCommandState } from '../model/tabCommands'
import { IconMoreFilled as IconEpMoreFilled } from '@iconify-prerendered/vue-ep'
import { computed } from 'vue'
import { getTabCommands } from '../model/tabCommands'

defineOptions({ name: 'TabBarActions' })

const props = defineProps<{
  state: TabCommandState
}>()

const emit = defineEmits<{
  command: [command: TabCommand]
}>()

const { t } = useI18n()

const commands = computed(() => getTabCommands('dropdown', props.state))

function handleCommand(command: string | number | object) {
  emit('command', command as TabCommand)
}
</script>

<template>
  <el-dropdown trigger="click" placement="bottom-end" @command="handleCommand">
    <button class="dropdown-btn" type="button" :aria-label="t('tabs.tabActions')">
      <el-icon>
        <IconEpMoreFilled />
      </el-icon>
    </button>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item
          v-for="item in commands"
          :key="item.command"
          :command="item.command"
          :divided="item.divided"
          :disabled="item.disabled"
        >
          <el-icon>
            <component :is="item.icon" />
          </el-icon>
          {{ t(item.labelKey) }}
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<style scoped lang="scss">
.dropdown-btn {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  font: inherit;
  color: $text-secondary;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-left: 1px solid $border-light;
  transition:
    color 0.2s,
    background 0.2s;

  &:hover {
    color: $primary-color;
    background: rgba($primary-color, 0.05);
  }

  :deep(svg path) {
    fill: currentcolor;
  }
}

.el-dropdown-menu__item {
  display: flex;
  gap: 8px;
  align-items: center;
}
</style>
