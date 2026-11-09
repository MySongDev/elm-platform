<script setup lang="ts">
import type { TenantActionLog } from '@/entities/tenant'

defineOptions({ name: 'TenantActionLogDialog' })

defineProps<{
  loading: boolean
  logs: TenantActionLog[]
}>()

const visible = defineModel<boolean>('visible', { required: true })
</script>

<template>
  <el-dialog
    v-model="visible"
    title="租户状态变更日志"
    width="700px"
    destroy-on-close
  >
    <el-table
      v-loading="loading"
      :data="logs"
      border
      stripe
      :max-height="400"
    >
      <el-table-column prop="event" label="事件" width="100" />
      <el-table-column prop="fromStatus" label="原状态" width="100" />
      <el-table-column prop="toStatus" label="新状态" width="100" />
      <el-table-column prop="actorName" label="操作人" width="120" />
      <el-table-column prop="reason" label="原因" min-width="150" />
      <el-table-column label="时间" width="180">
        <template #default="{ row }">
          {{ row.createdAt ? new Date(row.createdAt).toLocaleString('zh-CN') : '-' }}
        </template>
      </el-table-column>
    </el-table>
  </el-dialog>
</template>
