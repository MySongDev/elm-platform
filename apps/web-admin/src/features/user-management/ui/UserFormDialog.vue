<script setup lang="ts">
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
  tenantOptions: ConfigFieldOption[]
  shopOptions: ConfigFieldOption[]
}>()

const emit = defineEmits<{
  submit: []
}>()
const dialogVisible = defineModel<boolean>('visible', { required: true })
const form = defineModel<UserFormState>('form', { required: true })
const { t } = useI18n()
const fields = computed(() => createUserFormFields(t, props.permissionOptions, props.isEdit, props.tenantOptions, props.shopOptions))
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
