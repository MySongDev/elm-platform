import type { RouteLocationNormalizedLoaded, Router } from 'vue-router'
import type { TabCommand } from '../model/tabCommands'
import type { TabItem, useTabsStore } from '@/entities/tab'
import { DEFAULT_HOME_PATH } from '@/shared/config/paths'

type TabsStore = ReturnType<typeof useTabsStore>

interface UseTabActionsOptions {
  route: RouteLocationNormalizedLoaded
  router: Router
  tabsStore: TabsStore
  contextMenu: {
    visible: boolean
    targetPath: string
  }
  closeContextMenu: () => void
}

/**
 * TabBar 的全部 tab 操作：点击切换、× 关闭、下拉与右键菜单命令。
 *
 * 意图：把"store 状态变更 → 路由跳转 → 关闭菜单"这条收尾序列收在一处。
 *   调用方：仅 TabBar/index.vue；它把这里的 handler 直接绑在模板事件上。
 *
 * 不负责：菜单的开关与定位（useMenuManager）、菜单项的 disabled/hidden
 *   判定（useTabCommandState）、store 内部数据规则（entities/tab）。
 */
export function useTabActions(options: UseTabActionsOptions) {
  const { route, router, tabsStore, contextMenu, closeContextMenu } = options

  /**
   * 仅当目标与当前路由不同时才 push。
   *
   * WHY 要判重：closeTab/closeAllTabs 的返回值常常就是"本来就待着的页面"
   *   （关的是非激活 tab、或关闭后落回当前页），重复 push 同一路径会产生
   *   多余的导航记录。
   */
  function pushWhenNeeded(fullPath: string | null) {
    if (fullPath && fullPath !== route.fullPath)
      router.push(fullPath)
  }

  function hasTab(fullPath: string) {
    return tabsStore.tabs.some((tab: TabItem) => tab.fullPath === fullPath)
  }

  /**
   * 兜底路径：preferred 还在 tab 列表就回它，否则退到最右一个 tab，
   * 列表为空时退到默认首页。
   *
   * WHY 用"最右 tab"而不是按顺序找下一个相邻 tab：
   *   closeLeftTabs 会把本 tab 左侧全删掉，"前一个"在数据上已不存在，
   *   只有最右一个 tab 在两个方向上都一定还活着。
   */
  function getFallbackPath(preferredPath: string) {
    return hasTab(preferredPath)
      ? preferredPath
      : tabsStore.tabs.at(-1)?.fullPath ?? DEFAULT_HOME_PATH
  }

  /**
   * closeLeftTabs / closeRightTabs 共用收尾：
   * 这两个 store 动作都不返回值、不更新 activeTab，若删掉了当前路由所在
   * 的 tab，需要从这里把路由带到兜底页，否则 URL 与 tab 列表脱节。
   *
   * 注：home tab 不可关闭（isTabClosable），删除它永远不会发生。
   */
  function pushFallbackIfActiveClosed(preferredPath: string) {
    if (!hasTab(route.fullPath))
      pushWhenNeeded(getFallbackPath(preferredPath))
  }

  /**
   * 重挂缓存：store 内通过 splice + nextTick 插回实现（Vue patch 对同 key
   * 只 update 不重挂，必须让 key 先消失一帧，机制见 store.reloadTab）。
   *
   * WHAT IF: 这里若不收尾关菜单，右键菜单会停在原坐标，后续任何点击都会
   * 先把它 dismiss——用户看到的"刷新后弹层闪一下"就是这么来的。
   */
  function reloadTab(fullPath: string) {
    tabsStore.reloadTab(fullPath)
    closeContextMenu()
  }

  /**
   * 关闭单个 tab。
   *
   * store.closeTab 的返回值语义：只有关掉的是当前激活 tab 时才返回应导航到
   * 的下一个 fullPath；关的是非激活 tab 时返回 null（留在原地）。
   * null 对 pushWhenNeeded 是安全的——判重逻辑直接跳过。
   */
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

  /**
   * 把"下拉菜单"与"右键菜单"两条命令入口收敛到同一张表。
   *
   * WHY 用对象映射而非 if/else 链：新增命令时只需扩 TabCommand 联合类型
   *   加一行，缺映射会被 TS 直接拦住，而不是漏在某个分支里。
   *
   * WHY close-all 直接引用函数体而不带参数：它不作用于任何指定 tab，
   *   与其余"作用于 fullPath"的命令不同构，写成 (fullPath) => closeAllTabs()
   *   会让签名撒谎。
   */
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

  /**
   * tab 上的 × 按钮（TabBarItem @close）。
   *
   * WHY 要兜住"只剩最后一个 tab"：home tab 不可关闭（store 的
   *   isTabClosable），tabs 数 ≤ 1 意味着"home 之外再没有别的"或
   *   "只剩一个可关 tab"。后者若允许关掉，用户停在无任何 tab 的
   *   空壳布局里——这是静默的坏状态，不报错。
   * WHAT IF: 删掉这个守卫 → 关掉唯一的普通 tab 后 tab 列表为空，
   *   布局还在但没有导航入口。
   */
  function handleCloseTab(fullPath: string) {
    if (tabsStore.tabs.length <= 1)
      return
    closeTab(fullPath)
  }

  /** 路由命令：下拉菜单只作用于当前激活 tab，因此目标恒为 route.fullPath。 */
  function handleDropdownCommand(command: TabCommand) {
    runCommand(command, route.fullPath)
  }

  /**
   * 右键菜单命令：目标是"右键的那个 tab"（contextMenu.targetPath），
   * 而不是当前激活 tab。右键目标与激活 tab 可以不同，两者不能混用。
   */
  function handleContextMenuCommand(command: TabCommand) {
    runCommand(command, contextMenu.targetPath)
  }

  function handleTabClick(fullPath: string) {
    if (fullPath === route.fullPath)
      return
    router.push(fullPath)
  }

  return {
    handleCloseTab,
    handleDropdownCommand,
    handleContextMenuCommand,
    handleTabClick,
  }
}
