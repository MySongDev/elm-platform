<script setup lang="ts">
/**
 * @file 餐馆表单弹窗
 * @domain features/restaurant-management
 * @description 适配配置化表单弹窗，生成餐馆字段并向父级提交保存事件。
 */

import type { FormRules } from 'element-plus'
import type { RestaurantFormState } from '../model/useRestaurantManagement'
import { ConfigFormDialog } from '@/shared/config-crud'
import { createRestaurantFormFields } from '../config/fields'

defineOptions({ name: 'RestaurantFormDialog' })

defineProps<{
  saving: boolean
  isEdit: boolean
  rules: FormRules
}>()

const emit = defineEmits<{
  submit: []
}>()
const dialogVisible = defineModel<boolean>('visible', { required: true })
const form = defineModel<RestaurantFormState>('form', { required: true })
const { t } = useI18n()
const fields = computed(() => createRestaurantFormFields(t))
</script>

<template>
  <ConfigFormDialog
    v-model:visible="dialogVisible"
    v-model:model="form"
    :fields="fields"
    :dialog="{ title: t('commerce.restaurant.name') }"
    :is-edit="isEdit"
    :saving="saving"
    :form-options="{ rules }"
    @submit="emit('submit')"
  />
</template>
