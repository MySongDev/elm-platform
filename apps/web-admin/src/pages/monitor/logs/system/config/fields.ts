import type { SystemLog } from '@/entities/log'
import type { ConfigTableColumn, ConfigTableColumnTagType, Translate } from '@/shared/config-crud'
import type { AdminSearchField } from '@/shared/ui/AdminSearchForm/types'
import { formatDateTime } from '@/shared/lib/format'

export interface SystemLogQuery extends Record<string, unknown> {
  level: string
  source: string
}

export function getSystemLogLevelType(level: SystemLog['level']): ConfigTableColumnTagType {
  if (level === 'error')
    return 'danger'
  if (level === 'warn')
    return 'warning'
  return 'success'
}

export function createSystemLogSearchFields(t: Translate) {
  return [
    {
      prop: 'level',
      label: t('monitor.logs.system.level'),
      type: 'select',
      placeholder: t('monitor.logs.system.levelPlaceholder'),
      options: [
        {
          label: 'Info',
          value: 'info',
        },
        {
          label: 'Warn',
          value: 'warn',
        },
        {
          label: 'Error',
          value: 'error',
        },
      ],
    },
    {
      prop: 'source',
      label: t('monitor.logs.system.source'),
      type: 'input',
      placeholder: t('monitor.logs.system.sourcePlaceholder'),
    },
  ] satisfies AdminSearchField<SystemLogQuery>[]
}

export function createSystemLogTableColumns(t: Translate) {
  return [
    {
      label: t('monitor.logs.system.level'),
      width: 100,
      tag: row => ({
        label: row.level,
        type: getSystemLogLevelType(row.level),
      }),
    },
    {
      prop: 'source',
      label: t('monitor.logs.system.source'),
      minWidth: 140,
    },
    {
      prop: 'message',
      label: t('monitor.logs.system.message'),
      minWidth: 240,
    },
    {
      label: t('monitor.logs.system.detail'),
      minWidth: 260,
      formatter: row => row.detail,
    },
    {
      label: t('monitor.logs.system.time'),
      minWidth: 180,
      formatter: row => formatDateTime(row.createdAt),
    },
  ] satisfies ConfigTableColumn<SystemLog>[]
}

export function filterSystemLogs(data: SystemLog[], query: SystemLogQuery) {
  return data.filter((item) => {
    const levelMatched = !query.level || item.level === query.level
    const sourceMatched = !query.source || item.source.includes(query.source)
    return levelMatched && sourceMatched
  })
}
