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
