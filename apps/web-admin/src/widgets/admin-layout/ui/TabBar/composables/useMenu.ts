import { useEventListener } from '@vueuse/core'
import { computed, nextTick, reactive, ref } from 'vue'

/**
 * 菜单尚未完成布局时的兜底尺寸（px）。
 * 仅用于首帧临时定位；真实尺寸会在 nextTick 后通过 getBoundingClientRect 校正。
 */
const FALLBACK_MENU_WIDTH = 148
const FALLBACK_MENU_HEIGHT = 208
/** 菜单与视口边缘的最小间距（px） */
const VIEWPORT_GAP = 8

interface ContextMenu {
  visible: boolean
  x: number
  y: number
  targetPath: string
}

interface UseMenuManagerOptions {
  /**
   * 返回右键菜单根 DOM。
   * 用于测量真实宽高；未提供或尚未挂载时回退到兜底尺寸。
   */
  getMenuElement?: () => HTMLElement | null | undefined
}

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

function readMenuSize(el?: HTMLElement | null) {
  if (!el)
    return null

  const rect = el.getBoundingClientRect()
  // v-show=false 或尚未布局时宽高可能为 0，视为无效测量
  if (rect.width <= 0 || rect.height <= 0)
    return null

  return {
    width: rect.width,
    height: rect.height,
  }
}

/**
 * TabBar 右键菜单状态与关闭监听。
 *
 * 只负责：
 * - visible / x / y / targetPath
 * - 打开定位与 dismiss 监听会话
 *
 * 命令 disabled/hidden 状态改由 useTabCommandState 统一计算。
 */
export function useMenuManager(options: UseMenuManagerOptions = {}) {
  const contextMenu = reactive<ContextMenu>({
    visible: false,
    x: 0,
    y: 0,
    targetPath: '',
  })

  /**
   * 是否处于“菜单打开后的 dismiss 监听会话”。
   * false 时 document/window target 为 null，useEventListener 不会挂上真实监听。
   */
  const dismissActive = ref(false)
  /**
   * 打开会话令牌：
   * - nextTick 异步激活/校正时用来丢弃过期回调
   * - close 时递增，避免“已关闭却又被重新激活”
   */
  let dismissSessionToken = 0

  const documentTarget = computed(() => (dismissActive.value ? document : null))
  const windowTarget = computed(() => (dismissActive.value ? window : null))

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape')
      closeContextMenu()
  }

  // 在 setup 作用域声明：组件卸载时 VueUse/watch 会自动清理
  // target 为 null 时不会注册真实 DOM 监听
  useEventListener(documentTarget, 'click', closeContextMenu)
  useEventListener(documentTarget, 'scroll', closeContextMenu, true)
  useEventListener(windowTarget, 'resize', closeContextMenu)
  useEventListener(windowTarget, 'keydown', handleKeydown)

  function resolveMenuElement() {
    return options.getMenuElement?.() ?? null
  }

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

  function openContextMenu(e: MouseEvent, fullPath: string) {
    e.preventDefault()

    const pointerX = e.clientX
    const pointerY = e.clientY

    contextMenu.targetPath = fullPath
    contextMenu.visible = true
    // 首帧：菜单可能尚未布局，先用兜底尺寸避免直接贴边穿出视口
    applyMenuPosition(pointerX, pointerY, readMenuSize(resolveMenuElement()))

    // 延后：1) 用真实 DOM 尺寸二次夹紧  2) 再激活 dismiss 监听
    const token = ++dismissSessionToken
    nextTick(() => {
      if (token !== dismissSessionToken || !contextMenu.visible)
        return

      applyMenuPosition(pointerX, pointerY, readMenuSize(resolveMenuElement()))
      dismissActive.value = true
    })
  }

  function closeContextMenu() {
    // 使尚未执行的 nextTick(activate/reposition) 失效
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
