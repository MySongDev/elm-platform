export type ConfigTableColumnTagType = 'primary' | 'success' | 'info' | 'warning' | 'danger'

export interface ConfigTableColumnTag {
  label: string | number
  type?: ConfigTableColumnTagType
}

export interface ConfigTableColumn<Row extends object = object> {
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

export interface ConfigDataTableOptions {
  rowKey?: string
  border?: boolean
  stripe?: boolean
  defaultExpandAll?: boolean
}

export const DEFAULT_CONFIG_DATA_TABLE_OPTIONS: Required<
  Pick<ConfigDataTableOptions, 'border' | 'stripe' | 'defaultExpandAll'>
> = {
  border: true,
  stripe: true,
  defaultExpandAll: false,
}

export interface CrudActionColumnOptions {
  label?: string
  width?: string | number
  fixed?: string | boolean
}

export interface CrudActionPreset {
  auth?: string | string[]
  text?: string
}

export function shouldRenderCrudActionPreset(action?: CrudActionPreset) {
  return action !== undefined
}

export const DEFAULT_CRUD_ACTION_COLUMN_OPTIONS: Required<Pick<CrudActionColumnOptions, 'width' | 'fixed'>> = {
  width: '150',
  fixed: 'right',
}
