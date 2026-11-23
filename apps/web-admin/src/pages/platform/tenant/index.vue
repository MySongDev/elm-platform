<script setup lang="ts">
/**
 * @file 租户管理页面
 * @domain pages/platform/tenant
 * @description 组装租户列表、编辑器和日志弹窗，维护两类弹窗的当前选择。
 */

import type { TenantInfo } from '@/entities/tenant'
import { IconPlus as IconEpPlus } from '@iconify-prerendered/vue-ep'
import { computed, onMounted, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import AdminSearchForm from '@/shared/ui/AdminSearchForm/index.vue'
import AdminTablePage from '@/shared/ui/AdminTablePage/index.vue'
import { createTenantSearchFields } from './config/fields'
import { useTenantList } from './model/useTenantList'
import TenantActionLogDialog from './ui/TenantActionLogDialog.vue'
import TenantFormDialog from './ui/TenantFormDialog.vue'
import TenantTable from './ui/TenantTable.vue'

defineOptions({ name: 'PlatformTenantView' })

const { t } = useI18n()
const {
  loading,
  error,
  query,
  filteredData,
  resetQuery,
  fetchTenants,
  handleTransition,
} = useTenantList()

const searchFields = computed(() => createTenantSearchFields(t))
const dialogVisible = shallowRef(false)
const selectedTenant = shallowRef<TenantInfo | null>(null)
const actionLogVisible = shallowRef(false)
const actionLogTenant = shallowRef<TenantInfo | null>(null)

function openCreateDialog() {
  selectedTenant.value = null
  dialogVisible.value = true
}

function openEditDialog(tenant: TenantInfo) {
  selectedTenant.value = tenant
  dialogVisible.value = true
}

function handleViewActionLogs(tenant: TenantInfo) {
  actionLogTenant.value = tenant
  actionLogVisible.value = true
}

onMounted(() => {
  fetchTenants()
})
</script>

<template>
  <div class="main">
    <AdminTablePage
      title="租户管理"
      :loading="loading"
      :error="error"
      @refresh="fetchTenants"
    >
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
          @click="openCreateDialog()"
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
      :tenant="selectedTenant"
      @saved="fetchTenants"
    />

    <TenantActionLogDialog
      v-model:visible="actionLogVisible"
      :tenant="actionLogTenant"
    />
  </div>
</template>
