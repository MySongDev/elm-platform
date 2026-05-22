<script setup lang="ts">
/**
 * @file 角色表单弹窗
 * @domain features/role-management
 * @description 适配配置化表单弹窗，生成角色字段和权限选择项并向父级提交保存事件。
 */

import type { FormRules } from 'element-plus'
import type { RoleFormState } from '../model/useRoleManagement'
import type { ButtonPermission } from '@/entities/permission'
import { ConfigFormDialog } from '@/shared/config-crud'
import { createRoleFormFields } from '../config/fields'

defineOptions({ name: 'RoleFormDialog' })

const props = defineProps<{
  saving: boolean
  isEdit: boolean
  rules: FormRules
  permissionOptions: ButtonPermission[]
}>()

const emit = defineEmits<{
  submit: []
}>()
const dialogVisible = defineModel<boolean>('visible', { required: true })
const form = defineModel<RoleFormState>('form', { required: true })
const { t } = useI18n()
const fields = computed(() => createRoleFormFields(t, props.permissionOptions))
</script>

<template>
  <ConfigFormDialog
    v-model:visible="dialogVisible"
    v-model:model="form"
    :fields="fields"
    :dialog="{ title: t('role.name') }"
    :is-edit="isEdit"
    :saving="saving"
    :form-options="{ rules }"
    @submit="emit('submit')"
  />
</template>
