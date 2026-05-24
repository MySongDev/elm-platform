import type { Component } from 'vue'
import type { FormField } from '../field-schema'
import DateField from './renderers/DateField.vue'
import DateRangeField from './renderers/DateRangeField.vue'
import InputField from './renderers/InputField.vue'
import InputNumberField from './renderers/InputNumberField.vue'
import PasswordField from './renderers/PasswordField.vue'
import RadioField from './renderers/RadioField.vue'
import SelectField from './renderers/SelectField.vue'
import TextareaField from './renderers/TextareaField.vue'

export const fieldRendererMap: Partial<Record<FormField['type'], Component>> = {
  input: InputField,
  password: PasswordField,
  textarea: TextareaField,
  inputNumber: InputNumberField,
  select: SelectField,
  radio: RadioField,
  date: DateField,
  dateRange: DateRangeField,
}
