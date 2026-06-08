import { describe, expect, it, vi } from 'vitest'
import { useSecurityLogTable } from './security-log'

describe('useSecurityLogTable', () => {
  it('requests the current page and applies backend pagination metadata', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      list: [
        {
          id: 1,
          userId: 1,
          ip: '127.0.0.1',
          address: null,
          browser: 'Chrome',
          os: 'Windows',
          status: 1,
          message: '登录成功',
          createdAt: '2026-05-27T00:00:00.000Z',
        },
      ],
      total: 22,
      page: 2,
      pageSize: 10,
    })
    const table = useSecurityLogTable(fetcher)

    await table.handleCurrentChange(2)

    expect(fetcher).toHaveBeenCalledWith({
      page: 2,
      pageSize: 10,
    })
    expect(table.dataList.value).toHaveLength(1)
    expect(table.pagination.currentPage).toBe(2)
    expect(table.pagination.total).toBe(22)
  })

  it('resets to the first page when page size changes', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      list: [],
      total: 22,
      page: 1,
      pageSize: 20,
    })
    const table = useSecurityLogTable(fetcher)

    table.pagination.currentPage = 3
    await table.handleSizeChange(20)

    expect(fetcher).toHaveBeenCalledWith({
      page: 1,
      pageSize: 20,
    })
    expect(table.pagination.currentPage).toBe(1)
    expect(table.pagination.pageSize).toBe(20)
  })
})
