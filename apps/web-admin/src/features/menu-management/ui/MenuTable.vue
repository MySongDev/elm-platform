<script setup lang="ts">
/**
 * @file 菜单表格
 * @domain features/menu-management
 * @description 展示菜单树形表格，并提供新增子菜单、编辑和删除操作入口。
 */

import type { MenuItem } from '@/entities/system-menu'
import { IconPlus as IconEpPlus } from '@iconify-prerendered/vue-ep'
import { ConfigDataTable, CrudActionColumn } from '@/shared/config-crud'
import { Permissions } from '@/shared/config/roles'
import { createMenuTableColumns } from '../config/fields'

defineOptions({ name: 'MenuTable' })

defineProps<{
  loading: boolean
  data: MenuItem[]
}>()

defineEmits<{
  create: [row?: MenuItem]
  edit: [row: MenuItem]
  delete: [row: MenuItem]
}>()
const { t } = useI18n()
const columns = computed(() => createMenuTableColumns(t))
</script>

<template>
  <ConfigDataTable
    :loading="loading"
    :data="data"
    :columns="columns"
    :table="{ rowKey: 'id', defaultExpandAll: true }"
  >
    <CrudActionColumn
      :column="{ width: 210 }"
      :edit-action="{ auth: Permissions.MENU_EDIT }"
      :delete-action="{ auth: Permissions.MENU_DELETE }"
      @edit="$emit('edit', $event as MenuItem)"
      @delete="$emit('delete', $event as MenuItem)"
    >
      <template #prepend="{ row }">
        <el-button v-auth="Permissions.MENU_ADD" type="primary" link :icon="IconEpPlus" @click="$emit('create', row)">
          {{ t('crud.add') }}
        </el-button>
      </template>
    </CrudActionColumn>
  </ConfigDataTable>
</template>
