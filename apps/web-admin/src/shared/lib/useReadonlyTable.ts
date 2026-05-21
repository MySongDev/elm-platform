import { ref } from 'vue'

export interface UseReadonlyTableOptions<T, Q extends Record<string, unknown>> {
  /** API 请求函数 */
  fetchApi: () => Promise<T[]>
  /** 查询条件初始值 */
  queryDefaults: Q
  /** 前端过滤函数（可选） */
  filter?: (data: T[], query: Q) => T[]
}

/**
 * 只读表格 composable
 *
 * 封装 loading / tableData / query / filteredData / fetchRows / resetQuery
 * 消除 monitor、permission 等只读列表视图中的重复样板代码。
 */
export function useReadonlyTable<T, Q extends Record<string, unknown>>(
  options: UseReadonlyTableOptions<T, Q>,
) {
  const loading = ref(false)
  const tableData = ref<T[]>([]) as Ref<T[]>
  const query = reactive<Q>({ ...options.queryDefaults })

  const filteredData = computed(() => {
    if (!options.filter)
      return tableData.value
    return options.filter(tableData.value, query as Q)
  })

  function resetQuery() {
    Object.assign(query, { ...options.queryDefaults })
  }

  async function fetchRows() {
    loading.value = true
    try {
      tableData.value = await options.fetchApi()
    }
    finally {
      loading.value = false
    }
  }

  onMounted(fetchRows)

  return {
    loading,
    tableData,
    query,
    filteredData,
    fetchRows,
    resetQuery,
  }
}
