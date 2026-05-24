<script setup lang="ts">
/**
 * @file 部门表格
 * @domain features/dept-management
 * @description 展示部门树形表格，并提供新增子部门、编辑和删除操作入口。
 */

import type { DeptItem } from '@/entities/department'
import { IconPlus as IconEpPlus } from '@iconify-prerendered/vue-ep'
import { ConfigDataTable, CrudActionColumn } from '@/shared/config-crud'
import { Permissions } from '@/shared/config/access'
import { createDeptTableColumns } from '../config/fields'

defineOptions({ name: 'DeptTable' })

defineProps<{
  loading: boolean
  data: DeptItem[]
}>()

defineEmits<{
  create: [row?: DeptItem]
  edit: [row: DeptItem]
  delete: [row: DeptItem]
}>()
const { t } = useI18n()
const columns = computed(() => createDeptTableColumns(t))
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
      :edit-action="{ auth: Permissions.DEPT_EDIT }"
      :delete-action="{ auth: Permissions.DEPT_DELETE }"
      @edit="$emit('edit', $event as DeptItem)"
      @delete="$emit('delete', $event as DeptItem)"
    >
      <template #prepend="{ row }">
        <el-button
          v-auth="Permissions.DEPT_ADD"
          type="primary"
          link
          :icon="IconEpPlus"
          @click="$emit('create', row)"
        >
          {{ t('crud.add') }}
        </el-button>
      </template>
    </CrudActionColumn>
  </ConfigDataTable>
</template>
