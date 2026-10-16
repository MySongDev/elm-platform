// ⚠️ 与 apps/web-user/src/composables/ui/useFormValidator.ts 同源，修改需同步两处。
// 不抽共享包的原因见迁移方案议题 7。
//
// ★ 与 web-user 的差异：
// 1. TS → JS（uni-user 侧 composable 层以 JS 为主，vue-tsc 不覆盖 composables）
// 2. `scrollToFirstError` 的 `document.querySelector(...).scrollIntoView` 在小程序端
//    没有 DOM。改用语义等价的最小实现：返回首个出错字段名，由调用方（页面）决定
//    是否展示提示 —— 小程序表单一般不需要精确「滚到那个输入框」，错误提示文字已经
//    足以定位。本任务范围里 AddressAdd 页没有调用它（见该页差异说明）。

import { computed, reactive, watch } from 'vue'

export function useFormValidator(form, schema) {
  const errors = reactive({})
  const touched = reactive({})

  Object.keys(schema).forEach((key) => {
    errors[key] = ''
    touched[key] = false
  })

  const isValid = computed(() =>
    Object.keys(schema).every(key => !errors[key]),
  )

  function validateField(field) {
    const rules = schema[field]
    if (!rules)
      return ''

    touched[field] = true
    const value = form[field]

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

  function validateAll() {
    let valid = true
    Object.keys(schema).forEach((field) => {
      validateField(field)
      if (errors[field])
        valid = false
    })
    return valid
  }

  // 小程序端没有 DOM 可滚，改为返回首个出错字段名（调用方按需展示）
  function firstErrorField() {
    return Object.keys(errors).find(k => errors[k]) ?? ''
  }

  watch(
    () => Object.keys(schema).map(k => form[k]),
    (newVals, oldVals) => {
      Object.keys(schema).forEach((key, idx) => {
        if (newVals[idx] !== oldVals[idx] && errors[key]) {
          errors[key] = ''
        }
      })
    },
  )

  return {
    errors,
    touched,
    isValid,
    validateField,
    validateAll,
    scrollToFirstError: firstErrorField,
  }
}
