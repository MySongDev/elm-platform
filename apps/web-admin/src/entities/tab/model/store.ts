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
 *
 * WHY persist 只 pick tabs/activeTab 而不整体持久化：
 *   整体持久化会把 activeTab 的 key 也存进 localStorage。key 在 routeToTab 里
 *   允许被 meta.tabKey 改写（resolveTabKey），若某次部署改了 tabKey 的取值，
 *   旧 key 与当前任何 tab 都对不上，activeTab 会静默失效（无匹配 → 不渲染高亮，也不报错）。
 *   只持久化原始列表，key 缺失时 getTabKey 有 fullPath 兜底。
 */
export const useTabsStore = defineStore('tabs', () => {
  // state
  const tabs = ref<TabItem[]>([])
  const activeTab = ref('')

  /**
   * KeepAlive 的 include 名单，唯一消费方是 MainContent 的 <keep-alive :include>。
   *
   * WHY 契约是"匹配组件自身的 name"而非 tab.key：
   *   keep-alive 靠组件 name 判定是否复用。页面 defineOptions 的 name 与后端菜单
   *   name 不一致时，对应 tab 的缓存会静默失效——不报错，只是切走再切回页面重新挂载。
   *   当前 system/* 与 monitor/* 四个页面就处在这个状态（详见 MainContent 注释）。
   *
   * WHY cacheName || name：TabItem.name 已废弃（types.ts 标记 @deprecated），
   *   保留它只为兼容仍存着 name 字段的旧数据（getTabKey 同理有 fullPath 兜底）。
   *   新数据写的是 cacheName（routeToTab 生成），name 恒为 undefined，走到 || 右侧的是旧数据。
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
   * WHY 比较"引用"而非"下标"：moveHomeTabFirst 在 home 已在首位时
   *   返回原数组引用；若改成比较 index === 0 再判断，会多触发一次
   *   tabs.value 的响应式写入，下游所有订阅者（TabBar 渲染、cachedViews 计算）
   *   都会无意义地跑一轮。
   */
  function ensureHomeTabFirst() {
    const orderedTabs = moveHomeTabFirst(tabs.value)
    if (orderedTabs !== tabs.value)
      tabs.value = orderedTabs
  }

  /**
   * 路由守卫（app/router/guards/tabSyncGuard.ts）在每次路由解析完成后调用，
   * 把当前路由挂成 tab。
   *
   * 副作用：修改 activeTab、tabs（去重或 push）。
   *
   * WHY 用 Object.assign(exist, nextTab) 而不是整体替换：
   *   keep-alive 按组件 name 复用实例，实例内部状态（表单、滚动位置）挂在
   *   组件实例上而非 tab 数据上。replace 会丢失引用，下游任何按引用比较的逻辑
   *   （如 watch 监听某个 tab 对象）会误判"tab 变了"。
   *   assign 保留原引用，同时把 path/fullPath 等字段刷新为本次路由的值
   *   （同名 tab 可能带着不同 query 打开，fullPath 会变）。
   *
   * WHAT IF: 删掉 Object.assign 这一句（只保留 ensureHomeTabFirst）→
   *   用户从 /orders?a=1 跳去 /orders?a=2，tab 的 fullPath 仍停留在旧值，
   *   点 tab 跳回的是旧的 query。
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

  function shouldMoveActiveTab(tab: TabItem) {
    return activeTab.value === getTabKey(tab)
  }

  function getNextActiveTab(index: number) {
    return tabs.value[index] ?? tabs.value[index - 1]
  }

  /**
   * 关闭指定 tab，返回下一跳路径供调用方决定是否需要 router.push。
   *
   * 返回语义：
   *   - null：tab 不存在 / 不可关（home、fixed），或关的是非激活 tab
   *     （activeTab 不动，留在原地）。
   *   - string：关的是当前激活 tab，返回值是应导航到的下一个 fullPath
   *     （紧邻右侧或左侧 tab；都没有时退到 DEFAULT_HOME_PATH）。
   *
   * 调用方按"返回值非 null 就 push"的模式收尾（useTabActions.closeTab）。
   *
   * WHY getNextActiveTab 先查右、右空再查左（tabs[index] ?? tabs[index-1]）：
   *   被删 tab 的"下一个"在用户视觉上最直觉的是右边紧邻；右侧没有时（删的是
   *   最右 tab）退到左侧紧邻。两者都没有（只留 home）时 activeTab 直接落到
   *   DEFAULT_HOME_PATH，home tab 不可关闭，因此 tabs 永远非空。
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
   * 只保留目标 tab（及其左侧的 home/fixed 锚点），把中间其它可关 tab 全删掉。
   *
   * WHY 返回值是 void（不返回下一跳路径，与 closeTab 不同）：
   *   此操作的目标就是 fullPath 本身，activeTab 一定落到这里，调用方无需再跳。
   *   调用方（useTabActions.closeOtherTabs）在调用后会 pushWhenNeeded(fullPath)
   *   兜住"当前激活 tab 不是目标"的情形。
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
   * WHY 两个边界判断不对称：
   *   closeLeftTabs 用 `idx <= 0`——idx=0 意味着目标本身就是 home（home 不可关，
   *   而它又永远在首位），左侧根本无东西可关，直接返回。
   *   closeRightTabs 用 `idx === -1`——目标不存在时才无意义；idx=0（目标是 home）
   *   时右侧有东西可关，过滤后 home 自己（i <= 0）会保留，行为正常。
   *   两者共用一个判断会误伤"右侧关闭 home 左侧"的合法场景。
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
   * 边界判断与 closeLeftTabs 不对称，原因见 closeLeftTabs 注释。
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
   * WHY 返回值是 string 而非 string | null：
   *   关闭后 tabs 至少剩 home（home 不可关），first 永不为 undefined，
   *   `first?.fullPath ?? DEFAULT_HOME_PATH` 的兜底是防御性写法，实际总返回真实 tab。
   *   调用方（useTabActions.closeAllTabs）直接 push 返回值，无 null 分支。
   *
   * 与 closeOtherTabs 的区别：closeOtherTabs 保留"指定目标 + home/fixed"，
   *   closeAllTabs 不保留指定目标，只留系统锚点。
   */
  function closeAllTabs(): string {
    tabs.value = tabs.value.filter(t => !isTabClosable(t))
    ensureHomeTabFirst()
    const first = tabs.value[0]
    activeTab.value = first ? getTabKey(first) : DEFAULT_HOME_PATH
    return first?.fullPath ?? DEFAULT_HOME_PATH
  }

  /**
   * 登录成功后的初始化入口，从后端拉到的固定路由列表批量注册 tab。
   *
   * WHY 只在不存在时 push：persist 里存的是用户上一次的完整 tab 列表，
   *   重新登录后可能已包含部分固定 tab；若无脑 push，同一 fullPath 的 tab 会重复。
   *   与 addTab 不同，这里不接受"已存在就刷新引用"——固定路由是系统级定义，
   *   其 title/icon 不会变，刷新引用是多此一举。
   *
   * 现状：当前代码库内无调用方（登录后实际由 addTab 通过路由守卫逐条追加），
   *   保留导出以便后续需要批量注册时使用；勿误删，它不是死代码。
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

  function getTitle(tab: TabItem, translate: (key: string) => string): string {
    return translate(tab.title)
  }

  /**
   * 退出登录时调用（widgets/admin-layout/ui/TopNavigation/UserMenu）。
   *
   * WHY 只清 tabs 与 activeTab、不清 persist key：
   *   persist 由 Pinia 插件统一负责，清 key 应由它完成。这里清的是"运行时"
   *   状态，配合路由跳转回登录页；下次登录 addTab 会重新填充。
   *
   * WHAT IF: 若这里漏清 activeTab → 登录页残留上一次会话的 activeTab key，
   *   该 key 对应的 tab 已不存在（tabs 被清空），TabBar 高亮会短暂落在
   *   一个不存在的 tab 上，直到下一个 addTab 覆盖。
   */
  function clearTabs() {
    tabs.value = []
    activeTab.value = ''
  }

  /**
   * 重挂当前 tab 的 keep-alive 缓存，让"刷新页签"真正清空页面状态。
   *
   * WHY 先 splice 再 nextTick 插回：
   *   Vue patch 对同 key 节点只 update、不重新挂载（isSameVNodeType 判据是
   *   type + key），直接改数据不会让 keep-alive 释放该组件的实例。
   *   中间那帧列表里 key 消失，缓存才真正被清掉。
   *
   * WHY nextTick 而不是同步插回：
   *   同一同步块内 splice 掉再插回，列表在该次 patch 里从未真正少过这一项，
   *   Vue 不会把它视为"消失过"，重挂不生效。
   *
   * WHY 只在 tab 有 cacheName/name 时才走这套流程：
   *   meta.keepAlive === false 的页面没有缓存（resolveCacheName 返回 undefined），
   *   直接 router.push 重载即可；走 splice 流程会让无缓存的页面也多做一次无意义的重挂。
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
