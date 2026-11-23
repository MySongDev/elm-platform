/**
 * @file 列表与表单公共组件出口
 * @domain shared/config-crud
 * @description 导出表格、表单弹窗、操作列及展示类型，供业务页面统一引用。
 */

export { default as ConfigDataTable } from './components/ConfigDataTable/index.vue'
export { default as ConfigFormDialog } from './components/ConfigFormDialog/index.vue'

export { default as CrudActionColumn } from './components/CrudActionColumn/index.vue'
export { buildCsvContent, escapeCsvCell } from './model/csv'
export type {
  ConfigFieldOption,
  ConfigFormField,
  Translate,
} from './model/form'
export {
  createEnabledStatusOptions,
  createEnabledStatusSearchOptions,
  formatDateTime,
  getEnabledStatusTag,
  getStatusText,
} from './model/presets'
export type {
  ConfigDataTableOptions,
  ConfigTableBatchAction,
  ConfigTableColumn,
  ConfigTableColumnTag,
  ConfigTableColumnTagType,
  ConfigTableDensity,
  CrudActionColumnOptions,
  CrudActionPreset,
} from './model/table'
export {
  getColumnPreferenceKey,
  getDefaultVisibleColumnKeys,
  mergeVisibleColumnKeys,
  parseStoredVisibleColumnKeys,
} from './model/table-preferences'
