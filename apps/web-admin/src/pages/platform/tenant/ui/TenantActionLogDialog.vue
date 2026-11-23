<script setup lang="ts">
/**
 * @file 租户状态变更日志
 * @domain pages/platform/tenant
 * @description 有副作用：按当前租户加载日志，维护错误重试及关闭、切换时的请求隔离。
 */

import type { TenantActionLog, TenantInfo } from '@/entities/tenant'
import { onScopeDispose, shallowRef, watch } from 'vue'
import { getTenantActionLogs } from '@/entities/tenant'
import { AdminStateView } from '@/shared/ui/state'

defineOptions({ name: 'TenantActionLogDialog' })

const props = defineProps<{ tenant: TenantInfo | null }>()
const visible = defineModel<boolean>('visible', { required: true })
const loading = shallowRef(false)
const error = shallowRef<unknown>(null)
const logs = shallowRef<TenantActionLog[]>([])
let loadVersion = 0

async function loadLogs() {
  const tenant = props.tenant
  if (!visible.value || !tenant)
    return
  const version = ++loadVersion
  loading.value = true
  error.value = null
  try {
    const result = await getTenantActionLogs(tenant.id)
    // 切换租户、关闭或重试后，旧日志与错误不能写入当前弹窗。
    if (version === loadVersion)
      logs.value = result
  }
  catch (caughtError) {
    if (version === loadVersion)
      error.value = caughtError
  }
  finally {
    if (version === loadVersion)
      loading.value = false
  }
}

watch([visible, () => props.tenant], ([open, tenant]) => {
  loadVersion++
  logs.value = []
  error.value = null
  loading.value = false
  if (open && tenant)
    void loadLogs()
}, {
  immediate: true,
  flush: 'sync',
})

onScopeDispose(() => {
  loadVersion++
})
</script>

<template>
  <el-dialog
    v-model="visible"
    title="租户状态变更日志"
    width="700px"
    destroy-on-close
  >
    <AdminStateView
      :loading="loading"
      :error="error"
      :skeleton="false"
      @retry="loadLogs"
    >
      <el-table
        v-loading="loading"
        :data="logs"
        border
        stripe
        :max-height="400"
      >
        <el-table-column
          prop="event"
          label="事件"
          width="100"
        />
        <el-table-column
          prop="fromStatus"
          label="原状态"
          width="100"
        />
        <el-table-column
          prop="toStatus"
          label="新状态"
          width="100"
        />
        <el-table-column
          prop="actorName"
          label="操作人"
          width="120"
        />
        <el-table-column
          prop="reason"
          label="原因"
          min-width="150"
        />
        <el-table-column
          label="时间"
          width="180"
        >
          <template #default="{ row }">
            {{ row.createdAt ? new Date(row.createdAt).toLocaleString('zh-CN') : '-' }}
          </template>
        </el-table-column>
      </el-table>
    </AdminStateView>
  </el-dialog>
</template>
