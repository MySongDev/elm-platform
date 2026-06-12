import type { OnlineUser } from '@/entities/monitor'
import type { ConfigTableColumn, Translate } from '@/shared/config-crud'
import type { AdminSearchField } from '@/shared/ui/AdminSearchForm/types'
import { formatDateTime } from '@/shared/lib/format'

export interface OnlineUserQuery extends Record<string, unknown> {
  username: string
  role: string
}

export function createOnlineUserSearchFields(t: Translate) {
  return [
    {
      prop: 'username',
      label: t('monitor.online.username'),
      type: 'input',
      placeholder: t('monitor.online.usernamePlaceholder'),
    },
    {
      prop: 'role',
      label: t('monitor.online.role'),
      type: 'select',
      placeholder: t('monitor.online.rolePlaceholder'),
      options: [
        {
          label: t('monitor.online.admin'),
          value: 'admin',
        },
        {
          label: t('monitor.online.normalUser'),
          value: 'user',
        },
      ],
    },
  ] satisfies AdminSearchField<OnlineUserQuery>[]
}

export function createOnlineUserTableColumns(t: Translate) {
  return [
    {
      prop: 'username',
      label: t('monitor.online.username'),
      minWidth: 120,
    },
    {
      label: t('monitor.online.role'),
      width: 120,
      tag: row => ({
        label: row.role,
        type: row.role === 'admin' ? 'danger' : 'info',
      }),
    },
    {
      label: t('monitor.online.ip'),
      minWidth: 140,
      formatter: row => row.ip,
    },
    {
      label: t('monitor.online.browser'),
      minWidth: 140,
      formatter: row => row.browser,
    },
    {
      label: t('monitor.online.os'),
      minWidth: 140,
      formatter: row => row.os,
    },
    {
      label: t('monitor.online.loginTime'),
      minWidth: 180,
      formatter: row => formatDateTime(row.loginTime),
    },
    {
      label: t('monitor.online.lastActive'),
      minWidth: 180,
      formatter: row => formatDateTime(row.lastActiveAt),
    },
  ] satisfies ConfigTableColumn<OnlineUser>[]
}

export function filterOnlineUsers(data: OnlineUser[], query: OnlineUserQuery) {
  return data.filter((item) => {
    const usernameMatched = !query.username || item.username.includes(query.username)
    const roleMatched = !query.role || item.role === query.role
    return usernameMatched && roleMatched
  })
}
