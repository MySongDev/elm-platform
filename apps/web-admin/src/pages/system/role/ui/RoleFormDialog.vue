<script setup lang="ts">
/**
 * @file 角色表单弹窗
 * @domain pages/system/role
 * @description 有副作用：维护独立角色草稿、按钮权限选项和基本信息保存。
 */

import type { FormRules } from 'element-plus'
import type { RoleItem } from '../model/types'
import type { ButtonPermission } from '@/entities/permission'
import { ElMessage } from 'element-plus'
import { computed, onScopeDispose, reactive, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { getButtonPermissions } from '@/entities/permission'
import { ConfigFormDialog } from '@/shared/config-crud'
import { createEnabledStatusOptions, getStatusText } from '@/shared/lib/admin-display'
import { createRole, updateRole } from '../api'
import { createRoleForm, toRolePayload } from '../model/form'

defineOptions({ name: 'RoleFormDialog' })

const props = defineProps<{ role: RoleItem | null }>()
const emit = defineEmits<{ saved: [] }>()
const visible = defineModel<boolean>('visible', { required: true })
const { t } = useI18n()
const form = reactive(createRoleForm())
const saving = shallowRef(false)
const optionsLoading = shallowRef(false)
const optionsReady = shallowRef(false)
const optionsError = shallowRef(false)
const saveError = shallowRef(false)
const permissionOptions = shallowRef<ButtonPermission[]>([])
let editorVersion = 0
let optionsVersion = 0
const title = computed(() => t(props.role ? 'crud.editTitle' : 'crud.addTitle', {
  title: t('role.name'),
}))
const statusOptions = computed(() => createEnabledStatusOptions(getStatusText(t)))
const rules = computed<FormRules>(() => ({
  name: [
    {
      required: true,
      message: t('role.nameRequired'),
      trigger: 'blur',
    },
  ],
  code: [
    {
      required: true,
      message: t('role.codeRequired'),
      trigger: 'blur',
    },
  ],
}))

async function loadOptions() {
  const editor = editorVersion
  const requestVersion = ++optionsVersion
  optionsLoading.value = true
  optionsReady.value = false
  optionsError.value = false
  try {
    const options = await getButtonPermissions()
    // 关闭、切换角色和重试都会换版本，旧选项不能解除新会话的保存限制。
    if (editor !== editorVersion || requestVersion !== optionsVersion)
      return
    permissionOptions.value = options
    optionsReady.value = true
  }
  catch {
    if (editor === editorVersion && requestVersion === optionsVersion)
      optionsError.value = true
  }
  finally {
    if (editor === editorVersion && requestVersion === optionsVersion)
      optionsLoading.value = false
  }
}

watch([
  visible,
  () => props.role,
], ([open, role]) => {
  editorVersion++
  optionsVersion++
  saving.value = false
  if (!open)
    return
  Object.assign(form, createRoleForm(role))
  permissionOptions.value = []
  optionsReady.value = false
  saveError.value = false
  void loadOptions()
}, {
  immediate: true,
  flush: 'sync',
})

async function save() {
  if (!visible.value || saving.value || !optionsReady.value || optionsLoading.value)
    return
  const version = editorVersion
  const role = props.role
  const payload = toRolePayload(form)
  saving.value = true
  saveError.value = false
  try {
    if (role)
      await updateRole(role.id, payload)
    else
      await createRole(payload)
    // 保存属于打开时的角色；切换会话后不能关闭新弹窗，也不能发送旧 saved。
    if (version !== editorVersion)
      return
    ElMessage.success(t('crud.saveSuccess'))
    emit('saved')
    visible.value = false
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
  optionsVersion++
})
</script>

<template>
  <ConfigFormDialog
    v-model:visible="visible"
    :model="form"
    :title="title"
    :saving="saving"
    :submit-disabled="!optionsReady || optionsLoading"
    :rules="rules"
    @submit="save"
  >
    <el-alert
      v-if="optionsError"
      type="error"
      :closable="false"
      :title="t('crud.optionsLoadFailed')"
      show-icon
    >
      <el-button
        link
        type="primary"
        @click="loadOptions()"
      >
        {{ t('state.error.retry') }}
      </el-button>
    </el-alert>
    <el-alert
      v-if="saveError"
      type="error"
      :closable="false"
      :title="t('crud.saveFailed')"
      show-icon
    />
    <el-form-item
      :label="t('role.name')"
      prop="name"
    >
      <el-input
        v-model="form.name"
        :placeholder="t('role.namePlaceholder')"
        clearable
      />
    </el-form-item>
    <el-form-item
      :label="t('role.code')"
      prop="code"
    >
      <el-input
        v-model="form.code"
        :placeholder="t('role.codePlaceholder')"
        clearable
      />
    </el-form-item>
    <el-form-item
      :label="t('role.permissions')"
      prop="permissions"
    >
      <el-select
        v-model="form.permissions"
        :placeholder="t('role.permissionsPlaceholder')"
        :loading="optionsLoading"
        multiple
        filterable
        clearable
        collapse-tags
        collapse-tags-tooltip
      >
        <el-option
          v-for="permission in permissionOptions"
          :key="permission.code"
          :label="`${permission.name}（${permission.code}）`"
          :value="permission.code"
        />
      </el-select>
    </el-form-item>
    <el-form-item
      :label="t('role.status')"
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
    <el-form-item
      :label="t('role.remark')"
      prop="remark"
    >
      <el-input
        v-model="form.remark"
        type="textarea"
        :rows="3"
        :placeholder="t('role.remarkPlaceholder')"
      />
    </el-form-item>
  </ConfigFormDialog>
</template>
