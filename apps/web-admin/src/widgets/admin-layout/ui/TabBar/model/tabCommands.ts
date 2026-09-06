import type { Component } from 'vue'
import {
  IconBack as IconEpBack,
  IconCircleClose as IconEpCircleClose,
  IconClose as IconEpClose,
  IconMinus as IconEpMinus,
  IconRefresh as IconEpRefresh,
  IconRight as IconEpRight,
} from '@iconify-prerendered/vue-ep'

export type TabCommand
  = | 'reload'
    | 'close-current'
    | 'close-left'
    | 'close-right'
    | 'close-others'
    | 'close-all'

export type TabCommandSource = 'dropdown' | 'contextmenu'

/**
 * 单目标命令状态：
 * 下拉/右键每次只针对一个 tab（route 或 context target），
 * 不再拆 current/target 双角色字段。
 */
export interface TabCommandState {
  /** 目标 tab 是否固定 */
  fixed: boolean
  /** 目标 tab 是否允许关闭 */
  closable: boolean
  /** 目标左侧是否已无可关闭 tab */
  firstNonFixed: boolean
  /** 目标右侧是否已无可关闭 tab */
  lastNonFixed: boolean
  /** 是否只剩一个页签 */
  onlyOneTab: boolean
  /** 当前可关闭 tab 数量 */
  closableCount: number
}

export interface TabCommandConfig {
  command: TabCommand
  labelKey: string
  icon: Component
  sources: TabCommandSource[]
  divided?: boolean
  disabled?: (state: TabCommandState) => boolean
  hidden?: (state: TabCommandState, source: TabCommandSource) => boolean
}

export type TabCommandView = Omit<TabCommandConfig, 'disabled' | 'hidden'> & {
  disabled: boolean
}

export const tabCommands: TabCommandConfig[] = [
  {
    command: 'reload',
    labelKey: 'tabs.reload',
    icon: IconEpRefresh,
    sources: ['dropdown', 'contextmenu'],
  },
  {
    command: 'close-current',
    labelKey: 'tabs.closeCurrent',
    icon: IconEpClose,
    sources: ['dropdown', 'contextmenu'],
    disabled: state =>
      state.fixed
      || !state.closable
      || state.onlyOneTab,
    hidden: state => state.onlyOneTab,
  },
  {
    command: 'close-left',
    labelKey: 'tabs.closeLeft',
    icon: IconEpBack,
    sources: ['dropdown', 'contextmenu'],
    divided: true,
    disabled: state => state.firstNonFixed,
    hidden: (state, source) => state.onlyOneTab || (source === 'contextmenu' && state.firstNonFixed),
  },
  {
    command: 'close-right',
    labelKey: 'tabs.closeRight',
    icon: IconEpRight,
    sources: ['dropdown', 'contextmenu'],
    disabled: state => state.lastNonFixed,
    hidden: state => state.onlyOneTab,
  },
  {
    command: 'close-others',
    labelKey: 'tabs.closeOthers',
    icon: IconEpCircleClose,
    sources: ['dropdown', 'contextmenu'],
    divided: true,
    disabled: state => state.closableCount <= 1,
    hidden: state => state.onlyOneTab,
  },
  {
    command: 'close-all',
    labelKey: 'tabs.closeAll',
    icon: IconEpMinus,
    sources: ['dropdown', 'contextmenu'],
    disabled: state => state.closableCount === 0,
    hidden: state => state.onlyOneTab,
  },
]

export function getTabCommands(source: TabCommandSource, state: TabCommandState): TabCommandView[] {
  return tabCommands
    .filter(item => item.sources.includes(source) && !(item.hidden?.(state, source)))
    .map(item => ({
      ...item,
      disabled: item.disabled?.(state) ?? false,
    }))
}
