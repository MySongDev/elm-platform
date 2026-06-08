import type { ActionConfig, ActionVisibilityContext } from './types'

/**
 * 计算当前可见的动作列表
 *
 * 动作展示必须同时满足：
 * 1. 如果传入 availableActions，动作 key 必须包含在其中
 * 2. 如果配置了 permission，当前用户必须拥有权限
 * 3. 如果配置了 visible(record)，必须返回 true
 */
export function getVisibleActions<A extends string>(
  actionMap: Record<A, ActionConfig>,
  context: ActionVisibilityContext,
): Array<{ action: A } & ActionConfig> {
  const { availableActions, hasPermission, record } = context

  return (Object.keys(actionMap) as A[])
    .filter((action) => {
      // 条件 1：后端返回的可用动作
      if (!availableActions.includes(action)) {
        return false
      }

      const config = actionMap[action]

      // 条件 2：前端权限检查
      if (config.permission && !hasPermission(config.permission)) {
        return false
      }

      // 条件 3：自定义可见性
      if (config.visible && !config.visible(record)) {
        return false
      }

      return true
    })
    .map(action => ({
      action,
      ...actionMap[action],
    }))
}
