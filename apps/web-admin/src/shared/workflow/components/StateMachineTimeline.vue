<script setup lang="ts">
import type { StatusTagConfig, TimelineEntry, WorkflowTagType } from '../model/types'
import { formatDateTime } from '@/shared/lib/admin-display'

defineOptions({ name: 'StateMachineTimeline' })

const props = defineProps<{
  /** 时间线条目列表（按时间正序或倒序均可，组件不排序） */
  entries: TimelineEntry[]
  /** 事件标签映射（事件 key → 展示文案），可选 */
  eventLabelMap?: Record<string, string>
  /** 状态标签映射（用于渲染 fromStatus/toStatus），可选 */
  statusMap?: Record<string, StatusTagConfig>
  /** 是否显示状态转换（fromStatus → toStatus） */
  showTransition?: boolean
}>()

function getEventLabel(entry: TimelineEntry) {
  if (entry.eventLabel)
    return entry.eventLabel
  if (props.eventLabelMap?.[entry.event])
    return props.eventLabelMap[entry.event]
  return entry.event
}

function getStatusLabel(status: string | undefined) {
  if (!status)
    return '-'
  if (props.statusMap?.[status])
    return props.statusMap[status].label
  return status
}

function getNodeColor(entry: TimelineEntry): string {
  const typeColorMap: Record<WorkflowTagType, string> = {
    '': '',
    'success': 'var(--el-color-success)',
    'warning': 'var(--el-color-warning)',
    'danger': 'var(--el-color-danger)',
    'info': 'var(--el-color-info)',
    'primary': 'var(--el-color-primary)',
  }
  return entry.type ? typeColorMap[entry.type] || '' : ''
}

function displayTime(value: string | Date | undefined) {
  if (!value)
    return '-'
  return formatDateTime(typeof value === 'string' ? value : value.toISOString())
}
</script>

<template>
  <el-timeline v-if="entries.length" class="state-machine-timeline">
    <el-timeline-item
      v-for="(entry, index) in entries"
      :key="entry.id || index"
      :timestamp="displayTime(entry.createdAt)"
      :color="getNodeColor(entry)"
      placement="top"
    >
      <div class="timeline-content">
        <span class="timeline-event">{{ getEventLabel(entry) }}</span>

        <span v-if="showTransition && (entry.fromStatus || entry.toStatus)" class="timeline-transition">
          {{ getStatusLabel(entry.fromStatus) }} → {{ getStatusLabel(entry.toStatus) }}
        </span>

        <span v-if="entry.actorName" class="timeline-actor">
          {{ entry.actorName }}
        </span>

        <span v-if="entry.reason || entry.remark" class="timeline-reason">
          {{ entry.reason || entry.remark }}
        </span>
      </div>
    </el-timeline-item>
  </el-timeline>

  <el-empty v-else description="暂无记录" :image-size="60" />
</template>

<style scoped>
.state-machine-timeline {
  padding-top: 8px;
}

.timeline-content {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  align-items: baseline;
  font-size: 14px;
  line-height: 1.6;
}

.timeline-event {
  font-weight: 500;
}

.timeline-transition {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.timeline-actor {
  font-size: 13px;
  color: var(--el-text-color-regular);
}

.timeline-reason {
  flex-basis: 100%;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
</style>
