<script setup lang="ts">
/**
 * @file 菜单表单弹窗
 * @domain pages/system/menu
 * @description 有副作用：维护独立菜单草稿、父菜单选项、校验和保存。
 */

import type { MenuItem } from '@/entities/system-menu'
import { ElMessage } from 'element-plus'
import { computed, onScopeDispose, reactive, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { createMenu, updateMenu } from '@/entities/system-menu'
import { ConfigFormDialog } from '@/shared/config-crud'
import { createEnabledStatusOptions, getStatusText } from '@/shared/lib/admin-display'
import { flattenTree } from '@/shared/lib/tree'
import { createMenuFormRules } from '../config/fields'
import { createMenuForm, toMenuPayload } from '../model/form'

defineOptions({ name: 'MenuFormDialog' })

const props = defineProps<{
  menu: MenuItem | null
  menus: MenuItem[]
  initialParentId: number | null
}>()
const emit = defineEmits<{ saved: [] }>()
const visible = defineModel<boolean>('visible', { required: true })
const { t } = useI18n()
const form = reactive(createMenuForm())
const saving = shallowRef(false)
const saveError = shallowRef(false)
let editorVersion = 0
const title = computed(() => t(props.menu ? 'crud.editTitle' : 'crud.addTitle', { title: t('menu.menuType') }))
const rules = computed(() => createMenuFormRules(t))
const statusOptions = computed(() => createEnabledStatusOptions(getStatusText(t)))
// 保持原有选择范围，只排除自身；用完整树展开，搜索结果不会缩小可选父菜单。
const parentOptions = computed(() => flattenTree(props.menus).filter(menu => menu.id !== props.menu?.id))

watch([visible, () => props.menu, () => props.initialParentId], ([open, menu, initialParentId]) => {
  editorVersion++
  saving.value = false
  if (!open)
    return
  Object.assign(form, createMenuForm(menu, initialParentId))
  saveError.value = false
}, {
  immediate: true,
  flush: 'sync',
})

async function save() {
  if (!visible.value || saving.value)
    return
  const version = editorVersion
  const menu = props.menu
  const payload = toMenuPayload(form)
  saving.value = true
  saveError.value = false
  try {
    if (menu)
      await updateMenu(menu.id, payload)
    else
      await createMenu(payload)
    // 保存只属于发起时的菜单；关闭或切换会话后，旧响应不能关闭新弹窗或触发旧 saved。
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
      :label="t('menu.parentMenu')"
      prop="parentId"
    >
      <el-select
        v-model="form.parentId"
        :placeholder="t('menu.parentMenuPlaceholder')"
        clearable
      >
        <el-option
          v-for="menu in parentOptions"
          :key="menu.id"
          :label="menu.title"
          :value="menu.id"
        />
      </el-select>
    </el-form-item>
    <el-form-item
      :label="t('menu.title')"
      prop="title"
    >
      <el-input
        v-model="form.title"
        :placeholder="t('menu.titlePlaceholder')"
        clearable
      />
    </el-form-item>
    <el-form-item
      :label="t('menu.path')"
      prop="path"
    >
      <el-input
        v-model="form.path"
        :placeholder="t('menu.pathPlaceholder')"
        clearable
      />
    </el-form-item>
    <el-form-item
      :label="t('menu.routeName')"
      prop="name"
    >
      <el-input
        v-model="form.name"
        :placeholder="t('menu.routeNamePlaceholder')"
        clearable
      />
    </el-form-item>
    <el-form-item
      :label="t('menu.icon')"
      prop="icon"
    >
      <el-input
        v-model="form.icon"
        :placeholder="t('menu.iconPlaceholder')"
        clearable
      />
    </el-form-item>
    <el-form-item
      :label="t('menu.permission')"
      prop="permission"
    >
      <el-input
        v-model="form.permission"
        :placeholder="t('menu.permissionPlaceholder')"
        clearable
      />
    </el-form-item>
    <el-form-item
      :label="t('menu.type')"
      prop="type"
    >
      <el-radio-group v-model="form.type">
        <el-radio value="catalog">
          {{ t('menu.catalog') }}
        </el-radio>
        <el-radio value="menu">
          {{ t('menu.menuType') }}
        </el-radio>
        <el-radio value="button">
          {{ t('menu.button') }}
        </el-radio>
      </el-radio-group>
    </el-form-item>
    <el-form-item
      :label="t('menu.sort')"
      prop="sort"
    >
      <el-input-number
        v-model="form.sort"
        :min="0"
      />
    </el-form-item>
    <el-form-item
      :label="t('menu.status')"
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
