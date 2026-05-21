import type { ConfigFieldOption, Translate } from './form'
import type { ConfigTableColumnTag } from './table'

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
    { label: labels.normal, value: 1 },
    { label: labels.disabled, value: 0 },
  ]
}

export function createEnabledStatusSearchOptions(text?: EnabledStatusText): ConfigFieldOption[] {
  return createEnabledStatusOptions(text).map(item => ({ ...item, value: String(item.value) }))
}

export function getEnabledStatusTag(status: number, text?: EnabledStatusText): ConfigTableColumnTag {
  const labels = resolveStatusText(text)
  return status === 1
    ? { label: labels.normal, type: 'success' }
    : { label: labels.disabled, type: 'danger' }
}

export { formatDateTime } from '@/shared/lib/format'
