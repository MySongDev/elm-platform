<script setup lang="ts">
/**
 * @file 字段渲染器
 * @domain shared/ui/form
 * @description 搜索和编辑表单共用的控件渲染入口，直接按字段类型绑定控件属性。
 */

import type { FormField } from '../field-schema'

defineOptions({ name: 'FormFieldRenderer' })

defineProps<{
  field: FormField
}>()

const value = defineModel<any>({ required: true })
</script>

<template>
  <el-input
    v-if="field.type === 'input'"
    v-model="value"
    :placeholder="field.placeholder"
    :disabled="field.disabled"
    :clearable="field.clearable ?? true"
    v-bind="field.props ?? {}"
  />
  <el-input
    v-else-if="field.type === 'password'"
    v-model="value"
    type="password"
    :placeholder="field.placeholder"
    :disabled="field.disabled"
    :show-password="field.showPassword ?? true"
    v-bind="field.props ?? {}"
  />
  <el-input
    v-else-if="field.type === 'textarea'"
    v-model="value"
    type="textarea"
    :rows="field.rows ?? 3"
    :placeholder="field.placeholder"
    :disabled="field.disabled"
    v-bind="field.props ?? {}"
  />
  <el-input-number
    v-else-if="field.type === 'inputNumber'"
    v-model="value"
    :min="field.min"
    :max="field.max"
    :step="field.step"
    :precision="field.precision"
    :disabled="field.disabled"
    v-bind="field.props ?? {}"
  />
  <el-select
    v-else-if="field.type === 'select'"
    v-model="value"
    :placeholder="field.placeholder"
    :disabled="field.disabled"
    :clearable="field.clearable ?? true"
    :multiple="field.multiple"
    :filterable="field.filterable"
    :collapse-tags="field.collapseTags"
    :collapse-tags-tooltip="field.collapseTagsTooltip"
    v-bind="field.props ?? {}"
  >
    <el-option
      v-for="option in field.options"
      :key="String(option.value)"
      :label="option.label"
      :value="option.value"
      :disabled="option.disabled"
    />
  </el-select>
  <el-radio-group
    v-else-if="field.type === 'radio'"
    v-model="value"
    :disabled="field.disabled"
    v-bind="field.props ?? {}"
  >
    <el-radio
      v-for="option in field.options"
      :key="String(option.value)"
      :value="option.value"
      :disabled="option.disabled"
    >
      {{ option.label }}
    </el-radio>
  </el-radio-group>
  <el-date-picker
    v-else-if="field.type === 'date'"
    v-model="value"
    type="date"
    :placeholder="field.placeholder"
    :disabled="field.disabled"
    :clearable="field.clearable ?? true"
    :value-format="field.valueFormat"
    :format="field.format"
    v-bind="field.props ?? {}"
  />
  <el-date-picker
    v-else-if="field.type === 'dateRange'"
    v-model="value"
    type="daterange"
    :start-placeholder="field.startPlaceholder"
    :end-placeholder="field.endPlaceholder"
    :range-separator="field.rangeSeparator ?? '-'"
    :disabled="field.disabled"
    :clearable="field.clearable ?? true"
    :value-format="field.valueFormat"
    :format="field.format"
    v-bind="field.props ?? {}"
  />
</template>
