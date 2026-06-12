import type { OperationLog } from '@/entities/log'
import type { ConfigTableColumn, Translate } from '@/shared/config-crud'
import type { AdminSearchField } from '@/shared/ui/AdminSearchForm/types'
import { formatDateTime } from '@/shared/lib/format'

export interface OperationLogQuery extends Record<string, unknown> {
  username: string
  module: string
}

export function createOperationLogSearchFields(t: Translate) {
  return [
    {
      prop: 'username',
      label: t('monitor.logs.operation.username'),
      type: 'input',
      placeholder: t('monitor.logs.operation.usernamePlaceholder'),
    },
    {
      prop: 'module',
      label: t('monitor.logs.operation.module'),
      type: 'input',
      placeholder: t('monitor.logs.operation.modulePlaceholder'),
    },
  ] satisfies AdminSearchField<OperationLogQuery>[]
}

export function createOperationLogTableColumns(t: Translate) {
  return [
    {
      prop: 'username',
      label: t('monitor.logs.operation.username'),
      minWidth: 120,
    },
    {
      prop: 'module',
      label: t('monitor.logs.operation.module'),
      minWidth: 120,
    },
    {
      prop: 'action',
      label: t('monitor.logs.operation.action'),
      minWidth: 120,
    },
    {
      prop: 'method',
      label: t('monitor.logs.operation.method'),
      width: 100,
    },
    {
      prop: 'path',
      label: t('monitor.logs.operation.path'),
      minWidth: 220,
      showOverflowTooltip: true,
    },
    {
      label: t('monitor.logs.operation.ip'),
      minWidth: 140,
      formatter: row => row.ip,
    },
    {
      label: t('monitor.logs.operation.status'),
      width: 100,
      tag: row => ({
        label: row.status,
        type: row.status >= 200 && row.status < 400 ? 'success' : 'danger',
      }),
    },
    {
      label: t('monitor.logs.operation.duration'),
      width: 100,
      formatter: row => `${row.duration} ms`,
    },
    {
      label: t('monitor.logs.operation.time'),
      minWidth: 180,
      formatter: row => formatDateTime(row.createdAt),
    },
  ] satisfies ConfigTableColumn<OperationLog>[]
}

export function filterOperationLogs(data: OperationLog[], query: OperationLogQuery) {
  return data.filter((item) => {
    const usernameMatched = !query.username || item.username.includes(query.username)
    const moduleMatched = !query.module || item.module.includes(query.module)
    return usernameMatched && moduleMatched
  })
}
