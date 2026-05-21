<script setup lang="ts">
/**
 * @file 角色表格
 * @domain features/role-management
 * @description 展示角色列表和角色编辑/删除操作入口，权限控制交给 CrudActionColumn 处理。
 */

import type { RoleItem } from '@/entities/role'
import { ConfigDataTable, CrudActionColumn } from '@/shared/config-crud'
import { Permissions } from '@/shared/config/roles'
import { createRoleTableColumns } from '../config/fields'

defineOptions({ name: 'RoleTable' })

defineProps<{
  loading: boolean
  data: RoleItem[]
}>()

defineEmits<{
  edit: [row: RoleItem]
  delete: [row: RoleItem]
}>()
const { t } = useI18n()
const columns = computed(() => createRoleTableColumns(t))
</script>

<template>
  <ConfigDataTable :loading="loading" :data="data" :columns="columns">
    <CrudActionColumn
      :edit-auth="Permissions.ROLE_EDIT"
      :delete-auth="Permissions.ROLE_DELETE"
      @edit="$emit('edit', $event)"
      @delete="$emit('delete', $event)"
    />
  </ConfigDataTable>
</template>
