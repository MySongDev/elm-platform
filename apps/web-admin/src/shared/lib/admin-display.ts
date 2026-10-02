import type { ConfigFieldOption, Translate } from '@/shared/config-crud/model/form'
import type { ConfigTableColumnTag } from '@/shared/config-crud/model/table'

export type AccountStatus = 'ACTIVE' | 'DISABLED'

interface EnabledStatusText {
  normal?: string
  disabled?: string
}

function resolveStatusText(text: EnabledStatusText = {}) {
  return {
    normal: text.normal ?? '正常',
    disabled: text.disabled ?? '禁用',
  }
}

export function getStatusText(t: Translate): EnabledStatusText {
  return {
    normal: t('common.normal'),
    disabled: t('common.disabled'),
  }
}

export function createEnabledStatusOptions(text?: EnabledStatusText): ConfigFieldOption[] {
  const labels = resolveStatusText(text)
  return [
    {
      label: labels.normal,
      value: 'ACTIVE',
    },
    {
      label: labels.disabled,
      value: 'DISABLED',
    },
  ]
}

export function createEnabledStatusSearchOptions(text?: EnabledStatusText): ConfigFieldOption[] {
  return createEnabledStatusOptions(text)
}

export function getEnabledStatusTag(status: AccountStatus, text?: EnabledStatusText): ConfigTableColumnTag {
  const labels = resolveStatusText(text)
  return status === 'ACTIVE'
    ? {
        label: labels.normal,
        type: 'success',
      }
    : {
        label: labels.disabled,
        type: 'danger',
      }
}

export { formatDateTime } from '@/shared/lib/format'
