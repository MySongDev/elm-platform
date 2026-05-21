<script setup lang="ts">
import {
  IconArrowLeft as IconEpArrowLeft,
  IconArrowRight as IconEpArrowRight,
} from '@iconify-prerendered/vue-ep'
import { computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { isTabClosable, useTabsStore } from '@/entities/tab'
import { transformI18n } from '@/shared/i18n'
import emitter from '@/shared/lib/mitt'
import TabBarActions from './TabBarActions.vue'
import TabBarContextMenu from './TabBarContextMenu.vue'
import TabBarItem from './TabBarItem.vue'
import { useMenuManager } from './useMenu'
import { useScrollManager } from './useScroll'
import { useTabActions } from './useTabActions'

defineOptions({ name: 'TabBar' })

const route = useRoute()
const router = useRouter()
const tabsStore = useTabsStore()
const { t } = useI18n()

// 基础计算属性
const isOnlyOneTab = computed(() => tabsStore.tabs.length <= 1)
const closableCount = computed(() => tabsStore.tabs.filter(isTabClosable).length)
const currentTab = computed(() => tabsStore.tabs.find(t => t.fullPath === route.fullPath))
const isCurrentFixed = computed(() => currentTab.value?.fixed ?? false)
const isCurrentClosable = computed(() => currentTab.value ? isTabClosable(currentTab.value) : false)
const currentTabIndex = computed(() => tabsStore.tabs.findIndex(tab => tab.fullPath === route.fullPath))
const isCurrentFirstNonFixed = computed(() => {
  const index = currentTabIndex.value
  return index <= 0 || tabsStore.tabs.slice(0, index).every(tab => !isTabClosable(tab))
})
const isCurrentLastNonFixed = computed(() => {
  const index = currentTabIndex.value
  return index === -1 || tabsStore.tabs.slice(index + 1).every(tab => !isTabClosable(tab))
})

// 组合式函数
const {
  scrollContainer,
  tabTrack,
  canScrollLeft,
  canScrollRight,
  isOverflow,
  scroll,
  handleWheel,
  updateScrollState,
  scrollActiveIntoView,
  setupScrollListeners,
  cleanupScrollListeners,
} = useScrollManager()

const {
  contextMenu,
  targetTab,
  isFirstNonFixed,
  isLastNonFixed,
  openContextMenu,
  closeContextMenu,
  setupMenuListeners,
  cleanupMenuListeners,
} = useMenuManager(tabsStore)

const {
  handleCloseTab,
  handleDropdownCommand,
  handleContextMenuCommand,
  handleTabClick,
} = useTabActions({
  route,
  router,
  tabsStore,
  contextMenu,
  closeContextMenu,
})

function handleLayoutRouteChange(path: string) {
  const tab = tabsStore.tabs.find(tab => tab.path === path || tab.fullPath === path)
  if (tab)
    router.push(tab.fullPath)
}

function isActiveTab(fullPath: string) {
  return fullPath === route.fullPath
}

onMounted(() => {
  setupScrollListeners(scrollContainer, tabTrack)
  setupMenuListeners()
  emitter.on('changeLayoutRoute', handleLayoutRouteChange)
  scrollActiveIntoView()
})

onUnmounted(() => {
  emitter.off('changeLayoutRoute', handleLayoutRouteChange)
  cleanupScrollListeners()
  cleanupMenuListeners()
})

watch(() => tabsStore.tabs.length, () => scrollActiveIntoView())

watch(() => route.fullPath, () => scrollActiveIntoView())

watch(
  () => tabsStore.tabs.map(tab => `${tab.key || tab.fullPath}:${tab.fullPath}:${tab.title}`).join('|'),
  () => updateScrollState(),
  { flush: 'post' },
)
</script>

<template>
  <div class="tab-bar">
    <button v-show="isOverflow" class="scroll-btn left" type="button" :class="{ disabled: !canScrollLeft }"
      :disabled="!canScrollLeft" :aria-label="t('tabs.scrollLeft')" @click="scroll('left')">
      <el-icon>
        <IconEpArrowLeft />
      </el-icon>
    </button>

    <div ref="scrollContainer" class="tab-scroll-container" @wheel="handleWheel">
      <div ref="tabTrack" class="tab-track" role="tablist" :aria-label="t('tabs.openedPages')">
        <TabBarItem v-for="tab in tabsStore.tabs" :key="tab.fullPath" :tab="tab"
          :title="tabsStore.getTitle(tab, transformI18n)" :active="isActiveTab(tab.fullPath)"
          :closable="!isOnlyOneTab && isTabClosable(tab)"
          @click="handleTabClick(tab.fullPath)" @contextmenu="openContextMenu($event, tab.fullPath)"
          @close="handleCloseTab(tab.fullPath)" />
      </div>
    </div>

    <button v-show="isOverflow" class="scroll-btn right" type="button" :class="{ disabled: !canScrollRight }"
      :disabled="!canScrollRight" :aria-label="t('tabs.scrollRight')" @click="scroll('right')">
      <el-icon>
        <IconEpArrowRight />
      </el-icon>
    </button>

    <TabBarActions :current-fixed="isCurrentFixed" :current-closable="isCurrentClosable"
      :first-non-fixed="isCurrentFirstNonFixed"
      :last-non-fixed="isCurrentLastNonFixed" :only-one-tab="isOnlyOneTab" :closable-count="closableCount"
      @command="handleDropdownCommand" />

    <TabBarContextMenu :visible="contextMenu.visible" :x="contextMenu.x" :y="contextMenu.y" :target-tab="targetTab"
      :target-closable="targetTab ? isTabClosable(targetTab) : false" :first-non-fixed="isFirstNonFixed"
      :last-non-fixed="isLastNonFixed" :only-one-tab="isOnlyOneTab" :closable-count="closableCount"
      @command="handleContextMenuCommand" />
  </div>
</template>

<style scoped lang="scss">
.tab-bar {
  position: relative;
  display: flex;
  align-items: center;
  height: $tab-bar-height;
  user-select: none;
  background: $bg-white;
  border-bottom: 1px solid $border-light;
  box-shadow: 0 0 1px rgb(0 0 0 / 42%);
}

.scroll-btn {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 100%;
  padding: 0;
  font: inherit;
  color: $text-secondary;
  cursor: pointer;
  background: transparent;
  border: 0;
  transition:
    color 0.2s,
    background 0.2s,
    opacity 0.2s;

  &.left {
    box-shadow: 5px 0 5px -6px #ccc;
  }

  &.right {
    border-left: 1px solid $border-light;
    box-shadow: -5px 0 5px -6px #ccc;
  }

  &.disabled {
    pointer-events: none;
    cursor: default;
    opacity: 0.35;
  }

  &:hover {
    color: $primary-color;
    background: rgba($primary-color, 0.05);
  }

  :deep(svg path) {
    fill: currentcolor;
  }
}

.tab-scroll-container {
  flex: 1;
  min-width: 0;
  height: 100%;
  overflow: hidden;
  white-space: nowrap;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.tab-track {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  min-width: 100%;
  height: 100%;
  padding: 0 4px;
}
</style>
