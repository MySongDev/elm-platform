import type {
  MerchantApplication,
  MerchantApplicationAction,
  MerchantApplicationLog,
  MerchantApplicationQuery,
} from '@/entities/merchant-onboarding'
import {
  getMerchantApplicationDetail,
  getMerchantApplicationList,
  getMerchantApplicationLogs,
  reviewMerchantApplication,
} from '@/entities/merchant-onboarding/api'
import { useSubmitGuard } from '@/shared/ui/state'

export function useMerchantOnboarding() {
  const loading = ref(false)
  const list = ref<MerchantApplication[]>([])
  const query = ref<MerchantApplicationQuery>({})

  const detailLoading = ref(false)
  const selectedApplication = ref<MerchantApplication | null>(null)
  const detailVisible = ref(false)

  const logsLoading = ref(false)
  const logs = ref<MerchantApplicationLog[]>([])

  const { submitting, guardedSubmit } = useSubmitGuard()

  async function fetchList() {
    loading.value = true
    try {
      list.value = await getMerchantApplicationList(query.value)
    }
    finally {
      loading.value = false
    }
  }

  async function openDetail(application: MerchantApplication) {
    selectedApplication.value = application
    detailVisible.value = true
    detailLoading.value = true
    try {
      selectedApplication.value = await getMerchantApplicationDetail(application.id)
    }
    finally {
      detailLoading.value = false
    }
  }

  async function fetchLogs(id: string) {
    logsLoading.value = true
    try {
      logs.value = await getMerchantApplicationLogs(id)
    }
    finally {
      logsLoading.value = false
    }
  }

  async function executeReview(
    id: string,
    action: MerchantApplicationAction,
    reason?: string,
  ) {
    await guardedSubmit(async () => {
      await reviewMerchantApplication(id, {
        action,
        reason,
      })
      await fetchList()
      // 如果详情抽屉打开中，刷新详情
      if (detailVisible.value && selectedApplication.value?.id === id) {
        selectedApplication.value = await getMerchantApplicationDetail(id)
        await fetchLogs(id)
      }
    })
  }

  function closeDetail() {
    detailVisible.value = false
    selectedApplication.value = null
    logs.value = []
  }

  const filteredList = computed(() => {
    return list.value
  })

  return {
    // 列表
    loading,
    list,
    filteredList,
    query,
    fetchList,
    // 详情
    detailLoading,
    detailVisible,
    selectedApplication,
    openDetail,
    closeDetail,
    // 日志
    logsLoading,
    logs,
    fetchLogs,
    // 操作
    submitting,
    executeReview,
  }
}
