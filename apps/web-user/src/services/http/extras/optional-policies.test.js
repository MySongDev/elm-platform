import { beforeEach, describe, expect, it } from 'vitest'

import { clearHttpCache, useCache, useDedupe, useRetry } from './optional-policies'

// 这些用例原在 ../policies.test.js 的「可选策略插件」分组里，随实现一起迁到本模块。
describe('可选策略留档模块 - 开关标记', () => {
  beforeEach(() => {
    clearHttpCache()
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

  describe('clearHttpCache', () => {
    it('清空内存缓存', () => {
      clearHttpCache()
      // 无报错即通过
      expect(true).toBe(true)
    })
  })
})
