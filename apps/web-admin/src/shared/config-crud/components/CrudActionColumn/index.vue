<script setup lang="ts">
import {
  IconDelete as IconEpDelete,
  IconEditPen as IconEpEditPen,
} from '@iconify-prerendered/vue-ep'

defineOptions({ name: 'CrudActionColumn' })

withDefaults(defineProps<{
  label?: string
  width?: string | number
  editAuth?: string
  deleteAuth?: string
  editText?: string
  deleteText?: string
  fixed?: string | boolean
}>(), {
  label: undefined,
  width: '150',
  editAuth: undefined,
  deleteAuth: undefined,
  editText: undefined,
  deleteText: undefined,
  fixed: 'right',
})

defineEmits<{
  edit: [row: any]
  delete: [row: any]
}>()

const { t } = useI18n()
</script>

<template>
  <el-table-column :label="label ?? t('crud.actions')" :width="width" :fixed="fixed">
    <template #default="{ row }">
      <slot name="prepend" :row="row" />

      <slot name="edit" :row="row">
        <el-button
          v-if="editAuth !== undefined"
          v-auth="editAuth"
          type="primary"
          link
          :icon="IconEpEditPen"
          @click="$emit('edit', row)"
        >
          {{ editText ?? t('crud.edit') }}
        </el-button>
      </slot>

      <slot name="delete" :row="row">
        <el-button
          v-if="deleteAuth !== undefined"
          v-auth="deleteAuth"
          type="danger"
          link
          :icon="IconEpDelete"
          @click="$emit('delete', row)"
        >
          {{ deleteText ?? t('crud.delete') }}
        </el-button>
      </slot>

      <slot name="append" :row="row" />
    </template>
  </el-table-column>
</template>
