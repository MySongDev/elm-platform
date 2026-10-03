import { describe, expect, it, vi } from 'vitest'
import { getBusinessMessage, isBusinessError, useLocation } from './policies'

// Mock axios
vi.mock('axios', () => {
  const mockRequest = vi.fn()
  const mockInterceptors = {
    request: { use: vi.fn() },
    response: { use: vi.fn() },
  }
  return {
    default: {
      create: () => ({
        interceptors: mockInterceptors,
        ...mockRequest,
      }),
      CanceledError: class extends Error { constructor(m, c) { super(m); this.name = 'CanceledError'; this.code = 'ERR_CANCELED'; this.config = c } },
    },
  }
})

// Mock 依赖
vi.mock('@/components/common/AlterTip/index', () => ({ showAlert: vi.fn() }))
vi.mock('@/config', () => ({ API_BASE_URL: '/api' }))
vi.mock('@/utils/storage/storage', () => ({
  getStore: vi.fn(),
  setStore: vi.fn(),
}))
vi.mock('./auth-refresh', () => ({ refreshCustomerToken: vi.fn().mockResolvedValue(null) }))
vi.mock('./loading', () => ({
  startGlobalLoading: vi.fn(),
  finishGlobalLoading: vi.fn(),
}))

describe('hTTP Policies - 核心功能', () => {
  describe('isBusinessError', () => {
    it('不将实体 status 字段视为业务错误', () => {
      expect(isBusinessError({
        id: 3269,
        name: 'shop 3269',
        status: 0,
        rating: 5,
      })).toBe(false)
    })

    it('仍将包含 message 的 status 视为业务错误', () => {
      expect(isBusinessError({
        status: 0,
        message: 'invalid params',
      })).toBe(true)
    })

    it('不将 captcha image code 视为业务错误', () => {
      expect(isBusinessError({
        status: 1,
        code: 'data:image/png;base64,abc',
      })).toBe(false)
    })

    it('仍将带 message 的 string code 视为业务错误', () => {
      expect(isBusinessError({
        code: 'INVALID_CAPTCHA',
        message: '验证码错误',
      })).toBe(true)
    })
  })

  describe('getBusinessMessage', () => {
    it('返回 message 字段', () => {
      expect(getBusinessMessage({ message: '业务失败' })).toBe('业务失败')
    })
    it('回退到 msg 字段', () => {
      expect(getBusinessMessage({ msg: '错误信息' })).toBe('错误信息')
    })
    it('默认返回兜底文案', () => {
      expect(getBusinessMessage({})).toBe('业务处理失败')
    })
  })
})

// 缓存 / 去重 / 重试的开关用例已随实现迁到 ../extras/optional-policies.test.js
describe('hTTP Policies - 可选策略插件', () => {
  describe('useLocation', () => {
    it('标记 meta.location', () => {
      const config = {
        method: 'get',
        url: '/api/test',
      }
      const result = useLocation(config)
      expect(result.meta.location).toBe(true)
    })
  })
})
