import type { RouteLocationNormalizedLoaded, Router } from 'vue-router'
import type { TabCommand } from './tabCommands'
import type { TabItem, useTabsStore } from '@/entities/tab'
import { DEFAULT_HOME_PATH } from '@/shared/config/paths'
import { shouldNavigateTab } from './tabPresentation'

type TabsStore = ReturnType<typeof useTabsStore>

interface UseTabActionsOptions {
  route: RouteLocationNormalizedLoaded
  router: Router
  tabsStore: TabsStore
  contextMenu?: {
    visible: boolean
    targetPath: string
  }
  closeContextMenu?: () => void
}

export function useTabActions(options: UseTabActionsOptions) {
  const { route, router, tabsStore } = options
  const closeContextMenu = options.closeContextMenu ?? (() => {})

  function pushWhenNeeded(fullPath: string | null) {
    if (fullPath && shouldNavigateTab(fullPath, route.fullPath))
      router.push(fullPath)
  }

  function hasTab(fullPath: string) {
    return tabsStore.tabs.some((tab: TabItem) => tab.fullPath === fullPath)
  }

  function getFallbackPath(preferredPath: string) {
    return hasTab(preferredPath)
      ? preferredPath
      : tabsStore.tabs.at(-1)?.fullPath ?? DEFAULT_HOME_PATH
  }

  function pushFallbackIfActiveClosed(preferredPath: string) {
    if (!hasTab(route.fullPath))
      pushWhenNeeded(getFallbackPath(preferredPath))
  }

  function reloadTab(fullPath: string) {
    tabsStore.reloadTab(fullPath)
    closeContextMenu()
  }

  function closeTab(fullPath: string) {
    const next = tabsStore.closeTab(fullPath)
    pushWhenNeeded(next)
    closeContextMenu()
  }

  function closeOtherTabs(fullPath: string) {
    tabsStore.closeOtherTabs(fullPath)
    pushWhenNeeded(fullPath)
    closeContextMenu()
  }

  function closeLeftTabs(fullPath: string) {
    tabsStore.closeLeftTabs(fullPath)
    pushFallbackIfActiveClosed(fullPath)
    closeContextMenu()
  }

  function closeRightTabs(fullPath: string) {
    tabsStore.closeRightTabs(fullPath)
    pushFallbackIfActiveClosed(fullPath)
    closeContextMenu()
  }

  function closeAllTabs() {
    const next = tabsStore.closeAllTabs()
    pushWhenNeeded(next)
    closeContextMenu()
  }

  function runCommand(command: TabCommand, fullPath: string) {
    const commandMap: Record<TabCommand, () => void> = {
      'reload': () => reloadTab(fullPath),
      'close-current': () => closeTab(fullPath),
      'close-left': () => closeLeftTabs(fullPath),
      'close-right': () => closeRightTabs(fullPath),
      'close-others': () => closeOtherTabs(fullPath),
      'close-all': closeAllTabs,
    }

    commandMap[command]()
  }

  function handleTabClick(fullPath: string) {
    pushWhenNeeded(fullPath)
  }

  function handleCloseTab(fullPath: string) {
    if (tabsStore.tabs.length <= 1)
      return
    closeTab(fullPath)
  }

  function handleDropdownCommand(command: TabCommand) {
    runCommand(command, route.fullPath)
  }

  function handleContextMenuCommand(command: TabCommand) {
    runCommand(command, options.contextMenu?.targetPath ?? route.fullPath)
  }

  return {
    handleTabClick,
    handleCloseTab,
    handleDropdownCommand,
    handleContextMenuCommand,
  }
}
