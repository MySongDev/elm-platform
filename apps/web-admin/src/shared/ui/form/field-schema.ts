export type FormFieldOptionValue = string | number | boolean

export interface FormFieldOption {
  label: string
  value: FormFieldOptionValue
  disabled?: boolean
}

export type FormModel = Record<string, any>

interface BaseFormField<Model extends FormModel = FormModel> {
  prop: keyof Model & string
  label: string
  placeholder?: string
  disabled?: boolean
  props?: Record<string, unknown>
  showWhen?: (model: Model) => boolean
}

export interface InputFormField<Model extends FormModel = FormModel>
  extends BaseFormField<Model> {
  type: 'input'
  clearable?: boolean
}

export interface PasswordFormField<Model extends FormModel = FormModel>
  extends BaseFormField<Model> {
  type: 'password'
  showPassword?: boolean
}

export interface TextareaFormField<Model extends FormModel = FormModel>
  extends BaseFormField<Model> {
  type: 'textarea'
  rows?: number
}

export interface InputNumberFormField<Model extends FormModel = FormModel>
  extends BaseFormField<Model> {
  type: 'inputNumber'
  min?: number
  max?: number
  step?: number
  precision?: number
}

export interface SelectFormField<Model extends FormModel = FormModel>
  extends BaseFormField<Model> {
  type: 'select'
  options: FormFieldOption[]
  clearable?: boolean
  multiple?: boolean
  filterable?: boolean
  collapseTags?: boolean
  collapseTagsTooltip?: boolean
}

export interface RadioFormField<Model extends FormModel = FormModel>
  extends BaseFormField<Model> {
  type: 'radio'
  options: FormFieldOption[]
}

export interface DateFormField<Model extends FormModel = FormModel>
  extends BaseFormField<Model> {
  type: 'date'
  valueFormat?: string
  format?: string
  clearable?: boolean
}

export interface DateRangeFormField<Model extends FormModel = FormModel>
  extends BaseFormField<Model> {
  type: 'dateRange'
  startPlaceholder?: string
  endPlaceholder?: string
  rangeSeparator?: string
  valueFormat?: string
  format?: string
  clearable?: boolean
}

export interface CustomFormField<Model extends FormModel = FormModel>
  extends BaseFormField<Model> {
  type: 'custom'
}

export type FormField<Model extends FormModel = FormModel>
  = | InputFormField<Model>
    | PasswordFormField<Model>
    | TextareaFormField<Model>
    | InputNumberFormField<Model>
    | SelectFormField<Model>
    | RadioFormField<Model>
    | DateFormField<Model>
    | DateRangeFormField<Model>
    | CustomFormField<Model>
