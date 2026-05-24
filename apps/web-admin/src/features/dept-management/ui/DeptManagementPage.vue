<script setup lang="ts">
import { IconPlus as IconEpPlus } from '@iconify-prerendered/vue-ep'
import { Permissions } from '@/shared/config/access'
import AdminSearchForm from '@/shared/ui/AdminSearchForm/index.vue'
import AdminTablePage from '@/shared/ui/AdminTablePage/index.vue'
import { createDeptSearchFields } from '../config/fields'
import { useDeptManagement } from '../model/useDeptManagement'
import DeptFormDialog from './DeptFormDialog.vue'
import DeptTable from './DeptTable.vue'

defineOptions({ name: 'DeptManagementPage' })

const { t } = useI18n()
const searchFields = computed(() => createDeptSearchFields(t))

const {
  loading,
  saving,
  dialogVisible,
  query,
  form,
  isEdit,
  rules,
  filteredData,
  parentOptions,
  resetQuery,
  openCreateDialog,
  openEditDialog,
  fetchDepts,
  submitForm,
  handleDelete,
} = useDeptManagement()

onMounted(fetchDepts)
</script>

<template>
  <div class="main">
    <AdminTablePage :title="t('system.deptManagement')" :loading="loading" @refresh="fetchDepts">
      <template #search>
        <AdminSearchForm v-model:model="query" :fields="searchFields" @reset="resetQuery" />
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
      v-model:form="form"
      :saving="saving"
      :is-edit="isEdit"
      :rules="rules"
      :parent-options="parentOptions"
      @submit="submitForm"
    />
  </div>
</template>
