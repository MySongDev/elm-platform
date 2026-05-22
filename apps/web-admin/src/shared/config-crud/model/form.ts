import type { FormRules } from 'element-plus'
import type {
  FormField,
  FormFieldOption,
  FormModel,
  InputFormField,
  InputNumberFormField,
  PasswordFormField,
  RadioFormField,
  SelectFormField,
  TextareaFormField,
} from '@/shared/ui/form/field-schema'

export type ConfigFieldOption = FormFieldOption
export type ConfigFormModel = FormModel

export type InputConfigField = InputFormField<ConfigFormModel>
export type PasswordConfigField = PasswordFormField<ConfigFormModel>
export type TextareaConfigField = TextareaFormField<ConfigFormModel>
export type InputNumberConfigField = InputNumberFormField<ConfigFormModel>
export type SelectConfigField = SelectFormField<ConfigFormModel>
export type RadioConfigField = RadioFormField<ConfigFormModel>
export type ConfigFormField = FormField<ConfigFormModel>

export type Translate = (key: string) => string

export interface DialogOptions {
  title?: string
  dialogTitle?: string
  width?: string
  destroyOnClose?: boolean
}

export interface FormOptions {
  rules?: FormRules
  labelWidth?: string
}

export interface ActionOptions {
  confirmText?: string
  cancelText?: string
}

export const DEFAULT_DIALOG_OPTIONS: Required<Pick<DialogOptions, 'title' | 'width' | 'destroyOnClose'>> = {
  title: '',
  width: '620px',
  destroyOnClose: false,
}

export const DEFAULT_FORM_OPTIONS: Required<Pick<FormOptions, 'labelWidth'>> = {
  labelWidth: '90px',
}

export const DEFAULT_ACTION_OPTIONS: ActionOptions = {}
