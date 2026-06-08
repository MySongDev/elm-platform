import type { ConfigTableColumn } from './table'

export function getColumnPreferenceKey<Row extends object>(column: ConfigTableColumn<Row>, index: number) {
  return column.key ?? column.prop ?? `column-${index}`
}

export function getDefaultVisibleColumnKeys<Row extends object>(columns: ConfigTableColumn<Row>[]) {
  return columns
    .map((column, index) => ({
      column,
      key: getColumnPreferenceKey(column, index),
    }))
    .filter(({ column }) => column.defaultVisible !== false)
    .map(({ key }) => key)
}

export function parseStoredVisibleColumnKeys(value: string | null) {
  if (!value)
    return null

  try {
    const parsed = JSON.parse(value)
    if (!Array.isArray(parsed))
      return null
    const keys = parsed.filter((item): item is string => typeof item === 'string')
    return keys.length > 0 ? keys : null
  }
  catch {
    return null
  }
}

export function mergeVisibleColumnKeys<Row extends object>(columns: ConfigTableColumn<Row>[], storedKeys: string[] | null) {
  const availableKeys = columns.map((column, index) => getColumnPreferenceKey(column, index))
  const availableKeySet = new Set(availableKeys)
  const defaultKeys = getDefaultVisibleColumnKeys(columns)

  if (!storedKeys)
    return defaultKeys

  const mergedKeys = storedKeys.filter(key => availableKeySet.has(key))
  if (mergedKeys.length === 0)
    return defaultKeys

  const forcedVisibleKeys = columns
    .map((column, index) => ({
      column,
      key: getColumnPreferenceKey(column, index),
    }))
    .filter(({ column }) => column.hideable === false)
    .map(({ key }) => key)

  for (const key of forcedVisibleKeys) {
    if (!mergedKeys.includes(key))
      mergedKeys.push(key)
  }

  return mergedKeys.length > 0 ? mergedKeys : defaultKeys
}
