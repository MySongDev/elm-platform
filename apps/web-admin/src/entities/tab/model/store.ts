/**
 * @file 页签状态
 * @domain entities/tab
 * @description 管理多页签、活动页签和 KeepAlive include 列表，是布局页签栏的状态边界。
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
  // state
  const tabs = ref<TabItem[]>([])
  const activeTab = ref('')

  /**
   * KeepAlive 的 include 名单，唯一消费方是 MainContent 的 <keep-alive :include>。
   *
   * keep-alive 按组件自身的 name 判断是否复用，与 tab.key 无关；页面
   * defineOptions 的 name 与后端菜单 name 不一致时，缓存会静默失效（不报错，
   * 只是切走再切回重新挂载）。cacheName || name 是给仍存着已废弃 name 字段的旧数据兜底。
   */
  const cachedViews = computed(() =>
    tabs.value
      .map(t => t.cacheName || t.name)
      .filter((name): name is string => !!name),
  )

  // actions
  /**
   * home tab 永远固定在第一位。
   *
   * moveHomeTabFirst 在 home 已在首位时返回原数组引用，
   * 故这里比较引用而非下标，避免无谓地重写 tabs 触发一轮响应式更新。
   */
  function ensureHomeTabFirst() {
    const orderedTabs = moveHomeTabFirst(tabs.value)
    if (orderedTabs !== tabs.value)
      tabs.value = orderedTabs
  }

  /**
   * 路由守卫（app/router/guards/tabSyncGuard.ts）在路由解析完成后调用，把当前路由挂成 tab。
   *
   * 副作用：修改 activeTab、tabs（去重或 push）。
   * 已存在的 tab 用 Object.assign 原地刷新而非整体替换：keep-alive 按 name
   * 复用实例，整体替换会丢引用、误判 tab 变化，且 fullPath 会随 query 变。
   */
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

  /** 目标 tab 是否正是当前激活页签（按其 key 比对）。 */
  function shouldMoveActiveTab(tab: TabItem) {
    return activeTab.value === getTabKey(tab)
  }

  /** 取被删下标处的新激活 tab：先看右邻，没有再退到左邻；越界由 closeTab 兜底。 */
  function getNextActiveTab(index: number) {
    return tabs.value[index] ?? tabs.value[index - 1]
  }

  /**
   * 关闭指定 tab，返回下一跳路径供调用方决定是否需要 router.push。
   *
   * 返回 null 表示 tab 不存在 / 不可关 / 关的是非激活 tab（留在原地）；
   * 返回 string 表示关的是当前激活 tab，值为应导航到的下一个 fullPath
   * （右邻优先、退左邻、都没有则回 DEFAULT_HOME_PATH）。调用方按
   * "非 null 就 push" 收尾（useTabActions.closeTab）。
   */
  function closeTab(fullPath: string): string | null {
    const idx = tabs.value.findIndex(t => t.fullPath === fullPath)
    if (idx === -1)
      return null

    const tab = tabs.value[idx]
    if (!isTabClosable(tab))
      return null

    tabs.value.splice(idx, 1)

    if (shouldMoveActiveTab(tab)) {
      const next = getNextActiveTab(idx)
      activeTab.value = next ? getTabKey(next) : DEFAULT_HOME_PATH
      return next?.fullPath ?? DEFAULT_HOME_PATH
    }
    return null
  }

  /**
   * 只保留目标 tab 及其左侧的 home/fixed 锚点，删掉中间其它可关 tab。
   *
   * 返回 void：目标即 fullPath，activeTab 必落到它，调用方无需再跳；
   * 调用方（useTabActions.closeOtherTabs）会 pushWhenNeeded(fullPath) 兜底。
   */
  function closeOtherTabs(fullPath: string) {
    tabs.value = tabs.value.filter(
      t => !isTabClosable(t) || t.fullPath === fullPath,
    )
    ensureHomeTabFirst()
    const active = tabs.value.find(t => t.fullPath === fullPath)
    activeTab.value = active ? getTabKey(active) : fullPath
  }

  /**
   * 关闭目标 tab 左侧所有可关 tab（保留 home/fixed）。
   *
   * 边界用 `idx <= 0`：home 永在首位且不可关，故下标 0 一定是 home，
   * 目标是 home（idx=0）时左侧本就无物可关，且 `<= 0` 同时覆盖了
   * 目标不存在（idx=-1）。left 的"无物可关"与"目标是 home"重合，
   * 所以一个 `<= 0` 就够了——这正是与 closeRightTabs 的 `=== -1` 不对称的由来。
   */
  function closeLeftTabs(fullPath: string) {
    const idx = tabs.value.findIndex(t => t.fullPath === fullPath)
    if (idx <= 0)
      return
    tabs.value = tabs.value.filter(
      (t, i) => !isTabClosable(t) || i >= idx,
    )
    ensureHomeTabFirst()
  }

  /**
   * 关闭目标 tab 右侧所有可关 tab（保留 home/fixed）。
   *
   * 边界用 `idx === -1`（仅目标不存在时返回），而不是像 closeLeftTabs 用
   * `<= 0`：目标是 home（idx=0，右侧可能有可关的普通 tab）是合法操作，
   * 若照抄 `<= 0` 会把"关闭 home 右侧"误判为无效而直接返回。
   * right 的"无物可关"（目标是最后一位）由 filter 的 `i <= idx` 自然处理，
   * 无需提前 return，故这里唯一无效情形只剩 `idx === -1`。
   */
  function closeRightTabs(fullPath: string) {
    const idx = tabs.value.findIndex(t => t.fullPath === fullPath)
    if (idx === -1)
      return
    tabs.value = tabs.value.filter(
      (t, i) => !isTabClosable(t) || i <= idx,
    )
    ensureHomeTabFirst()
  }

  /**
   * 关闭所有可关 tab，只保留 home/fixed 锚点。
   *
   * 返回值总是 string（home 不可关，关闭后至少剩它），调用方
   * （useTabActions.closeAllTabs）直接 push，无 null 分支。
   * 与 closeOtherTabs 的区别：这里不保留任何指定目标，只留系统锚点。
   */
  function closeAllTabs(): string {
    tabs.value = tabs.value.filter(t => !isTabClosable(t))
    ensureHomeTabFirst()
    const first = tabs.value[0]
    activeTab.value = first ? getTabKey(first) : DEFAULT_HOME_PATH
    return first?.fullPath ?? DEFAULT_HOME_PATH
  }

  /**
   * 登录后从后端固定路由列表批量注册 tab。
   *
   * 只在不存在时 push：persist 可能已含上次的固定 tab，无脑 push 会重复。
   * 现状无调用方（登录后由 addTab 经路由守卫逐条追加），保留导出备用，勿误删。
   */
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

  /** 取页签标题的翻译文案（消费方：ui/TabBar/index.vue）。 */
  function getTitle(tab: TabItem, translate: (key: string) => string): string {
    return translate(tab.title)
  }

  /**
   * 退出登录时调用（layouts/admin-layout/ui/TopNavigation/UserMenu）。
   *
   * 只清运行时状态，不清 persist key（由 Pinia 插件负责）；下次登录 addTab 会重新填充。
   */
  function clearTabs() {
    tabs.value = []
    activeTab.value = ''
  }

  /**
   * 重挂当前 tab 的 keep-alive 缓存，让"刷新页签"真正清空页面状态。
   *
   * Vue patch 对同 key 节点只 update 不重挂，必须先 splice 让 key 消失一帧、
   * 再 nextTick 插回，缓存才会真正释放。只在有 cacheName/name（即真的缓存了）
   * 才走这套流程；无缓存的页面直接 router.push 重载即可。
   *
   * 调用方：useTabActions.reloadTab（TabBar 右键菜单"刷新"命令）。
   */
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
