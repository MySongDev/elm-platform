<script setup lang="ts">
/**
 * @file 部门表单弹窗
 * @domain pages/system/dept
 * @description 有副作用：维护独立部门草稿、上级选项、校验与保存，成功后通知页面刷新。
 */

import type { FormRules } from 'element-plus'
import type { DeptItem } from '../model/types'
import { ElMessage } from 'element-plus'
import { computed, onScopeDispose, reactive, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ConfigFormDialog } from '@/shared/config-crud'
import { createEnabledStatusOptions, getStatusText } from '@/shared/lib/admin-display'
import { flattenTree } from '@/shared/lib/tree'
import { createDept, updateDept } from '../api'
import { createDeptForm, toDeptPayload } from '../model/form'

defineOptions({ name: 'DeptFormDialog' })

const props = defineProps<{
  dept: DeptItem | null
  depts: DeptItem[]
  initialParentId: number | null
}>()

const emit = defineEmits<{
  saved: []
}>()
const visible = defineModel<boolean>('visible', { required: true })
const form = reactive(createDeptForm())
const saving = shallowRef(false)
const saveError = shallowRef(false)
let editorVersion = 0
const { t } = useI18n()
const isEdit = computed(() => props.dept !== null)
const title = computed(() => t(isEdit.value ? 'crud.editTitle' : 'crud.addTitle', { title: t('dept.name') }))
const statusOptions = computed(() => createEnabledStatusOptions(getStatusText(t)))
// 沿用原上级选择范围，只排除当前部门；不要在这次职责拆分中新增后代禁选规则。
const parentOptions = computed(() => flattenTree(props.depts).filter(dept => dept.id !== props.dept?.id))
const rules = computed<FormRules>(() => ({
  name: [{
    required: true,
    message: t('dept.nameRequired'),
    trigger: 'blur',
  }],
}))

watch([visible, () => props.dept, () => props.initialParentId], ([open, dept, parentId]) => {
  editorVersion++
  saving.value = false
  saveError.value = false
  if (open)
    Object.assign(form, createDeptForm(dept, parentId))
}, {
  immediate: true,
  flush: 'sync',
})

async function save() {
  if (saving.value || !visible.value)
    return

  const dept = props.dept
  const version = editorVersion
  const payload = toDeptPayload(form)
  saving.value = true
  saveError.value = false
  try {
    if (dept)
      await updateDept(dept.id, payload)
    else
      await createDept(payload)

    // 关闭或切换部门后，旧保存不能关闭新弹窗或让新页面收到旧的 saved。
    if (version !== editorVersion)
      return
    ElMessage.success(t('crud.saveSuccess'))
    visible.value = false
    emit('saved')
  }
  catch {
    if (version === editorVersion)
      saveError.value = true
  }
  finally {
    if (version === editorVersion)
      saving.value = false
  }
}

onScopeDispose(() => {
  editorVersion++
})
</script>

<template>
  <ConfigFormDialog
    v-model:visible="visible"
    :model="form"
    :title="title"
    :saving="saving"
    :rules="rules"
    @submit="save"
  >
    <el-alert
      v-if="saveError"
      type="error"
      :closable="false"
      :title="t('crud.saveFailed')"
      show-icon
    />

    <el-form-item
      :label="t('dept.parentDept')"
      prop="parentId"
    >
      <el-select
        v-model="form.parentId"
        :placeholder="t('dept.parentDeptPlaceholder')"
        clearable
        :value-on-clear="null"
      >
        <el-option
          v-for="dept in parentOptions"
          :key="dept.id"
          :label="dept.name"
          :value="dept.id"
        />
      </el-select>
    </el-form-item>
    <el-form-item
      :label="t('dept.name')"
      prop="name"
    >
      <el-input
        v-model="form.name"
        :placeholder="t('dept.namePlaceholder')"
        clearable
      />
    </el-form-item>
    <el-form-item
      :label="t('dept.leader')"
      prop="leader"
    >
      <el-input
        v-model="form.leader"
        :placeholder="t('dept.leaderPlaceholder')"
        clearable
      />
    </el-form-item>
    <el-form-item
      :label="t('dept.phone')"
      prop="phone"
    >
      <el-input
        v-model="form.phone"
        :placeholder="t('dept.phonePlaceholder')"
        clearable
      />
    </el-form-item>
    <el-form-item
      :label="t('dept.email')"
      prop="email"
    >
      <el-input
        v-model="form.email"
        :placeholder="t('dept.emailPlaceholder')"
        clearable
      />
    </el-form-item>
    <el-form-item
      :label="t('dept.sort')"
      prop="sort"
    >
      <el-input-number
        v-model="form.sort"
        :min="0"
      />
    </el-form-item>
    <el-form-item
      :label="t('dept.status')"
      prop="status"
    >
      <el-radio-group v-model="form.status">
        <el-radio
          v-for="status in statusOptions"
          :key="String(status.value)"
          :value="status.value"
        >
          {{ status.label }}
        </el-radio>
      </el-radio-group>
    </el-form-item>
  </ConfigFormDialog>
</template>
