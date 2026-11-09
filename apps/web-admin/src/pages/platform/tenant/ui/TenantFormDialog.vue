<script setup lang="ts">
import type { FormRules } from 'element-plus'
import type { TenantFormState } from '../model/payload'
import { ConfigFormDialog } from '@/shared/config-crud'
import { createTenantFormFields } from '../config/fields'

defineOptions({ name: 'TenantFormDialog' })

const props = defineProps<{
  saving: boolean
  isEdit: boolean
  rules: FormRules
}>()

const emit = defineEmits<{
  submit: []
}>()

const dialogVisible = defineModel<boolean>('visible', { required: true })
const form = defineModel<TenantFormState>('form', { required: true })
const { t } = useI18n()
const fields = computed(() => createTenantFormFields(t, props.isEdit))
</script>

<template>
  <ConfigFormDialog
    v-model:visible="dialogVisible"
    v-model:model="form"
    :fields="fields"
    :dialog="{ title: isEdit ? '编辑租户' : '新增租户' }"
    :is-edit="isEdit"
    :saving="saving"
    :form-options="{ rules }"
    @submit="emit('submit')"
  />
</template>
