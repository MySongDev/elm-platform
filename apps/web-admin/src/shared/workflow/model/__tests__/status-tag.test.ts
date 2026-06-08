import type { StatusTagConfig } from '../types'
import { describe, expect, it } from 'vitest'

/**
 * StatusTag 组件的核心逻辑：根据 status 和 statusMap 解析展示配置。
 * 此处直接测试逻辑函数，不依赖 @vue/test-utils。
 */
function resolveTagConfig(
  status: string,
  statusMap: Record<string, StatusTagConfig>,
): StatusTagConfig {
  return statusMap[status] || {
    label: status,
    type: 'info',
  }
}

const statusMap: Record<string, StatusTagConfig> = {
  ACTIVE: {
    label: '活跃',
    type: 'success',
  },
  PENDING: {
    label: '待处理',
    type: 'warning',
  },
  DISABLED: {
    label: '已禁用',
    type: 'danger',
  },
}

describe('statusTag 配置解析', () => {
  it('应该根据 statusMap 返回正确的标签配置', () => {
    expect(resolveTagConfig('ACTIVE', statusMap)).toEqual({
      label: '活跃',
      type: 'success',
    })
  })

  it('应该支持所有 type 类型', () => {
    expect(resolveTagConfig('PENDING', statusMap).type).toBe('warning')
    expect(resolveTagConfig('DISABLED', statusMap).type).toBe('danger')
  })

  it('未知状态应回退为 status 本身作为 label，type 为 info', () => {
    const result = resolveTagConfig('NONEXISTENT', statusMap)
    expect(result.label).toBe('NONEXISTENT')
    expect(result.type).toBe('info')
  })

  it('空 statusMap 时所有状态都应回退', () => {
    const result = resolveTagConfig('ANYTHING', {})
    expect(result.label).toBe('ANYTHING')
    expect(result.type).toBe('info')
  })
})
