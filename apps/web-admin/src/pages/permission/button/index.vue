<script setup lang="ts">
import type { ButtonPermission } from '@/entities/permission'
import { IconSearch as IconEpSearch } from '@iconify-prerendered/vue-ep'
import { getButtonPermissions } from '@/entities/permission'
import { useReadonlyTable } from '@/shared/lib/useReadonlyTable'
import AdminTablePage from '@/shared/ui/AdminTablePage/index.vue'

defineOptions({ name: 'ButtonPermissionView' })

const { t } = useI18n()

const { loading, filteredData, query, fetchRows, resetQuery } = useReadonlyTable<
  ButtonPermission,
  { name: string, code: string, group: string }
>({
  fetchApi: getButtonPermissions,
  queryDefaults: { name: '', code: '', group: '' },
  filter: (data, q) => data.filter((item) => {
    const nameMatched = !q.name || item.name.includes(q.name)
    const codeMatched = !q.code || item.code.includes(q.code)
    const groupMatched = !q.group || item.group === q.group
    return nameMatched && codeMatched && groupMatched
  }),
})

const groupOptions = computed(() =>
  Array.from(new Set(filteredData.value.map(item => item.group).filter(Boolean))).sort(),
)
</script>

<template>
  <div class="main">
    <AdminTablePage :title="t('permission.button.title')" :loading="loading" @refresh="fetchRows">
      <template #search>
        <el-form :model="query" inline>
          <el-form-item :label="`${t('permission.button.name')}：`">
            <el-input v-model="query.name" class="button-permission-filter__input" :placeholder="t('permission.button.namePlaceholder')" clearable />
          </el-form-item>
          <el-form-item :label="`${t('permission.button.code')}：`">
            <el-input v-model="query.code" class="button-permission-filter__code" :placeholder="t('permission.button.codePlaceholder')" clearable />
          </el-form-item>
          <el-form-item :label="`${t('permission.button.group')}：`">
            <el-select v-model="query.group" class="button-permission-filter__group" :placeholder="t('permission.button.groupPlaceholder')" clearable>
              <el-option v-for="item in groupOptions" :key="item" :label="item" :value="item" />
            </el-select>
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

      <el-table v-loading="loading" :data="filteredData" border stripe>
        <el-table-column prop="group" :label="t('permission.button.group')" min-width="140" />
        <el-table-column prop="name" :label="t('permission.button.name')" min-width="160" />
        <el-table-column prop="code" :label="t('permission.button.code')" min-width="240">
          <template #default="{ row }">
            <el-tag effect="plain">
              {{ row.code }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </AdminTablePage>
  </div>
</template>

<style scoped lang="scss">
.button-permission-filter__input,
.button-permission-filter__group {
  width: 180px;
}

.button-permission-filter__code {
  width: 240px;
}
</style>
