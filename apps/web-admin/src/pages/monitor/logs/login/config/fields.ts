import type { LoginLog } from '@/entities/log'
import type { ConfigTableColumn, Translate } from '@/shared/config-crud'
import type { AdminSearchField } from '@/shared/ui/AdminSearchForm/types'
import { formatDateTime } from '@/shared/lib/format'

export interface LoginLogQuery extends Record<string, unknown> {
  username: string
  status: string
}

export function createLoginLogSearchFields(t: Translate) {
  return [
    {
      prop: 'username',
      label: t('monitor.logs.login.username'),
      type: 'input',
      placeholder: t('monitor.logs.login.usernamePlaceholder'),
    },
    {
      prop: 'status',
      label: t('monitor.logs.login.status'),
      type: 'select',
      placeholder: t('monitor.logs.login.statusPlaceholder'),
      options: [
        {
          label: t('monitor.logs.login.success'),
          value: '1',
        },
        {
          label: t('monitor.logs.login.failed'),
          value: '0',
        },
      ],
    },
  ] satisfies AdminSearchField<LoginLogQuery>[]
}

export function createLoginLogTableColumns(t: Translate) {
  return [
    {
      prop: 'username',
      label: t('monitor.logs.login.username'),
      minWidth: 120,
    },
    {
      label: t('monitor.logs.login.ip'),
      minWidth: 140,
      formatter: row => row.ip,
    },
    {
      label: t('monitor.logs.login.address'),
      minWidth: 160,
      formatter: row => row.address,
    },
    {
      label: t('monitor.logs.login.browser'),
      minWidth: 140,
      formatter: row => row.browser,
    },
    {
      label: t('monitor.logs.login.os'),
      minWidth: 140,
      formatter: row => row.os,
    },
    {
      label: t('monitor.logs.login.status'),
      width: 100,
      tag: row => ({
        label: row.status === 1
          ? t('monitor.logs.login.success')
          : t('monitor.logs.login.failed'),
        type: row.status === 1 ? 'success' : 'danger',
      }),
    },
    {
      label: t('monitor.logs.login.message'),
      minWidth: 180,
      formatter: row => row.message,
    },
    {
      label: t('monitor.logs.login.time'),
      minWidth: 180,
      formatter: row => formatDateTime(row.createdAt),
    },
  ] satisfies ConfigTableColumn<LoginLog>[]
}

export function filterLoginLogs(data: LoginLog[], query: LoginLogQuery) {
  return data.filter((item) => {
    const usernameMatched = !query.username || item.username.includes(query.username)
    const statusMatched = query.status === '' || String(item.status) === query.status
    return usernameMatched && statusMatched
  })
}
