<script setup lang="ts">
/**
 * @file 食品表单弹窗
 * @domain features/food-management
 * @description 适配配置化表单弹窗，生成食品字段并向父级提交保存事件。
 */

import type { FormRules } from 'element-plus'
import type { FoodFormState } from '../model/useFoodManagement'
import { ConfigFormDialog } from '@/shared/config-crud'
import { createFoodFormFields } from '../config/fields'

defineOptions({ name: 'FoodFormDialog' })

defineProps<{
  saving: boolean
  isEdit: boolean
  rules: FormRules
}>()

const emit = defineEmits<{
  submit: []
}>()
const dialogVisible = defineModel<boolean>('visible', { required: true })
const form = defineModel<FoodFormState>('form', { required: true })
const { t } = useI18n()
const fields = computed(() => createFoodFormFields(t))
</script>

<template>
  <ConfigFormDialog
    v-model:visible="dialogVisible"
    v-model:model="form"
    :fields="fields"
    :dialog="{ title: t('commerce.food.name') }"
    :is-edit="isEdit"
    :saving="saving"
    :form-options="{ rules }"
    @submit="emit('submit')"
  />
</template>
