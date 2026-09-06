import { beforeEach, describe, expect, it, vi } from 'vitest'
import { clearHttpCache, getBusinessMessage, isBusinessError, useCache, useDedupe, useLocation, useRetry } from './policies'

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

describe('hTTP Policies - 可选策略插件', () => {
  beforeEach(() => {
    clearHttpCache()
    vi.clearAllMocks()
  })

  describe('useCache', () => {
    it('标记 meta.cache 并可设置 maxAge', () => {
      const config = {
        method: 'get',
        url: '/api/test',
        params: { a: 1 },
      }
      const result = useCache(config, { maxAge: 60000 })
      expect(result.meta.cache).toBe(true)
      expect(result.meta.cacheMaxAge).toBe(60000)
    })
  })

  describe('useDedupe', () => {
    it('标记 meta.dedupe 模式', () => {
      const config = {
        method: 'post',
        url: '/api/test',
        data: { b: 2 },
      }
      const result = useDedupe(config, 'ignoreCurrent')
      expect(result.meta.dedupe).toBe('ignoreCurrent')
    })

    it('默认模式为 cancelPrevious', () => {
      const config = {
        method: 'get',
        url: '/api/test',
      }
      const result = useDedupe(config)
      expect(result.meta.dedupe).toBe('cancelPrevious')
    })
  })

  describe('useRetry', () => {
    it('标记 meta.retry 并可设置最大重试次数', () => {
      const config = {
        method: 'get',
        url: '/api/test',
      }
      const result = useRetry(config, { maxRetries: 5 })
      expect(result.meta.retry).toBe(5)
    })

    it('默认重试 3 次', () => {
      const config = {
        method: 'get',
        url: '/api/test',
      }
      const result = useRetry(config)
      expect(result.meta.retry).toBe(3)
    })
  })

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

  describe('clearHttpCache', () => {
    it('清空内存缓存', () => {
      clearHttpCache()
      // 无报错即通过
      expect(true).toBe(true)
    })
  })
})
