import type { TabItem, useTabsStore } from '@/entities/tab'
import { computed, reactive } from 'vue'
import { isTabClosable } from '@/entities/tab'

type TabsStore = ReturnType<typeof useTabsStore>
const MENU_WIDTH = 148
const MENU_HEIGHT = 208
const VIEWPORT_GAP = 8

interface ContextMenu {
  visible: boolean
  x: number
  y: number
  targetPath: string
}

export function useMenuManager(tabsStore: TabsStore) {
  const contextMenu = reactive<ContextMenu>({
    visible: false,
    x: 0,
    y: 0,
    targetPath: '',
  })

  const targetTab = computed(() => tabsStore.tabs.find((tab: TabItem) => tab.fullPath === contextMenu.targetPath))
  const isFirstNonFixed = computed(() => {
    const index = tabsStore.tabs.findIndex((tab: TabItem) => tab.fullPath === contextMenu.targetPath)
    return index <= 0 || tabsStore.tabs.slice(0, index).every((tab: TabItem) => !isTabClosable(tab))
  })
  const isLastNonFixed = computed(() => {
    const index = tabsStore.tabs.findIndex((tab: TabItem) => tab.fullPath === contextMenu.targetPath)
    return index === -1 || tabsStore.tabs.slice(index + 1).every((tab: TabItem) => !isTabClosable(tab))
  })

  function openContextMenu(e: MouseEvent, fullPath: string) {
    e.preventDefault()
    const maxLeft = window.innerWidth - MENU_WIDTH - VIEWPORT_GAP
    const maxTop = window.innerHeight - MENU_HEIGHT - VIEWPORT_GAP

    contextMenu.x = Math.max(VIEWPORT_GAP, Math.min(e.clientX, maxLeft))
    contextMenu.y = Math.max(VIEWPORT_GAP, Math.min(e.clientY, maxTop))
    contextMenu.targetPath = fullPath
    contextMenu.visible = true
  }

  function closeContextMenu() {
    contextMenu.visible = false
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape')
      closeContextMenu()
  }

  function setupMenuListeners() {
    document.addEventListener('click', closeContextMenu)
    document.addEventListener('scroll', closeContextMenu, true)
    window.addEventListener('resize', closeContextMenu)
    window.addEventListener('keydown', handleKeydown)
  }

  function cleanupMenuListeners() {
    document.removeEventListener('click', closeContextMenu)
    document.removeEventListener('scroll', closeContextMenu, true)
    window.removeEventListener('resize', closeContextMenu)
    window.removeEventListener('keydown', handleKeydown)
  }

  return {
    contextMenu,
    targetTab,
    isFirstNonFixed,
    isLastNonFixed,
    openContextMenu,
    closeContextMenu,
    setupMenuListeners,
    cleanupMenuListeners,
  }
}
