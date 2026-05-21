/**
 * @file 页签状态
 * @domain entities/tab
 * @description 管理后台多页签、活动页签和 KeepAlive include 列表，是布局页签栏的状态边界。
 */

import type { RouteLocationNormalized } from 'vue-router'
import type { TabItem } from './types'
import { defineStore } from 'pinia'
import { computed, nextTick, ref } from 'vue'
import { DEFAULT_HOME_PATH } from '@/shared/config/paths'
import { getTabKey, isTabClosable, moveHomeTabFirst, routeToTab } from './lib'

/**
 * @description 有副作用：创建页签 store，所有 action 都会修改页签状态或触发 nextTick 重建缓存。
 * @returns 页签集合、活动页签和页签操作函数。
 */
export const useTabsStore = defineStore('tabs', () => {
  const tabs = ref<TabItem[]>([])
  const activeTab = ref('')

  const cachedViews = computed(() =>
    tabs.value
      .map(t => t.cacheName || t.name)
      .filter((name): name is string => !!name),
  )

  function ensureHomeTabFirst() {
    const orderedTabs = moveHomeTabFirst(tabs.value)
    if (orderedTabs !== tabs.value)
      tabs.value = orderedTabs
  }

  function addTab(route: RouteLocationNormalized) {
    const meta = route.meta ?? {}
    if (meta.hiddenTag || !meta.title)
      return

    const nextTab = routeToTab(route)
    activeTab.value = nextTab.key

    const exist = tabs.value.find(t => getTabKey(t) === nextTab.key)
    if (exist) {
      Object.assign(exist, nextTab)
      ensureHomeTabFirst()
      return
    }

    tabs.value.push(nextTab)
    ensureHomeTabFirst()
  }

  function shouldMoveActiveTab(tab: TabItem, fullPath: string) {
    return activeTab.value === getTabKey(tab) || tab.fullPath === fullPath
  }

  function getNextActiveTab(index: number) {
    return tabs.value[index] ?? tabs.value[index - 1]
  }

  function closeTab(fullPath: string): string | null {
    const idx = tabs.value.findIndex(t => t.fullPath === fullPath)
    if (idx === -1)
      return null

    const tab = tabs.value[idx]
    if (!isTabClosable(tab))
      return null

    tabs.value.splice(idx, 1)

    if (shouldMoveActiveTab(tab, fullPath)) {
      const next = getNextActiveTab(idx)
      activeTab.value = next ? getTabKey(next) : DEFAULT_HOME_PATH
      return next?.fullPath ?? DEFAULT_HOME_PATH
    }
    return null
  }

  function closeOtherTabs(fullPath: string) {
    tabs.value = tabs.value.filter(
      t => !isTabClosable(t) || t.fullPath === fullPath,
    )
    ensureHomeTabFirst()
    const active = tabs.value.find(t => t.fullPath === fullPath)
    activeTab.value = active ? getTabKey(active) : fullPath
  }

  function closeLeftTabs(fullPath: string) {
    const idx = tabs.value.findIndex(t => t.fullPath === fullPath)
    if (idx <= 0)
      return
    tabs.value = tabs.value.filter(
      (t, i) => !isTabClosable(t) || i >= idx,
    )
    ensureHomeTabFirst()
  }

  function closeRightTabs(fullPath: string) {
    const idx = tabs.value.findIndex(t => t.fullPath === fullPath)
    if (idx === -1)
      return
    tabs.value = tabs.value.filter(
      (t, i) => !isTabClosable(t) || i <= idx,
    )
    ensureHomeTabFirst()
  }

  function closeAllTabs(): string {
    tabs.value = tabs.value.filter(t => !isTabClosable(t))
    ensureHomeTabFirst()
    const first = tabs.value[0]
    activeTab.value = first ? getTabKey(first) : DEFAULT_HOME_PATH
    return first?.fullPath ?? DEFAULT_HOME_PATH
  }

  function initFixedTabs(routes: RouteLocationNormalized[]) {
    routes.forEach((route) => {
      if (route.meta?.fixedTag && route.meta?.title) {
        const nextTab = routeToTab(route)
        const exist = tabs.value.find(t => getTabKey(t) === nextTab.key)
        if (!exist) {
          tabs.value.push(nextTab)
        }
      }
    })
    ensureHomeTabFirst()
  }

  function getTitle(tab: TabItem, translate: (key: string) => string): string {
    return translate(tab.title)
  }

  function clearTabs() {
    tabs.value = []
    activeTab.value = ''
  }

  function reloadTab(fullPath: string) {
    const idx = tabs.value.findIndex(t => t.fullPath === fullPath)
    if (idx === -1)
      return
    const tab = tabs.value[idx]
    if (tab.cacheName || tab.name) {
      tabs.value.splice(idx, 1)
      nextTick(() => {
        tabs.value.splice(idx, 0, tab)
      })
    }
  }

  return {
    tabs,
    activeTab,
    cachedViews,
    addTab,
    closeTab,
    closeOtherTabs,
    closeLeftTabs,
    closeRightTabs,
    closeAllTabs,
    initFixedTabs,
    getTitle,
    clearTabs,
    reloadTab,
  }
}, {
  persist: {
    key: 'elm-admin-tabs',
    storage: localStorage,
    pick: ['tabs', 'activeTab'],
  },
})
