<script setup lang="ts">
/**
 * @file 用户表单弹窗
 * @domain pages/system/user
 * @description 有副作用：管理独立编辑草稿、选项加载和保存，通过公共弹窗校验后提交用户请求。
 */

import type { FormRules } from 'element-plus'
import type { ButtonPermission } from '@/entities/permission'
import type { TenantInfo } from '@/entities/tenant'
import type { UserInfo } from '@/entities/user'
import { ElMessage } from 'element-plus'
import { computed, onScopeDispose, reactive, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { getButtonPermissions } from '@/entities/permission'
import { getTenantList } from '@/entities/tenant'
import { createUser, updateUser } from '@/entities/user'
import { adminEndpoints } from '@/shared/api/endpoints'
import request from '@/shared/api/request'
import { ConfigFormDialog } from '@/shared/config-crud'
import { createEnabledStatusOptions, getStatusText } from '@/shared/lib/admin-display'
import { createUserForm, toCreateUserParams, toUpdateUserParams } from '../model/form'

defineOptions({ name: 'UserFormDialog' })

const props = defineProps<{
  user: UserInfo | null
}>()

const emit = defineEmits<{
  saved: []
}>()
const visible = defineModel<boolean>('visible', { required: true })
const form = reactive(createUserForm())
const saving = shallowRef(false)
const optionsLoading = shallowRef(false)
const optionsError = shallowRef(false)
const saveError = shallowRef(false)
const permissionOptions = shallowRef<ButtonPermission[]>([])
const tenantOptions = shallowRef<TenantInfo[]>([])
const shopOptions = shallowRef<{
  id: number
  name: string
}[]>([])
let editorVersion = 0
const { t } = useI18n()
const isEdit = computed(() => props.user !== null)
const title = computed(() => t(isEdit.value ? 'user.editUser' : 'user.addUser'))
const statusOptions = computed(() => createEnabledStatusOptions(getStatusText(t)))
// 密码项只在新增时挂载，编辑时不参与校验；规则无需随模式切换。
// 动态改 required 会触发整表重新校验，让新建弹窗一打开就显示错误。
const rules = computed<FormRules>(() => ({
  username: [
    {
      required: true,
      message: t('user.usernameRequired'),
      trigger: 'blur',
    },
    {
      min: 2,
      message: t('user.usernameMin'),
      trigger: 'blur',
    },
  ],
  password: [
    {
      required: true,
      message: t('user.passwordRequired'),
      trigger: 'blur',
    },
    {
      min: 6,
      message: t('user.passwordMin'),
      trigger: 'blur',
    },
  ],
  email: [
    {
      type: 'email',
      message: t('user.emailInvalid'),
      trigger: 'blur',
    },
  ],
}))

async function loadOptions(version = editorVersion) {
  optionsLoading.value = true
  optionsError.value = false
  try {
    const [permissions, tenants, shops] = await Promise.allSettled([
      getButtonPermissions(),
      getTenantList(),
      request.get<{
        id: number
        name: string
      }[]>(adminEndpoints.commerce.restaurants),
    ])
    // 关闭或切换用户后，旧选项不能覆盖新编辑器的数据和 loading。
    if (version !== editorVersion)
      return

    if (permissions.status === 'fulfilled')
      permissionOptions.value = permissions.value
    if (tenants.status === 'fulfilled')
      tenantOptions.value = tenants.value
    if (shops.status === 'fulfilled')
      shopOptions.value = shops.value
    optionsError.value = [permissions, tenants, shops].some(result => result.status === 'rejected')
  }
  catch {
    if (version === editorVersion)
      optionsError.value = true
  }
  finally {
    if (version === editorVersion)
      optionsLoading.value = false
  }
}

watch([visible, () => props.user], ([open, user]) => {
  const version = ++editorVersion
  if (!open)
    return
  Object.assign(form, createUserForm(user))
  permissionOptions.value = []
  tenantOptions.value = []
  shopOptions.value = []
  saveError.value = false
  void loadOptions(version)
}, { immediate: true })

async function save() {
  if (saving.value || optionsLoading.value || optionsError.value)
    return

  const user = props.user
  const version = editorVersion
  saving.value = true
  saveError.value = false
  try {
    if (user)
      await updateUser(user.id, toUpdateUserParams(form))
    else
      await createUser(toCreateUserParams(form))

    // 请求属于打开时的用户；若编辑器已切换，不能关闭新弹窗或发送旧的 saved。
    if (version !== editorVersion)
      return
    ElMessage.success(t(user ? 'user.updateSuccess' : 'user.createSuccess'))
    visible.value = false
    emit('saved')
  }
  catch {
    if (version === editorVersion)
      saveError.value = true
  }
  finally {
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
    :submit-disabled="optionsLoading || optionsError"
    :rules="rules"
    @submit="save"
  >
    <el-alert
      v-if="optionsError"
      type="error"
      :closable="false"
      :title="t('user.optionsLoadFailed')"
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
      :title="t('user.saveFailed')"
      show-icon
    />

    <el-form-item
      :label="t('user.username')"
      prop="username"
    >
      <el-input
        v-model="form.username"
        :placeholder="t('user.usernamePlaceholder')"
        clearable
      />
    </el-form-item>
    <el-form-item
      v-if="!isEdit"
      :label="t('login.password')"
      prop="password"
    >
      <el-input
        v-model="form.password"
        type="password"
        :placeholder="t('user.passwordPlaceholder')"
        show-password
      />
    </el-form-item>
    <el-form-item
      :label="t('user.role')"
      prop="role"
    >
      <el-radio-group v-model="form.role">
        <el-radio value="admin">
          {{ t('common.admin') }}
        </el-radio>
        <el-radio value="user">
          {{ t('common.user') }}
        </el-radio>
      </el-radio-group>
    </el-form-item>
    <el-form-item
      :label="t('user.dataScope')"
      prop="dataScope"
    >
      <el-select
        v-model="form.dataScope"
        :placeholder="t('user.dataScopePlaceholder')"
        clearable
      >
        <el-option
          :label="t('user.scopeAll')"
          value="ALL"
        />
        <el-option
          :label="t('user.scopeTenant')"
          value="TENANT"
        />
        <el-option
          :label="t('user.scopeShop')"
          value="SHOP"
        />
      </el-select>
    </el-form-item>
    <el-form-item
      v-if="form.dataScope !== 'ALL'"
      :label="t('user.tenant')"
      prop="tenantId"
    >
      <el-select
        v-model="form.tenantId"
        :placeholder="t('user.tenantPlaceholder')"
        :loading="optionsLoading"
        filterable
        clearable
      >
        <el-option
          v-for="tenant in tenantOptions"
          :key="tenant.id"
          :label="`${tenant.name}（${tenant.code}）`"
          :value="tenant.id"
        />
      </el-select>
    </el-form-item>
    <el-form-item
      v-if="form.dataScope === 'SHOP'"
      :label="t('user.boundShops')"
      prop="boundShopIds"
    >
      <el-select
        v-model="form.boundShopIds"
        :placeholder="t('user.shopsPlaceholder')"
        :loading="optionsLoading"
        multiple
        filterable
        clearable
        collapse-tags
        collapse-tags-tooltip
      >
        <el-option
          v-for="shop in shopOptions"
          :key="shop.id"
          :label="shop.name"
          :value="String(shop.id)"
        />
      </el-select>
    </el-form-item>
    <el-form-item
      :label="t('user.status')"
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
      :label="t('user.email')"
      prop="email"
    >
      <el-input
        v-model="form.email"
        :placeholder="t('user.emailPlaceholder')"
        clearable
      />
    </el-form-item>
    <el-form-item
      :label="t('user.phone')"
      prop="phone"
    >
      <el-input
        v-model="form.phone"
        :placeholder="t('user.phonePlaceholder')"
        clearable
      />
    </el-form-item>
    <el-form-item
      :label="t('user.permissions')"
      prop="permissions"
    >
      <el-select
        v-model="form.permissions"
        :placeholder="t('user.permissionsPlaceholder')"
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
  </ConfigFormDialog>
</template>
