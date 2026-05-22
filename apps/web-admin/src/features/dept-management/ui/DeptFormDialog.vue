<script setup lang="ts">
/**
 * @file 部门表单弹窗
 * @domain features/dept-management
 * @description 适配配置化表单弹窗，根据父部门选项生成部门字段并向父级提交保存事件。
 */

import type { FormRules } from 'element-plus'
import type { DeptFormState } from '../model/useDeptManagement'
import type { DeptItem } from '@/entities/department'
import { ConfigFormDialog } from '@/shared/config-crud'
import { createDeptFormFields } from '../config/fields'

defineOptions({ name: 'DeptFormDialog' })

const props = defineProps<{
  saving: boolean
  isEdit: boolean
  rules: FormRules
  parentOptions: DeptItem[]
}>()

const emit = defineEmits<{
  submit: []
}>()
const dialogVisible = defineModel<boolean>('visible', { required: true })
const form = defineModel<DeptFormState>('form', { required: true })
const { t } = useI18n()
const fields = computed(() => createDeptFormFields(t, props.parentOptions))
</script>

<template>
  <ConfigFormDialog
    v-model:visible="dialogVisible"
    v-model:model="form"
    :fields="fields"
    :dialog="{ title: t('dept.name') }"
    :is-edit="isEdit"
    :saving="saving"
    :form-options="{ rules }"
    @submit="emit('submit')"
  />
</template>
