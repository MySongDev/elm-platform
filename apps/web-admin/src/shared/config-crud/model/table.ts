export type ConfigTableColumnTagType = 'primary' | 'success' | 'info' | 'warning' | 'danger'

export interface ConfigTableColumnTag {
  label: string | number
  type?: ConfigTableColumnTagType
}

export interface ConfigTableColumn<Row extends Record<string, any> = Record<string, any>> {
  prop?: keyof Row & string
  label: string
  width?: string | number
  minWidth?: string | number
  fixed?: boolean | 'left' | 'right'
  showOverflowTooltip?: boolean
  emptyText?: string
  formatter?: (row: Row) => string | number | null | undefined
  tag?: (row: Row) => ConfigTableColumnTag
}
