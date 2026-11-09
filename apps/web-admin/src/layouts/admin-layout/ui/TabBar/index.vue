<script setup lang="ts">
import {
  IconArrowLeft as IconEpArrowLeft,
  IconArrowRight as IconEpArrowRight,
} from '@iconify-prerendered/vue-ep'
import { onMounted, onUnmounted, useTemplateRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { isTabClosable, useTabsStore } from '@/entities/tab'
import { transformI18n } from '@/shared/i18n'
import { useMenuManager } from './composables/useMenu'
import { useScrollManager } from './composables/useScroll'
import { useTabActions } from './composables/useTabActions'
import { useTabCommandState } from './composables/useTabCommandState'
import TabBarActions from './ui/TabBarActions.vue'
import TabBarContextMenu from './ui/TabBarContextMenu.vue'
import TabBarItem from './ui/TabBarItem.vue'

defineOptions({ name: 'TabBar' })

const route = useRoute()
const router = useRouter()
const tabsStore = useTabsStore()
const { t } = useI18n()

// DOM 所有权留在视图层：模板 ref 名称必须与 useTemplateRef 参数一致
const scrollContainerRef = useTemplateRef<HTMLElement>('scrollContainerRef')
const tabTrackRef = useTemplateRef<HTMLElement>('tabTrackRef')

// 组合式函数：滚动能力只接收 DOM，不创建 DOM ref
const {
  canScrollLeft,
  canScrollRight,
  isOverflow,
  scroll,
  handleWheel,
  updateScrollState,
  scrollActiveIntoView,
  setupScrollListeners,
  cleanupScrollListeners,
} = useScrollManager(scrollContainerRef, tabTrackRef)

// 菜单组件实例：expose 了 rootEl，供测量真实菜单宽高
const contextMenuRef = useTemplateRef<{ rootEl: HTMLElement | null }>('contextMenuRef')

// 菜单只负责定位与 dismiss 会话；命令状态另由 useTabCommandState 计算
const {
  contextMenu,
  openContextMenu,
  closeContextMenu,
} = useMenuManager({
  // 模板 ref 访问 expose 的 ref 时会被自动解包为 HTMLElement | null
  getMenuElement: () => contextMenuRef.value?.rootEl ?? null,
})

const dropdownCommandState = useTabCommandState(() => route.fullPath)

const contextCommandState = useTabCommandState(
  () => contextMenu.targetPath,
)

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

function isActiveTab(fullPath: string) {
  return fullPath === route.fullPath
}

onMounted(() => {
  // setup 无参：DOM 关联已在 useScrollManager(scrollContainerRef, tabTrackRef) 完成
  setupScrollListeners()
  scrollActiveIntoView()
})

onUnmounted(() => {
  cleanupScrollListeners()
  // 菜单监听由 useMenuManager 在 close / 作用域销毁时自行释放
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

    <div ref="scrollContainerRef" class="tab-scroll-container" @wheel="handleWheel">
      <div
        ref="tabTrackRef"
        class="tab-track"
        role="tablist"
        :aria-label="t('tabs.openedPages')"
      >
        <TabBarItem
          v-for="tab in tabsStore.tabs"
          :key="tab.fullPath"
          :tab="tab"
          :title="tabsStore.getTitle(tab, transformI18n)"
          :active="isActiveTab(tab.fullPath)"
          :closable="!dropdownCommandState.onlyOneTab && isTabClosable(tab)"
          @click="handleTabClick(tab.fullPath)"
          @contextmenu="openContextMenu($event, tab.fullPath)"
          @close="handleCloseTab(tab.fullPath)"
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
      :state="dropdownCommandState"
      @command="handleDropdownCommand"
    />

    <TabBarContextMenu
      ref="contextMenuRef"
      :visible="contextMenu.visible"
      :x="contextMenu.x"
      :y="contextMenu.y"
      :state="contextCommandState"
      @command="handleContextMenuCommand"
    />
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
