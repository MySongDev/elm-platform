<script setup lang="ts">
import type { MerchantApplication, MerchantApplicationAction } from '@/entities/merchant-onboarding'
import { useAuthStore } from '@/entities/session'
import { ConfigDataTable } from '@/shared/config-crud'
import { Permissions } from '@/shared/config/access'
import AdminSearchForm from '@/shared/ui/AdminSearchForm/index.vue'
import AdminTablePage from '@/shared/ui/AdminTablePage/index.vue'
import { StateMachineActions } from '@/shared/workflow'
import { createMerchantSearchFields, createMerchantTableColumns } from '../config/fields'
import { merchantActionMap } from '../config/workflow'
import { useMerchantOnboarding } from '../model/useMerchantOnboarding'
import MerchantDetailDrawer from './MerchantDetailDrawer.vue'
import MerchantReviewDialog from './MerchantReviewDialog.vue'

defineOptions({ name: 'MerchantOnboardingPage' })

const { t } = useI18n()
const authStore = useAuthStore()

const {
  loading,
  filteredList,
  query,
  fetchList,
  detailLoading,
  detailVisible,
  selectedApplication,
  openDetail,
  closeDetail,
  logsLoading,
  logs,
  fetchLogs,
  submitting,
  executeReview,
} = useMerchantOnboarding()

const searchFields = computed(() => createMerchantSearchFields(t))
const tableColumns = computed(() => createMerchantTableColumns(t))

// 审核弹窗
const reviewVisible = ref(false)
const reviewAction = ref<MerchantApplicationAction>('APPROVE')
const reviewTarget = ref<MerchantApplication | null>(null)

function handleAction(action: string, row: any) {
  const typedAction = action as MerchantApplicationAction

  if (typedAction === 'VIEW') {
    openDetail(row as MerchantApplication)
    return
  }

  if (typedAction === 'APPROVE' || typedAction === 'REJECT' || typedAction === 'REQUEST_SUPPLEMENT') {
    reviewAction.value = typedAction
    reviewTarget.value = row as MerchantApplication
    reviewVisible.value = true
    return
  }

  // START_REVIEW 直接执行（已有 confirmText）
  executeReview((row as MerchantApplication).id, typedAction)
}

async function handleReviewConfirm(reason: string) {
  if (!reviewTarget.value)
    return
  await executeReview(reviewTarget.value.id, reviewAction.value, reason)
  reviewVisible.value = false
  reviewTarget.value = null
}

function handleSearch() {
  fetchList()
}

function handleReset() {
  query.value = {}
  fetchList()
}

// 初始加载
onMounted(() => {
  fetchList()
})

// 打开详情时加载日志
watch(detailVisible, (visible) => {
  if (visible && selectedApplication.value) {
    fetchLogs(selectedApplication.value.id)
  }
})
</script>

<template>
  <AdminTablePage
    title="商家入驻审批"
    :loading="loading"
    :empty="filteredList.length === 0"
    :forbidden="!authStore.hasPermission(Permissions.MERCHANT_ONBOARDING_VIEW)"
    @refresh="fetchList"
  >
    <template #search>
      <AdminSearchForm
        :fields="searchFields"
        :model="query"
        @search="handleSearch"
        @reset="handleReset"
      />
    </template>

    <template #default>
      <ConfigDataTable
        :loading="loading"
        :data="filteredList"
        :columns="tableColumns"
      >
        <el-table-column label="操作" fixed="right" min-width="220">
          <template #default="{ row }">
            <StateMachineActions
              :action-map="merchantActionMap"
              :available-actions="row.availableActions || []"
              :record="row"
              :has-permission="authStore.hasPermission"
              button-style="link"
              @action="handleAction($event, row)"
            />
          </template>
        </el-table-column>
      </ConfigDataTable>
    </template>
  </AdminTablePage>

  <MerchantDetailDrawer
    :visible="detailVisible"
    :loading="detailLoading"
    :application="selectedApplication"
    :logs="logs"
    :logs-loading="logsLoading"
    @close="closeDetail"
  />

  <MerchantReviewDialog
    v-model:visible="reviewVisible"
    :action="reviewAction"
    :submitting="submitting"
    @confirm="handleReviewConfirm"
  />
</template>
