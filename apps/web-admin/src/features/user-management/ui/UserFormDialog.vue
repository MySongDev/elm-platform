<script setup lang="ts">
/**
 * @file 用户表单弹窗
 * @domain features/user-management
 * @description 适配配置化表单弹窗，按新增/编辑状态生成用户字段并向父级提交保存事件。
 */

import type { FormRules } from 'element-plus'
import type { UserFormState } from '../model/useUserManagement'
import type { ConfigFieldOption } from '@/shared/config-crud'
import { ConfigFormDialog } from '@/shared/config-crud'
import { createUserFormFields } from '../config/fields'

defineOptions({ name: 'UserFormDialog' })

const props = defineProps<{
  saving: boolean
  isEdit: boolean
  rules: FormRules
  permissionOptions: ConfigFieldOption[]
}>()

const emit = defineEmits<{
  submit: []
}>()
const dialogVisible = defineModel<boolean>('visible', { required: true })
const form = defineModel<UserFormState>('form', { required: true })
const { t } = useI18n()
const fields = computed(() => createUserFormFields(t, props.permissionOptions, props.isEdit))
</script>

<template>
  <ConfigFormDialog
    v-model:visible="dialogVisible"
    v-model:model="form"
    :fields="fields"
    :dialog="{ title: t('user.username') }"
    :is-edit="isEdit"
    :saving="saving"
    :form-options="{ rules }"
    @submit="emit('submit')"
  />
</template>
