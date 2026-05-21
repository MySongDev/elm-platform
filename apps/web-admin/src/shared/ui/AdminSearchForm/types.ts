import type {
  CustomFormField,
  DateFormField,
  DateRangeFormField,
  FormField,
  FormFieldOption,
  FormFieldOptionValue,
  FormModel,
  InputFormField,
  InputNumberFormField,
  PasswordFormField,
  RadioFormField,
  SelectFormField,
  TextareaFormField,
} from '@/shared/ui/form/field-schema'

export type AdminSearchOptionValue = FormFieldOptionValue
export type AdminSearchOption = FormFieldOption
export type AdminSearchFormModel = FormModel

export type InputAdminSearchField<Model extends AdminSearchFormModel = AdminSearchFormModel> = InputFormField<Model>
export type PasswordAdminSearchField<Model extends AdminSearchFormModel = AdminSearchFormModel> = PasswordFormField<Model>
export type TextareaAdminSearchField<Model extends AdminSearchFormModel = AdminSearchFormModel> = TextareaFormField<Model>
export type InputNumberAdminSearchField<Model extends AdminSearchFormModel = AdminSearchFormModel> = InputNumberFormField<Model>
export type SelectAdminSearchField<Model extends AdminSearchFormModel = AdminSearchFormModel> = SelectFormField<Model>
export type RadioAdminSearchField<Model extends AdminSearchFormModel = AdminSearchFormModel> = RadioFormField<Model>
export type DateAdminSearchField<Model extends AdminSearchFormModel = AdminSearchFormModel> = DateFormField<Model>
export type DateRangeAdminSearchField<Model extends AdminSearchFormModel = AdminSearchFormModel> = DateRangeFormField<Model>
export type CustomAdminSearchField<Model extends AdminSearchFormModel = AdminSearchFormModel> = CustomFormField<Model>
export type AdminSearchField<Model extends AdminSearchFormModel = AdminSearchFormModel> = FormField<Model>
