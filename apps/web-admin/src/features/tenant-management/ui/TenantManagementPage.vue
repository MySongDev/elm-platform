<script setup lang="ts">
import type { TenantEvent, TenantInfo } from '@/entities/tenant'
import { IconPlus as IconEpPlus } from '@iconify-prerendered/vue-ep'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getTenantActionLogs, transitionTenant } from '@/entities/tenant'
import AdminSearchForm from '@/shared/ui/AdminSearchForm/index.vue'
import AdminTablePage from '@/shared/ui/AdminTablePage/index.vue'
import { createTenantSearchFields } from '../config/fields'
import { useTenantManagement } from '../model/useTenantManagement'
import TenantActionLogDialog from './TenantActionLogDialog.vue'
import TenantFormDialog from './TenantFormDialog.vue'
import TenantTable from './TenantTable.vue'

defineOptions({ name: 'TenantManagementPage' })

const { t } = useI18n()
const {
  loading,
  saving,
  dialogVisible,
  query,
  form,
  isEdit,
  filteredData,
  rules,
  resetQuery,
  openCreateDialog,
  openEditDialog,
  submitForm,
  fetchTenants,
} = useTenantManagement()

const searchFields = computed(() => createTenantSearchFields(t))

const actionLogVisible = ref(false)
const actionLogs = ref<Awaited<ReturnType<typeof getTenantActionLogs>>>([])

const actionLogLoading = ref(false)

async function handleViewActionLogs(row: TenantInfo) {
  actionLogVisible.value = true
  actionLogLoading.value = true
  try {
    actionLogs.value = await getTenantActionLogs(row.id)
  }
  catch {
    actionLogs.value = []
  }
  finally {
    actionLogLoading.value = false
  }
}

async function handleTransition(row: TenantInfo, event: TenantEvent) {
  try {
    const { value: reason } = await ElMessageBox.prompt(
      `确认对租户「${row.name}」执行操作：${event}？`,
      '状态变更',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        inputPlaceholder: '变更原因（可选）',
        inputType: 'textarea',
      },
    )
    await transitionTenant(row.id, event, { reason: reason || undefined })
    ElMessage.success('状态变更成功')
    fetchTenants()
  }
  catch {
    // cancelled or error
  }
}

onMounted(() => {
  fetchTenants()
})
</script>

<template>
  <div class="main">
    <AdminTablePage title="租户管理" :loading="loading" @refresh="fetchTenants">
      <template #search>
        <AdminSearchForm
          v-model:model="query"
          :fields="searchFields"
          search-text="搜索"
          reset-text="重置"
          @reset="resetQuery"
        />
      </template>

      <template #buttons>
        <el-button
          type="primary"
          :icon="IconEpPlus"
          @click="openCreateDialog"
        >
          新增租户
        </el-button>
      </template>

      <TenantTable
        :loading="loading"
        :data="filteredData"
        @edit="openEditDialog"
        @transition="handleTransition"
        @view-logs="handleViewActionLogs"
      />
    </AdminTablePage>

    <TenantFormDialog
      v-model:visible="dialogVisible"
      v-model:form="form"
      :saving="saving"
      :is-edit="isEdit"
      :rules="rules"
      @submit="submitForm"
    />

    <TenantActionLogDialog
      v-model:visible="actionLogVisible"
      :loading="actionLogLoading"
      :logs="actionLogs"
    />
  </div>
</template>
