<script setup lang="ts">
import {
  IconArrowLeft as IconEpArrowLeft,
  IconArrowRight as IconEpArrowRight,
} from '@iconify-prerendered/vue-ep'
import { computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { isTabClosable, useTabsStore } from '@/entities/tab'
import { transformI18n } from '@/shared/i18n'
import TabBarActions from './TabBarActions.vue'
import TabBarItem from './TabBarItem.vue'
import {
  getTabItemClass,
  isActiveTab,
  shouldShowCloseButton,
} from './tabPresentation'
import { useScrollManager } from './useScroll'
import { useTabActions } from './useTabActions'

defineOptions({ name: 'TabBarFromScratch' })

const route = useRoute()
const router = useRouter()
const tabsStore = useTabsStore()
const { t } = useI18n()

const isOnlyOneTab = computed(() => tabsStore.tabs.length <= 1)
const closableCount = computed(() => tabsStore.tabs.filter(isTabClosable).length)
const currentTab = computed(() => tabsStore.tabs.find(tab => tab.fullPath === route.fullPath))
const isCurrentFixed = computed(() => currentTab.value?.fixed ?? false)
const isCurrentClosable = computed(() =>
  currentTab.value ? isTabClosable(currentTab.value) : false,
)
const currentTabIndex = computed(() =>
  tabsStore.tabs.findIndex(tab => tab.fullPath === route.fullPath),
)
const isCurrentFirstNonFixed = computed(() => {
  const index = currentTabIndex.value
  return index <= 0 || tabsStore.tabs.slice(0, index).every(tab => !isTabClosable(tab))
})
const isCurrentLastNonFixed = computed(() => {
  const index = currentTabIndex.value
  return index === -1 || tabsStore.tabs.slice(index + 1).every(tab => !isTabClosable(tab))
})

const tabViews = computed(() =>
  tabsStore.tabs.map((tab) => {
    const active = isActiveTab(tab.fullPath, route.fullPath)
    return {
      tab,
      active,
      closable: shouldShowCloseButton(isTabClosable(tab), tabsStore.tabs.length),
      title: tabsStore.getTitle(tab, transformI18n),
      itemClass: getTabItemClass({
        active,
        fixed: tab.fixed,
      }),
    }
  }),
)

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
  handleTabClick,
  handleCloseTab,
  handleDropdownCommand,
} = useTabActions({
  route,
  router,
  tabsStore,
})

onMounted(() => {
  setupScrollListeners(scrollContainer, tabTrack)
  scrollActiveIntoView()
})

onUnmounted(() => {
  cleanupScrollListeners()
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
  <div class="tab-bar-from-scratch">
    <button
      v-show="isOverflow"
      class="scroll-btn left"
      type="button"
      :class="{ disabled: !canScrollLeft }"
      :disabled="!canScrollLeft"
      :aria-label="t('tabs.scrollLeft')"
      @click="scroll('left')"
    >
      <el-icon>
        <IconEpArrowLeft />
      </el-icon>
    </button>

    <div ref="scrollContainer" class="tab-scroll-container" @wheel="handleWheel">
      <div ref="tabTrack" class="tab-track" role="tablist" :aria-label="t('tabs.openedPages')">
        <TabBarItem
          v-for="item in tabViews"
          :key="item.tab.fullPath"
          :tab="item.tab"
          :title="item.title"
          :active="item.active"
          :closable="item.closable"
          :item-class="item.itemClass"
          @click="handleTabClick"
          @close="handleCloseTab"
        />
      </div>
    </div>

    <button
      v-show="isOverflow"
      class="scroll-btn right"
      type="button"
      :class="{ disabled: !canScrollRight }"
      :disabled="!canScrollRight"
      :aria-label="t('tabs.scrollRight')"
      @click="scroll('right')"
    >
      <el-icon>
        <IconEpArrowRight />
      </el-icon>
    </button>

    <TabBarActions
      :current-fixed="isCurrentFixed"
      :current-closable="isCurrentClosable"
      :first-non-fixed="isCurrentFirstNonFixed"
      :last-non-fixed="isCurrentLastNonFixed"
      :only-one-tab="isOnlyOneTab"
      :closable-count="closableCount"
      @command="handleDropdownCommand"
    />
  </div>
</template>

<style scoped lang="scss">
.tab-bar-from-scratch {
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
}

.scroll-btn.left {
  box-shadow: 5px 0 5px -6px #ccc;
}

.scroll-btn.right {
  border-left: 1px solid $border-light;
  box-shadow: -5px 0 5px -6px #ccc;
}

.scroll-btn.disabled {
  pointer-events: none;
  cursor: default;
  opacity: 0.35;
}

.scroll-btn:hover {
  color: $primary-color;
  background: rgba($primary-color, 0.05);
}

.scroll-btn :deep(svg path) {
  fill: currentcolor;
}

.tab-scroll-container {
  flex: 1;
  min-width: 0;
  height: 100%;
  overflow: hidden;
  white-space: nowrap;
  scrollbar-width: none;
}

.tab-scroll-container::-webkit-scrollbar {
  display: none;
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
