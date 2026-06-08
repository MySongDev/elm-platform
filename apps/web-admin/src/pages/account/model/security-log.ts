import type { SecurityLog, SecurityLogQuery, SecurityLogResult } from '@/entities/session'
import { reactive, shallowRef } from 'vue'
import { getSecurityLogs } from '@/entities/session'

export type SecurityLogFetcher = (params: SecurityLogQuery) => Promise<SecurityLogResult>

export const securityLogPageSizes = [10, 20, 50]

export function useSecurityLogTable(fetcher: SecurityLogFetcher = getSecurityLogs) {
  const loading = shallowRef(true)
  const dataList = shallowRef<SecurityLog[]>([])
  const pagination = reactive({
    total: 0,
    pageSize: 10,
    currentPage: 1,
    background: true,
  })

  async function fetchData() {
    loading.value = true
    try {
      const res = await fetcher({
        page: pagination.currentPage,
        pageSize: pagination.pageSize,
      })
      dataList.value = res.list
      pagination.total = res.total
      pagination.currentPage = res.page
      pagination.pageSize = res.pageSize
    }
    catch {
      // error handled by request interceptor
    }
    finally {
      loading.value = false
    }
  }

  async function handleCurrentChange(page: number) {
    pagination.currentPage = page
    await fetchData()
  }

  async function handleSizeChange(size: number) {
    pagination.pageSize = size
    pagination.currentPage = 1
    await fetchData()
  }

  return {
    loading,
    dataList,
    pagination,
    fetchData,
    handleCurrentChange,
    handleSizeChange,
  }
}
