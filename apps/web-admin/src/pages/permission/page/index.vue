<script setup lang="ts">
import type { PagePermission } from '@/entities/permission'
import { IconSearch as IconEpSearch } from '@iconify-prerendered/vue-ep'
import { getPagePermissions } from '@/entities/permission'
import { useReadonlyTable } from '@/shared/lib/useReadonlyTable'
import AdminTablePage from '@/shared/ui/AdminTablePage/index.vue'

defineOptions({ name: 'PagePermissionView' })

const { t } = useI18n()

const { loading, filteredData, query, fetchRows, resetQuery } = useReadonlyTable<
  PagePermission,
  { title: string, path: string }
>({
  fetchApi: getPagePermissions,
  queryDefaults: { title: '', path: '' },
  filter: (data, q) => data.filter((item) => {
    const titleMatched = !q.title || item.title.includes(q.title)
    const pathMatched = !q.path || item.path.includes(q.path)
    return titleMatched && pathMatched
  }),
})
</script>

<template>
  <div class="main">
    <AdminTablePage :title="t('permission.page.title')" :loading="loading" @refresh="fetchRows">
      <template #search>
        <el-form :model="query" inline>
          <el-form-item :label="`${t('permission.page.pageName')}：`">
            <el-input v-model="query.title" :placeholder="t('permission.page.pageNamePlaceholder')" clearable />
          </el-form-item>
          <el-form-item :label="`${t('permission.page.routePath')}：`">
            <el-input v-model="query.path" :placeholder="t('permission.page.routePathPlaceholder')" clearable />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :icon="IconEpSearch">
              {{ t('common.search') }}
            </el-button>
            <el-button @click="resetQuery">
              {{ t('common.reset') }}
            </el-button>
          </el-form-item>
        </el-form>
      </template>

      <el-table
        v-loading="loading"
        :data="filteredData"
        border
        stripe
      >
        <el-table-column prop="title" :label="t('permission.page.pageName')" min-width="150" />
        <el-table-column prop="path" :label="t('permission.page.routePath')" min-width="180" />
        <el-table-column prop="name" :label="t('permission.page.routeName')" min-width="140">
          <template #default="{ row }">
            {{ row.name || '-' }}
          </template>
        </el-table-column>
        <el-table-column :label="t('permission.page.roles')" min-width="160">
          <template #default="{ row }">
            <el-tag
              v-for="role in row.roles"
              :key="role"
              class="tag-item"
              effect="plain"
            >
              {{ role }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('permission.page.permissionCodes')" min-width="220">
          <template #default="{ row }">
            <template v-if="row.auths?.length">
              <el-tag
                v-for="auth in row.auths"
                :key="auth"
                class="tag-item"
                type="success"
                effect="plain"
              >
                {{ auth }}
              </el-tag>
            </template>
            <span v-else>-</span>
          </template>
        </el-table-column>
      </el-table>
    </AdminTablePage>
  </div>
</template>

<style scoped lang="scss">
.tag-item {
  margin: 2px 4px 2px 0;
}
</style>
