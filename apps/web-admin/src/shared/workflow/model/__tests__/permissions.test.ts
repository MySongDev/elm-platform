import type { ActionConfig } from '../types'
import { describe, expect, it } from 'vitest'
import { getVisibleActions } from '../permissions'

describe('getVisibleActions', () => {
  const actionMap: Record<string, ActionConfig> = {
    APPROVE: {
      label: '通过',
      type: 'success',
      permission: 'REVIEW_APPROVE',
    },
    REJECT: {
      label: '驳回',
      type: 'danger',
      permission: 'REVIEW_REJECT',
      danger: true,
    },
    VIEW: {
      label: '查看',
    },
    CONDITIONAL: {
      label: '条件动作',
      visible: (record: any) => record.amount > 100,
    },
  }

  it('应该只返回 availableActions 中包含的动作', () => {
    const result = getVisibleActions(actionMap, {
      availableActions: ['APPROVE'],
      hasPermission: () => true,
      record: {},
    })

    expect(result).toHaveLength(1)
    expect(result[0].action).toBe('APPROVE')
  })

  it('应该过滤掉无权限的动作', () => {
    const result = getVisibleActions(actionMap, {
      availableActions: ['APPROVE', 'REJECT'],
      hasPermission: (perm: string) => perm === 'REVIEW_APPROVE',
      record: {},
    })

    expect(result).toHaveLength(1)
    expect(result[0].action).toBe('APPROVE')
  })

  it('无 permission 配置的动作不做权限过滤', () => {
    const result = getVisibleActions(actionMap, {
      availableActions: ['VIEW'],
      hasPermission: () => false,
      record: {},
    })

    expect(result).toHaveLength(1)
    expect(result[0].action).toBe('VIEW')
  })

  it('应该通过 visible 函数过滤动作', () => {
    const resultHidden = getVisibleActions(actionMap, {
      availableActions: ['CONDITIONAL'],
      hasPermission: () => true,
      record: { amount: 50 },
    })

    expect(resultHidden).toHaveLength(0)

    const resultVisible = getVisibleActions(actionMap, {
      availableActions: ['CONDITIONAL'],
      hasPermission: () => true,
      record: { amount: 200 },
    })

    expect(resultVisible).toHaveLength(1)
    expect(resultVisible[0].action).toBe('CONDITIONAL')
  })

  it('三个条件应该同时满足才展示', () => {
    const actionMapWithAll: Record<string, ActionConfig> = {
      STRICT: {
        label: '严格动作',
        permission: 'STRICT_PERM',
        visible: (record: any) => record.active,
      },
    }

    // 全部满足
    const allPass = getVisibleActions(actionMapWithAll, {
      availableActions: ['STRICT'],
      hasPermission: () => true,
      record: { active: true },
    })
    expect(allPass).toHaveLength(1)

    // availableActions 不包含
    const noAvailable = getVisibleActions(actionMapWithAll, {
      availableActions: [],
      hasPermission: () => true,
      record: { active: true },
    })
    expect(noAvailable).toHaveLength(0)

    // 无权限
    const noPerm = getVisibleActions(actionMapWithAll, {
      availableActions: ['STRICT'],
      hasPermission: () => false,
      record: { active: true },
    })
    expect(noPerm).toHaveLength(0)

    // visible 返回 false
    const notVisible = getVisibleActions(actionMapWithAll, {
      availableActions: ['STRICT'],
      hasPermission: () => true,
      record: { active: false },
    })
    expect(notVisible).toHaveLength(0)
  })

  it('返回结果应包含完整的 ActionConfig 字段', () => {
    const result = getVisibleActions(actionMap, {
      availableActions: ['REJECT'],
      hasPermission: () => true,
      record: {},
    })

    expect(result[0]).toEqual({
      action: 'REJECT',
      label: '驳回',
      type: 'danger',
      permission: 'REVIEW_REJECT',
      danger: true,
    })
  })

  it('availableActions 为空时返回空数组', () => {
    const result = getVisibleActions(actionMap, {
      availableActions: [],
      hasPermission: () => true,
      record: {},
    })

    expect(result).toHaveLength(0)
  })
})
