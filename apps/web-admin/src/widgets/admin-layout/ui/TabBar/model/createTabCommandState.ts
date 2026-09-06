import type { TabCommandState } from './tabCommands'
import type { TabItem } from '@/entities/tab/model/types'
import { isTabClosable } from '@/entities/tab/model/lib'

/**
 * 根据页签列表 + 目标 fullPath，生成命令菜单所需的统一状态。
 *
 * 单目标模型：
 * - dropdown：targetFullPath = 当前路由
 * - contextmenu：targetFullPath = 右键目标
 *
 * 不再维护 current/target 双字段；一次状态只描述“本次命令针对的那个 tab”。
 */
export function createTabCommandState(
  tabs: TabItem[],
  targetFullPath?: string | null,
): TabCommandState {
  const onlyOneTab = tabs.length <= 1
  const closableCount = tabs.filter(isTabClosable).length
  const index = targetFullPath
    ? tabs.findIndex(tab => tab.fullPath === targetFullPath)
    : -1
  const targetTab = index >= 0 ? tabs[index] : undefined
  const fixed = targetTab?.fixed ?? false
  const closable = targetTab ? isTabClosable(targetTab) : false
  const firstNonFixed = index <= 0
    || tabs.slice(0, index).every(tab => !isTabClosable(tab))
  const lastNonFixed = index === -1
    || tabs.slice(index + 1).every(tab => !isTabClosable(tab))

  return {
    fixed,
    closable,
    firstNonFixed,
    lastNonFixed,
    onlyOneTab,
    closableCount,
  }
}
