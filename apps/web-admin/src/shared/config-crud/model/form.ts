/**
 * @file 配置化表单类型
 * @domain shared/config-crud
 * @description 复用搜索与编辑表单共用的字段类型，供 CRUD 页面声明配置。
 */

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
