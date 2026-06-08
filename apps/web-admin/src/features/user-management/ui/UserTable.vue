<script setup lang="ts">
/**
 * @file 用户表格
 * @domain features/user-management
 * @description 展示用户列表和行级操作，删除按钮根据当前登录用户禁用自删除入口。
 */

import type { UserInfo } from '@/entities/user'
import { IconDelete as IconEpDelete } from '@iconify-prerendered/vue-ep'
import { ConfigDataTable, CrudActionColumn } from '@/shared/config-crud'
import { Permissions } from '@/shared/config/access'
import { createUserTableColumns } from '../config/fields'

defineOptions({ name: 'UserTable' })

defineProps<{
  loading: boolean
  data: UserInfo[]
  isSelf: (row: UserInfo) => boolean
}>()

defineEmits<{
  edit: [row: UserInfo]
  delete: [row: UserInfo]
}>()

const { t } = useI18n()
const columns = computed(() => createUserTableColumns(t))

function asUserInfo(row: unknown) {
  return row as UserInfo
}
</script>

<template>
  <ConfigDataTable :loading="loading" :data="data" :columns="columns">
    <CrudActionColumn
      :column="{ label: t('user.actions') }"
      :edit-action="{ auth: Permissions.USER_EDIT, text: t('common.edit') }"
      @edit="$emit('edit', $event as UserInfo)"
    >
      <template #delete="{ row }">
        <el-button
          v-auth="Permissions.USER_DELETE"
          type="danger"
          link
          :icon="IconEpDelete"
          :disabled="isSelf(asUserInfo(row))"
          @click="$emit('delete', asUserInfo(row))"
        >
          {{ t('common.delete') }}
        </el-button>
      </template>
    </CrudActionColumn>
  </ConfigDataTable>
</template>
