import type { ComputedRef } from 'vue'
import { computed, reactive, watch } from 'vue'

interface ValidationRule {
  required?: boolean
  pattern?: RegExp
  validator?: (value: any) => boolean | string
  message?: string
}

type ValidationSchema<T> = {
  [K in keyof T]?: ValidationRule[]
}

interface UseFormValidatorReturn<T> {
  errors: Record<keyof T, string>
  touched: Record<keyof T, boolean>
  isValid: ComputedRef<boolean>
  validateField: (field: keyof T) => string
  validateAll: () => boolean
  scrollToFirstError: () => void
}

export function useFormValidator<T extends Record<string, any>>(
  form: T,
  schema: ValidationSchema<T>,
): UseFormValidatorReturn<T> {
  const errors: Record<string, string> = reactive({})
  const touched: Record<string, boolean> = reactive({})

  Object.keys(schema).forEach((key) => {
    errors[key] = ''
    touched[key] = false
  })

  const isValid = computed(() =>
    Object.keys(schema).every(key => !errors[key]),
  )

  function validateField(field: string): string {
    const rules = schema[field as keyof T]
    if (!rules)
      return ''

    touched[field] = true
    const value = form[field as keyof T]

    for (const rule of rules) {
      if (rule.required && !value?.toString().trim()) {
        errors[field] = rule.message || `${field}不能为空`
        return errors[field]
      }

      if (rule.pattern && value && !rule.pattern.test(value)) {
        errors[field] = rule.message || `${field}格式错误`
        return errors[field]
      }

      if (rule.validator) {
        const result = rule.validator(value)
        if (result !== true && typeof result === 'string') {
          errors[field] = result
          return errors[field]
        }
        if (result === false) {
          errors[field] = rule.message || '校验失败'
          return errors[field]
        }
      }
    }

    errors[field] = ''
    return ''
  }

  function validateAll(): boolean {
    let valid = true
    Object.keys(schema).forEach((field) => {
      validateField(field)
      if (errors[field])
        valid = false
    })
    return valid
  }

  function scrollToFirstError() {
    const field = Object.keys(errors).find(k => errors[k])
    if (!field)
      return
    const el = document.querySelector(`[data-field="${field}"]`)
    if (el) {
      el.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }
  }

  watch(
    () => Object.keys(schema).map(k => form[k as keyof T]),
    (newVals, oldVals) => {
      Object.keys(schema).forEach((key, idx) => {
        if (newVals[idx] !== oldVals![idx] && errors[key]) {
          errors[key] = ''
        }
      })
    },
  )

  return {
    errors: errors as Record<keyof T, string>,
    touched: touched as Record<keyof T, boolean>,
    isValid,
    validateField: validateField as (field: keyof T) => string,
    validateAll,
    scrollToFirstError,
  }
}
