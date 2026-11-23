<script setup lang="ts">
/**
 * @file 菜单管理页面
 * @domain pages/system/menu
 * @description 装配菜单树列表与编辑器，持有编辑目标、初始父级和弹窗可见状态。
 */

import type { MenuItem } from '@/entities/system-menu'
import { IconPlus as IconEpPlus } from '@iconify-prerendered/vue-ep'
import { computed, onMounted, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { Permissions } from '@/shared/config/access'
import AdminSearchForm from '@/shared/ui/AdminSearchForm/index.vue'
import AdminTablePage from '@/shared/ui/AdminTablePage/index.vue'
import { createMenuSearchFields } from './config/fields'
import { useMenuList } from './model/useMenuList'
import MenuFormDialog from './ui/MenuFormDialog.vue'
import MenuTable from './ui/MenuTable.vue'

defineOptions({ name: 'MenuManagement' })

const { t } = useI18n()
const searchFields = computed(() => createMenuSearchFields(t))
const editingMenu = shallowRef<MenuItem | null>(null)
const initialParentId = shallowRef<number | null>(null)
const dialogVisible = shallowRef(false)

const {
  loading,
  error,
  menus,
  query,
  filteredData,
  resetQuery,
  fetchMenus,
  handleDelete,
} = useMenuList()

function openCreateDialog(parent?: MenuItem) {
  editingMenu.value = null
  initialParentId.value = parent?.id ?? null
  dialogVisible.value = true
}

function openEditDialog(menu: MenuItem) {
  editingMenu.value = menu
  initialParentId.value = null
  dialogVisible.value = true
}

onMounted(() => {
  void fetchMenus()
})
</script>

<template>
  <div class="main">
    <AdminTablePage
      :title="t('system.menuManagement')"
      :loading="loading"
      :error="error"
      @refresh="fetchMenus"
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
          v-auth="Permissions.MENU_ADD"
          type="primary"
          :icon="IconEpPlus"
          @click="openCreateDialog()"
        >
          {{ t('system.addMenu') }}
        </el-button>
      </template>

      <MenuTable
        :loading="loading"
        :data="filteredData"
        @create="openCreateDialog"
        @edit="openEditDialog"
        @delete="handleDelete"
      />
    </AdminTablePage>

    <MenuFormDialog
      v-model:visible="dialogVisible"
      :menu="editingMenu"
      :menus="menus"
      :initial-parent-id="initialParentId"
      @saved="fetchMenus"
    />
  </div>
</template>
