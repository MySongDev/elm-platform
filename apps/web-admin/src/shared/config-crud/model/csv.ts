import type { ConfigTableColumn } from './table'
import { getColumnPreferenceKey } from './table-preferences'

export function escapeCsvCell(value: unknown) {
  if (value === null || value === undefined)
    return ''

  const text = String(value)
  if (/[",\n\r]/.test(text))
    return `"${text.replaceAll('"', '""')}"`
  return text
}

export function buildCsvContent<Row extends object>(columns: ConfigTableColumn<Row>[], rows: Row[]) {
  const exportableColumns = columns.filter(column => column.exportable !== false)
  const header = exportableColumns.map(column => escapeCsvCell(column.label)).join(',')
  const body = rows.map(row => exportableColumns
    .map((column, index) => {
      const value = column.formatter
        ? column.formatter(row)
        : column.prop
          ? row[column.prop]
          : getColumnPreferenceKey(column, index)
      return escapeCsvCell(value)
    })
    .join(','))

  return [header, ...body].join('\r\n')
}
