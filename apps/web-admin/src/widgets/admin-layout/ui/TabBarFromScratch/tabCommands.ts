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

export interface TabCommandState {
  currentFixed: boolean
  currentClosable: boolean
  firstNonFixed: boolean
  lastNonFixed: boolean
  onlyOneTab: boolean
  closableCount: number
}

interface TabCommandConfig {
  command: TabCommand
  labelKey: string
  icon: Component
  divided?: boolean
  disabled?: (state: TabCommandState) => boolean
  hidden?: (state: TabCommandState) => boolean
}

export type TabCommandView = Omit<TabCommandConfig, 'disabled' | 'hidden'> & {
  disabled: boolean
}

const tabCommands: TabCommandConfig[] = [
  {
    command: 'reload',
    labelKey: 'tabs.reload',
    icon: IconEpRefresh,
  },
  {
    command: 'close-current',
    labelKey: 'tabs.closeCurrent',
    icon: IconEpClose,
    hidden: state => state.onlyOneTab,
    disabled: state => state.currentFixed || !state.currentClosable,
  },
  {
    command: 'close-left',
    labelKey: 'tabs.closeLeft',
    icon: IconEpBack,
    divided: true,
    hidden: state => state.onlyOneTab,
    disabled: state => state.firstNonFixed,
  },
  {
    command: 'close-right',
    labelKey: 'tabs.closeRight',
    icon: IconEpRight,
    hidden: state => state.onlyOneTab,
    disabled: state => state.lastNonFixed,
  },
  {
    command: 'close-others',
    labelKey: 'tabs.closeOthers',
    icon: IconEpCircleClose,
    divided: true,
    hidden: state => state.onlyOneTab,
    disabled: state => state.closableCount <= 1,
  },
  {
    command: 'close-all',
    labelKey: 'tabs.closeAll',
    icon: IconEpMinus,
    hidden: state => state.onlyOneTab,
    disabled: state => state.closableCount === 0,
  },
]

export function getTabCommands(state: TabCommandState): TabCommandView[] {
  return tabCommands
    .filter(item => !item.hidden?.(state))
    .map(item => ({
      ...item,
      disabled: item.disabled?.(state) ?? false,
    }))
}
