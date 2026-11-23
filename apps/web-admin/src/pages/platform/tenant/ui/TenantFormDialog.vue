<script setup lang="ts">
/**
 * @file 租户表单弹窗
 * @domain pages/platform/tenant
 * @description 有副作用：维护独立租户草稿、校验和保存状态，保存成功后通知列表刷新。
 */

import type { FormRules } from 'element-plus'
import type { TenantInfo } from '@/entities/tenant'
import { ElMessage } from 'element-plus'
import { computed, onScopeDispose, reactive, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { createTenant, updateTenant } from '@/entities/tenant'
import { ConfigFormDialog } from '@/shared/config-crud'
import { createTenantForm, toCreateTenantParams, toUpdateTenantParams } from '../model/form'

defineOptions({ name: 'TenantFormDialog' })

const props = defineProps<{ tenant: TenantInfo | null }>()
const emit = defineEmits<{ saved: [] }>()
const visible = defineModel<boolean>('visible', { required: true })
const { t } = useI18n()
const form = reactive(createTenantForm())
const saving = shallowRef(false)
const saveError = shallowRef(false)
const isEdit = computed(() => props.tenant !== null)
let editorVersion = 0
const rules: FormRules = {
  code: [
    {
      required: true,
      message: '请输入租户编码',
      trigger: 'blur',
    },
    {
      pattern: /^[a-z][a-z0-9-]*$/,
      message: '编码须小写字母开头，仅含小写字母、数字和连字符',
      trigger: 'blur',
    },
  ],
  name: [{
    required: true,
    message: '请输入租户名称',
    trigger: 'blur',
  }],
}

watch([visible, () => props.tenant], ([open, tenant]) => {
  editorVersion++
  saving.value = false
  saveError.value = false
  if (open)
    Object.assign(form, createTenantForm(tenant))
}, {
  immediate: true,
  flush: 'sync',
})

async function save() {
  if (!visible.value || saving.value)
    return
  const tenant = props.tenant
  const version = editorVersion
  saving.value = true
  saveError.value = false
  try {
    if (tenant)
      await updateTenant(tenant.id, toUpdateTenantParams(form))
    else
      await createTenant(toCreateTenantParams(form))

    // 关闭或切换租户后，旧保存不能关闭新编辑器，也不能发送旧会话的 saved。
    if (version !== editorVersion)
      return
    ElMessage.success(tenant ? '更新租户成功' : '创建租户成功')
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
})
</script>

<template>
  <ConfigFormDialog
    v-model:visible="visible"
    :model="form"
    :title="isEdit ? '编辑租户' : '新增租户'"
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
      label="租户编码"
      prop="code"
    >
      <el-input
        v-model="form.code"
        placeholder="请输入租户编码（创建后不可修改）"
        :disabled="isEdit"
        clearable
      />
    </el-form-item>
    <el-form-item
      label="租户名称"
      prop="name"
    >
      <el-input
        v-model="form.name"
        placeholder="请输入租户名称"
        clearable
      />
    </el-form-item>
    <el-form-item
      label="联系人"
      prop="contactName"
    >
      <el-input
        v-model="form.contactName"
        placeholder="请输入联系人姓名"
        clearable
      />
    </el-form-item>
    <el-form-item
      label="联系电话"
      prop="contactPhone"
    >
      <el-input
        v-model="form.contactPhone"
        placeholder="请输入联系电话"
        clearable
      />
    </el-form-item>
    <el-form-item
      label="联系邮箱"
      prop="contactEmail"
    >
      <el-input
        v-model="form.contactEmail"
        placeholder="请输入联系邮箱"
        clearable
      />
    </el-form-item>
    <el-form-item
      label="套餐"
      prop="planCode"
    >
      <el-select
        v-model="form.planCode"
        placeholder="请选择套餐"
        clearable
      >
        <el-option
          label="标准版"
          value="standard"
        />
        <el-option
          label="专业版"
          value="professional"
        />
        <el-option
          label="企业版"
          value="enterprise"
        />
      </el-select>
    </el-form-item>
    <el-form-item
      label="备注"
      prop="remark"
    >
      <el-input
        v-model="form.remark"
        type="textarea"
        :rows="3"
        placeholder="请输入备注"
      />
    </el-form-item>
  </ConfigFormDialog>
</template>
