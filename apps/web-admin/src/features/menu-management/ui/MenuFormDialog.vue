<script setup lang="ts">
/**
 * @file 菜单表单弹窗
 * @domain features/menu-management
 * @description 适配配置化表单弹窗，根据父菜单选项生成菜单字段并向父级提交保存事件。
 */

import type { FormRules } from 'element-plus'
import type { MenuFormState } from '../model/useMenuManagement'
import type { MenuItem } from '@/entities/system-menu'
import { ConfigFormDialog } from '@/shared/config-crud'
import { createMenuFormFields } from '../config/fields'

defineOptions({ name: 'MenuFormDialog' })

const props = defineProps<{
  saving: boolean
  isEdit: boolean
  rules: FormRules
  parentOptions: MenuItem[]
}>()

const emit = defineEmits<{
  submit: []
}>()
const dialogVisible = defineModel<boolean>('visible', { required: true })
const form = defineModel<MenuFormState>('form', { required: true })
const { t } = useI18n()
const fields = computed(() => createMenuFormFields(t, props.parentOptions))
</script>

<template>
  <ConfigFormDialog v-model:visible="dialogVisible" v-model:model="form" :fields="fields" :title="t('menu.menuType')"
    :is-edit="isEdit" :saving="saving" :rules="rules" @submit="emit('submit')" />
</template>
