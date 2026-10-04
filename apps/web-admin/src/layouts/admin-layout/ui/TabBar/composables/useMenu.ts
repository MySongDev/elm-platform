import { useEventListener } from '@vueuse/core'
import { computed, nextTick, reactive, ref } from 'vue'

/**
 * 菜单尚未完成布局时的兜底尺寸（px）。
 * WHY 需要兜底：visible 刚置 true 时 Teleport 还没把菜单渲染进 DOM，
 *   量出来的宽高是 0，直接拿 0 去 clamp 会把菜单算到视口左上角。
 */
const FALLBACK_MENU_WIDTH = 148
const FALLBACK_MENU_HEIGHT = 208

/** 菜单与视口边缘的最小间距（px） */
const VIEWPORT_GAP = 8

interface ContextMenu {
  visible: boolean
  /** 菜单左上角的 fixed 坐标（视口坐标系，不是文档坐标系） */
  x: number
  y: number
  /**
   * 本次右键指向的那个 tab 的 fullPath。
   *
   * WHY 不能用 route.fullPath 顶替：右键目标与当前激活 tab 可以不是同一个
   *   （右键一个非激活 tab），而所有菜单命令都必须作用于"右键的那个"。
   *   换成 route.fullPath，右键 A 却关掉了 B。
   *
   * 消费者：TabBar/index.vue 的 useTabCommandState(() => contextMenu.targetPath)
   *   算菜单项 disabled/hidden；useTabActions 的命令执行也直接读它。
   */
  targetPath: string
}

interface UseMenuManagerOptions {
  /**
   * 返回右键菜单的根 DOM，用于测量真实宽高。
   *
   * WHY 收函数而不是 ref：菜单经 Teleport + defineExpose 暴露 rootEl，
   *   视图层的 ref 在 Teleport 完成前可能还是 null；收 getter 让本模块每次要用时再取，
   *   不依赖 Teleport 时机，同时让它不依赖具体组件、可直接单测。
   */
  getMenuElement?: () => HTMLElement | null | undefined
}

/**
 * 把鼠标坐标 + 菜单尺寸夹紧到视口内，算出最终的 left / top。
 *
 * WHY 必须夹紧：菜单有自身尺寸，直接贴在鼠标位置上，右下角右键时会有一半在屏幕外。
 *
 * @throws {Error} never —— 纯函数，无副作用
 */
function clampMenuPosition(
  pointerX: number,
  pointerY: number,
  menuWidth: number,
  menuHeight: number,
) {
  const maxLeft = window.innerWidth - menuWidth - VIEWPORT_GAP
  const maxTop = window.innerHeight - menuHeight - VIEWPORT_GAP

  return {
    x: Math.max(VIEWPORT_GAP, Math.min(pointerX, maxLeft)),
    y: Math.max(VIEWPORT_GAP, Math.min(pointerY, maxTop)),
  }
}

/**
 * 读菜单真实尺寸。返回 null 表示"量不到"，调用方应走 FALLBACK 尺寸。
 *
 * 返回 null 的两种情况：元素拿不到（Teleport 未完成 / 已销毁），
 * 或宽高为 0（v-show=false 时元素 display:none，rect 全 0）。
 */
function readMenuSize(el?: HTMLElement | null) {
  if (!el)
    return null

  const rect = el.getBoundingClientRect()
  if (rect.width <= 0 || rect.height <= 0)
    return null

  return {
    width: rect.width,
    height: rect.height,
  }
}

/**
 * TabBar 右键菜单的可见性、定位与 dismiss 会话。
 *
 * 意图：只管"菜单开着没有、在哪、什么时候该关"。
 *   不负责菜单项的 disabled/hidden——那由 useTabCommandState 统一算。
 *
 * 生命周期：4 个 useEventListener 声明在 setup 作用域，绑定当前组件的 setupScope，
 *   卸载时自动清理，本模块不需要（也不能）提供 cleanup。
 */
export function useMenuManager(options: UseMenuManagerOptions = {}) {
  const contextMenu = reactive<ContextMenu>({
    visible: false,
    x: 0,
    y: 0,
    targetPath: '',
  })

  /**
   * dismiss 监听是否处于激活状态。
   *
   * WHY 不全程挂监听：菜单没开时也监听 click，用户点任意 tab / 页面任意处
   *   都会触发一次无意义的 close + reactive 写入。
   *
   * WHY target 用 computed 而非手动 add/removeEventListener：
   *   VueUse 的 useEventListener 接 computed ref 时，值从 null 变成 document
   *   会自动挂上监听、变回 null 会自动摘掉，add/remove 天然配对。
   */
  const dismissActive = ref(false)

  /**
   * 打开会话令牌，用来作废已排队的 nextTick 回调。
   * 用普通 let 而非 ref：只需要同步比对值，不需要被模板或 watcher 观察。
   *
   * open 与 close 都递增它。任何一端的 nextTick 回调执行时先比对，
   *   不相等就说明"我排队期间已经发生过另一次 open 或 close"，直接放弃。
   *
   * WHY 不用 ref：避免每次 open/close 多触发一次无意义的 reactive 通知。
   * WHAT IF: 删掉 → 快速"开→关→开"，第一次 open 排的 nextTick 会在最后才跑，
   *   用旧坐标覆盖新菜单的位置，并把 dismissActive 又置 true（菜单已关但监听重新挂上）。
   */
  let dismissSessionToken = 0

  const documentTarget = computed(() => (dismissActive.value ? document : null))
  const windowTarget = computed(() => (dismissActive.value ? window : null))

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape')
      closeContextMenu()
  }

  // 菜单关闭时 target 为 null，VueUse 会跳过注册
  useEventListener(documentTarget, 'click', closeContextMenu)
  useEventListener(documentTarget, 'scroll', closeContextMenu, true)
  useEventListener(windowTarget, 'resize', closeContextMenu)
  useEventListener(windowTarget, 'keydown', handleKeydown)

  function resolveMenuElement() {
    return options.getMenuElement?.() ?? null
  }

  /**
   * 算位置并写进 contextMenu.x / y。size 为 null 时用 FALLBACK 尺寸。
   *
   * WHY 一次 open 里会调两次（本函数 + nextTick 里各一次）而不是只写一次：
   *   首帧量不到真实尺寸，只能用兜底值先算一个不出界的位置；
   *   真实尺寸到达后必须再算一次才能保证不出界。走同一个入口避免两条路径算出不同结果。
   */
  function applyMenuPosition(
    pointerX: number,
    pointerY: number,
    size?: {
      width: number
      height: number
    } | null,
  ) {
    const width = size?.width ?? FALLBACK_MENU_WIDTH
    const height = size?.height ?? FALLBACK_MENU_HEIGHT
    const next = clampMenuPosition(pointerX, pointerY, width, height)
    contextMenu.x = next.x
    contextMenu.y = next.y
  }

  /**
   * 打开右键菜单，菜单定位在鼠标位置。
   *
   * 意图：见函数头。本函数的关键在于"两步定位 + 延后激活监听"这三件事，
   *   分别对应 openContextMenu 内注释的 ORDER 三段。
   *
   * 副作用：写 contextMenu 的四个字段、递增 dismissSessionToken、挂 dismiss 监听（nextTick 之后）。
   */
  function openContextMenu(e: MouseEvent, fullPath: string) {
    // 不加这一句，原生右键菜单会和自定义菜单同时出现在屏幕上
    e.preventDefault()

    // 坐标必须在这里读：e 是同步派发的，nextTick 里再取已经不是这次右键的位置
    const pointerX = e.clientX
    const pointerY = e.clientY

    contextMenu.targetPath = fullPath
    contextMenu.visible = true

    // 首帧量不到尺寸，用兜底值先算一个不出界的位置；nextTick 里会拿真实尺寸重算覆盖
    applyMenuPosition(pointerX, pointerY, readMenuSize(resolveMenuElement()))

    const token = ++dismissSessionToken
    nextTick(() => {
      // 过期回调一律放弃：期间又 open 了别的 tab，或菜单已经关掉
      if (token !== dismissSessionToken || !contextMenu.visible)
        return

      // 此时 Teleport 已完成、真实宽高可测，重算一次修正兜底位置
      applyMenuPosition(pointerX, pointerY, readMenuSize(resolveMenuElement()))

      // ORDER: 必须延后到 nextTick 才激活。若在上面的同步段置 true，
      //   当前这次右键事件还会继续冒泡到 document，被 dismiss 的 click 监听捕获 → 菜单刚开就关。
      dismissActive.value = true
    })
  }

  /**
   * 关闭菜单，同时让所有尚未执行的 open 回调作废。
   *
   * 调用方：4 个 dismiss 监听；以及 useTabActions 里每个命令执行完的收尾。
   *
   * WHY 幂等性由调用方保证（dismiss 监听可能在菜单已关时再次触发）：
   *   本函数无前置判断，直接递增 token + 写两个字段。若被重复调用，
   *   token 会多递增一次，但已排队的 nextTick 回调仍会因"token 不匹配"
   *   正确放弃——重复关闭不会造成副作用，无需额外防抖。
   */
  function closeContextMenu() {
    // 先递增 token：已排队的 nextTick(open) 回调跑到时会发现不匹配而放弃，
    // 不会在菜单已关之后又把 dismissActive 置回 true
    dismissSessionToken += 1
    contextMenu.visible = false
    dismissActive.value = false
  }

  return {
    contextMenu,
    openContextMenu,
    closeContextMenu,
  }
}
