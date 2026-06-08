<script setup lang="ts">
import type { TenantEvent, TenantInfo } from '@/entities/tenant'
import { useAuthStore } from '@/entities/session'
import { ConfigDataTable } from '@/shared/config-crud'
import { StateMachineActions } from '@/shared/workflow'
import { createTenantTableColumns } from '../config/fields'
import { tenantActionConfig } from '../config/workflow'

defineOptions({ name: 'TenantTable' })

defineProps<{
  loading: boolean
  data: TenantInfo[]
}>()

defineEmits<{
  edit: [row: TenantInfo]
  transition: [row: TenantInfo, event: TenantEvent]
  viewLogs: [row: TenantInfo]
}>()

const { t } = useI18n()
const authStore = useAuthStore()
const columns = computed(() => createTenantTableColumns(t))

function asTenantInfo(row: unknown) {
  return row as TenantInfo
}
</script>

<template>
  <ConfigDataTable :loading="loading" :data="data" :columns="columns">
    <el-table-column label="操作" fixed="right" min-width="260">
      <template #default="{ row }">
        <el-button type="primary" link @click="$emit('edit', asTenantInfo(row))">
          编辑
        </el-button>
        <el-button type="info" link @click="$emit('viewLogs', asTenantInfo(row))">
          日志
        </el-button>
        <StateMachineActions
          :action-map="tenantActionConfig"
          :available-actions="asTenantInfo(row).availableActions || []"
          :record="asTenantInfo(row)"
          :has-permission="authStore.hasPermission"
          button-style="link"
          @action="$emit('transition', asTenantInfo(row), $event as TenantEvent)"
        />
      </template>
    </el-table-column>
  </ConfigDataTable>
</template>
