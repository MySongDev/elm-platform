export {
  createElementPlusCrudFeedback,
} from './adapters/element-plus'
export { default as ConfigDataTable } from './components/ConfigDataTable/index.vue'
export { default as ConfigFormFields } from './components/ConfigFormDialog/ConfigFormFields.vue'
export { default as CrudFormDialog } from './components/ConfigFormDialog/CrudFormDialog.vue'
export { default as ConfigFormDialog } from './components/ConfigFormDialog/index.vue'

export { default as CrudActionColumn } from './components/CrudActionColumn/index.vue'
export type {
  ActionOptions,
  ConfigFieldOption,
  ConfigFormField,
  DialogOptions,
  FormOptions,
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
  ConfigTableColumn,
  CrudActionColumnOptions,
  CrudActionPreset,
} from './model/table'
export { useConfigCrud } from './model/useConfigCrud'
