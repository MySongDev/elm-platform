<script setup lang="ts">
/**
 * @file 部门管理页面
 * @domain pages/system/dept
 * @description 连接部门列表、当前编辑对象和表单弹窗，保存成功后刷新列表。
 */

import type { DeptItem } from './model/types'
import { IconPlus as IconEpPlus } from '@iconify-prerendered/vue-ep'
import { computed, onMounted, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { Permissions } from '@/shared/config/access'
import AdminSearchForm from '@/shared/ui/AdminSearchForm/index.vue'
import AdminTablePage from '@/shared/ui/AdminTablePage/index.vue'
import { createDeptSearchFields } from './config/fields'
import { useDeptList } from './model/useDeptList'
import DeptFormDialog from './ui/DeptFormDialog.vue'
import DeptTable from './ui/DeptTable.vue'

defineOptions({ name: 'DeptManagement' })

const { t } = useI18n()
const searchFields = computed(() => createDeptSearchFields(t))

const {
  loading,
  depts,
  error,
  query,
  filteredData,
  resetQuery,
  fetchDepts,
  handleDelete,
} = useDeptList()

const editingDept = shallowRef<DeptItem | null>(null)
const dialogVisible = shallowRef(false)
const initialParentId = shallowRef<number | null>(null)

function openCreateDialog(parent?: DeptItem) {
  editingDept.value = null
  initialParentId.value = parent?.id ?? null
  dialogVisible.value = true
}

function openEditDialog(dept: DeptItem) {
  editingDept.value = dept
  initialParentId.value = dept.parentId
  dialogVisible.value = true
}

onMounted(fetchDepts)
</script>

<template>
  <div class="main">
    <AdminTablePage
      :title="t('system.deptManagement')"
      :loading="loading"
      :error="error"
      @refresh="fetchDepts"
    >
      <template #search>
        <AdminSearchForm
          v-model:model="query"
          :fields="searchFields"
          @reset="resetQuery"
        />
      </template>

      <template #buttons>
        <el-button
          v-auth="Permissions.DEPT_ADD"
          type="primary"
          :icon="IconEpPlus"
          @click="openCreateDialog()"
        >
          {{ t('system.addDept') }}
        </el-button>
      </template>

      <DeptTable
        :loading="loading"
        :data="filteredData"
        @create="openCreateDialog"
        @edit="openEditDialog"
        @delete="handleDelete"
      />
    </AdminTablePage>

    <DeptFormDialog
      v-model:visible="dialogVisible"
      :dept="editingDept"
      :depts="depts"
      :initial-parent-id="initialParentId"
      @saved="fetchDepts"
    />
  </div>
</template>
