import type { TabItem, useTabsStore } from '@/entities/tab'
import { computed, reactive } from 'vue'
import { isTabClosable } from '@/entities/tab'
import { getContextMenuPosition } from './tabMenu'

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

  const targetTab = computed(() =>
    tabsStore.tabs.find((tab: TabItem) => tab.fullPath === contextMenu.targetPath),
  )

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
    const position = getContextMenuPosition({
      clientX: e.clientX,
      clientY: e.clientY,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      menuWidth: MENU_WIDTH,
      menuHeight: MENU_HEIGHT,
      gap: VIEWPORT_GAP,
    })

    contextMenu.x = position.x
    contextMenu.y = position.y
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
