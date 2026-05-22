<script setup lang="ts">
import type { CrudActionColumnOptions, CrudActionPreset } from '../../model/table'
import {
  IconDelete as IconEpDelete,
  IconEditPen as IconEpEditPen,
} from '@iconify-prerendered/vue-ep'
import { DEFAULT_CRUD_ACTION_COLUMN_OPTIONS, shouldRenderCrudActionPreset } from '../../model/table'

defineOptions({ name: 'CrudActionColumn' })

const props = defineProps<{
  column?: CrudActionColumnOptions
  editAction?: CrudActionPreset
  deleteAction?: CrudActionPreset
}>()

defineEmits<{
  edit: [row: unknown]
  delete: [row: unknown]
}>()

const { t } = useI18n()

const columnOptions = computed<CrudActionColumnOptions & typeof DEFAULT_CRUD_ACTION_COLUMN_OPTIONS>(() => ({
  ...DEFAULT_CRUD_ACTION_COLUMN_OPTIONS,
  ...props.column,
}))
</script>

<template>
  <el-table-column
    :label="columnOptions.label ?? t('crud.actions')"
    :width="columnOptions.width"
    :fixed="columnOptions.fixed"
  >
    <template #default="{ row }">
      <div class="crud-action-column__actions">
        <slot name="prepend" :row="row" />

        <slot name="edit" :row="row">
          <el-button
            v-if="shouldRenderCrudActionPreset(editAction)"
            v-auth="editAction?.auth"
            type="primary"
            link
            :icon="IconEpEditPen"
            @click="$emit('edit', row)"
          >
            {{ editAction.text ?? t('crud.edit') }}
          </el-button>
        </slot>

        <slot name="delete" :row="row">
          <el-button
            v-if="shouldRenderCrudActionPreset(deleteAction)"
            v-auth="deleteAction?.auth"
            type="danger"
            link
            :icon="IconEpDelete"
            @click="$emit('delete', row)"
          >
            {{ deleteAction.text ?? t('crud.delete') }}
          </el-button>
        </slot>

        <slot name="append" :row="row" />
      </div>
    </template>
  </el-table-column>
</template>

<style scoped>
.crud-action-column__actions {
  display: flex;
  flex-wrap: nowrap;
  gap: 8px;
  align-items: center;
  white-space: nowrap;
}

.crud-action-column__actions :deep(.el-button + .el-button) {
  margin-left: 0;
}
</style>
